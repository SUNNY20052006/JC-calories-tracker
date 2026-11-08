const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const { DatabaseSync } = require('node:sqlite');

// Exercise actual TypeScript modules with narrow native/API adapters, without a device or live API calls.
function load(relative, mocks = {}) {
  const filename = path.resolve(__dirname, '..', relative);
  const source = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  const localRequire = name => {
    if (name in mocks) return mocks[name];
    if (name.startsWith('.')) return load(path.relative(path.resolve(__dirname, '..'), path.resolve(path.dirname(filename), name + '.ts')), mocks);
    return require(name);
  };
  new Function('require', 'module', 'exports', source)(localRequire, module, module.exports);
  return module.exports;
}

const recipes = load('utils/recipes.ts');
const recipe = { id: 1, name: 'Paneer curry', description: '200 g paneer, spinach, onion, 10 g oil',
  servings: 4, calories: 1600, protein: 80, carbs: 40, fat: 120, createdAt: '2026-01-01T00:00:00Z' };

test('recipe servings and fresh food combine without changing either input', () => {
  const analysis = { foodItems: [], calories: 100, protein: 2, carbs: 20, fat: 1 };
  const result = recipes.combineMeal(analysis, [{ recipe, servings: 1.5 }]);
  assert.equal(result.calories, 700);
  assert.equal(result.protein, 32);
  assert.equal(result.carbs, 35);
  assert.equal(result.fat, 46);
  assert.equal(analysis.foodItems.length, 0);
  assert.equal(recipe.calories, 1600);
  assert.equal(recipes.combineMeal(null, [{ recipe, servings: 0.5 }]).calories, 200);
  assert.equal(recipes.combineMeal(null, []), null);
  assert.throws(() => recipes.combineMeal(null, [{ recipe, servings: NaN }]));
  assert.equal(recipes.mealDescription('two rotis', [{ recipe, servings: 1 }]), 'two rotis; 1 serving(s) of Paneer curry');
  assert.equal(recipes.parseServings('1,5'), 1.5);
  assert.equal(recipes.parseServings(String(recipe.servings)), 4);
  for (const invalid of ['', '0', '-1', 'Infinity']) assert.equal(recipes.parseServings(invalid), null);
});

function openDatabase() {
  const sql = new DatabaseSync(':memory:');
  return {
    sql,
    execAsync: async text => { sql.exec(text); },
    getFirstAsync: async (text, ...params) => sql.prepare(text).get(...params),
    getAllAsync: async (text, ...params) => sql.prepare(text).all(...params),
    runAsync: async (text, ...params) => {
      const result = sql.prepare(text).run(...params);
      return { ...result, lastInsertRowId: Number(result.lastInsertRowid) };
    },
  };
}
const database = load('database/DatabaseService.ts');
const analysisUsage = load('database/AnalysisUsage.ts');
test('fresh database, upgrade, repeated initialization, and cleanup preserve recipes and settings', async () => {
  const db = openDatabase();
  try {
    await database.initializeDatabase(db);
    await database.createProfile(db, { dailyCalories: 2000, proteinTarget: 60, carbTarget: 250, fatTarget: 65 }, 'Asha');
    await database.insertFoodLog(db, { foodText: 'Old meal', oilPercentage: 100, calories: 100, protein: 1, carbs: 2, fat: 3, createdAt: '2020-01-01T00:00:00Z' });
    // Simulate an existing version-one installation with user data.
    db.sql.exec('DROP TRIGGER purge_profile; DROP TABLE analysis_usage_daily; DROP TABLE gemini_daily_limits; DROP TABLE meal_analysis_cache; DROP TABLE recipes; PRAGMA user_version = 1;');
    await database.initializeDatabase(db);
    await database.initializeDatabase(db);
    assert.equal((await database.getRecentLogs(db)).length, 1);
    const { id, ...newRecipe } = recipe;
    const savedId = await database.insertRecipe(db, newRecipe);
    await database.deleteLogsOlderThan(db, 7);
    assert.equal((await database.getRecentLogs(db)).length, 0);
    assert.equal((await database.getRecipes(db))[0].name, recipe.name);
    assert.equal((await database.getUserSettings(db)).dailyCalories, 2000);
    assert.equal(db.sql.prepare('PRAGMA user_version').get().user_version, 8);
    await assert.rejects(database.insertRecipe(db, { ...newRecipe, servings: 0 }));
    await database.deleteRecipe(db, savedId);
    assert.equal((await database.getRecipes(db)).length, 0);
  } finally { db.sql.close(); }
});

