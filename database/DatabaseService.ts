import type { SQLiteDatabase } from 'expo-sqlite';
import { FoodLog, UserSettings, NutritionTargets, Recipe, SavedProfile } from '../types';

const DATABASE_VERSION = 8;

export async function initializeDatabase(db: SQLiteDatabase): Promise<void> {
  const versionRow = await db.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version'
  );
  const currentVersion = versionRow?.user_version ?? 0;

  if (currentVersion >= DATABASE_VERSION) return;

  if (currentVersion === 0) {
    await db.execAsync(`
      PRAGMA journal_mode = 'wal';
      CREATE TABLE IF NOT EXISTS user_settings (
        id INTEGER PRIMARY KEY NOT NULL,
        dailyCalories REAL NOT NULL,
        proteinTarget REAL NOT NULL,
        carbTarget REAL NOT NULL,
        fatTarget REAL NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS food_logs (
        id INTEGER PRIMARY KEY NOT NULL,
        foodText TEXT NOT NULL,
        oilPercentage REAL NOT NULL DEFAULT 100,
        calories REAL NOT NULL,
        protein REAL NOT NULL,
        carbs REAL NOT NULL,
        fat REAL NOT NULL,
        createdAt TEXT NOT NULL
      );
    `);
  }
  if (currentVersion < 2) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS recipes (
        id INTEGER PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        servings REAL NOT NULL CHECK(servings > 0),
        calories REAL NOT NULL CHECK(calories >= 0),
        protein REAL NOT NULL CHECK(protein >= 0),
        carbs REAL NOT NULL CHECK(carbs >= 0),
        fat REAL NOT NULL CHECK(fat >= 0),
        createdAt TEXT NOT NULL
      );
    `);
  }
  if (currentVersion < 3) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS meal_analysis_cache (
        id INTEGER PRIMARY KEY,
        description TEXT NOT NULL,
        oilPercentage REAL NOT NULL,
        result TEXT NOT NULL,
        lastUsed INTEGER NOT NULL,
        UNIQUE (description, oilPercentage)
      );
      CREATE INDEX IF NOT EXISTS meal_analysis_cache_last_used ON meal_analysis_cache (lastUsed);
      CREATE TRIGGER IF NOT EXISTS limit_meal_analysis_cache
      AFTER INSERT ON meal_analysis_cache
      BEGIN
        DELETE FROM meal_analysis_cache WHERE id IN (
          SELECT id FROM meal_analysis_cache ORDER BY lastUsed DESC LIMIT -1 OFFSET 200
        );
      END;
    `);
  }
  if (currentVersion < 4) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS analysis_usage_daily (
        day TEXT PRIMARY KEY NOT NULL,
        cacheHits INTEGER NOT NULL DEFAULT 0,
        localCalculations INTEGER NOT NULL DEFAULT 0,
        fallbackEstimates INTEGER NOT NULL DEFAULT 0,
        personalRequests INTEGER NOT NULL DEFAULT 0,
        defaultRequests INTEGER NOT NULL DEFAULT 0
      );
      CREATE TRIGGER IF NOT EXISTS prune_analysis_usage
      AFTER INSERT ON analysis_usage_daily
      BEGIN
        DELETE FROM analysis_usage_daily WHERE day < date(NEW.day, '-6 days');
      END;
      CREATE TABLE IF NOT EXISTS gemini_daily_limits (
        scope TEXT PRIMARY KEY NOT NULL CHECK (scope IN ('personal', 'default')),
        dailyLimit INTEGER NOT NULL CHECK (dailyLimit > 0)
      );
    `);
  }
  if (currentVersion < 5) {
    const columns = await db.getAllAsync<{ name: string }>('PRAGMA table_info(user_settings)');
    if (!columns.some(column => column.name === 'displayName')) {
      await db.execAsync('ALTER TABLE user_settings ADD COLUMN displayName TEXT');
    }
  }
  if (currentVersion < 6) {
    const columns = await db.getAllAsync<{ name: string }>('PRAGMA table_info(user_settings)');
    if (!columns.some(column => column.name === 'signedOut')) {
      await db.execAsync('ALTER TABLE user_settings ADD COLUMN signedOut INTEGER NOT NULL DEFAULT 0');
    }
  }
  await db.execAsync('BEGIN');
  try {
    await addProfileScopes(db);
    await addProfileDeletion(db);
    await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}; COMMIT;`);
  } catch (error) {
    await db.execAsync('ROLLBACK');
    throw error;
  }
}

