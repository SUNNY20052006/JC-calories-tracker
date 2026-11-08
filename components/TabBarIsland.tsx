import { useRef, useEffect, useCallback } from 'react';
import { View, StyleSheet, Pressable, Animated, Easing } from 'react-native';
import { Text } from 'react-native-paper';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { RADIUS_XL } from '../constants/radius';

const TAB_ICONS: Record<string, { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap }> = {
  index: { active: 'home', inactive: 'home-outline' },
  entries: { active: 'list-sharp', inactive: 'list-outline' },
  recipes: { active: 'book', inactive: 'book-outline' },
  settings: { active: 'settings', inactive: 'settings-outline' },
};

const TAB_LABELS: Record<string, string> = {
  index: 'Home',
  entries: 'Entries',
  recipes: 'Recipes',
  settings: 'Settings',
};

let hasAnimatedEntrance = false;

const INACTIVE_COLOR = 'rgba(255,255,255,0.55)';
const ACTIVE_COLOR = '#0A84FF';

export default function TabBarIsland(props: any) {
  const { state, navigation, insets } = props;
  const entranceOpacity = useRef(new Animated.Value(hasAnimatedEntrance ? 1 : 0)).current;
  const entranceTranslateY = useRef(new Animated.Value(hasAnimatedEntrance ? 0 : 40)).current;

  useEffect(() => {
    if (!hasAnimatedEntrance) {
      Animated.parallel([
        Animated.timing(entranceOpacity, { toValue: 1, duration: 400, delay: 200, easing: Easing.out(Easing.back(1.2)), useNativeDriver: true }),
        Animated.timing(entranceTranslateY, { toValue: 0, duration: 400, delay: 200, easing: Easing.out(Easing.back(1.2)), useNativeDriver: true }),
      ]).start();
      hasAnimatedEntrance = true;
    }
  }, []);

  const activeIndex = state.index;

  return (
    <View style={[styles.container, { bottom: 16 + insets.bottom }]}>
      <View style={styles.blueOuterGlow} />
      <Animated.View style={styles.depthShadow}>
        <BlurView intensity={80} tint="dark" style={styles.island}>
          <View style={styles.subtleTint} />
          <View style={styles.outerHighlight} />
          <View style={styles.innerShadow} />
          <LinearGradient colors={['rgba(255,255,255,0.12)', 'rgba(255,255,255,0.05)', 'transparent'] as const} style={styles.topRefraction} />
          <Animated.View style={[styles.islandInner, { opacity: entranceOpacity, transform: [{ translateY: entranceTranslateY }] }]}>
            {state.routes.map((route: any, index: number) => {
              const isActive = index === activeIndex;
              const icons = TAB_ICONS[route.name] || { active: 'ellipse', inactive: 'ellipse-outline' };
              const label = TAB_LABELS[route.name] || route.name;

              return (
                <TabItem
                  key={route.key}
                  label={label}
                  iconActive={icons.active}
                  iconInactive={icons.inactive}
                  isActive={isActive}
                  onPress={() => {
                    const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                    if (!event.defaultPrevented) {
                      navigation.navigate(route.name);
                    }
                  }}
                />
              );
            })}
          </Animated.View>
        </BlurView>
      </Animated.View>
    </View>
  );
}

function TabItem({ label, iconActive, iconInactive, isActive, onPress }: {
  label: string;
  iconActive: keyof typeof Ionicons.glyphMap;
  iconInactive: keyof typeof Ionicons.glyphMap;
  isActive: boolean;
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.timing(scale, { toValue: 0.92, duration: 0, useNativeDriver: true }).start();
  }, [scale]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scale, { toValue: 1, damping: 20, stiffness: 300, useNativeDriver: true }).start();
  }, [scale]);

  const handlePress = useCallback(() => {
    handlePressOut();
    onPress();
  }, [handlePressOut, onPress]);

  return (
    <Pressable onPress={handlePress} onPressIn={handlePressIn} onPressOut={handlePressOut} style={styles.tabItem}
      accessibilityRole="tab" accessibilityLabel={label} accessibilityState={{ selected: isActive }}>
      <Animated.View style={[styles.tabForeground, { transform: [{ scale }] }]}>
        <Ionicons
          name={isActive ? iconActive : iconInactive}
          size={22}
          color={isActive ? ACTIVE_COLOR : INACTIVE_COLOR}
          style={styles.tabIcon}
        />
        <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 24,
    right: 24,
    height: 68,
  },
  blueOuterGlow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 68,
    borderRadius: RADIUS_XL,
    backgroundColor: 'rgba(10,132,255,0.01)',
    shadowColor: '#0A84FF',
    shadowOpacity: 0.28,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 0 },
  },
  depthShadow: {
    flex: 1,
    borderRadius: RADIUS_XL,
    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },
  island: {
    flex: 1,
    borderRadius: RADIUS_XL,
    overflow: 'hidden',
    backgroundColor: 'rgba(16,19,24,0.93)',
  },
  subtleTint: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(10,132,255,0.02)',
  },
  outerHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  innerShadow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.12)',
  },
  topRefraction: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  islandInner: {
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: 4,
  },
  tabItem: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  tabForeground: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  tabIcon: {
    width: 26,
    lineHeight: 25,
    textAlign: 'center',
    includeFontPadding: false,
  },
  tabLabel: {
    fontSize: 11,
    color: INACTIVE_COLOR,
    fontWeight: '500',
    textAlign: 'center',
    includeFontPadding: false,
    fontFamily: 'StackSansNotch_500Medium',
  },
  tabLabelActive: {
    color: ACTIVE_COLOR,
    fontWeight: '600',
    fontFamily: 'StackSansNotch_600SemiBold',
  },
});
