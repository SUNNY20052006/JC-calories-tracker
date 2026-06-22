import { useState, useRef, useCallback } from 'react';
import { View, StyleSheet, Pressable, Animated, ActivityIndicator, GestureResponderEvent } from 'react-native';
import { Text } from 'react-native-paper';
import { BlurView } from 'expo-blur';
import {
  BG_GLASS,
  COLOR_PRIMARY,
  TEXT_PRIMARY,
  COLOR_ERROR,
  COLOR_SUCCESS,
} from '../constants/colors';
import { RADIUS_LG, RADIUS_XL } from '../constants/radius';

type Variant = 'primary' | 'outline' | 'glass' | 'destructive' | 'success' | 'text' | 'textDestructive';
type Size = 'sm' | 'default' | 'lg' | 'xl' | 'xxl';

interface LiquidGlassButtonProps {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  children: string;
}

interface TouchGlow {
  id: number;
  x: number;
  y: number;
  opacity: Animated.Value;
}

const variantStyles: Record<Variant, { bg: string; text: string; glass: boolean; glow: string; innerEdge: string; innerSpread: string; innerBottom: string }> = {
  primary: {
    bg: BG_GLASS,
    text: TEXT_PRIMARY,
    glass: true,
    glow: 'rgba(10,132,255,0.10)',
    innerEdge: 'rgba(10,132,255,0.15)',
    innerSpread: 'rgba(10,132,255,0.04)',
    innerBottom: 'rgba(10,132,255,0.06)',
  },
  outline: {
    bg: 'transparent',
    text: COLOR_PRIMARY,
    glass: false,
    glow: 'rgba(10,132,255,0.06)',
    innerEdge: 'transparent',
    innerSpread: 'transparent',
    innerBottom: 'transparent',
  },
  glass: {
    bg: BG_GLASS,
    text: TEXT_PRIMARY,
    glass: true,
    glow: 'rgba(10,132,255,0.10)',
    innerEdge: 'rgba(10,132,255,0.15)',
    innerSpread: 'rgba(10,132,255,0.04)',
    innerBottom: 'rgba(10,132,255,0.06)',
  },
  destructive: {
    bg: BG_GLASS,
    text: COLOR_ERROR,
    glass: true,
    glow: 'rgba(255,69,58,0.10)',
    innerEdge: 'rgba(255,69,58,0.15)',
    innerSpread: 'rgba(255,69,58,0.04)',
    innerBottom: 'rgba(255,69,58,0.06)',
  },
  success: {
    bg: BG_GLASS,
    text: COLOR_SUCCESS,
    glass: true,
    glow: 'rgba(48,209,88,0.10)',
    innerEdge: 'rgba(48,209,88,0.15)',
    innerSpread: 'rgba(48,209,88,0.04)',
    innerBottom: 'rgba(48,209,88,0.06)',
  },
  text: {
    bg: 'transparent',
    text: COLOR_PRIMARY,
    glass: false,
    glow: 'transparent',
    innerEdge: 'transparent',
    innerSpread: 'transparent',
    innerBottom: 'transparent',
  },
  textDestructive: {
    bg: 'transparent',
    text: COLOR_ERROR,
    glass: false,
    glow: 'transparent',
    innerEdge: 'transparent',
    innerSpread: 'transparent',
    innerBottom: 'transparent',
  },
};

const sizeStyles: Record<Size, { height: number; px: number; fontSize: number; radius: number; py: number }> = {
  sm: { height: 32, px: 14, fontSize: 13, radius: RADIUS_LG, py: 0 },
  default: { height: 40, px: 20, fontSize: 15, radius: RADIUS_LG, py: 0 },
  lg: { height: 48, px: 24, fontSize: 16, radius: RADIUS_XL, py: 0 },
  xl: { height: 52, px: 28, fontSize: 17, radius: RADIUS_XL, py: 0 },
  xxl: { height: 56, px: 32, fontSize: 18, radius: RADIUS_XL, py: 0 },
};