test('meal macro edits use the target rule while untouched estimates keep their precision', () => {
  const { readMealNutrition, mealNutritionToDraft, updateTargetDraft } = load('utils/nutritionTargets.ts');
  const original = { calories: 315, protein: 22.5, carbs: 39.375, fat: 7.5 };
  const draft = mealNutritionToDraft(original);
  assert.deepEqual(readMealNutrition(null, original).nutrition, original);
  assert.deepEqual(readMealNutrition(updateTargetDraft(draft, 'dailyCalories', '400'), original).nutrition,
    { calories: 400, protein: 22.5, carbs: 60.625, fat: 7.5 });
  assert.deepEqual(readMealNutrition(updateTargetDraft(draft, 'fatTarget', '10'), original).nutrition,
    { calories: 337.5, protein: 22.5, carbs: 39.375, fat: 10 });
  assert.match(readMealNutrition(updateTargetDraft(draft, 'dailyCalories', '100'), original).error, /157.5 kcal/);
  const zero = { calories: 0, protein: 0, carbs: 0, fat: 0 };
  assert.deepEqual(readMealNutrition(mealNutritionToDraft(zero), original).nutrition, zero);
});

test('target edits preserve protein and fat for calorie changes and reject impossible combinations', () => {
  const { readTargets, targetsToDraft, updateTargetDraft, estimateMaintenanceTargets } = load('utils/nutritionTargets.ts');
  const estimate = estimateMaintenanceTargets(30, 175, 70, 'male', 'active');
  assert.equal(estimate.dailyCalories, 2935);
  assert.equal(estimate.proteinTarget * 4 + estimate.carbTarget * 4 + estimate.fatTarget * 9, 2935);
  assert.equal(estimateMaintenanceTargets(18, 175, 70, 'male', 'active'), null);
  assert.equal(estimateMaintenanceTargets(30, 0, 70, 'female', 'active'), null);
  assert.equal(estimateMaintenanceTargets(30, 165, 60, 'female', 'inactive').dailyCalories, 2021);

  const original = targetsToDraft({ dailyCalories: 2650, proteinTarget: 200, carbTarget: 350, fatTarget: 50 });
  assert.deepEqual(readTargets(updateTargetDraft(original, 'dailyCalories', '2000')).targets,
    { dailyCalories: 2000, proteinTarget: 200, carbTarget: 187.5, fatTarget: 50 });
  assert.equal(readTargets(updateTargetDraft(original, 'dailyCalories', '1250')).targets.carbTarget, 0);
  assert.match(readTargets(updateTargetDraft(original, 'dailyCalories', '1000')).error, /1250 kcal/);
  for (const [field, value, calories] of [
    ['proteinTarget', '210', 2690], ['carbTarget', '340.5', 2612], ['fatTarget', '55', 2695],
  ]) {
    assert.equal(readTargets(updateTargetDraft(original, field, value)).targets.dailyCalories, calories);
  }
  assert.ok(readTargets(updateTargetDraft(original, 'fatTarget', '')).error);
});

