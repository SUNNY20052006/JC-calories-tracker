import { View, StyleSheet, Pressable, Animated, ActivityIndicator } from 'react-native';
import { Text } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useRef, useCallback } from 'react';

interface GlassActionButtonProps {
  kind: 'primary' | 'secondary' | 'destructive';
  loading?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  children: string;
}

const BTN_HEIGHT = 56;
const BTN_RADIUS = 28;

export default function GlassActionButton({
  kind = 'primary',
  loading = false,
  disabled = false,
  onPress,
  children,
}: GlassActionButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(scale, { toValue: 0.97, damping: 20, stiffness: 300, useNativeDriver: true }).start();
  }, [scale]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scale, { toValue: 1, damping: 15, stiffness: 250, useNativeDriver: true }).start();
  }, [scale]);

  const isPrimary = kind === 'primary';
  const isDestructive = kind === 'destructive';
  const isDisabled = disabled || loading;

  const innerGlowColor = isDestructive ? 'rgba(255,69,58,0.16)' : (isPrimary ? 'rgba(10,132,255,0.16)' : 'rgba(10,132,255,0.10)');
  const outerGlowOpacity = isDestructive ? 0.22 : (isPrimary ? 0.22 : 0.18);
  const textColor = isDestructive ? '#FF453A' : (isPrimary ? '#FFFFFF' : 'rgba(10,132,255,0.95)');

  return (
    <Pressable onPress={onPress} disabled={isDisabled} onPressIn={handlePressIn} onPressOut={handlePressOut}>
      <Animated.View
        style={[
          styles.shadowLayer,
          {
            transform: [{ scale }],
            opacity: isDisabled ? 0.5 : 1,
            shadowColor: isDestructive ? '#FF453A' : '#0A84FF',
            shadowOpacity: outerGlowOpacity,
          },
        ]}
      >
        <View style={[styles.innerGlowBg, { backgroundColor: innerGlowColor }]}>
          <View style={styles.glassSurface}>
            <LinearGradient colors={['rgba(255,255,255,0.08)', 'transparent'] as const} style={styles.topHighlight}>
              {loading ? (
                <View style={styles.contentRow}>
                  <ActivityIndicator size="small" color={textColor} />
                </View>
              ) : (
                <View style={styles.contentRow}>
                  <Text
                    style={[
                      styles.label,
                      { color: textColor },
                    ]}
                  >
                    {children}
                  </Text>
                </View>
              )}
            </LinearGradient>
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  shadowLayer: {
    borderRadius: BTN_RADIUS,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
  },
  innerGlowBg: {
    borderRadius: BTN_RADIUS,
    overflow: 'hidden',
  },
  glassSurface: {
    borderRadius: BTN_RADIUS,
    backgroundColor: 'rgba(255,255,255,0.04)',
    overflow: 'hidden',
  },
  topHighlight: {
    borderRadius: BTN_RADIUS,
    overflow: 'hidden',
  },
  contentRow: {
    height: BTN_HEIGHT,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