export default function LiquidGlassButton({
  variant = 'primary',
  size = 'default',
  loading = false,
  disabled = false,
  onPress,
  children,
}: LiquidGlassButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const brightness = useRef(new Animated.Value(1)).current;
  const [touchGlows, setTouchGlows] = useState<TouchGlow[]>([]);
  const glowId = useRef(0);

  const v = variantStyles[variant];
  const s = sizeStyles[size];

  const spawnTouchGlow = useCallback((x: number, y: number) => {
    const id = glowId.current++;
    const opacity = new Animated.Value(0);

    setTouchGlows((prev) => [...prev, { id, x, y, opacity }]);

    Animated.sequence([
      Animated.timing(opacity, { toValue: 0.65, duration: 100, useNativeDriver: true }),
      Animated.delay(350),
      Animated.timing(opacity, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start(() => {
      setTouchGlows((prev) => prev.filter((g) => g.id !== id));
    });
  }, []);

  const handlePressIn = useCallback(
    (event: GestureResponderEvent) => {
      const { locationX, locationY } = event.nativeEvent;

      for (let i = 0; i < 3; i++) {
        const ox = (Math.random() - 0.5) * 24;
        const oy = (Math.random() - 0.5) * 24;
        spawnTouchGlow(locationX + ox, locationY + oy);
      }

      Animated.parallel([
        Animated.spring(scale, { toValue: 0.97, damping: 20, stiffness: 300, useNativeDriver: true }),
        Animated.timing(brightness, { toValue: 0.9, duration: 80, useNativeDriver: false }),
      ]).start();
    },
    [scale, brightness, spawnTouchGlow],
  );

  const handlePressOut = useCallback(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, damping: 15, stiffness: 250, useNativeDriver: true }),
      Animated.timing(brightness, { toValue: 1, duration: 150, useNativeDriver: false }),
    ]).start();
  }, [scale, brightness]);

  const isGlass = variant !== 'outline' && variant !== 'text' && variant !== 'textDestructive';

  const isDisabled = disabled || loading;

  const circles = touchGlows.map((g) => (
    <Animated.View
      key={g.id}
      pointerEvents="none"
      style={[
        styles.touchGlow,
        {
          left: g.x - 10,
          top: g.y - 10,
          opacity: g.opacity,
          backgroundColor: v.glow !== 'transparent' ? v.glow.replace('0.10', '0.40') : 'rgba(10,132,255,0.30)',
        },
      ]}
    />
  ));

  const button = (
    <Animated.View style={[styles.shadowOuter, { transform: [{ scale }], opacity: isDisabled ? 0.5 : 1 }]}>
      <View style={[styles.depthShadow, { borderRadius: s.radius }]} />
      <View style={[styles.glowLayer, { backgroundColor: v.glow, borderRadius: s.radius }]} />
      {isGlass ? (
        <BlurView intensity={80} tint="dark" style={[styles.glassLayer, { borderRadius: s.radius }]}>
          <View style={[styles.edgeGlow, { borderRadius: s.radius }]} />
          <View style={[styles.innerSpreadGlow, { backgroundColor: v.innerSpread, borderRadius: s.radius }]} />
          <View style={[styles.innerBottomGlow, { backgroundColor: v.innerBottom, borderBottomLeftRadius: s.radius, borderBottomRightRadius: s.radius }]} />
          <View style={[styles.topHighlight, { backgroundColor: 'rgba(255,255,255,0.06)', borderTopLeftRadius: s.radius, borderTopRightRadius: s.radius }]} />
          <View style={[styles.bottomShadow, { backgroundColor: 'rgba(0,0,0,0.15)', borderBottomLeftRadius: s.radius, borderBottomRightRadius: s.radius }]} />
          {circles}
          <View style={[styles.content, { height: s.height, paddingHorizontal: s.px }]}>
            {loading ? (
              <ActivityIndicator size="small" color={v.text} />
            ) : (
              <Text style={[styles.label, { color: v.text, fontSize: s.fontSize }]}>{children}</Text>
            )}
          </View>
        </BlurView>
      ) : (
        <View style={[styles.solidLayer, { borderRadius: s.radius, backgroundColor: v.bg, borderColor: COLOR_PRIMARY, borderWidth: variant === 'outline' ? 1.5 : 0 }]}>
          {circles}
          <Animated.View style={[styles.content, { height: s.height, paddingHorizontal: s.px, opacity: brightness }]}>
            {loading ? (
              <ActivityIndicator size="small" color={v.text} />
            ) : (
              <Text style={[styles.label, { color: v.text, fontSize: s.fontSize }]}>{children}</Text>
            )}
          </Animated.View>
        </View>
      )}
    </Animated.View>
  );

  if (variant === 'text' || variant === 'textDestructive') {
    return (
      <Pressable onPress={onPress} disabled={isDisabled} onPressIn={handlePressIn} onPressOut={handlePressOut} style={[styles.textTouchable, { opacity: isDisabled ? 0.5 : 1 }]}>
        <Animated.View style={{ transform: [{ scale }] }}>
          {circles}
          {loading ? (
            <ActivityIndicator size="small" color={v.text} />
          ) : (
            <Text style={[styles.textLabel, { color: v.text, fontSize: s.fontSize }]}>{children}</Text>
          )}
        </Animated.View>
      </Pressable>
    );
  }

  return (
    <Pressable onPress={onPress} disabled={isDisabled} onPressIn={handlePressIn} onPressOut={handlePressOut}>
      {button}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  shadowOuter: {
    position: 'relative',
  },
  depthShadow: {
    position: 'absolute',
    bottom: -2,
    left: 8,
    right: 8,
    height: 24,
    backgroundColor: 'rgba(0,0,0,0.30)',
  },
  glowLayer: {
    position: 'absolute',
    top: -8,
    bottom: -8,
    left: -8,
    right: -8,
  },
  glassLayer: {
    overflow: 'hidden',
    backgroundColor: 'rgba(28,28,30,0.18)',
  },
  solidLayer: {
    overflow: 'hidden',
  },
  edgeGlow: {
    position: 'absolute',
    top: -1,
    left: -1,
    right: -1,
    bottom: -1,
    borderWidth: 1,
    borderColor: 'rgba(170,202,255,0.04)',
  },
  innerSpreadGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  innerBottomGlow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '40%',
  },
  topHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
  },
  bottomShadow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 1,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  textTouchable: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  textLabel: {
    fontWeight: '600',
  },
  touchGlow: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    zIndex: 0,
  },
});