test('profile migration preserves an existing install and saving targets preserves the new name', async () => {
  const db = openDatabase();
  try {
    await database.initializeDatabase(db);
    assert.equal(await database.getUserSettings(db), null);
    const legacy = { dailyCalories: 2000, proteinTarget: 60, carbTarget: 250, fatTarget: 65 };
    await database.createProfile(db, legacy, 'Legacy');
    db.sql.exec('ALTER TABLE user_settings DROP COLUMN displayName; PRAGMA user_version = 4;');
    await database.initializeDatabase(db);
    const previous = await database.getUserSettings(db);
    assert.equal(previous.displayName, null);
    assert.equal(previous.carbTarget, 250);

    const profileDb = openDatabase();
    try {
      await database.initializeDatabase(profileDb);
      const id = await database.createProfile(profileDb, legacy, 'Asha');
      await database.updateSettings(profileDb, { ...legacy, dailyCalories: 1825 }, id);
      const profile = await database.getUserSettings(profileDb);
      assert.equal(profile.displayName, 'Asha');
      assert.equal(profile.dailyCalories, 1825);
      assert.equal(profileDb.sql.prepare('SELECT COUNT(*) AS n FROM user_settings').get().n, 1);
      profileDb.sql.exec('DROP INDEX active_local_profile; ALTER TABLE user_settings DROP COLUMN signedOut; PRAGMA user_version = 5;');
      await database.initializeDatabase(profileDb);
      assert.equal((await database.getUserSettings(profileDb)).signedOut, 0);
      await database.renameProfile(profileDb, profile.id, '  Anya  ');
      await database.setProfileSignedOut(profileDb, profile.id, true);
      assert.equal(await database.getUserSettings(profileDb), null);
      assert.equal((await database.getSavedProfiles(profileDb))[0].displayName, 'Anya');
      await database.setProfileSignedOut(profileDb, profile.id, false);
      const { displayName, signedOut, dailyCalories, carbTarget } = await database.getUserSettings(profileDb);
      assert.deepEqual({ displayName, signedOut, dailyCalories, carbTarget }, {
        displayName: 'Anya', signedOut: 0, dailyCalories: 1825, carbTarget: 250,
      });
    } finally { profileDb.sql.close(); }
  } finally { db.sql.close(); }
});

const mealCache = load('database/MealAnalysisCache.ts');
const mealNutrition = { calories: 440, protein: 30, carbs: 62, fat: 8 };
const mealEstimate = {
  ...mealNutrition,
  foodItems: [{ name: 'Rice with chicken', quantity: '1 plate', preparation: null, estimatedWeightGrams: 350, ...mealNutrition }],
};

test('local profile switching isolates nutrition data while sharing the bundled Gemini budget', async () => {
  const db = openDatabase();
  try {
    await database.initializeDatabase(db);
    const targets = { dailyCalories: 2000, proteinTarget: 60, carbTarget: 250, fatTarget: 65 };
    const first = await database.createProfile(db, targets, 'First');
    const { id: _, ...newRecipe } = recipe;
    const recipeId = await database.insertRecipe(db, newRecipe, first);
    const log = { foodText: 'Existing meal', oilPercentage: 100, ...mealNutrition, createdAt: new Date().toISOString() };
    const logId = await database.insertFoodLog(db, log, first);
    await mealCache.cacheConfirmedMeal(db, 'rice with chicken', 100, mealEstimate, first);
    await analysisUsage.recordAnalysisUsage(db, 'personal', undefined, first);
    await analysisUsage.recordAnalysisUsage(db, 'default', undefined, first);
    await analysisUsage.setGeminiDailyLimit(db, 'personal', 12, first);
    await analysisUsage.setGeminiDailyLimit(db, 'default', 30, first);
    await assert.rejects(database.createProfile(db, targets, 'Another active profile'));
    await database.setProfileSignedOut(db, first, true);
    const second = await database.createProfile(db, { ...targets, dailyCalories: 2400 }, 'Second');
    assert.equal((await database.getSavedProfiles(db)).length, 2);
    assert.equal((await database.getUserSettings(db)).dailyCalories, 2400);
    assert.deepEqual(await database.getRecipes(db, second), []);
    assert.deepEqual(await database.getRecentLogs(db, 20, second), []);
    assert.equal(await mealCache.getCachedMeal(db, 'rice with chicken', 100, second), null);
    await mealCache.cacheConfirmedMeal(db, 'rice with chicken', 100, { ...mealEstimate, calories: 480 }, second);
    assert.equal((await mealCache.getCachedMeal(db, 'rice with chicken', 100, second)).calories, 480);
    assert.equal((await analysisUsage.getAnalysisUsage(db, 'personal', undefined, second)).requestsThisQuotaDay, 0);
    assert.equal((await analysisUsage.getAnalysisUsage(db, 'default', undefined, second)).requestsThisQuotaDay, 1);
    assert.equal(await analysisUsage.getGeminiDailyLimit(db, 'personal', second), null);
    assert.equal(await analysisUsage.getGeminiDailyLimit(db, 'default', second), 30);
    await database.deleteRecipe(db, recipeId, second);
    await database.deleteFoodLog(db, logId, second);
    await database.setProfileSignedOut(db, second, true);
    await database.setProfileSignedOut(db, first, false);
    assert.equal((await database.getUserSettings(db)).dailyCalories, 2000);
    assert.equal((await database.getRecipes(db, first))[0].id, recipeId);
    assert.equal((await database.getFoodLogById(db, logId, first)).foodText, log.foodText);
    assert.equal((await mealCache.getCachedMeal(db, 'rice with chicken', 100, first)).calories, 440);
  } finally { db.sql.close(); }
});

