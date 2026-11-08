import { useState, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Alert,
  AppState,
  Modal,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import {
  Text,
  TextInput,
  ActivityIndicator,
  Button,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useSQLiteContext } from 'expo-sqlite';
import { useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { FoodLog, MealNutrition } from '../../types';
import OilSlider from '../../components/OilSlider';
import ModalHeader from '../../components/ModalHeader';
import SwipeableTabScreen from '../../components/SwipeableTabScreen';
import GlassActionButton from '../../components/GlassActionButton';
import MealAnalysisNotice from '../../components/MealAnalysisNotice';
import MacroBreakdown from '../../components/MacroBreakdown';
import MealMacroFields from '../../components/MealMacroFields';
import { useTextMealAnalysis } from '../../hooks/useTextMealAnalysis';
import { useActiveProfileId, useUserSettings } from '../../hooks/useSettings';
import { BG_BASE, COLOR_PRIMARY, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_DISABLED, MACRO_CALORIES, MACRO_PROTEIN, MACRO_CARBS, MACRO_FAT } from '../../constants/colors';
import { SCREEN_PADDING_H, SPACE_2, SPACE_4, SPACE_8, SPACE_12, SPACE_16, SPACE_ENTRIES_BOTTOM } from '../../constants/spacing';
import { RADIUS_SM, RADIUS_XL } from '../../constants/radius';
import { rememberTextMeal } from '../../services/TextMealAnalysisService';
import { getTodayDateString } from '../../utils/nutrition';
import { mealNutritionToDraft, readMealNutrition, updateTargetDraft, type TargetDraft, type TargetField } from '../../utils/nutritionTargets';
import {
  getLogsForDate,
  insertFoodLog,
  updateFoodLog,
  deleteFoodLog,
  deleteLogsOlderThan,
} from '../../database/DatabaseService';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getCurrentWeekDays(): { label: string; date: string; isToday: boolean }[] {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));
  return DAY_LABELS.map((label, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return { label, date: getTodayDateString(d), isToday: d.toDateString() === today.toDateString() };
  });
}

function formatTime(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function currentTime(date = new Date()): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function buildTimestamp(date: string, time: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time)) return null;
  const timestamp = new Date(`${date}T${time}:00`);
  return getTodayDateString(timestamp) === date && currentTime(timestamp) === time ? timestamp.toISOString() : null;
}