async function addProfileDeletion(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS profile_id_counter (id INTEGER PRIMARY KEY CHECK (id = 1), lastId INTEGER NOT NULL);
    INSERT OR IGNORE INTO profile_id_counter SELECT 1, COALESCE(MAX(id), 0) FROM user_settings;
    CREATE TRIGGER IF NOT EXISTS advance_profile_id AFTER INSERT ON user_settings BEGIN
      UPDATE profile_id_counter SET lastId = MAX(lastId, NEW.id) WHERE id = 1;
    END;
    CREATE TABLE IF NOT EXISTS profile_keys_to_remove (profileId INTEGER PRIMARY KEY NOT NULL);
    CREATE TRIGGER IF NOT EXISTS purge_profile AFTER DELETE ON user_settings BEGIN
      INSERT INTO profile_keys_to_remove (profileId) VALUES (OLD.id);
      DELETE FROM food_logs WHERE profileId = OLD.id;
      DELETE FROM recipes WHERE profileId = OLD.id;
      DELETE FROM meal_analysis_cache WHERE profileId = OLD.id;
      DELETE FROM gemini_daily_limits WHERE profileId = OLD.id AND scope = 'personal';
      INSERT INTO analysis_usage_daily (day, profileId, defaultRequests)
        SELECT day, 0, defaultRequests FROM analysis_usage_daily WHERE profileId = OLD.id AND defaultRequests > 0
        ON CONFLICT (day, profileId) DO UPDATE SET defaultRequests = defaultRequests + excluded.defaultRequests;
      DELETE FROM analysis_usage_daily WHERE profileId = OLD.id;
    END;
  `);
  // A save started before deletion must not recreate the profile's data. IDs above the counter
  // have never belonged to a profile, including the implicit first slot used by offline tools.
  const removedOwner = `NEW.profileId > 0 AND NEW.profileId <= (SELECT lastId FROM profile_id_counter WHERE id = 1)
    AND NOT EXISTS (SELECT 1 FROM user_settings WHERE id = NEW.profileId)`;
  for (const table of ['food_logs', 'recipes', 'meal_analysis_cache', 'gemini_daily_limits']) {
    const profileOnly = table === 'gemini_daily_limits' ? "AND NEW.scope = 'personal'" : '';
    const onRemoved = table === 'food_logs' || table === 'recipes' ? "RAISE(ABORT, 'Profile was deleted')" : 'RAISE(IGNORE)';
    await db.execAsync(`CREATE TRIGGER IF NOT EXISTS reject_removed_${table} BEFORE INSERT ON ${table}
      WHEN ${removedOwner} ${profileOnly} BEGIN SELECT ${onRemoved}; END;`);
  }
  await db.execAsync(`CREATE TRIGGER IF NOT EXISTS discard_removed_usage BEFORE INSERT ON analysis_usage_daily
    WHEN ${removedOwner} BEGIN
      INSERT INTO analysis_usage_daily (day, profileId, defaultRequests)
        SELECT NEW.day, 0, NEW.defaultRequests WHERE NEW.defaultRequests > 0
        ON CONFLICT (day, profileId) DO UPDATE SET defaultRequests = defaultRequests + excluded.defaultRequests;
      SELECT RAISE(IGNORE);
    END;`);
}

async function addProfileScopes(db: SQLiteDatabase): Promise<void> {
  const hasProfileId = async (table: string) => (await db.getAllAsync<{ name: string }>(`PRAGMA table_info(${table})`))
    .some(column => column.name === 'profileId');
  // Single-profile installs always used the first row (ID 1).
  for (const table of ['food_logs', 'recipes']) {
    if (!(await hasProfileId(table))) await db.execAsync(`ALTER TABLE ${table} ADD COLUMN profileId INTEGER NOT NULL DEFAULT 1`);
  }
  await db.execAsync(`
    CREATE UNIQUE INDEX IF NOT EXISTS active_local_profile ON user_settings (signedOut) WHERE signedOut = 0;
    CREATE INDEX IF NOT EXISTS profile_food_log_date ON food_logs (profileId, createdAt);
    CREATE INDEX IF NOT EXISTS profile_recipe_name ON recipes (profileId, name COLLATE NOCASE);
  `);
  if (!(await hasProfileId('meal_analysis_cache'))) await db.execAsync(`
    ALTER TABLE meal_analysis_cache RENAME TO legacy_meal_analysis_cache;
    CREATE TABLE meal_analysis_cache (
      id INTEGER PRIMARY KEY, profileId INTEGER NOT NULL, description TEXT NOT NULL,
      oilPercentage REAL NOT NULL, result TEXT NOT NULL, lastUsed INTEGER NOT NULL,
      UNIQUE (profileId, description, oilPercentage)
    );
    INSERT INTO meal_analysis_cache SELECT id, 1, description, oilPercentage, result, lastUsed FROM legacy_meal_analysis_cache;
    DROP TABLE legacy_meal_analysis_cache;
    CREATE INDEX meal_analysis_cache_last_used ON meal_analysis_cache (profileId, lastUsed);
    CREATE TRIGGER limit_meal_analysis_cache AFTER INSERT ON meal_analysis_cache BEGIN
      DELETE FROM meal_analysis_cache WHERE id IN (
        SELECT id FROM meal_analysis_cache WHERE profileId = NEW.profileId ORDER BY lastUsed DESC LIMIT -1 OFFSET 200
      );
    END;
  `);
  if (!(await hasProfileId('analysis_usage_daily'))) await db.execAsync(`
    ALTER TABLE analysis_usage_daily RENAME TO legacy_analysis_usage_daily;
    CREATE TABLE analysis_usage_daily (
      day TEXT NOT NULL, profileId INTEGER NOT NULL,
      cacheHits INTEGER NOT NULL DEFAULT 0, localCalculations INTEGER NOT NULL DEFAULT 0,
      fallbackEstimates INTEGER NOT NULL DEFAULT 0, personalRequests INTEGER NOT NULL DEFAULT 0,
      defaultRequests INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (day, profileId)
    );
    INSERT INTO analysis_usage_daily
      SELECT day, 1, cacheHits, localCalculations, fallbackEstimates, personalRequests, defaultRequests FROM legacy_analysis_usage_daily;
    DROP TABLE legacy_analysis_usage_daily;
    CREATE TRIGGER prune_analysis_usage AFTER INSERT ON analysis_usage_daily BEGIN
      DELETE FROM analysis_usage_daily WHERE day < date(NEW.day, '-6 days');
    END;
  `);
  if (!(await hasProfileId('gemini_daily_limits'))) await db.execAsync(`
    ALTER TABLE gemini_daily_limits RENAME TO legacy_gemini_daily_limits;
    CREATE TABLE gemini_daily_limits (
      scope TEXT NOT NULL CHECK (scope IN ('personal', 'default')), profileId INTEGER NOT NULL,
      dailyLimit INTEGER NOT NULL CHECK (dailyLimit > 0), PRIMARY KEY (scope, profileId)
    );
    INSERT INTO gemini_daily_limits SELECT scope, 1, dailyLimit FROM legacy_gemini_daily_limits;
    DROP TABLE legacy_gemini_daily_limits;
  `);
}

export async function getRecipes(db: SQLiteDatabase, profileId = 1): Promise<Recipe[]> {
  return db.getAllAsync<Recipe>('SELECT * FROM recipes WHERE profileId = ? ORDER BY name COLLATE NOCASE, id', profileId);
}

export async function insertRecipe(db: SQLiteDatabase, recipe: Omit<Recipe, 'id'>, profileId = 1): Promise<number> {
  if (!recipe.name.trim() || !recipe.description.trim() || !Number.isFinite(recipe.servings) || recipe.servings <= 0 ||
      [recipe.calories, recipe.protein, recipe.carbs, recipe.fat].some(v => !Number.isFinite(v) || v < 0)) {
    throw new Error('Invalid recipe values');
  }
  const result = await db.runAsync(
    'INSERT INTO recipes (name, description, servings, calories, protein, carbs, fat, createdAt, profileId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    recipe.name.trim(), recipe.description.trim(), recipe.servings, recipe.calories, recipe.protein, recipe.carbs, recipe.fat, recipe.createdAt, profileId
  );
  return result.lastInsertRowId;
}

export async function deleteRecipe(db: SQLiteDatabase, id: number, profileId = 1): Promise<void> {
  await db.runAsync('DELETE FROM recipes WHERE id = ? AND profileId = ?', id, profileId);
}

export async function insertFoodLog(
  db: SQLiteDatabase,
  log: Omit<FoodLog, 'id'>,
  profileId = 1
): Promise<number> {
  const result = await db.runAsync(
    `INSERT INTO food_logs (foodText, oilPercentage, calories, protein, carbs, fat, createdAt, profileId)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    log.foodText,
    log.oilPercentage,
    log.calories,
    log.protein,
    log.carbs,
    log.fat,
    log.createdAt,
    profileId
  );
  return result.lastInsertRowId;
}