test('profile deletion purges local data, preserves other profiles and never reuses a removed ID', async () => {
  const db = openDatabase();
  try {
    await database.initializeDatabase(db);
    const targets = { dailyCalories: 2000, proteinTarget: 60, carbTarget: 250, fatTarget: 65 };
    const first = await database.createProfile(db, targets, 'Keep');
    await mealCache.cacheConfirmedMeal(db, 'same meal', 100, mealEstimate, first);
    await database.setProfileSignedOut(db, first, true);
    const second = await database.createProfile(db, targets, 'Delete');
    const { id: _, ...newRecipe } = recipe;
    await database.insertRecipe(db, newRecipe, second);
    const log = { foodText: 'Meal to delete', oilPercentage: 100, ...mealNutrition, createdAt: new Date().toISOString() };
    await database.insertFoodLog(db, log, second);
    await mealCache.cacheConfirmedMeal(db, 'same meal', 100, mealEstimate, second);
    await analysisUsage.recordAnalysisUsage(db, 'personal', undefined, second);
    await analysisUsage.recordAnalysisUsage(db, 'default', undefined, second);
    await analysisUsage.setGeminiDailyLimit(db, 'personal', 12, second);
    await analysisUsage.setGeminiDailyLimit(db, 'default', 30, second);

    await database.deleteProfile(db, second);
    assert.equal(await database.getUserSettings(db), null);
    assert.deepEqual((await database.getSavedProfiles(db)).map(profile => profile.id), [first]);
    assert.equal((await database.getProfileKeysToRemove(db))[0].profileId, second);
    await database.completeProfileKeyRemoval(db, second);
    assert.deepEqual(await database.getProfileKeysToRemove(db), []);

    // A request dispatched or saved around the time of deletion cannot recreate private rows.
    await assert.rejects(database.insertFoodLog(db, log, second), /Profile was deleted/);
    await mealCache.cacheConfirmedMeal(db, 'same meal', 100, mealEstimate, second);
    await analysisUsage.recordAnalysisUsage(db, 'personal', undefined, second);
    await analysisUsage.recordAnalysisUsage(db, 'default', undefined, second);
    await analysisUsage.setGeminiDailyLimit(db, 'personal', 14, second);
    assert.deepEqual(await database.getRecipes(db, second), []);
    assert.deepEqual(await database.getRecentLogs(db, 20, second), []);
    assert.equal(await mealCache.getCachedMeal(db, 'same meal', 100, second), null);
    assert.equal(await analysisUsage.getGeminiDailyLimit(db, 'personal', second), null);
    assert.equal((await analysisUsage.getAnalysisUsage(db, 'personal', undefined, second)).geminiRequests, 0);
    assert.equal((await analysisUsage.getAnalysisUsage(db, 'default', undefined, first)).requestsThisQuotaDay, 2);
    assert.equal(await analysisUsage.getGeminiDailyLimit(db, 'default', first), 30);
    assert.equal((await mealCache.getCachedMeal(db, 'same meal', 100, first)).calories, 440);

    const next = await database.createProfile(db, targets, 'New');
    assert.ok(next > second);
    await database.deleteProfile(db, next);
    await database.setProfileSignedOut(db, first, false);
    await database.deleteProfile(db, first);
    assert.deepEqual(await database.getSavedProfiles(db), []);
    assert.ok((await database.createProfile(db, targets, 'Fresh')) > next);
  } finally { db.sql.close(); }
});