export default function EntriesScreen() {
  const db = useSQLiteContext();
  const { settings } = useUserSettings();
  const profileId = useActiveProfileId();
  const weekDays = getCurrentWeekDays();
  const [selectedDate, setSelectedDate] = useState(getTodayDateString);
  const [logs, setLogs] = useState<FoodLog[]>([]);
  const [expandedLogId, setExpandedLogId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const logRequest = useRef(0);

  const [logModalVisible, setLogModalVisible] = useState(false);
  const [foodText, setFoodText] = useState('');
  const [oilPercentage, setOilPercentage] = useState(100);
  const logAnalysis = useTextMealAnalysis(db, profileId);
  const editAnalysis = useTextMealAnalysis(db, profileId);
  const { analysis, analyzing } = logAnalysis;
  const analysisResult = analysis?.result ?? null;
  const [logDraft, setLogDraft] = useState<TargetDraft | null>(null);
  const logNutrition = analysisResult && readMealNutrition(logDraft, analysisResult).nutrition;
  const [saving, setSaving] = useState(false);
  const [logDate, setLogDate] = useState(selectedDate);
  const [logTime, setLogTime] = useState(currentTime);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingLog, setEditingLog] = useState<FoodLog | null>(null);
  const [editFoodText, setEditFoodText] = useState('');
  const [editOil, setEditOil] = useState(100);
  const [editNutrition, setEditNutrition] = useState<MealNutrition | null>(null);
  const [editDraft, setEditDraft] = useState<TargetDraft | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const editOilAnchor = useRef<{ nutrition: MealNutrition; oil: number } | null>(null);

  const loadLogsForDate = useCallback(async (date: string) => {
    const request = ++logRequest.current;
    setLoading(true);
    try {
      await deleteLogsOlderThan(db, 7);
      const dayLogs = await getLogsForDate(db, date, profileId);
      if (request === logRequest.current) setLogs(dayLogs);
    } catch {
      if (request === logRequest.current) {
        setLogs([]);
        Alert.alert('Could not load entries', 'Select the day again to retry.');
      }
    } finally {
      if (request === logRequest.current) setLoading(false);
    }
  }, [db, profileId]);

  const selectDate = useCallback((date: string) => {
    setExpandedLogId(null);
    setSelectedDate(date);
    void loadLogsForDate(date);
  }, [loadLogsForDate]);

  useFocusEffect(useCallback(() => {
    let today = getTodayDateString();
    selectDate(today);
    const subscription = AppState.addEventListener('change', state => {
      if (state !== 'active') return;
      const currentDate = getTodayDateString();
      if (currentDate === today) return;
      today = currentDate;
      selectDate(today);
    });
    return () => {
      subscription.remove();
      logRequest.current++;
    };
  }, [selectDate]));

  function resetLogModal() {
    setFoodText('');
    setOilPercentage(100);
    setLogDraft(null);
    logAnalysis.invalidate();
    setLogDate(selectedDate);
    setLogTime(currentTime());
  }

  function closeLogModal() {
    if (saving) return;
    setLogModalVisible(false);
    resetLogModal();
  }

  function invalidateLogAnalysis() {
    logAnalysis.invalidate();
    setLogDraft(null);
  }

  async function handleLogAnalyze(forceGemini = false) {
    Keyboard.dismiss();
    if (await logAnalysis.analyze(foodText, oilPercentage, forceGemini)) setLogDraft(null);
  }

  async function handleLogSave() {
    if (!analysis || !logNutrition || analyzing || saving) return;
    const createdAt = buildTimestamp(logDate, logTime);
    if (!createdAt) {
      Alert.alert('Invalid date or time', 'Enter a valid date (YYYY-MM-DD) and 24-hour time (HH:MM).');
      return;
    }
    setSaving(true);
    try {
      await insertFoodLog(db, {
        foodText: foodText,
        oilPercentage,
        ...logNutrition,
        createdAt,
      }, profileId);
      await rememberTextMeal(db, foodText, oilPercentage, { ...analysis, result: { ...analysis.result, ...logNutrition } }, profileId);
      setLogModalVisible(false);
      resetLogModal();
      selectDate(logDate);
    } catch {
      Alert.alert('Error', 'Failed to save entry.');
    } finally {
      setSaving(false);
    }
  }

  function openEditModal(log: FoodLog) {
    editAnalysis.invalidate();
    setEditingLog(log);
    setEditFoodText(log.foodText);
    setEditOil(log.oilPercentage);
    const { calories, protein, carbs, fat } = log;
    const nutrition = { calories, protein, carbs, fat };
    setEditNutrition(nutrition);
    setEditDraft(null);
    editOilAnchor.current = { nutrition, oil: log.oilPercentage };
    const d = new Date(log.createdAt);
    setEditDate(getTodayDateString(d));
    setEditTime(currentTime(d));
    setEditModalVisible(true);
  }

  function handleEditOilChange(newOil: number) {
    const anchor = editOilAnchor.current;
    if (!anchor) return;
    editAnalysis.invalidate();
    setEditOil(newOil);
    const oilGrams = (Math.max(0, newOil - 100) - Math.max(0, anchor.oil - 100)) / 20;
    const fatChange = Math.max(oilGrams, -anchor.nutrition.fat, -anchor.nutrition.calories / 9);
    setEditNutrition({ ...anchor.nutrition, calories: anchor.nutrition.calories + fatChange * 9, fat: anchor.nutrition.fat + fatChange });
    setEditDraft(null);
  }

  function handleEditMacro(field: TargetField, value: string) {
    if (!editNutrition) return;
    const next = updateTargetDraft(editDraft ?? mealNutritionToDraft(editNutrition), field, value);
    setEditDraft(next);
    const { nutrition } = readMealNutrition(next, editNutrition);
    if (nutrition) editOilAnchor.current = { nutrition, oil: editOil };
  }

  async function handleEditAnalyze(forceGemini = false) {
    if (editSaving) return;
    Keyboard.dismiss();
    const estimate = await editAnalysis.analyze(editFoodText, editOil, forceGemini);
    if (!estimate) return;
    const { result } = estimate;
    const { calories, protein, carbs, fat } = result;
    const nutrition = { calories, protein, carbs, fat };
    setEditNutrition(nutrition);
    setEditDraft(null);
    editOilAnchor.current = { nutrition, oil: editOil };
  }

  function closeEditModal() {
    if (editSaving) return;
    editAnalysis.invalidate();
    setEditModalVisible(false);
  }

  async function handleEditSave() {
    if (!editingLog || !editNutrition || editAnalysis.analyzing || editSaving) return;
    const { nutrition, error } = readMealNutrition(editDraft, editNutrition);
    if (!nutrition) {
      Alert.alert('Invalid nutrition', error);
      return;
    }
    const createdAt = buildTimestamp(editDate, editTime);
    if (!createdAt) {
      Alert.alert('Invalid date or time', 'Enter a valid date (YYYY-MM-DD) and 24-hour time (HH:MM).');
      return;
    }
    setEditSaving(true);
    try {
      await updateFoodLog(db, { ...editingLog, foodText: editFoodText, oilPercentage: editOil, ...nutrition, createdAt }, profileId);
      const estimate = editAnalysis.analysis;
      if (estimate) await rememberTextMeal(db, editFoodText, editOil, { ...estimate, result: { ...estimate.result, ...nutrition } }, profileId);
      editAnalysis.invalidate();
      setEditModalVisible(false);
      setEditingLog(null);
      loadLogsForDate(selectedDate);
    } catch {
      Alert.alert('Error', 'Failed to update entry.');
    } finally {
      setEditSaving(false);
    }
  }

  async function handleDelete(id: number) {
    Alert.alert('Delete Entry', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await deleteFoodLog(db, id, profileId);
        setExpandedLogId(current => current === id ? null : current);
        loadLogsForDate(selectedDate);
      } },
    ]);
  }

  return (
    <SwipeableTabScreen>
      <View style={styles.flex}>
        <View style={styles.dayPickerWrapper}>
          <View style={styles.dayPickerBlueGlow} />
          <View style={styles.dayPickerDepth}>
            <View style={styles.dayPickerContainer}>
              <View style={styles.dayPickerBase} />
              <View style={styles.dayPickerTint} />
              <LinearGradient colors={['rgba(255,255,255,0.10)', 'rgba(255,255,255,0.04)', 'transparent'] as const} style={styles.dayPickerRefraction} />
              <View style={styles.dayPickerContent}>
                {weekDays.map((day) => {
                  const isActive = selectedDate === day.date;
                  const isTodayNotActive = day.isToday && !isActive;
                  return (
                    <TouchableOpacity
                      key={day.date}
                      style={[
                        styles.dayPill,
                        isActive && styles.dayPillActive,
                        isTodayNotActive && styles.dayPillToday,
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={day.label}
                      accessibilityHint={day.isToday ? 'Today' : undefined}
                      accessibilityState={{ selected: isActive }}
                      onPress={() => selectDate(day.date)}
                    >
                      <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.dayPillText, isActive && styles.dayPillTextActive]}>{day.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        </View>

        <ScrollView style={styles.flex} contentContainerStyle={styles.content}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLOR_PRIMARY} />
            </View>
          ) : logs.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="document-text-outline" size={40} color={TEXT_DISABLED} />
              <Text style={styles.emptyText}>No entries for this day.</Text>
              <Text style={styles.emptySubtext}>Tap + to log a meal</Text>
            </View>
          ) : (
            logs.map(log => {
              const expanded = expandedLogId === log.id;
              return (
                <View key={log.id} style={styles.logOuter}>
                  <View style={styles.logBlueGlow} />
                  <View style={styles.logDepth}>
                    <View style={styles.logCard}>
                      <View style={styles.logBase} />
                      <View style={styles.logTint} />
                      <LinearGradient colors={['rgba(255,255,255,0.10)', 'rgba(255,255,255,0.04)', 'transparent'] as const} style={styles.logRefraction} />
                      <TouchableOpacity style={styles.logContent} activeOpacity={0.85}
                        accessibilityRole="button" accessibilityState={{ expanded }}
                        onPress={() => setExpandedLogId(current => current === log.id ? null : log.id)}
                        onLongPress={() => handleDelete(log.id)}>
                        <View style={styles.logHeader}>
                          <Text style={styles.logTime}>{formatTime(log.createdAt)}</Text>
                          <View style={styles.logMacros}>
                            <Text style={styles.macroCal}>{Math.round(log.calories)}<Text style={styles.macroUnit}>kcal</Text></Text>
                            <Text style={styles.macroP}>{Math.round(log.protein)}<Text style={styles.macroUnit}>g</Text></Text>
                            <Text style={styles.macroC}>{Math.round(log.carbs)}<Text style={styles.macroUnit}>g</Text></Text>
                            <Text style={styles.macroF}>{Math.round(log.fat)}<Text style={styles.macroUnit}>g</Text></Text>
                          </View>
                        </View>
                        <View style={styles.logSummary}>
                          <Text style={styles.logFoodText} numberOfLines={expanded ? undefined : 2}>{log.foodText}</Text>
                          <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={TEXT_SECONDARY} />
                        </View>
                      </TouchableOpacity>
                      {expanded && (
                        <View style={styles.logDetails}>
                          <MacroBreakdown nutrition={log} targets={settings} />
                          <Button onPress={() => openEditModal(log)}>Edit entry</Button>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>

        <View style={styles.fabWrapper}>
          <View style={styles.fabBlueGlow} />
          <View style={styles.fabDepth}>
            <Pressable onPress={() => { resetLogModal(); setLogModalVisible(true); }}>
              <View style={styles.fabInnerGlow}>
                <View style={styles.fabGlass}>
                  <LinearGradient colors={['rgba(255,255,255,0.08)', 'transparent'] as const} style={styles.fabFill}>
                    <Ionicons name="add" size={24} color="#FFFFFF" />
                  </LinearGradient>
                </View>
              </View>
            </Pressable>
          </View>
        </View>

        <Modal visible={logModalVisible} animationType="slide" onRequestClose={closeLogModal} presentationStyle="pageSheet">
          <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'android' ? 'height' : 'padding'}>
            <ModalHeader title="Log Food" onCancel={closeLogModal} />
            <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive">
              <TextInput mode="outlined" label="Food and quantity" placeholder="For example, 200 g cooked rice"
                value={foodText} editable={!saving} onChangeText={value => { setFoodText(value); invalidateLogAnalysis(); }} />

              <GlassActionButton kind="primary" onPress={() => handleLogAnalyze()} loading={analyzing} disabled={analyzing || saving || !foodText.trim()}>
                {analyzing ? 'Analyzing...' : 'Analyze'}
              </GlassActionButton>

              {analysis && analysisResult && (
                <View style={styles.analysisBox}>
                  <Text style={styles.sectionLabel}>Macros</Text>
                  <MealAnalysisNotice source={analysis.source} onRefresh={() => handleLogAnalyze(true)} disabled={analyzing || saving} />
                  <MealMacroFields original={analysisResult} draft={logDraft} targets={settings} disabled={analyzing || saving}
                    onChange={(field, value) => setLogDraft(current => updateTargetDraft(current ?? mealNutritionToDraft(analysisResult), field, value))} />
                </View>
              )}

              <OilSlider value={oilPercentage} disabled={saving} onValueChange={value => { setOilPercentage(value); invalidateLogAnalysis(); }} />
              <EntryDateTime date={logDate} time={logTime} onDateChange={setLogDate} onTimeChange={setLogTime} disabled={saving} />
              {analysis && <GlassActionButton kind="primary" onPress={handleLogSave} loading={saving} disabled={saving || analyzing || !logNutrition}>
                {saving ? 'Saving...' : 'Save Entry'}
              </GlassActionButton>}
            </ScrollView>
          </KeyboardAvoidingView>
        </Modal>

        <Modal visible={editModalVisible} animationType="slide" onRequestClose={closeEditModal} presentationStyle="pageSheet">
          <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'android' ? 'height' : 'padding'}>
            <ModalHeader
              title="Edit Entry"
              onCancel={closeEditModal}
              rightAction={editSaving || editAnalysis.analyzing ? null : { label: 'Save', onPress: handleEditSave }}
            />
            <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive">
              <TextInput mode="outlined" label="Food and quantity" placeholder="For example, 200 g cooked rice"
                value={editFoodText} editable={!editSaving} onChangeText={value => { setEditFoodText(value); editAnalysis.invalidate(); }} />

              <GlassActionButton kind="primary" onPress={() => handleEditAnalyze()} loading={editAnalysis.analyzing} disabled={editAnalysis.analyzing || editSaving || !editFoodText.trim()}>
                {editAnalysis.analyzing ? 'Analyzing...' : 'Analyze'}
              </GlassActionButton>
              {editNutrition && <View style={styles.analysisBox}>
                <Text style={styles.sectionLabel}>Macros</Text>
                {editAnalysis.analysis && <MealAnalysisNotice source={editAnalysis.analysis.source} onRefresh={() => handleEditAnalyze(true)} disabled={editAnalysis.analyzing || editSaving} />}
                <MealMacroFields original={editNutrition} draft={editDraft} targets={settings}
                  onChange={handleEditMacro} disabled={editSaving || editAnalysis.analyzing} />
              </View>}

              <OilSlider value={editOil} onValueChange={handleEditOilChange} disabled={editSaving} />
              <EntryDateTime date={editDate} time={editTime} onDateChange={setEditDate} onTimeChange={setEditTime} disabled={editSaving} />

              <GlassActionButton kind="destructive" disabled={editSaving} onPress={() => { if (editingLog) handleDelete(editingLog.id); closeEditModal(); }}>
                Delete Entry
              </GlassActionButton>
            </ScrollView>
          </KeyboardAvoidingView>
        </Modal>
      </View>
    </SwipeableTabScreen>
  );
}

function EntryDateTime({ date, time, onDateChange, onTimeChange, disabled }: {
  date: string; time: string; onDateChange: (value: string) => void; onTimeChange: (value: string) => void; disabled: boolean;
}) {
  return (
    <View style={styles.dateTimeRow}>
      <TextInput mode="outlined" label="Date" placeholder="YYYY-MM-DD" value={date} maxLength={10}
        onChangeText={onDateChange} editable={!disabled} style={styles.dateTimeField} />
      <TextInput mode="outlined" label="Time" placeholder="HH:MM (24h)" value={time} maxLength={5}
        onChangeText={onTimeChange} editable={!disabled} style={styles.dateTimeField} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: BG_BASE },
  content: { paddingBottom: SPACE_ENTRIES_BOTTOM, paddingHorizontal: SCREEN_PADDING_H, paddingTop: SPACE_8 },
  dayPickerWrapper: {
    marginTop: SPACE_8,
  },
  dayPickerBlueGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 0,
    backgroundColor: 'rgba(10,132,255,0.01)',
    shadowColor: '#0A84FF',
    shadowOpacity: 0.22,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 0 },
  },
  dayPickerDepth: {
    borderRadius: RADIUS_XL,
    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },
  dayPickerContainer: {
    borderRadius: RADIUS_XL,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.18)',
    paddingVertical: 10,
  },
  dayPickerBase: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  dayPickerTint: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(10,132,255,0.02)',
  },
  dayPickerRefraction: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  dayPickerContent: { flexDirection: 'row', paddingHorizontal: SCREEN_PADDING_H, gap: 4 },
  dayPill: {
    flex: 1,
    minWidth: 0,
    minHeight: 42,
    justifyContent: 'center',
    paddingHorizontal: 2,
    borderRadius: RADIUS_SM,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  dayPillActive: {
    backgroundColor: COLOR_PRIMARY,
  },
  dayPillToday: {
    backgroundColor: 'rgba(10,132,255,0.15)',
  },
  dayPillText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    color: TEXT_SECONDARY,
    fontFamily: 'StackSansNotch_600SemiBold',
  },
  dayPillTextActive: { color: TEXT_PRIMARY },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: SPACE_16 },
  emptyContainer: { alignItems: 'center', paddingVertical: SPACE_16 },
  emptyText: { fontSize: 15, fontWeight: '600', color: TEXT_SECONDARY, marginTop: 12, fontFamily: 'StackSansNotch_600SemiBold' },
  emptySubtext: { fontSize: 13, color: TEXT_DISABLED, marginTop: 4, fontFamily: 'StackSansNotch_400Regular' },
  logOuter: {
    marginBottom: SPACE_4,
  },
  logBlueGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: RADIUS_XL,
    backgroundColor: 'rgba(10,132,255,0.01)',
    shadowColor: '#0A84FF',
    shadowOpacity: 0.22,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 0 },
  },
  logDepth: {
    borderRadius: RADIUS_XL,
    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  logCard: {
    borderRadius: RADIUS_XL,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  logBase: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  logTint: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(10,132,255,0.02)',
  },
  logRefraction: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  logContent: {
    padding: 18,
  },
  logHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  logTime: { fontSize: 13, fontWeight: '500', color: TEXT_SECONDARY, fontFamily: 'StackSansNotch_500Medium' },
  logMacros: { flexDirection: 'row', gap: SPACE_2 },
  macroCal: { fontSize: 13, fontWeight: '700', color: MACRO_CALORIES, fontFamily: 'StackSansNotch_700Bold' },
  macroP: { fontSize: 13, fontWeight: '600', color: MACRO_PROTEIN, fontFamily: 'StackSansNotch_600SemiBold' },
  macroC: { fontSize: 13, fontWeight: '600', color: MACRO_CARBS, fontFamily: 'StackSansNotch_600SemiBold' },
  macroF: { fontSize: 13, fontWeight: '600', color: MACRO_FAT, fontFamily: 'StackSansNotch_600SemiBold' },
  macroUnit: { fontSize: 11, fontFamily: 'StackSansNotch_500Medium' },
  logSummary: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logFoodText: { flex: 1, fontSize: 15, color: TEXT_PRIMARY, fontFamily: 'StackSansNotch_400Regular' },
  logDetails: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 4, gap: 6, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255,255,255,0.10)' },
  fabWrapper: {
    position: 'absolute',
    right: 24,
    bottom: 16 + 64 + 48,
    width: 56,
    height: 56,
  },
  fabBlueGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: RADIUS_XL,
    backgroundColor: 'rgba(10,132,255,0.01)',
    shadowColor: '#0A84FF',
    shadowOpacity: 0.28,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
  },
  fabDepth: {
    borderRadius: RADIUS_XL,
    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  fabInnerGlow: {
    borderRadius: RADIUS_XL,
    overflow: 'hidden',
    backgroundColor: 'rgba(10,132,255,0.16)',
  },
  fabGlass: {
    borderRadius: RADIUS_XL,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  fabFill: {
    width: 56,
    height: 56,
    borderRadius: RADIUS_XL,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: { padding: SCREEN_PADDING_H, paddingBottom: SPACE_12, gap: SPACE_4, backgroundColor: 'rgba(0,0,0,0.18)' },
  sectionLabel: { fontSize: 13, fontWeight: '600', color: TEXT_SECONDARY, marginBottom: 8, marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5, fontFamily: 'StackSansNotch_600SemiBold' },
  analysisBox: {
    borderRadius: RADIUS_XL,
    padding: 16,
    gap: 8,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  dateTimeRow: { flexDirection: 'row', gap: SPACE_2 },
  dateTimeField: { flex: 1, minWidth: 0 },
});
