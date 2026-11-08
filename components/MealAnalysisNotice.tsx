import { View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import type { TextMealAnalysis } from '../services/TextMealAnalysisService';

const labels = {
  cache: 'Reused saved estimate',
  database: 'Calculated from JC’s food database',
  fallback: 'Estimated locally · Gemini unavailable',
};

interface Props {
  source: TextMealAnalysis['source'];
  onRefresh: () => void;
  disabled?: boolean;
}

export default function MealAnalysisNotice({ source, onRefresh, disabled }: Props) {
  if (source === 'gemini') return null;
  return (
    <View>
      <Text accessibilityLiveRegion="polite">{labels[source]}</Text>
      <Button onPress={onRefresh} disabled={disabled} compact>Analyze again with Gemini</Button>
    </View>
  );
}