test('exact meal routing uses saved corrections and sends modifiers, portions and oil changes to Gemini', async () => {
  const db = openDatabase();
  const requests = [];
  let available = true;
  const { analyzeTextMeal, rememberTextMeal } = load('services/TextMealAnalysisService.ts', {
    './GeminiFoodAnalysisService': {
      analyzeFoodWithGemini: async (_db, text, oil) => {
        requests.push([text, oil]);
        if (!available) throw new Error('Offline');
        return mealEstimate;
      },
    },
  });
  try {
    await database.initializeDatabase(db);
    const rice = await analyzeTextMeal(db, '200 g cooked white rice', 100);
    assert.equal(rice.source, 'database');
    assert.equal(rice.result.calories, 260);
    assert.equal(rice.result.foodItems[0].estimatedWeightGrams, 200);
    await rememberTextMeal(db, '200 g cooked white rice', 100, rice);
    assert.equal(await mealCache.getCachedMeal(db, '200 g cooked white rice', 100), null);
    assert.equal(requests.length, 0);

    const meal = 'rice with chicken';
    const first = await analyzeTextMeal(db, meal, 100);
    assert.equal(first.source, 'gemini');
    assert.equal(await mealCache.getCachedMeal(db, meal, 100), null, 'analysis alone does not populate the cache');
    await rememberTextMeal(db, meal, 100, { ...first, result: { ...first.result, calories: 480 } });
    const repeat = await analyzeTextMeal(db, '  Rice   with chicken ', 100);
    assert.equal(repeat.source, 'cache');
    assert.equal(repeat.result.calories, 480);
    assert.deepEqual(repeat.result.foodItems, first.result.foodItems);
    assert.equal(requests.length, 1);

    const changedMeals = [
      ['fried rice with chicken', 100],
      ['rice with chicken', 125],
      ['rice, with chicken', 100],
      ['200 g cooked white rice with chicken', 100],
      ['200 g cooked white rice', 125],
      ['200 g chicken thigh', 100],
    ];
    for (const [text, oil] of changedMeals) assert.equal((await analyzeTextMeal(db, text, oil)).source, 'gemini');
    assert.deepEqual(requests.slice(1), changedMeals);

    assert.equal((await analyzeTextMeal(db, meal, 100, true)).source, 'gemini');
    assert.deepEqual(requests.at(-1), [meal, 100]);
    assert.equal((await mealCache.getCachedMeal(db, meal, 100)).calories, 480);
    available = false;
    await assert.rejects(analyzeTextMeal(db, meal, 100, true), /Offline/);
    assert.equal((await mealCache.getCachedMeal(db, meal, 100)).calories, 480);
    const fallback = await analyzeTextMeal(db, '1 banana', 100);
    assert.equal(fallback.source, 'fallback');
    await rememberTextMeal(db, '1 banana', 100, fallback);
    assert.equal(await mealCache.getCachedMeal(db, '1 banana', 100), null);
    assert.deepEqual({ ...await analysisUsage.getAnalysisUsage(db, 'personal') }, {
      cacheHits: 1, localCalculations: 1, fallbackEstimates: 1, geminiRequests: 0, requestsThisQuotaDay: 0,
    });
  } finally { db.sql.close(); }
});

