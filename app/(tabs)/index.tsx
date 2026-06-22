import { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated,
  Easing,
} from 'react-native';
import { Text } from 'react-native-paper';
import { useSQLiteContext } from 'expo-sqlite';
import { useFocusEffect } from 'expo-router';
import DailyProgress from '../../components/DailyProgress';
import FoodEntry from '../../components/FoodEntry';
import OilSlider from '../../components/OilSlider';
import AnalysisResultCard from '../../components/AnalysisResultCard';
import SwipeableTabScreen from '../../components/SwipeableTabScreen';
import { useUserSettings } from '../../hooks/useSettings';
import { analyzeFoodWithGemini } from '../../services/GeminiFoodAnalysisService';
import { analyzeFoodLocally } from '../../services/LocalFoodAnalysisService';
import { getTodayTotals, insertFoodLog } from '../../database/DatabaseService';
import { getTodayDateString } from '../../utils/nutrition';
import { FoodAnalysisResult, FoodItem } from '../../types';
import { BG_BASE, COLOR_PRIMARY, TEXT_SECONDARY, MACRO_CALORIES, TEXT_DISABLED, TEXT_PRIMARY, COLOR_SUCCESS } from '../../constants/colors';
import { SCREEN_PADDING_H, BUTTON_GAP, SPACE_5, SPACE_8 } from '../../constants/spacing';
import { LinearGradient } from 'expo-linear-gradient';
import GlassActionButton from '../../components/GlassActionButton';

export default function HomeScreen() {
  const db = useSQLiteContext();
  const { settings, reload: reloadSettings } = useUserSettings();

  const [foodText, setFoodText] = useState('');
  const [oilPercentage, setOilPercentage] = useState(100);
  const [analysisResult, setAnalysisResult] = useState<FoodAnalysisResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [usedLocalFallback, setUsedLocalFallback] = useState(false);
  const [savedVisible, setSavedVisible] = useState(false);

  const scrollRef = useRef<ScrollView>(null);
  const saveOpacity = useRef(new Animated.Value(0)).current;

  const [dailyTotals, setDailyTotals] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  });

  function handleFocusInput() {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150);
  }

  const loadTotals = useCallback(async () => {
    const totals = await getTodayTotals(db, getTodayDateString());
    setDailyTotals(totals);
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      loadTotals();
      reloadSettings();
    }, [loadTotals, reloadSettings])
  );

  async function handleAnalyze() {
    if (!foodText.trim()) {
      Alert.alert('Error', 'Please describe what you ate.');
      return;
    }
    setAnalyzing(true);
    setAnalysisResult(null);
    setUsedLocalFallback(false);
    try {
      const geminiResult = await analyzeFoodWithGemini(foodText, oilPercentage);
      setAnalysisResult(geminiResult);
    } catch {
      const localResult = analyzeFoodLocally(foodText, oilPercentage);
      setAnalysisResult(localResult);
      setUsedLocalFallback(true);
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleSave() {
    if (!analysisResult) return;
    setSaving(true);
    try {
      await insertFoodLog(db, {
        foodText,
        oilPercentage,
        calories: analysisResult.calories,
        protein: analysisResult.protein,
        carbs: analysisResult.carbs,
        fat: analysisResult.fat,
        createdAt: new Date().toISOString(),
      });
      setFoodText('');
      setOilPercentage(100);
      setAnalysisResult(null);
      await loadTotals();
      setSaving(false);
      showSaveConfirmation();
    } catch {
      Alert.alert('Error', 'Failed to save entry.');
      setSaving(false);
    }
  }

  function showSaveConfirmation() {
    setSavedVisible(true);
    Animated.timing(saveOpacity, {
      toValue: 1,
      duration: 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
    setTimeout(() => {
      Animated.timing(saveOpacity, {
        toValue: 0,
        duration: 200,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: false,
      }).start(() => setSavedVisible(false));
    }, 1200);
  }

  function handleEditTotal(field: string, value: number) {
    if (!analysisResult) return;
    setAnalysisResult({ ...analysisResult, [field]: value });
  }

  function handleEditItem(index: number, updatedItem: FoodItem) {
    if (!analysisResult) return;
    const foodItems = [...analysisResult.foodItems];
    foodItems[index] = updatedItem;
    setAnalysisResult({
      foodItems,
      calories: foodItems.reduce((s, f) => s + f.calories, 0),
      protein: foodItems.reduce((s, f) => s + f.protein, 0),
      carbs: foodItems.reduce((s, f) => s + f.carbs, 0),
      fat: foodItems.reduce((s, f) => s + f.fat, 0),
    });
  }

  return (
    <SwipeableTabScreen>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'android' ? 'height' : 'padding'}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.flex}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          {settings && (
            <DailyProgress
              currentCalories={dailyTotals.calories}
              targetCalories={settings.dailyCalories}
              currentProtein={dailyTotals.protein}
              targetProtein={settings.proteinTarget}
              currentCarbs={dailyTotals.carbs}
              targetCarbs={settings.carbTarget}
              currentFat={dailyTotals.fat}
              targetFat={settings.fatTarget}
            />
          )}

          <FoodEntry value={foodText} onChangeText={setFoodText} />
          <OilSlider value={oilPercentage} onValueChange={setOilPercentage} />

          <View style={styles.buttonRow}>
            <View style={styles.buttonGroup}>
              <GlassActionButton
                kind="primary"
                onPress={handleAnalyze}
                loading={analyzing}
                disabled={analyzing || !foodText.trim()}
              >
                {analyzing ? 'Analyzing...' : 'Analyze'}
              </GlassActionButton>
              {savedVisible ? (
                <Animated.View style={[styles.saveConfirmed, { opacity: saveOpacity }]}>
                  <View style={styles.saveDepthShadow}>
                    <View style={styles.saveGlass}>
                      <View style={styles.saveBase} />
                      <View style={styles.saveTint} />
                      <LinearGradient colors={['rgba(255,255,255,0.08)', 'transparent'] as const} style={styles.saveHighlight} />
                      <View style={styles.saveContent}>
                        <Text style={styles.saveText}>✓ Saved</Text>
                      </View>
                    </View>
                  </View>
                </Animated.View>
              ) : (
                <GlassActionButton
                  kind="secondary"
                  onPress={handleSave}
                  loading={saving}
                  disabled={saving || !analysisResult}
                >
                  {saving ? 'Saving...' : 'Save Entry'}
                </GlassActionButton>
              )}
            </View>
          </View>

          {analysisResult && (
            <AnalysisResultCard
              result={analysisResult}
              onEditTotal={handleEditTotal}
              onEditItem={handleEditItem}
              onFocusInput={handleFocusInput}
              usedLocalFallback={usedLocalFallback}
            />
          )}


        </ScrollView>
      </KeyboardAvoidingView>
    </SwipeableTabScreen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: BG_BASE },
  content: { paddingBottom: 96, paddingTop: SPACE_8 },
  buttonRow: {
    paddingHorizontal: SCREEN_PADDING_H,
    paddingTop: SPACE_5,
  },
  buttonGroup: {
    flexDirection: 'row',
    alignSelf: 'flex-end',
    gap: BUTTON_GAP,
  },
  saveConfirmed: {
    borderRadius: 28,
    shadowColor: '#30D158',
    shadowOpacity: 0.28,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  saveDepthShadow: {
    borderRadius: 28,
    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  saveGlass: {
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  saveBase: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  saveTint: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(48,209,88,0.04)',
  },
  saveHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  saveContent: {
    height: 56,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#30D158',
    letterSpacing: 0.3,
  },
});
