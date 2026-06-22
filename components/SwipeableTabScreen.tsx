import React, { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { useRouter, usePathname } from 'expo-router';
import { BG_BASE } from '../constants/colors';

const TAB_ROUTES = ['/(tabs)/index', '/(tabs)/entries', '/(tabs)/settings'] as const;
type TabRoute = typeof TAB_ROUTES[number];

function normalisePath(pathname: string): TabRoute | null {
  for (const route of TAB_ROUTES) {
    const bare = route.replace('/(tabs)', '');
    const slug = route.replace('/(tabs)/', '');
    if (
      pathname === route ||
      pathname === bare ||
      pathname === '/' + slug ||
      pathname.endsWith('/' + slug)
    ) {
      return route;
    }
  }
  return null;
}

interface Props {
  children: React.ReactNode;
}

export default function SwipeableTabScreen({ children }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  const navigate = useCallback(
    (direction: 'left' | 'right') => {
      const current = normalisePath(pathname);
      if (!current) return;

      const idx = TAB_ROUTES.indexOf(current);
      if (idx === -1) return;

      if (direction === 'left' && idx < TAB_ROUTES.length - 1) {
        router.push(TAB_ROUTES[idx + 1]);
      } else if (direction === 'right' && idx > 0) {
        router.push(TAB_ROUTES[idx - 1]);
      }
    },
    [pathname, router]
  );

  const panGesture = Gesture.Pan()
    .activeOffsetX([-20, 20])
    .failOffsetY([-8, 8])
    .onEnd((event) => {
      'worklet';
      const isConfidentHorizontalSwipe =
        Math.abs(event.translationX) > 60 &&
        Math.abs(event.velocityX) > 200 &&
        Math.abs(event.translationY) < 40;

      if (!isConfidentHorizontalSwipe) return;

      if (event.translationX < 0) {
        runOnJS(navigate)('left');
      } else {
        runOnJS(navigate)('right');
      }
    });

  return (
    <GestureDetector gesture={panGesture}>
      <View style={styles.container}>
        {children}
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG_BASE,
  },
});