test('v3 upgrade preserves cached meals and quota counts roll over at Pacific midnight', async () => {
  const db = openDatabase();
  try {
    await database.initializeDatabase(db);
    await mealCache.cacheConfirmedMeal(db, 'rice with chicken', 100, mealEstimate);
    db.sql.exec('DROP TRIGGER purge_profile; DROP TABLE analysis_usage_daily; DROP TABLE gemini_daily_limits; PRAGMA user_version = 3;');
    await database.initializeDatabase(db);
    assert.equal((await mealCache.getCachedMeal(db, 'rice with chicken', 100)).calories, 440);

    const before = new Date('2026-11-07T07:59:59Z');
    const after = new Date('2026-11-07T08:00:00Z');
    assert.equal(analysisUsage.getGeminiQuotaDay(before), '2026-11-06');
    assert.equal(analysisUsage.getGeminiQuotaDay(after), '2026-11-07');
    assert.equal(analysisUsage.getGeminiQuotaDay(new Date('2026-07-07T07:00:00Z')), '2026-07-07');

    await Promise.all([
      analysisUsage.recordAnalysisUsage(db, 'personal', before),
      analysisUsage.recordAnalysisUsage(db, 'personal', before),
      analysisUsage.recordAnalysisUsage(db, 'default', before),
    ]);
    assert.equal((await analysisUsage.getAnalysisUsage(db, 'personal', before)).requestsThisQuotaDay, 2);
    assert.equal((await analysisUsage.getAnalysisUsage(db, 'default', before)).requestsThisQuotaDay, 1);
    assert.equal((await analysisUsage.getAnalysisUsage(db, 'personal', after)).requestsThisQuotaDay, 0);
    assert.equal((await analysisUsage.getAnalysisUsage(db, 'personal', after)).geminiRequests, 3);

    assert.equal(await analysisUsage.getGeminiDailyLimit(db, 'personal'), null);
    assert.equal(analysisUsage.estimateGeminiRequestsLeft(2, null, false), 18);
    assert.equal(analysisUsage.estimateGeminiRequestsLeft(2, null, true), 0);
    assert.equal(analysisUsage.estimateGeminiRequestsLeft(2, 50, false), 48);
    assert.equal(analysisUsage.estimateGeminiRequestsLeft(51, 50, false), 0);
    await analysisUsage.setGeminiDailyLimit(db, 'personal', 20);
    await analysisUsage.setGeminiDailyLimit(db, 'default', 100);
    await analysisUsage.setGeminiDailyLimit(db, 'personal', 25);
    assert.equal(await analysisUsage.getGeminiDailyLimit(db, 'personal'), 25);
    assert.equal(await analysisUsage.getGeminiDailyLimit(db, 'default'), 100);
    await assert.rejects(analysisUsage.setGeminiDailyLimit(db, 'personal', 1.5));
    await analysisUsage.setGeminiDailyLimit(db, 'personal', null);
    assert.equal(await analysisUsage.getGeminiDailyLimit(db, 'personal'), null);

    const nextWeek = new Date('2026-11-14T08:00:00Z');
    await analysisUsage.recordAnalysisUsage(db, 'cache', nextWeek);
    assert.equal(db.sql.prepare('SELECT COUNT(*) AS count FROM analysis_usage_daily').get().count, 1);
    assert.equal((await analysisUsage.getAnalysisUsage(db, 'personal', nextWeek)).geminiRequests, 0);
  } finally { db.sql.close(); }
});

test('v2 upgrade preserves user data and cache evicts by last use with a size limit', async () => {
  const db = openDatabase();
  try {
    await database.initializeDatabase(db);
    const { id, ...newRecipe } = recipe;
    await database.insertRecipe(db, newRecipe);
    await database.insertFoodLog(db, { foodText: 'Existing meal', oilPercentage: 100, ...mealNutrition, createdAt: '2020-01-01T00:00:00Z' });
    db.sql.exec('DROP TRIGGER purge_profile; DROP TABLE meal_analysis_cache; PRAGMA user_version = 2;');
    await database.initializeDatabase(db);
    assert.equal((await database.getRecipes(db))[0].name, recipe.name);
    assert.equal((await database.getRecentLogs(db))[0].foodText, 'Existing meal');

    for (let i = 0; i < 200; i++) await mealCache.cacheConfirmedMeal(db, `meal ${i}`, 100, mealEstimate);
    await mealCache.getCachedMeal(db, 'meal 0', 100);
    await mealCache.cacheConfirmedMeal(db, 'meal 200', 100, mealEstimate);
    assert.equal(db.sql.prepare('SELECT COUNT(*) AS count FROM meal_analysis_cache').get().count, 200);
    assert.equal(await mealCache.getCachedMeal(db, 'meal 1', 100), null);
    assert.equal((await mealCache.getCachedMeal(db, 'meal 0', 100)).calories, 440);

    await mealCache.cacheConfirmedMeal(db, 'Meal 0', 100, { ...mealEstimate, calories: 460 });
    await mealCache.cacheConfirmedMeal(db, 'meal 0', 100, {
      ...mealEstimate, foodItems: [{ ...mealEstimate.foodItems[0], name: 'x'.repeat(2000) }],
    });
    await database.deleteLogsOlderThan(db, 7);
    assert.equal((await database.getRecentLogs(db)).length, 0);
    assert.equal((await mealCache.getCachedMeal(db, 'meal 0', 100)).calories, 460);
    assert.equal(db.sql.prepare('SELECT COUNT(*) AS count FROM meal_analysis_cache').get().count, 200);
    db.sql.prepare('UPDATE meal_analysis_cache SET result = ? WHERE description = ?').run('{broken json', 'meal 0');
    assert.equal(await mealCache.getCachedMeal(db, 'meal 0', 100), null);
  } finally { db.sql.close(); }
});

