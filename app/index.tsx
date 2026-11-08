import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import { useUserSettings } from '../hooks/useSettings';
import { BG_BASE, COLOR_PRIMARY } from '../constants/colors';

export default function Index() {
  const { loading, settings } = useUserSettings();
  if (!loading) return <Redirect href={settings ? '/(tabs)' : '/onboarding'} />;

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={COLOR_PRIMARY} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: BG_BASE,
  },
});
