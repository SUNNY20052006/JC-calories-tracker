import type { SQLiteDatabase } from 'expo-sqlite';

export type GeminiScope = 'personal' | 'default';

export const STARTER_GEMINI_DAILY_BUDGET = 20;

export function estimateGeminiRequestsLeft(
  attempts: number,
  dailyLimit: number | null,
  dailyQuotaReached: boolean
): number {
  if (dailyQuotaReached) return 0;
  return Math.max(0, (dailyLimit ?? STARTER_GEMINI_DAILY_BUDGET) - attempts);
}

const counters = {
  cache: 'cacheHits',
  database: 'localCalculations',
  fallback: 'fallbackEstimates',
  personal: 'personalRequests',
  default: 'defaultRequests',
} as const;

const pacificDate = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/Los_Angeles',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export function getGeminiQuotaDay(date = new Date()): string {
  const parts = pacificDate.formatToParts(date);
  const year = parts.find(part => part.type === 'year')?.value;
  const month = parts.find(part => part.type === 'month')?.value;
  const day = parts.find(part => part.type === 'day')?.value;
  return `${year}-${month}-${day}`;
}

export async function recordAnalysisUsage(
  db: SQLiteDatabase,
  event: keyof typeof counters,
  at = new Date(),
  profileId = 1
): Promise<void> {
  const column = counters[event];
  await db.runAsync(
    `INSERT INTO analysis_usage_daily (day, profileId, ${column}) VALUES (?, ?, 1)
     ON CONFLICT (day, profileId) DO UPDATE SET ${column} = ${column} + 1`,
    getGeminiQuotaDay(at), profileId
  );
}

export interface AnalysisUsageSummary {
  cacheHits: number;
  localCalculations: number;
  fallbackEstimates: number;
  geminiRequests: number;
  requestsThisQuotaDay: number;
}

export async function getAnalysisUsage(
  db: SQLiteDatabase,
  scope: GeminiScope,
  at = new Date(),
  profileId = 1
): Promise<AnalysisUsageSummary> {
  const day = getGeminiQuotaDay(at);
  // The app's bundled key pool has one budget on this device, shared across profiles.
  const result = await db.getFirstAsync<AnalysisUsageSummary>(
    `SELECT COALESCE(SUM(cacheHits), 0) AS cacheHits,
            COALESCE(SUM(localCalculations), 0) AS localCalculations,
            COALESCE(SUM(fallbackEstimates), 0) AS fallbackEstimates,
            COALESCE(SUM(personalRequests + defaultRequests), 0) AS geminiRequests,
            (SELECT COALESCE(SUM(${counters[scope]}), 0) FROM analysis_usage_daily
             WHERE day = ? ${scope === 'personal' ? 'AND profileId = ?' : ''}) AS requestsThisQuotaDay
     FROM analysis_usage_daily
     WHERE profileId = ? AND day BETWEEN date(?, '-6 days') AND ?`,
    ...(scope === 'personal' ? [day, profileId, profileId, day, day] : [day, profileId, day, day])
  );
  return result ?? { cacheHits: 0, localCalculations: 0, fallbackEstimates: 0, geminiRequests: 0, requestsThisQuotaDay: 0 };
}

export async function getGeminiDailyLimit(db: SQLiteDatabase, scope: GeminiScope, profileId = 1): Promise<number | null> {
  const row = await db.getFirstAsync<{ dailyLimit: number }>(
    'SELECT dailyLimit FROM gemini_daily_limits WHERE scope = ? AND profileId = ?', scope, scope === 'default' ? 1 : profileId
  );
  return row?.dailyLimit ?? null;
}

export async function setGeminiDailyLimit(db: SQLiteDatabase, scope: GeminiScope, limit: number | null, profileId = 1): Promise<void> {
  const owner = scope === 'default' ? 1 : profileId;
  if (limit === null) {
    await db.runAsync('DELETE FROM gemini_daily_limits WHERE scope = ? AND profileId = ?', scope, owner);
    return;
  }
  if (!Number.isSafeInteger(limit) || limit < 1) throw new Error('Enter a positive whole number.');
  await db.runAsync(
    `INSERT INTO gemini_daily_limits (scope, profileId, dailyLimit) VALUES (?, ?, ?)
     ON CONFLICT (scope, profileId) DO UPDATE SET dailyLimit = excluded.dailyLimit`,
    scope, owner, limit
  );
}