test('personal keys use secure native storage; browser previews never persist credentials', async () => {
  const stored = new Map();
  const platform = { OS: 'android' };
  const keys = load('services/ApiKeyService.ts', {
    'react-native': { Platform: platform },
    'expo-secure-store': {
      getItemAsync: async key => stored.get(key) ?? null,
      setItemAsync: async (key, value) => { stored.set(key, value); },
      deleteItemAsync: async key => { stored.delete(key); },
    },
  });
  await keys.savePersonalApiKey('  personal-test  ');
  assert.equal(await keys.getPersonalApiKey(), 'personal-test');
  assert.equal(await keys.getPersonalApiKey(2), null);
  await keys.savePersonalApiKey('second-profile-key', 2);
  assert.equal(await keys.getPersonalApiKey(2), 'second-profile-key');
  await keys.removePersonalApiKey();
  assert.equal(await keys.getPersonalApiKey(), null);
  assert.equal(await keys.getPersonalApiKey(2), 'second-profile-key');
  await Promise.all([keys.savePersonalApiKey('replacement-key', 2), keys.removePersonalApiKey(2)]);
  assert.equal(await keys.getPersonalApiKey(2), null);
  await assert.rejects(keys.savePersonalApiKey('key-one,key-two'));
  platform.OS = 'web';
  await keys.savePersonalApiKey('browser-test');
  assert.equal(await keys.getPersonalApiKey(), 'browser-test');
  assert.equal(stored.size, 0);
  await keys.removePersonalApiKey();
});

test('default rotation, personal-key precedence, and recipe attempts are counted including failures and retries', async () => {
  const db = openDatabase();
  const previousKeys = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  const previousFetch = global.fetch;
  process.env.EXPO_PUBLIC_GEMINI_API_KEY = 'default-one,default-two,default-three,default-four';
  let personal = null;
  const requests = [];
  const service = load('services/GeminiFoodAnalysisService.ts', {
    './ApiKeyService': { getPersonalApiKey: async () => personal },
  });
  let fail = false;
  let networkError = false;
  global.fetch = async (_url, options) => {
    requests.push(options);
    if (networkError) throw new Error('Connection failed');
    return fail ? { ok: false, status: 429 } : { ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: JSON.stringify({
      foodItems: [{ name: 'rice', quantity: '100 g', estimatedWeightGrams: 100, calories: 130, protein: 3, carbs: 28, fat: 0 }],
      calories: 130, protein: 3, carbs: 28, fat: 0,
    }) }] } }] }) };
  };
  try {
    await database.initializeDatabase(db);
    for (let i = 0; i < 5; i++) await service.analyzeFoodWithGemini(db, '100 g rice', 100);
    assert.deepEqual(requests.map(r => r.headers['x-goog-api-key']), ['default-one', 'default-two', 'default-three', 'default-four', 'default-one']);
    personal = 'personal';
    await service.analyzeFoodWithGemini(db, 'whole recipe', 100, true);
    assert.equal(requests.at(-1).headers['x-goog-api-key'], 'personal');
    assert.match(requests.at(-1).body, /WHOLE RECIPE/);
    fail = true;
    const start = requests.length;
    await assert.rejects(service.analyzeFoodWithGemini(db, 'rice', 100));
    assert.equal(requests.length - start, 1, 'personal key failure must not spend default quota');
    personal = null;
    const retryStart = requests.length;
    await assert.rejects(service.analyzeFoodWithGemini(db, 'rice', 100));
    assert.equal(requests.length - retryStart, 4, 'all configured default keys are still attempted');
    personal = 'personal';
    networkError = true;
    await assert.rejects(service.analyzeFoodWithGemini(db, 'rice', 100), /Connection failed/);
    assert.equal((await analysisUsage.getAnalysisUsage(db, 'default')).requestsThisQuotaDay, 9);
    const personalUsage = await analysisUsage.getAnalysisUsage(db, 'personal');
    assert.equal(personalUsage.requestsThisQuotaDay, 3);
    assert.equal(personalUsage.geminiRequests, requests.length);

    process.env.EXPO_PUBLIC_GEMINI_API_KEY = '';
    const unconfigured = load('services/GeminiFoodAnalysisService.ts', {
      './ApiKeyService': { getPersonalApiKey: async () => null },
    });
    await assert.rejects(unconfigured.analyzeFoodWithGemini(db, 'rice', 100), /not configured/);
    assert.equal((await analysisUsage.getAnalysisUsage(db, 'default')).geminiRequests, requests.length);
  } finally {
    db.sql.close();
    global.fetch = previousFetch;
    if (previousKeys === undefined) delete process.env.EXPO_PUBLIC_GEMINI_API_KEY;
    else process.env.EXPO_PUBLIC_GEMINI_API_KEY = previousKeys;
  }
});

