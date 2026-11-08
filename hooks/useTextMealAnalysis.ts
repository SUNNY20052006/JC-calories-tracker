import { useRef, useState } from 'react';
import { Alert } from 'react-native';
import type { SQLiteDatabase } from 'expo-sqlite';
import { analyzeTextMeal, type TextMealAnalysis } from '../services/TextMealAnalysisService';

export function useTextMealAnalysis(db: SQLiteDatabase, profileId: number) {
  const [analysis, setAnalysis] = useState<TextMealAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const revision = useRef(0);
  const busy = useRef(false);

  function invalidate() {
    revision.current++;
    setAnalysis(null);
  }

  async function analyze(text: string, oilPercentage: number, forceGemini = false) {
    if (busy.current || !text.trim()) return null;
    busy.current = true;
    setAnalyzing(true);
    const requestRevision = revision.current;
    try {
      const next = await analyzeTextMeal(db, text, oilPercentage, forceGemini, profileId);
      if (requestRevision !== revision.current) return null;
      setAnalysis(next);
      return next;
    } catch {
      if (requestRevision === revision.current) {
        Alert.alert('Analysis unavailable', forceGemini
          ? 'Gemini could not provide a fresh estimate. Check your connection, API key, or quota and try again.'
          : 'Could not estimate this meal. Try again or include more detail.');
      }
      return null;
    } finally {
      busy.current = false;
      setAnalyzing(false);
    }
  }

  return { analysis, setAnalysis, analyzing, analyze, invalidate };
}
