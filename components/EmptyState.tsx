import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { TEXT_SECONDARY, TEXT_DISABLED } from '../constants/colors';

interface Props {
  message: string;
  submessage?: string;
}

export default function EmptyState({ message, submessage }: Props) {
  return (
    <View style={styles.container}>
      <Ionicons name="document-text-outline" size={40} color={TEXT_DISABLED} />
      <Text style={styles.message}>{message}</Text>
      {submessage && <Text style={styles.submessage}>{submessage}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  message: {
    fontSize: 15,
    fontWeight: '600',
    color: TEXT_SECONDARY,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 20,
  },
  submessage: {
    fontSize: 13,
    fontWeight: '400',
    color: TEXT_DISABLED,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
});
