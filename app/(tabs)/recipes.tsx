import { useCallback, useRef, useState } from 'react';
import { ScrollView, View, Alert, Keyboard, KeyboardAvoidingView, Platform, Pressable, StyleSheet } from 'react-native';
import { Button, SegmentedButtons, Text, TextInput } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { deleteRecipe, getRecipes, insertRecipe } from '../../database/DatabaseService';
import { analyzeFoodWithGemini } from '../../services/GeminiFoodAnalysisService';
import { FoodAnalysisResult, Recipe } from '../../types';
import { useMealDraft } from '../../hooks/useMealDraft';
import SwipeableTabScreen from '../../components/SwipeableTabScreen';
import MacroBreakdown from '../../components/MacroBreakdown';
import MealMacroFields from '../../components/MealMacroFields';
import { BG_BASE, BG_SURFACE, COLOR_BORDER, TEXT_SECONDARY } from '../../constants/colors';
import { useActiveProfileId, useUserSettings } from '../../hooks/useSettings';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { nutritionForServings, parseServings } from '../../utils/recipes';
import { mealNutritionToDraft, readMealNutrition, updateTargetDraft, type TargetDraft } from '../../utils/nutritionTargets';

export default function RecipesScreen() {
  const insets = useSafeAreaInsets();
  const db = useSQLiteContext();
  const router = useRouter();
  const { addRecipe } = useMealDraft();
  const { settings } = useUserSettings();
  const profileId = useActiveProfileId();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [expanded, setExpanded] = useState<{ id: number; basis: 'serving' | 'batch'; amount: string } | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [servings, setServings] = useState('4');
  const [result, setResult] = useState<FoodAnalysisResult | null>(null);
  const [totals, setTotals] = useState<TargetDraft | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const revision = useRef(0);
  const reload = useCallback(async () => {
    try { setRecipes(await getRecipes(db, profileId)); }
    catch { setError('Could not load recipes. Please reopen this tab to retry.'); }
  }, [db, profileId]);
  useFocusEffect(useCallback(() => {
    void reload();
  }, [reload]));

  function changeDescription(value: string) {
    revision.current++; setDescription(value); setResult(null); setError('');
  }
  async function analyze() {
    if (!description.trim() || busy) return;
    Keyboard.dismiss();
    const requestRevision = revision.current;
    setBusy(true); setError(''); setResult(null);
    try {
      const response = await analyzeFoodWithGemini(db, description, 100, true, profileId);
      if (revision.current === requestRevision) {
        setResult(response);
        setTotals(null);
      }
    } catch {
      setError('AI analysis failed. Check your key or quota in Settings and retry. Include ingredient amounts and oil for a better estimate.');
    } finally { setBusy(false); }
  }
  async function save() {
    if (!result || busy) return;
    const count = parseServings(servings);
    const { nutrition, error: nutritionError } = readMealNutrition(totals, result);
    if (!name.trim() || count === null || !nutrition) {
      setError(nutritionError ?? 'Enter a recipe name and a serving count greater than zero.'); return;
    }
    setBusy(true); setError('');
    try {
      await insertRecipe(db, { name, description, servings: count, ...nutrition, createdAt: new Date().toISOString() }, profileId);
      setName(''); setDescription(''); setResult(null); setServings('4'); revision.current++;
      await reload();
    } catch { setError('Could not save recipe. Please retry.'); }
    finally { setBusy(false); }
  }
  function select(recipe: Recipe, value: string) {
    const amount = parseServings(value);
    if (amount === null) {
      Alert.alert('Invalid serving amount', 'Enter a serving amount greater than zero.');
      return;
    }
    addRecipe(recipe, amount);
    router.navigate('/(tabs)');
  }
  function remove(recipe: Recipe) {
    Alert.alert('Delete recipe?', 'Existing meal logs and recipes already added to a meal keep their recorded nutrition.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await deleteRecipe(db, recipe.id, profileId);
          setExpanded(current => current?.id === recipe.id ? null : current);
          await reload();
        }
        catch { setError('Could not delete recipe. Please retry.'); }
      } },
    ]);
  }
  return (
    <SwipeableTabScreen>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'android' ? 'height' : 'padding'}>
        <ScrollView style={{ backgroundColor: BG_BASE }} contentContainerStyle={{ padding: 20, paddingTop: insets.top + 16, paddingBottom: insets.bottom + 130, gap: 16 }} keyboardShouldPersistTaps="handled">
          <Text variant="headlineMedium">Recipes</Text>
          <View style={styles.create}>
            <Text variant="titleLarge">Create a recipe</Text>
            <Text variant="bodySmall" style={styles.muted}>Analyze a batch once, then add servings to meals as needed.</Text>
            {!!error && <Text accessibilityLiveRegion="polite" style={{ color: '#FF9F0A' }}>{error}</Text>}
            <TextInput label="Recipe name" value={name} onChangeText={setName} editable={!busy} />
            <TextInput label="Whole-batch ingredients and amounts" placeholder="For example: 200 g paneer, 100 g spinach, 1 onion, 10 g oil…"
              multiline value={description} onChangeText={changeDescription} editable={!busy} />
            <TextInput label="Servings made by this batch" keyboardType="decimal-pad" value={servings} onChangeText={setServings} editable={!busy} />
            <Button mode="contained" onPress={analyze} loading={busy} disabled={busy || !description.trim()}>Analyze whole recipe</Button>
            {result && <>
              <Text>Estimated whole-batch totals. Review and correct before saving. Divide the cooked batch into the number of servings above.</Text>
              <MealMacroFields original={result} draft={totals} targets={settings} disabled={busy}
                onChange={(field, value) => setTotals(current => updateTargetDraft(current ?? mealNutritionToDraft(result), field, value))} />
              <Button mode="contained" onPress={save} disabled={busy}>Save recipe</Button>
            </>}
          </View>

          <Text variant="titleLarge">Saved recipes</Text>
          {recipes.length === 0 && <Text style={styles.muted}>No saved recipes yet. Create your first recipe above.</Text>}
          {recipes.map(recipe => {
            const details = expanded?.id === recipe.id ? expanded : null;
            const perServing = nutritionForServings(recipe, 1);
            return (
              <View key={recipe.id} style={styles.savedCard}>
                <Pressable
                  style={styles.savedHeader}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: !!details }}
                  onPress={() => setExpanded(current => current?.id === recipe.id ? null : { id: recipe.id, basis: 'serving', amount: '1' })}
                  android_ripple={{ color: 'rgba(255,255,255,0.08)' }}
                >
                  <View style={styles.savedTitle}>
                    <Text variant="titleMedium" numberOfLines={details ? undefined : 2}>{recipe.name}</Text>
                    <Text variant="bodySmall" style={styles.muted}>
                      {Math.round(perServing.calories)} kcal per serving · {recipe.servings} {recipe.servings === 1 ? 'serving' : 'servings'}
                    </Text>
                  </View>
                  <Ionicons name={details ? 'chevron-up' : 'chevron-down'} color={TEXT_SECONDARY} size={20} />
                </Pressable>
                {details && (
                  <View style={styles.details}>
                    <Text variant="bodyMedium">{recipe.description}</Text>
                    <SegmentedButtons value={details.basis}
                      onValueChange={value => setExpanded({ id: recipe.id, basis: value === 'batch' ? 'batch' : 'serving', amount: value === 'batch' ? String(recipe.servings) : '1' })}
                      buttons={[{ value: 'serving', label: 'Per serving' }, { value: 'batch', label: 'Whole batch' }]} />
                    <MacroBreakdown nutrition={details.basis === 'batch' ? recipe : perServing} targets={settings} />
                    <TextInput label="Servings to eat" keyboardType="decimal-pad" mode="outlined"
                      value={details.amount} onChangeText={amount => setExpanded({ ...details, amount })} />
                    <Button mode="contained" onPress={() => select(recipe, details.amount)}>Add to current meal</Button>
                    <Button onPress={() => remove(recipe)}>Delete recipe</Button>
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      </KeyboardAvoidingView>
    </SwipeableTabScreen>
  );
}

const styles = StyleSheet.create({
  create: { padding: 16, gap: 12, borderRadius: 20, backgroundColor: BG_SURFACE, borderWidth: 1, borderColor: COLOR_BORDER },
  savedCard: { borderRadius: 18, overflow: 'hidden', backgroundColor: BG_SURFACE, borderWidth: 1, borderColor: COLOR_BORDER },
  savedHeader: { padding: 14, minHeight: 62, flexDirection: 'row', alignItems: 'center', gap: 12 },
  savedTitle: { flex: 1, gap: 3 },
  details: { padding: 14, gap: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: COLOR_BORDER },
  muted: { color: TEXT_SECONDARY },
});
