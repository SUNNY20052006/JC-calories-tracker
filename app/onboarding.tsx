import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Avatar, Button, Chip, List, Text, TextInput } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUserSettings } from '../hooks/useSettings';
import NutritionTargetFields from '../components/NutritionTargetFields';
import { BG_BASE, BG_SURFACE, COLOR_BORDER, TEXT_SECONDARY } from '../constants/colors';
import {
  EMPTY_TARGETS, estimateMaintenanceTargets, parseTarget, readTargets, targetsToDraft, updateTargetDraft,
  type ActivityLevel, type EquationProfile,
} from '../utils/nutritionTargets';

const activityOptions: { value: ActivityLevel; label: string; description: string }[] = [
  { value: 'inactive', label: 'Inactive', description: 'You spend most of the day sitting and rarely do planned exercise.' },
  { value: 'lowActive', label: 'Lightly active', description: 'You take short walks most days or do a couple of light workouts in a typical week.' },
  { value: 'active', label: 'Active', description: 'You move regularly. For example, you might do 1–2 strength workouts and 3–4 brisk walks or cardio sessions per week.' },
  { value: 'veryActive', label: 'Very active', description: 'You train hard most days or combine physically demanding work with regular workouts.' },
];

export default function Onboarding() {
  const { profiles, signIn } = useUserSettings();
  const insets = useSafeAreaInsets();
  const [showSetup, setShowSetup] = useState(false);
  const [openingProfile, setOpeningProfile] = useState<number | null>(null);
  const [error, setError] = useState('');
  const opening = useRef(false);

  async function openProfile(id: number) {
    if (opening.current) return;
    opening.current = true;
    setOpeningProfile(id);
    setError('');
    try {
      await signIn(id);
    } catch {
      setError('Could not open this profile. Please try again.');
    } finally {
      opening.current = false;
      setOpeningProfile(null);
    }
  }

  if (!profiles.length || showSetup) {
    return <ProfileSetup onBack={profiles.length ? () => setShowSetup(false) : undefined} />;
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={[styles.container, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
      <View style={styles.content}>
        <Text variant="headlineLarge">Welcome to JC</Text>
        <Text variant="bodyMedium" style={styles.muted}>Choose a saved profile on this device or create a new one.</Text>
        {profiles.map(({ id, displayName }) => {
          const name = displayName || 'Local profile';
          return (
            <View key={id} style={styles.profileCard}>
              <List.Item title={name} accessibilityRole="button" accessibilityLabel={`Open profile ${name}`}
                left={() => <Avatar.Text size={40} label={name.slice(0, 1).toUpperCase()} />}
                right={props => <List.Icon {...props} icon="chevron-right" />}
                disabled={openingProfile !== null} onPress={() => openProfile(id)} />
            </View>
          );
        })}
        {!!error && <Text style={styles.error} accessibilityLiveRegion="polite">{error}</Text>}
        <Button mode="contained" disabled={openingProfile !== null} onPress={() => setShowSetup(true)}>Create new profile</Button>
      </View>
    </ScrollView>
  );
}

function ProfileSetup({ onBack }: { onBack?: () => void }) {
  const { signUp } = useUserSettings();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [profile, setProfile] = useState<EquationProfile | null>(null);
  const [activity, setActivity] = useState<ActivityLevel | null>(null);
  const [draft, setDraft] = useState(EMPTY_TARGETS);
  const [manual, setManual] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const saveInProgress = useRef(false);

  const activityDescription = activityOptions.find(option => option.value === activity)?.description;

  function goTo(nextStep: number) {
    setError('');
    setSubmitted(false);
    setStep(nextStep);
  }

  function nextFromName() {
    if (!name.trim()) {
      setError('Enter the name you want JC to use.');
      return;
    }
    goTo(2);
  }

  function estimate() {
    const years = parseTarget(age);
    const cm = parseTarget(height);
    const kg = parseTarget(weight);
    if (years === null || !Number.isInteger(years) || years < 19 || years > 120) {
      setError('Enter an age from 19 to 120 for the adult estimate, or use your own targets.');
      return;
    }
    if (cm === null || kg === null || !profile || !activity) {
      setError('Enter your height and weight, then select a calculation profile and activity level.');
      return;
    }
    const targets = estimateMaintenanceTargets(years, cm, kg, profile, activity);
    if (!targets) {
      setError('Check your height in centimeters and weight in kilograms, or use your own targets.');
      return;
    }
    setDraft(targetsToDraft(targets));
    setManual(false);
    goTo(3);
  }

  function enterManually() {
    setDraft(EMPTY_TARGETS);
    setManual(true);
    goTo(3);
  }

  async function finish() {
    if (saveInProgress.current) return;
    setSubmitted(true);
    const { targets } = readTargets(draft);
    if (!targets) return;
    saveInProgress.current = true;
    setSaving(true);
    setError('');
    try {
      await signUp(targets, name.trim());
    } catch {
      setError('Could not save your profile. Please try again.');
    } finally {
      saveInProgress.current = false;
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'android' ? 'height' : 'padding'}>
      <ScrollView key={step} keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.content}>
          <Text variant="labelMedium" style={styles.muted}>JC  ·  STEP {step} OF 3</Text>
          <View style={styles.progress}>
            {[1, 2, 3].map(value => <View key={value} style={[styles.segment, value <= step && styles.filled]} />)}
          </View>

          <Text variant="headlineLarge">{step === 1 ? 'Create your profile' : step === 2 ? 'Estimate your targets' : 'Review your targets'}</Text>
          <Text variant="bodyMedium" style={styles.muted}>
            {step === 1 ? 'Choose a name for your profile on this device.'
              : step === 2 ? 'Use your age, measurements, and usual activity to estimate daily maintenance calories.'
                : manual ? 'Enter your own macro targets to calculate calories.' : 'These are starting targets for maintaining your current weight. You can edit them now or in Settings.'}
          </Text>

          <View style={styles.card}>
            {step === 1 && (
              <>
                <TextInput label="Your name" mode="outlined" value={name} onChangeText={setName}
                  autoCapitalize="words" maxLength={60} returnKeyType="next" onSubmitEditing={nextFromName} />
                <Button mode="contained" onPress={nextFromName}>Continue</Button>
              </>
            )}
            {step === 2 && (
              <>
                <TextInput label="Age (years)" mode="outlined" keyboardType="number-pad" value={age} onChangeText={setAge} />
                <TextInput label="Height (cm)" mode="outlined" keyboardType="decimal-pad" value={height} onChangeText={setHeight} />
                <TextInput label="Weight (kg)" mode="outlined" keyboardType="decimal-pad" value={weight} onChangeText={setWeight} />
                <Text variant="titleSmall">Sex used for the calorie estimate</Text>
                <View style={styles.choices}>
                  <Chip selected={profile === 'female'} onPress={() => setProfile('female')}>Female</Chip>
                  <Chip selected={profile === 'male'} onPress={() => setProfile('male')}>Male</Chip>
                </View>
                <Text variant="titleSmall">Usual activity and exercise</Text>
                <Text variant="bodySmall" style={styles.muted}>Consider exercise, walking, and how active you are at work.</Text>
                <View style={styles.choices}>
                  {activityOptions.map(({ value, label }) => (
                    <Chip key={value} selected={activity === value} onPress={() => setActivity(value)}>{label}</Chip>
                  ))}
                </View>
                {activityDescription && <Text variant="bodySmall" style={styles.muted} accessibilityLiveRegion="polite">{activityDescription}</Text>}
                <Text variant="bodySmall" style={styles.muted}>The estimate is for adults 19 and older. Use your own targets during pregnancy or breastfeeding.</Text>
                <Button mode="contained" onPress={estimate}>Calculate targets</Button>
                <Button onPress={enterManually}>Enter my own targets</Button>
              </>
            )}
            {step === 3 && (
              <>
                <NutritionTargetFields draft={draft} submitted={submitted} disabled={saving}
                  onChange={(field, value) => setDraft(current => updateTargetDraft(current, field, value))} />
                <Button mode="contained" loading={saving} disabled={saving} onPress={finish}>Start using JC</Button>
              </>
            )}
            {!!error && <Text style={styles.error} accessibilityLiveRegion="polite">{error}</Text>}
          </View>

          {step > 1 && <Button onPress={() => goTo(step - 1)} disabled={saving}>Back</Button>}
          {step === 1 && onBack && <Button onPress={onBack}>Back to saved profiles</Button>}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BG_BASE },
  container: { flexGrow: 1, paddingHorizontal: 24, justifyContent: 'center' },
  content: { alignSelf: 'center', width: '100%', maxWidth: 460, gap: 12 },
  muted: { color: TEXT_SECONDARY },
  progress: { flexDirection: 'row', gap: 6 },
  segment: { flex: 1, height: 3, borderRadius: 2, backgroundColor: COLOR_BORDER },
  filled: { backgroundColor: '#0A84FF' },
  card: { padding: 16, gap: 12, borderRadius: 18, backgroundColor: BG_SURFACE, borderWidth: 1, borderColor: COLOR_BORDER },
  profileCard: { paddingLeft: 12, borderRadius: 16, overflow: 'hidden', backgroundColor: BG_SURFACE, borderWidth: 1, borderColor: COLOR_BORDER },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  error: { color: '#FF9B92' },
});
