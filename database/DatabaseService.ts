import type { SQLiteDatabase } from 'expo-sqlite';
import { FoodLog, UserSettings } from '../types';

const DATABASE_VERSION = 1;

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
    await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
  }
}

export async function insertFoodLog(
  db: SQLiteDatabase,
  log: Omit<FoodLog, 'id'>
): Promise<number> {
  const result = await db.runAsync(
    `INSERT INTO food_logs (foodText, oilPercentage, calories, protein, carbs, fat, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    log.foodText,
    log.oilPercentage,
    log.calories,
    log.protein,
    log.carbs,
    log.fat,
    log.createdAt
  );
  return result.lastInsertRowId;
}

export async function updateSettings(
  db: SQLiteDatabase,
  settings: Omit<UserSettings, 'id' | 'createdAt' | 'updatedAt'>
): Promise<void> {
  const existing = await getUserSettings(db);
  const now = new Date().toISOString();

  if (existing) {
    await db.runAsync(
      `UPDATE user_settings SET dailyCalories = ?, proteinTarget = ?, carbTarget = ?, fatTarget = ?, updatedAt = ? WHERE id = ?`,
      settings.dailyCalories,
      settings.proteinTarget,
      settings.carbTarget,
      settings.fatTarget,
      now,
      existing.id
    );
  } else {
    await db.runAsync(
      `INSERT INTO user_settings (dailyCalories, proteinTarget, carbTarget, fatTarget, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?)`,
      settings.dailyCalories,
      settings.proteinTarget,
      settings.carbTarget,
      settings.fatTarget,
      now,
      now
    );
  }
}

export async function getUserSettings(
  db: SQLiteDatabase
): Promise<UserSettings | null> {
  const row = await db.getFirstAsync<UserSettings>(
    'SELECT * FROM user_settings LIMIT 1'
  );
  return row ?? null;
}

export async function getTodayTotals(
  db: SQLiteDatabase,
  dateString: string
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
     WHERE DATE(createdAt) = ?`,
    dateString
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
  limit: number = 20
): Promise<FoodLog[]> {
  return db.getAllAsync<FoodLog>(
    'SELECT * FROM food_logs ORDER BY createdAt DESC LIMIT ?',
    limit
  );
}

export async function getFoodLogById(
  db: SQLiteDatabase,
  id: number
): Promise<FoodLog | null> {
  const row = await db.getFirstAsync<FoodLog>(
    'SELECT * FROM food_logs WHERE id = ?',
    id
  );
  return row ?? null;
}

export async function updateFoodLog(
  db: SQLiteDatabase,
  log: FoodLog
): Promise<void> {
  await db.runAsync(
    `UPDATE food_logs SET foodText = ?, oilPercentage = ?, calories = ?, protein = ?, carbs = ?, fat = ?, createdAt = ? WHERE id = ?`,
    log.foodText,
    log.oilPercentage,
    log.calories,
    log.protein,
    log.carbs,
    log.fat,
    log.createdAt,
    log.id
  );
}

export async function deleteFoodLog(
  db: SQLiteDatabase,
  id: number
): Promise<void> {
  await db.runAsync('DELETE FROM food_logs WHERE id = ?', id);
}

export async function getLogsForDate(
  db: SQLiteDatabase,
  dateString: string
): Promise<FoodLog[]> {
  return db.getAllAsync<FoodLog>(
    "SELECT * FROM food_logs WHERE DATE(createdAt) = ? ORDER BY createdAt DESC",
    dateString
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
