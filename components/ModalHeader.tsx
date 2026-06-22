import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Text } from 'react-native-paper';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLOR_BORDER_SUBTLE, BG_GLASS, COLOR_PRIMARY, TEXT_PRIMARY } from '../constants/colors';
import { SCREEN_PADDING_H } from '../constants/spacing';
import { HEADING } from '../constants/typography';

interface Props {
  title: string;
  onCancel: () => void;
  rightAction?: {
    label: string;
    onPress: () => void;
  } | null;
  cancelLabel?: string;
}

export default function ModalHeader({ title, onCancel, rightAction, cancelLabel = 'Cancel' }: Props) {
  const insets = useSafeAreaInsets();
  const paddingTop = Platform.OS === 'ios' ? insets.top + 8 : 16;

  return (
    <BlurView intensity={60} tint="dark" style={[styles.header, { paddingTop }]}>
      <TouchableOpacity onPress={onCancel} style={styles.sideButton}>
        <Text style={styles.cancelText}>{cancelLabel}</Text>
      </TouchableOpacity>
      <Text style={styles.title} numberOfLines={1}>{title}</Text>
      {rightAction ? (
        <TouchableOpacity onPress={rightAction.onPress} style={styles.sideButton}>
          <Text style={styles.actionText}>{rightAction.label}</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.spacer} />
      )}
    </BlurView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SCREEN_PADDING_H,
    paddingBottom: 12,
    backgroundColor: BG_GLASS,
    borderBottomWidth: 1,
    borderBottomColor: COLOR_BORDER_SUBTLE,
  },
  sideButton: {
    minWidth: 60,
    minHeight: 44,
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLOR_PRIMARY,
    fontFamily: 'StackSansNotch_500Medium',
  },
  title: {
    ...HEADING,
    color: TEXT_PRIMARY,
    textAlign: 'center',
    flex: 1,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLOR_PRIMARY,
    textAlign: 'right',
    fontFamily: 'StackSansNotch_600SemiBold',
  },
  spacer: {
    minWidth: 60,
  },
});
