import { useState, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import {
  Text,
  TextInput,
  ActivityIndicator,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useSQLiteContext } from 'expo-sqlite';
import { useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { FoodAnalysisResult, FoodLog } from '../../types';
import OilSlider from '../../components/OilSlider';
import ModalHeader from '../../components/ModalHeader';
import SwipeableTabScreen from '../../components/SwipeableTabScreen';
import GlassActionButton from '../../components/GlassActionButton';
import { BG_BASE, COLOR_PRIMARY, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_DISABLED, MACRO_CALORIES, MACRO_PROTEIN, MACRO_CARBS, MACRO_FAT } from '../../constants/colors';
import { SCREEN_PADDING_H, SPACE_2, SPACE_3, SPACE_4, SPACE_8, SPACE_12, SPACE_16, SPACE_24, SPACE_ENTRIES_BOTTOM } from '../../constants/spacing';
import { RADIUS_SM, RADIUS_MD, RADIUS_LG, RADIUS_XL } from '../../constants/radius';
import { analyzeFoodWithGemini } from '../../services/GeminiFoodAnalysisService';
import { analyzeFoodLocally } from '../../services/LocalFoodAnalysisService';
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
    return { label, date: d.toISOString().slice(0, 10), isToday: d.toDateString() === today.toDateString() };
  });
}

