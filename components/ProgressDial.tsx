import { useEffect, useRef, type ReactNode } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface Props {
  progress: number;
  color: string;
  radius: number;
  strokeWidth: number;
  children?: ReactNode;
}

export default function ProgressDial({ progress, color, radius, strokeWidth, children }: Props) {
  const animatedProgress = useRef(new Animated.Value(0)).current;
  const fill = Math.max(0, Math.min(progress, 1));

  useEffect(() => {
    const animation = Animated.timing(animatedProgress, {
      toValue: fill,
      duration: 500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [animatedProgress, fill]);

  const circumference = 2 * Math.PI * radius;
  const size = (radius + strokeWidth) * 2 + 4;
  const center = size / 2;

  return (
    <View style={[styles.dial, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} accessible={false}>
        <Circle cx={center} cy={center} r={radius} stroke={color + '20'} strokeWidth={strokeWidth} fill="none" />
        <AnimatedCircle
          cx={center}
          cy={center}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={animatedProgress.interpolate({ inputRange: [0, 1], outputRange: [circumference, 0] })}
          strokeLinecap="round"
          rotation="-90"
          origin={`${center}, ${center}`}
        />
      </Svg>
      {children && <View style={styles.center}>{children}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  dial: { alignItems: 'center', justifyContent: 'center' },
  center: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, alignItems: 'center', justifyContent: 'center' },
});