test('a structured daily request rejection shows exhaustion for the active key and quota day only', async () => {
  const db = openDatabase();
  const previousKeys = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  const previousFetch = global.fetch;
  process.env.EXPO_PUBLIC_GEMINI_API_KEY = 'shared-one,shared-two';
  let personal = 'first-personal-key';
  const service = load('services/GeminiFoodAnalysisService.ts', {
    './ApiKeyService': { getPersonalApiKey: async () => personal },
  });
  let quotaId = 'GenerateRequestsPerMinutePerProjectPerModel-FreeTier';
  let model = service.GEMINI_MODEL;
  let ok = false;
  global.fetch = async () => ({
    ok,
    status: ok ? 200 : 429,
    json: async () => ok ? { candidates: [{ content: { parts: [{ text: JSON.stringify(mealEstimate) }] } }] } : {
      error: { details: [{
        '@type': 'type.googleapis.com/google.rpc.QuotaFailure',
        violations: [{ quotaId, quotaDimensions: { model } }],
      }] },
    },
  });
  try {
    await database.initializeDatabase(db);
    await assert.rejects(service.analyzeFoodWithGemini(db, 'rice', 100), /429/);
    assert.equal(await service.hasReportedDailyQuotaReached('personal'), false);

    quotaId = 'GenerateRequestsPerDayPerProjectPerModel-FreeTier';
    model = 'different-model';
    await assert.rejects(service.analyzeFoodWithGemini(db, 'rice', 100), /429/);
    assert.equal(await service.hasReportedDailyQuotaReached('personal'), false);

    model = service.GEMINI_MODEL;
    await assert.rejects(service.analyzeFoodWithGemini(db, 'rice', 100), /daily request quota/);
    assert.equal(await service.hasReportedDailyQuotaReached('personal'), true);
    assert.equal(await service.hasReportedDailyQuotaReached('personal', new Date(Date.now() + 48 * 60 * 60 * 1000)), false);
    personal = 'another-personal-key';
    assert.equal(await service.hasReportedDailyQuotaReached('personal'), false);
    personal = null;
    await assert.rejects(service.analyzeFoodWithGemini(db, 'rice', 100), /429/);
    assert.equal(await service.hasReportedDailyQuotaReached('default'), false, 'a multi-key pool may span several projects');

    personal = 'first-personal-key';
    ok = true;
    await service.analyzeFoodWithGemini(db, 'rice', 100);
    assert.equal(await service.hasReportedDailyQuotaReached('personal'), false);
  } finally {
    db.sql.close();
    global.fetch = previousFetch;
    if (previousKeys === undefined) delete process.env.EXPO_PUBLIC_GEMINI_API_KEY;
    else process.env.EXPO_PUBLIC_GEMINI_API_KEY = previousKeys;
  }
});
