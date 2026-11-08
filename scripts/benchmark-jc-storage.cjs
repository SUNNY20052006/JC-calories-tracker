// Run with Node 22.13+ after npm install. Measures synthetic data in temporary SQLite files.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');
const ts = require('typescript');

require.extensions['.ts'] = (module, filename) => {
  const source = fs.readFileSync(filename, 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  module._compile(outputText, filename);
};

const database = require('../database/DatabaseService.ts');
const { cacheConfirmedMeal } = require('../database/MealAnalysisCache.ts');
const { recordAnalysisUsage } = require('../database/AnalysisUsage.ts');

const targets = { dailyCalories: 2000, proteinTarget: 100, carbTarget: 250, fatTarget: 66.6667 };
const nutrition = { calories: 420, protein: 30, carbs: 52.5, fat: 10 };
const fixture = {
  ...nutrition,
  foodItems: ['Cooked rice', 'Chicken breast'].map(name => ({
    name, quantity: '100 g', preparation: 'cooked', estimatedWeightGrams: 100,
    calories: 210, protein: 15, carbs: 26.25, fat: 5,
  })),
};
const description = 'Cooked rice with chicken, 200 g';

async function withDatabase(run) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'jc-storage-'));
  const filename = path.join(dir, 'benchmark.db');
  const sql = new DatabaseSync(filename);
  try {
    sql.exec('PRAGMA page_size = 4096; PRAGMA journal_mode = WAL;');
    const db = {
      execAsync: async text => sql.exec(text),
      getFirstAsync: async (text, ...args) => sql.prepare(text).get(...args),
      getAllAsync: async (text, ...args) => sql.prepare(text).all(...args),
      runAsync: async (text, ...args) => {
        const result = sql.prepare(text).run(...args);
        return { ...result, lastInsertRowId: Number(result.lastInsertRowid) };
      },
    };
    function snapshot() {
      sql.exec('PRAGMA wal_checkpoint(TRUNCATE);');
      return { bytes: fs.statSync(filename).size, freePages: sql.prepare('PRAGMA freelist_count').get().freelist_count };
    }
    return await run(db, sql, snapshot);
  } finally {
    sql.close();
    for (const suffix of ['', '-wal', '-shm']) fs.rmSync(filename + suffix, { force: true });
    fs.rmdirSync(dir);
  }
}

function logFor(index) {
  return { ...nutrition, foodText: description, oilPercentage: 100,
    createdAt: new Date(Date.UTC(2025, 0, 1 + Math.floor(index / 3), 8 + index % 3 * 4)).toISOString() };
}

async function seedProfile(db, profileId) {
  for (let index = 0; index < 24; index++) await database.insertFoodLog(db, logFor(index), profileId);
  await database.insertRecipe(db, {
    ...nutrition, name: 'Rice and chicken', description, servings: 2, createdAt: logFor(0).createdAt,
  }, profileId);
  for (let day = 0; day < 7; day++) await recordAnalysisUsage(db, 'default', new Date(Date.UTC(2025, 0, day + 1, 12)), profileId);
}

async function fillCache(db, profileId, from, until, nearLimit = false) {
  for (let index = from; index < until; index++) {
    const text = `sample meal ${String(index).padStart(3, '0')}`;
    const padding = 1536 - 2 * Buffer.byteLength(text) - Buffer.byteLength(JSON.stringify(fixture));
    const result = nearLimit
      ? { ...fixture, foodItems: [{ ...fixture.foodItems[0], name: fixture.foodItems[0].name + 'x'.repeat(padding) }, fixture.foodItems[1]] }
      : fixture;
    await cacheConfirmedMeal(db, text, 100, result, profileId);
  }
}

async function main() {
  const original = await withDatabase(async (_db, sql, snapshot) => {
    // The version-one schema from the archived, Gemini-first JC project.
    sql.exec(`
      CREATE TABLE user_settings (id INTEGER PRIMARY KEY NOT NULL, dailyCalories REAL NOT NULL,
        proteinTarget REAL NOT NULL, carbTarget REAL NOT NULL, fatTarget REAL NOT NULL,
        createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL);
      CREATE TABLE food_logs (id INTEGER PRIMARY KEY NOT NULL, foodText TEXT NOT NULL,
        oilPercentage REAL NOT NULL DEFAULT 100, calories REAL NOT NULL, protein REAL NOT NULL,
        carbs REAL NOT NULL, fat REAL NOT NULL, createdAt TEXT NOT NULL);
    `);
    sql.prepare('INSERT INTO user_settings VALUES (1, ?, ?, ?, ?, ?, ?)').run(
      targets.dailyCalories, targets.proteinTarget, targets.carbTarget, targets.fatTarget, logFor(0).createdAt, logFor(0).createdAt
    );
    const insert = sql.prepare('INSERT INTO food_logs VALUES (NULL, ?, ?, ?, ?, ?, ?, ?)');
    for (let index = 0; index < 24; index++) {
      const { foodText, oilPercentage, calories, protein, carbs, fat, createdAt } = logFor(index);
      insert.run(foodText, oilPercentage, calories, protein, carbs, fat, createdAt);
    }
    return snapshot();
  });

  const current = await withDatabase(async (db, sql, snapshot) => {
    await database.initializeDatabase(db);
    const first = await database.createProfile(db, targets, 'First profile');
    await seedProfile(db, first);
    const emptyCache = snapshot();
    await fillCache(db, first, 0, 27);
    const warmCache = snapshot();
    await database.setProfileSignedOut(db, first, true);
    const second = await database.createProfile(db, targets, 'Second profile');
    const addedEmptyProfile = snapshot();
    await seedProfile(db, second);
    await fillCache(db, second, 0, 27);
    const twoWarmProfiles = snapshot();
    await database.deleteProfile(db, second);
    const afterDelete = snapshot();
    await fillCache(db, first, 27, 220);
    const fullCache = snapshot();
    const fullCacheEntries = sql.prepare('SELECT COUNT(*) AS count FROM meal_analysis_cache').get().count;
    return { emptyCache, warmCache, addedEmptyProfile, twoWarmProfiles, afterDelete, fullCache, fullCacheEntries };
  });

  const nearLimit = await withDatabase(async (db, sql, snapshot) => {
    await database.initializeDatabase(db);
    const profileId = await database.createProfile(db, targets, 'First profile');
    await seedProfile(db, profileId);
    await fillCache(db, profileId, 0, 220, true);
    return { ...snapshot(), entries: sql.prepare('SELECT COUNT(*) AS count FROM meal_analysis_cache').get().count };
  });

  console.log(JSON.stringify({ original, current, nearLimit }, null, 2));
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