function formatTime(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function reverseOilAdjustment(adjustedFat: number, adjustedCalories: number, oilPercentage: number) {
  const oilDiff = (oilPercentage - 100) / 100;
  const extraOilGrams = Math.max(0, oilDiff) * 5;
  const extraFat = extraOilGrams * 9;
  const extraCalories = extraFat;
  return { baseFat: adjustedFat - extraFat, baseCalories: adjustedCalories - extraCalories };
}

function applyOilAdjustment(baseCalories: number, baseFat: number, oilPercentage: number) {
  const oilDiff = (oilPercentage - 100) / 100;
  const extraOilGrams = Math.max(0, oilDiff) * 5;
  const extraFat = extraOilGrams * 9;
  const extraCalories = extraFat;
  return { calories: Math.round(baseCalories + extraCalories), fat: Math.round(baseFat + extraFat) };
}

export default function EntriesScreen() {
  const db = useSQLiteContext();
  const weekDays = getCurrentWeekDays();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [logs, setLogs] = useState<FoodLog[]>([]);
  const [loading, setLoading] = useState(true);

  const [logModalVisible, setLogModalVisible] = useState(false);
  const [foodText, setFoodText] = useState('');
  const [oilPercentage, setOilPercentage] = useState(100);
  const [analysisResult, setAnalysisResult] = useState<FoodAnalysisResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [usedLocalFallback, setUsedLocalFallback] = useState(false);
  const [logTime, setLogTime] = useState(
    new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })
  );
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingLog, setEditingLog] = useState<FoodLog | null>(null);
  const [editFoodText, setEditFoodText] = useState('');
  const [editOil, setEditOil] = useState(100);
  const [editCalories, setEditCalories] = useState('');
  const [editProtein, setEditProtein] = useState('');
  const [editCarbs, setEditCarbs] = useState('');
  const [editFat, setEditFat] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editAnalyzing, setEditAnalyzing] = useState(false);
  const editBaseRef = useRef({ baseCal: 0, baseProtein: 0, baseCarbs: 0, baseFat: 0 });
  const editScrollRef = useRef<ScrollView>(null);
  const logScrollRef = useRef<ScrollView>(null);

  const loadLogsForDate = useCallback(async (date: string) => {
    await deleteLogsOlderThan(db, 7);
    const dayLogs = await getLogsForDate(db, date);
    setLogs(dayLogs);
    setLoading(false);
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      loadLogsForDate(selectedDate);
    }, [loadLogsForDate, selectedDate])
  );

  function resetLogModal() {
    setFoodText('');
    setOilPercentage(100);
    setAnalysisResult(null);
    setUsedLocalFallback(false);
    setAnalyzing(false);
    setLogTime(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false }));
  }

  async function handleAnalyze() {
    if (!foodText.trim()) return;
    setAnalyzing(true);
    setAnalysisResult(null);
    setUsedLocalFallback(false);
    try {
      setAnalysisResult(await analyzeFoodWithGemini(foodText, oilPercentage));
    } catch {
      setAnalysisResult(analyzeFoodLocally(foodText, oilPercentage));
      setUsedLocalFallback(true);
    } finally {
      setAnalyzing(false);
    }
  }

  function buildTimestamp(dateStr: string, timeStr: string): string {
    const [h, m] = timeStr.split(':');
    const d = new Date(dateStr);
    d.setHours(Number(h) || 0, Number(m) || 0, 0, 0);
    return d.toISOString();
  }

  async function handleLogSave() {
    if (!analysisResult) return;
    setSaving(true);
    try {
      await insertFoodLog(db, {
        foodText: foodText,
        oilPercentage,
        calories: analysisResult.calories,
        protein: analysisResult.protein,
        carbs: analysisResult.carbs,
        fat: analysisResult.fat,
        createdAt: buildTimestamp(selectedDate, logTime),
      });
      setLogModalVisible(false);
      resetLogModal();
      loadLogsForDate(selectedDate);
    } catch {
      Alert.alert('Error', 'Failed to save entry.');
    } finally {
      setSaving(false);
    }
  }

  function openEditModal(log: FoodLog) {
    setEditingLog(log);
    setEditFoodText(log.foodText);
    setEditOil(log.oilPercentage);
    setEditCalories(String(Math.round(log.calories)));
    setEditProtein(String(Math.round(log.protein)));
    setEditCarbs(String(Math.round(log.carbs)));
    setEditFat(String(Math.round(log.fat)));
    const { baseFat, baseCalories } = reverseOilAdjustment(log.fat, log.calories, log.oilPercentage);
    editBaseRef.current = { baseCal: baseCalories, baseProtein: log.protein, baseCarbs: log.carbs, baseFat };
    const d = new Date(log.createdAt);
    setEditDate(d.toISOString().slice(0, 10));
    setEditTime(d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false }));
    setEditModalVisible(true);
  }

  function handleEditOilChange(newOil: number) {
    setEditOil(newOil);
    const { baseCal, baseProtein, baseCarbs, baseFat } = editBaseRef.current;
    const adjusted = applyOilAdjustment(baseCal, baseFat, newOil);
    setEditCalories(String(adjusted.calories));
    setEditProtein(String(baseProtein));
    setEditCarbs(String(baseCarbs));
    setEditFat(String(adjusted.fat));
  }

  async function handleEditAnalyze() {
    if (!editFoodText.trim()) return;
    setEditAnalyzing(true);
    try {
      const result = await analyzeFoodWithGemini(editFoodText, editOil);
      setEditCalories(String(result.calories));
      setEditProtein(String(result.protein));
      setEditCarbs(String(result.carbs));
      setEditFat(String(result.fat));
      const { baseFat, baseCalories } = reverseOilAdjustment(result.fat, result.calories, editOil);
      editBaseRef.current = { baseCal: baseCalories, baseProtein: result.protein, baseCarbs: result.carbs, baseFat };
    } catch {
      const localResult = analyzeFoodLocally(editFoodText, editOil);
      setEditCalories(String(localResult.calories));
      setEditProtein(String(localResult.protein));
      setEditCarbs(String(localResult.carbs));
      setEditFat(String(localResult.fat));
      const { baseFat, baseCalories } = reverseOilAdjustment(localResult.fat, localResult.calories, editOil);
      editBaseRef.current = { baseCal: baseCalories, baseProtein: localResult.protein, baseCarbs: localResult.carbs, baseFat };
    } finally {
      setEditAnalyzing(false);
    }
  }

  async function handleEditSave() {
    if (!editingLog) return;
    const c = Number(editCalories);
    const p = Number(editProtein);
    const ca = Number(editCarbs);
    const f = Number(editFat);
    if ([c, p, ca, f].some(v => isNaN(v) || v < 0)) {
      Alert.alert('Error', 'All macro values must be valid numbers.');
      return;
    }
    try {
      await updateFoodLog(db, { ...editingLog, foodText: editFoodText, oilPercentage: editOil, calories: c, protein: p, carbs: ca, fat: f, createdAt: buildTimestamp(editDate, editTime) });
      setEditModalVisible(false);
      setEditingLog(null);
      loadLogsForDate(selectedDate);
    } catch {
      Alert.alert('Error', 'Failed to update entry.');
    }
  }

  async function handleDelete(id: number) {
    Alert.alert('Delete Entry', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await deleteFoodLog(db, id); loadLogsForDate(selectedDate); } },
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
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayPickerContent}>
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
                      onPress={() => { setSelectedDate(day.date); setLoading(true); loadLogsForDate(day.date); }}
                    >
                      <Text style={[styles.dayPillText, isActive && styles.dayPillTextActive]}>{day.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
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
            logs.map(log => (
              <TouchableOpacity key={log.id} onPress={() => openEditModal(log)} onLongPress={() => handleDelete(log.id)} activeOpacity={0.85}>
                <View style={styles.logOuter}>
                  <View style={styles.logBlueGlow} />
                  <View style={styles.logDepth}>
                    <View style={styles.logCard}>
                      <View style={styles.logBase} />
                      <View style={styles.logTint} />
                      <LinearGradient colors={['rgba(255,255,255,0.10)', 'rgba(255,255,255,0.04)', 'transparent'] as const} style={styles.logRefraction} />
                      <View style={styles.logContent}>
                        <View style={styles.logHeader}>
                          <Text style={styles.logTime}>{formatTime(log.createdAt)}</Text>
                          <View style={styles.logMacros}>
                            <Text style={styles.macroCal}>{Math.round(log.calories)}<Text style={styles.macroUnit}>kcal</Text></Text>
                            <Text style={styles.macroP}>{Math.round(log.protein)}<Text style={styles.macroUnit}>g</Text></Text>
                            <Text style={styles.macroC}>{Math.round(log.carbs)}<Text style={styles.macroUnit}>g</Text></Text>
                            <Text style={styles.macroF}>{Math.round(log.fat)}<Text style={styles.macroUnit}>g</Text></Text>
                          </View>
                        </View>
                        <Text style={styles.logFoodText} numberOfLines={2}>{log.foodText}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))
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

        <Modal visible={logModalVisible} animationType="slide" onRequestClose={() => setLogModalVisible(false)} presentationStyle="pageSheet">
          <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'android' ? 'height' : 'padding'}>
            <ModalHeader title="Log Food" onCancel={() => { setLogModalVisible(false); resetLogModal(); }} />
            <ScrollView ref={logScrollRef} contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive">
              <TextInput mode="flat" placeholder="What did you eat?" value={foodText} onChangeText={setFoodText} style={styles.input} underlineColor="transparent" activeUnderlineColor="#0A84FF" textColor="#FFFFFF" />

              <Text style={styles.sectionLabel}>Time</Text>
              <TextInput mode="flat" value={logTime} onChangeText={setLogTime} placeholder="HH:MM (24h)" style={styles.input} underlineColor="transparent" activeUnderlineColor="#0A84FF" textColor="#FFFFFF" />

              <OilSlider value={oilPercentage} onValueChange={setOilPercentage} />

              <GlassActionButton kind="primary" onPress={handleAnalyze} loading={analyzing} disabled={analyzing || !foodText.trim()}>
                {analyzing ? 'Analyzing...' : 'Analyze'}
              </GlassActionButton>

              {analysisResult && (
                <View style={styles.analysisBox}>
                  {usedLocalFallback && (
                    <Text style={styles.fallbackBanner}>⚠ Estimated locally · AI unavailable</Text>
                  )}
                  <View style={styles.analysisMacroRow}>
                    <MacroDisplay label="Calories" value={analysisResult.calories} color={MACRO_CALORIES} unit="kcal" />
                    <MacroDisplay label="Protein" value={analysisResult.protein} color={MACRO_PROTEIN} unit="g" />
                    <MacroDisplay label="Carbs" value={analysisResult.carbs} color={MACRO_CARBS} unit="g" />
                    <MacroDisplay label="Fat" value={analysisResult.fat} color={MACRO_FAT} unit="g" />
                  </View>
                  <GlassActionButton kind="primary" onPress={handleLogSave} loading={saving} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Entry'}
                  </GlassActionButton>
                </View>
              )}
            </ScrollView>
          </KeyboardAvoidingView>
        </Modal>

        <Modal visible={editModalVisible} animationType="slide" onRequestClose={() => setEditModalVisible(false)} presentationStyle="pageSheet">
          <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'android' ? 'height' : 'padding'}>
            <ModalHeader
              title="Edit Entry"
              onCancel={() => setEditModalVisible(false)}
              rightAction={{ label: 'Save', onPress: handleEditSave }}
            />
            <ScrollView ref={editScrollRef} contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive">
              <TextInput mode="flat" placeholder="Food description" value={editFoodText} onChangeText={setEditFoodText} style={styles.input} underlineColor="transparent" activeUnderlineColor="#0A84FF" textColor="#FFFFFF" />

              <GlassActionButton kind="primary" onPress={handleEditAnalyze} loading={editAnalyzing} disabled={editAnalyzing || !editFoodText.trim()}>
                {editAnalyzing ? 'Analyzing...' : 'Re-analyze'}
              </GlassActionButton>

              <Text style={styles.sectionLabel}>Date</Text>
              <TextInput mode="flat" value={editDate} onChangeText={setEditDate} placeholder="YYYY-MM-DD" style={styles.input} underlineColor="transparent" activeUnderlineColor="#0A84FF" textColor="#FFFFFF" />

              <Text style={styles.sectionLabel}>Time</Text>
              <TextInput mode="flat" value={editTime} onChangeText={setEditTime} placeholder="HH:MM (24h)" style={styles.input} underlineColor="transparent" activeUnderlineColor="#0A84FF" textColor="#FFFFFF" />

              <View style={styles.dividerInset} />

              <OilSlider value={editOil} onValueChange={handleEditOilChange} />

              <Text style={styles.sectionLabel}>Macros</Text>
              <View style={styles.macroRow}>
                <MacroEditField label="Calories" value={editCalories} onChange={setEditCalories} color={MACRO_CALORIES} />
                <MacroEditField label="Protein" value={editProtein} onChange={setEditProtein} color={MACRO_PROTEIN} />
                <MacroEditField label="Carbs" value={editCarbs} onChange={setEditCarbs} color={MACRO_CARBS} />
                <MacroEditField label="Fat" value={editFat} onChange={setEditFat} color={MACRO_FAT} />
              </View>

              <GlassActionButton kind="destructive" onPress={() => { if (editingLog) handleDelete(editingLog.id); setEditModalVisible(false); }}>
                Delete Entry
              </GlassActionButton>
            </ScrollView>
          </KeyboardAvoidingView>
        </Modal>
      </View>
    </SwipeableTabScreen>
  );
}

