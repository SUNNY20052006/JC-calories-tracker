import { useState, useCallback, useMemo, useRef } from 'react';
import { Button, Text, TextInput } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useMealDraft } from '../../hooks/useMealDraft';
import { useTextMealAnalysis } from '../../hooks/useTextMealAnalysis';
import { combineMeal, mealDescription, nutritionForServings, parseServings } from '../../utils/recipes';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated,
  Easing,
  Keyboard,
  Pressable,
} from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { useFocusEffect } from 'expo-router';
import DailyProgress from '../../components/DailyProgress';
import FoodEntry from '../../components/FoodEntry';
import OilSlider from '../../components/OilSlider';
import AnalysisResultCard from '../../components/AnalysisResultCard';
import SwipeableTabScreen from '../../components/SwipeableTabScreen';
import { useActiveProfileId, useUserSettings } from '../../hooks/useSettings';
import { rememberTextMeal } from '../../services/TextMealAnalysisService';
import { getTodayTotals, insertFoodLog } from '../../database/DatabaseService';
import { getTodayDateString } from '../../utils/nutrition';
import { FoodAnalysisResult, FoodItem } from '../../types';
import { BG_BASE, BG_SURFACE, COLOR_BORDER, TEXT_SECONDARY, COLOR_SUCCESS } from '../../constants/colors';
import { SCREEN_PADDING_H, BUTTON_GAP, SPACE_5, SPACE_8 } from '../../constants/spacing';
import { LinearGradient } from 'expo-linear-gradient';
import GlassActionButton from '../../components/GlassActionButton';
import { mealNutritionToDraft, readMealNutrition, updateTargetDraft, type TargetDraft, type TargetField } from '../../utils/nutritionTargets';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const { selections, changeServings, removeRecipe, clearRecipes } = useMealDraft();
  const { settings } = useUserSettings();
  const profileId = useActiveProfileId();

  const [foodText, setFoodText] = useState('');
  const [oilPercentage, setOilPercentage] = useState(100);
  const { analysis, setAnalysis, analyzing, analyze, invalidate } = useTextMealAnalysis(db, profileId);
  const analysisResult = analysis?.result ?? null;
  const [saving, setSaving] = useState(false);
  const [savedVisible, setSavedVisible] = useState(false);
  const [manualTotal, setManualTotal] = useState<{ base: FoodAnalysisResult; draft: TargetDraft } | null>(null);
  const [servingEdit, setServingEdit] = useState<{ id: number; value: string } | null>(null);

  const scrollRef = useRef<ScrollView>(null);
  const saveOpacity = useRef(new Animated.Value(0)).current;

  const [dailyTotals, setDailyTotals] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  });
  const mealResult = useMemo(() => combineMeal(analysisResult, selections), [analysisResult, selections]);
  const macroDraft = manualTotal?.base === mealResult ? manualTotal.draft : null;
  const savedNutrition = mealResult && readMealNutrition(macroDraft, mealResult).nutrition;
  const readyToSave = !!savedNutrition && (!foodText.trim() || !!analysisResult) && !analyzing;

  function changeFoodText(value: string) {
    setFoodText(value);
    invalidate();
  }
  function changeOil(value: number) {
    setOilPercentage(value);
    invalidate();
  }

  function handleFocusInput() {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150);
  }

  const loadTotals = useCallback(async () => {
    const totals = await getTodayTotals(db, getTodayDateString(), profileId);
    setDailyTotals(totals);
  }, [db, profileId]);

  useFocusEffect(
    useCallback(() => {
      loadTotals();
    }, [loadTotals])
  );

  function handleAnalyze(forceGemini = false) {
    if (saving) return;
    Keyboard.dismiss();
    void analyze(foodText, oilPercentage, forceGemini);
  }

  async function handleSave() {
    if (!readyToSave || !savedNutrition || saving) return;
    if ([savedNutrition.calories, savedNutrition.protein, savedNutrition.carbs, savedNutrition.fat].some(v => !Number.isFinite(v) || v < 0)) {
      Alert.alert('Invalid nutrition', 'Nutrition totals must be valid non-negative numbers.'); return;
    }
    setSaving(true);
    try {
      await insertFoodLog(db, {
        foodText: mealDescription(foodText, selections),
        oilPercentage,
        calories: savedNutrition.calories,
        protein: savedNutrition.protein,
        carbs: savedNutrition.carbs,
        fat: savedNutrition.fat,
        createdAt: new Date().toISOString(),
      }, profileId);
      const textEstimate = analysis && selections.length === 0 && macroDraft
        ? { ...analysis, result: { ...analysis.result, ...savedNutrition } }
        : analysis;
      await rememberTextMeal(db, foodText, oilPercentage, textEstimate, profileId);
      setFoodText('');
      setOilPercentage(100);
      invalidate();
      clearRecipes();
      setManualTotal(null);
      setServingEdit(null);
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

  function handleEditTotal(field: TargetField, value: string) {
    if (!mealResult || analyzing || saving) return;
    setManualTotal(current => ({ base: mealResult,
      draft: updateTargetDraft(current?.base === mealResult ? current.draft : mealNutritionToDraft(mealResult), field, value),
    }));
  }

  function applyServingEdit() {
    if (!servingEdit) return;
    const amount = parseServings(servingEdit.value);
    if (amount === null) {
      Alert.alert('Invalid serving amount', 'Enter a serving amount greater than zero.');
      return;
    }
    changeServings(servingEdit.id, amount);
    setServingEdit(null);
    Keyboard.dismiss();
  }

  function handleEditItem(index: number, updatedItem: FoodItem) {
    if (!analysis || analyzing || saving) return;
    const analysisResult = analysis.result;
    const foodItems = [...analysisResult.foodItems];
    foodItems[index] = updatedItem;
    setAnalysis({ ...analysis, result: {
      foodItems,
      calories: foodItems.reduce((s, f) => s + f.calories, 0),
      protein: foodItems.reduce((s, f) => s + f.protein, 0),
      carbs: foodItems.reduce((s, f) => s + f.carbs, 0),
      fat: foodItems.reduce((s, f) => s + f.fat, 0),
    } });
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

          <FoodEntry value={foodText} onChangeText={changeFoodText} disabled={saving} />
          <Button onPress={() => router.navigate('/(tabs)/recipes')} disabled={saving || analyzing}>Add saved recipe</Button>
          <OilSlider value={oilPercentage} onValueChange={changeOil} disabled={saving} />

          <View style={styles.buttonRow}>
            <View style={styles.buttonGroup}>
              <GlassActionButton
                kind="primary"
                onPress={() => handleAnalyze()}
                loading={analyzing}
                disabled={analyzing || saving || !foodText.trim()}
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
                  disabled={saving || !readyToSave}
                >
                  {saving ? 'Saving...' : 'Save Entry'}
                </GlassActionButton>
              )}
            </View>
          </View>

          {mealResult && (
            <AnalysisResultCard
              result={analysisResult}
              total={mealResult}
              draft={macroDraft}
              targets={settings}
              onEditTotal={handleEditTotal}
              onEditItem={handleEditItem}
              source={analysis?.source}
              onRefresh={() => handleAnalyze(true)}
              refreshDisabled={analyzing || saving}
            >
              {selections.length > 0 && <Text variant="titleMedium">Saved recipes</Text>}
              {selections.map(({ recipe, servings }) => {
                const active = servingEdit?.id === recipe.id;
                const { calories } = nutritionForServings(recipe, servings);
                return (
                  <View key={recipe.id} style={styles.recipeCard}>
                    <Pressable style={styles.recipeHeader} accessibilityRole="button" accessibilityState={{ expanded: active }}
                      disabled={saving || analyzing} onPress={() => setServingEdit(active ? null : { id: recipe.id, value: String(servings) })}>
                      <View style={styles.recipeTitle}>
                        <Text variant="titleSmall">{recipe.name}</Text>
                        <Text variant="bodySmall" style={styles.muted}>{servings} {servings === 1 ? 'serving' : 'servings'} · {Math.round(calories)} kcal</Text>
                      </View>
                      <Ionicons name={active ? 'chevron-up' : 'chevron-down'} size={18} color={TEXT_SECONDARY} />
                    </Pressable>
                    {active && <>
                      <TextInput mode="outlined" label="Servings to eat" keyboardType="decimal-pad"
                        value={servingEdit.value} onChangeText={value => setServingEdit({ id: recipe.id, value })}
                        onFocus={handleFocusInput} onSubmitEditing={applyServingEdit} editable={!saving && !analyzing} />
                      <View style={styles.recipeActions}>
                        <Button disabled={saving || analyzing} onPress={() => { removeRecipe(recipe.id); setServingEdit(null); }}>Remove</Button>
                        <Button mode="contained-tonal" disabled={saving || analyzing} onPress={applyServingEdit}>Apply servings</Button>
                      </View>
                    </>}
                  </View>
                );
              })}
              {selections.length > 0 && !!foodText.trim() && !analysisResult && <Text>Analyze your additional food before saving this meal.</Text>}
            </AnalysisResultCard>
          )}


        </ScrollView>
      </KeyboardAvoidingView>
    </SwipeableTabScreen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: BG_BASE },
  content: { paddingBottom: 96, paddingTop: SPACE_8 },
  recipeCard: { borderRadius: 14, borderWidth: 1, borderColor: COLOR_BORDER, backgroundColor: BG_SURFACE, padding: 12, gap: 8 },
  recipeHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  recipeTitle: { flex: 1, gap: 3 },
  recipeActions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 6 },
  muted: { color: TEXT_SECONDARY },
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