export async function updateSettings(
  db: SQLiteDatabase,
  settings: NutritionTargets,
  id: number
): Promise<void> {
  await db.runAsync(
    `UPDATE user_settings SET dailyCalories = ?, proteinTarget = ?, carbTarget = ?, fatTarget = ?,
     updatedAt = ? WHERE id = ?`,
    settings.dailyCalories, settings.proteinTarget, settings.carbTarget, settings.fatTarget, new Date().toISOString(), id
  );
}

export async function createProfile(db: SQLiteDatabase, targets: NutritionTargets, displayName: string): Promise<number> {
  const name = displayName.trim();
  if (!name) throw new Error('Missing profile name');
  const now = new Date().toISOString();
  const result = await db.runAsync(
    `INSERT INTO user_settings (id, dailyCalories, proteinTarget, carbTarget, fatTarget, displayName, createdAt, updatedAt)
     SELECT lastId + 1, ?, ?, ?, ?, ?, ?, ? FROM profile_id_counter WHERE id = 1`,
    targets.dailyCalories, targets.proteinTarget, targets.carbTarget, targets.fatTarget, name, now, now
  );
  return result.lastInsertRowId;
}

export async function getUserSettings(
  db: SQLiteDatabase
): Promise<UserSettings | null> {
  const row = await db.getFirstAsync<UserSettings>(
    'SELECT * FROM user_settings WHERE signedOut = 0'
  );
  return row ?? null;
}