function MacroDisplay({ label, value, color, unit }: { label: string; value: number; color: string; unit: string }) {
  return (
    <View style={styles.macroDisplayBox}>
      <Text style={[styles.macroDisplayLabel, { color }]}>{label}</Text>
      <Text style={[styles.macroDisplayValue, { color }]}>
        {Math.round(value)}<Text style={styles.macroDisplayUnit}>{unit}</Text>
      </Text>
    </View>
  );
}

function MacroEditField({ label, value, onChange, color }: { label: string; value: string; onChange: (v: string) => void; color: string }) {
  return (
    <View style={styles.macroEditBox}>
      <Text style={[styles.macroEditFieldLabel, { color }]}>{label}</Text>
      <TextInput
        mode="flat"
        value={value}
        onChangeText={onChange}
        keyboardType="numeric"
        style={styles.macroEditFieldInput}
        underlineColor="transparent"
        activeUnderlineColor="#0A84FF"
        textColor="#FFFFFF"
      />
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
  dayPickerContent: { paddingHorizontal: SCREEN_PADDING_H, gap: SPACE_2 },
  dayPill: {
    paddingHorizontal: 20,
    paddingVertical: 8,
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
  logFoodText: { fontSize: 15, color: TEXT_PRIMARY, fontFamily: 'StackSansNotch_400Regular' },
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
  modalContent: { padding: SCREEN_PADDING_H, paddingBottom: SPACE_12, backgroundColor: 'rgba(0,0,0,0.18)' },
  input: { marginBottom: SPACE_3, backgroundColor: 'rgba(0,0,0,0.12)', fontSize: 15, color: '#FFFFFF', borderRadius: 12, paddingHorizontal: 12 },
  sectionLabel: { fontSize: 13, fontWeight: '600', color: TEXT_SECONDARY, marginBottom: 8, marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5, fontFamily: 'StackSansNotch_600SemiBold' },
  fallbackBanner: {
    fontSize: 12,
    fontWeight: '400',
    color: TEXT_SECONDARY,
    marginBottom: 8,
    fontFamily: 'StackSansNotch_400Regular',
  },
  analysisBox: {
    borderRadius: RADIUS_XL,
    marginTop: 8,
    padding: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  analysisMacroRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  macroDisplayBox: {
    flex: 1,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.12)',
    padding: 8,
    alignItems: 'center',
  },
  macroDisplayLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
    textAlign: 'center',
    fontFamily: 'StackSansNotch_500Medium',
  },
  macroDisplayValue: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'StackSansNotch_700Bold',
  },
  macroDisplayUnit: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'StackSansNotch_600SemiBold',
  },
  dividerInset: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginBottom: SPACE_3,
  },
  macroRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
    marginBottom: 16,
  },
  macroEditBox: {
    flex: 1,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.12)',
    padding: 8,
    alignItems: 'center',
  },
  macroEditFieldLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
    textAlign: 'center',
    fontFamily: 'StackSansNotch_500Medium',
  },
  macroEditFieldInput: {
    width: '100%',
    height: 36,
    backgroundColor: 'rgba(0,0,0,0.12)',
    borderRadius: 8,
    fontSize: 15,
    color: '#FFFFFF',
    textAlign: 'center',
    paddingHorizontal: 4,
  },
});