export async function getSavedProfiles(db: SQLiteDatabase): Promise<SavedProfile[]> {
  return db.getAllAsync<SavedProfile>('SELECT id, displayName FROM user_settings ORDER BY updatedAt DESC, id DESC');
}

export async function renameProfile(db: SQLiteDatabase, id: number, displayName: string): Promise<void> {
  const name = displayName.trim();
  if (!name) throw new Error('Missing profile name');
  await db.runAsync('UPDATE user_settings SET displayName = ?, updatedAt = ? WHERE id = ?', name, new Date().toISOString(), id);
}

export async function setProfileSignedOut(db: SQLiteDatabase, id: number, signedOut: boolean): Promise<void> {
  const { changes } = await db.runAsync('UPDATE user_settings SET signedOut = ?, updatedAt = ? WHERE id = ?',
    Number(signedOut), new Date().toISOString(), id);
  if (!changes) throw new Error('Saved profile not found');
}

export async function deleteProfile(db: SQLiteDatabase, id: number): Promise<void> {
  const { changes } = await db.runAsync('DELETE FROM user_settings WHERE id = ? AND signedOut = 0', id);
  if (!changes) throw new Error('Active profile not found');
}

export async function getProfileKeysToRemove(db: SQLiteDatabase): Promise<{ profileId: number }[]> {
  return db.getAllAsync<{ profileId: number }>('SELECT profileId FROM profile_keys_to_remove');
}

export async function completeProfileKeyRemoval(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM profile_keys_to_remove WHERE profileId = ?', id);
}

export async function getTodayTotals(
  db: SQLiteDatabase,
  dateString: string,
  profileId = 1
): Promise<{ calories: number; protein: number; carbs: number; fat: number }> {
  const row = await db.getFirstAsync<{
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }>(
    `SELECT
       COALESCE(SUM(calories), 0) as calories,
       COALESCE(SUM(protein), 0) as protein,
       COALESCE(SUM(carbs), 0) as carbs,
       COALESCE(SUM(fat), 0) as fat
     FROM food_logs
     WHERE profileId = ? AND DATE(createdAt, 'localtime') = ?`,
    profileId, dateString
  );

  return {
    calories: row?.calories ?? 0,
    protein: row?.protein ?? 0,
    carbs: row?.carbs ?? 0,
    fat: row?.fat ?? 0,
  };
}

export async function getRecentLogs(
  db: SQLiteDatabase,
  limit: number = 20,
  profileId = 1
): Promise<FoodLog[]> {
  return db.getAllAsync<FoodLog>(
    'SELECT * FROM food_logs WHERE profileId = ? ORDER BY createdAt DESC LIMIT ?',
    profileId, limit
  );
}

export async function getFoodLogById(
  db: SQLiteDatabase,
  id: number,
  profileId = 1
): Promise<FoodLog | null> {
  const row = await db.getFirstAsync<FoodLog>(
    'SELECT * FROM food_logs WHERE id = ? AND profileId = ?',
    id, profileId
  );
  return row ?? null;
}

export async function updateFoodLog(
  db: SQLiteDatabase,
  log: FoodLog,
  profileId = 1
): Promise<void> {
  await db.runAsync(
    `UPDATE food_logs SET foodText = ?, oilPercentage = ?, calories = ?, protein = ?, carbs = ?, fat = ?, createdAt = ? WHERE id = ? AND profileId = ?`,
    log.foodText,
    log.oilPercentage,
    log.calories,
    log.protein,
    log.carbs,
    log.fat,
    log.createdAt,
    log.id,
    profileId
  );
}

export async function deleteFoodLog(
  db: SQLiteDatabase,
  id: number,
  profileId = 1
): Promise<void> {
  await db.runAsync('DELETE FROM food_logs WHERE id = ? AND profileId = ?', id, profileId);
}

export async function getLogsForDate(
  db: SQLiteDatabase,
  dateString: string,
  profileId = 1
): Promise<FoodLog[]> {
  return db.getAllAsync<FoodLog>(
    "SELECT * FROM food_logs WHERE profileId = ? AND DATE(createdAt, 'localtime') = ? ORDER BY createdAt DESC",
    profileId, dateString
  );
}

export async function deleteLogsOlderThan(
  db: SQLiteDatabase,
  days: number
): Promise<void> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  await db.runAsync('DELETE FROM food_logs WHERE DATE(createdAt) < ?', cutoff.toISOString().slice(0, 10));
}
