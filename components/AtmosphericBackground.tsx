import { View, StyleSheet } from 'react-native';
import { ATMOS_BLUE, ATMOS_CYAN, ATMOS_PURPLE } from '../constants/colors';

const opacity = 0.5;

export default function AtmosphericBackground() {
  return (
    <View style={styles.root} pointerEvents="none">
      <View style={[styles.orb, styles.orb1]} />
      <View style={[styles.orb, styles.orb2]} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
    zIndex: 0,
  },
  orb: {
    position: 'absolute',
    borderRadius: 9999,
  },
  orb1: {
    width: '100%',
    height: '50%',
    top: '-5%',
    left: '-10%',
    backgroundColor: ATMOS_BLUE,
    opacity,
  },
  orb2: {
    width: '80%',
    height: '40%',
    bottom: '10%',
    right: '-15%',
    backgroundColor: ATMOS_PURPLE,
    opacity,
  },
});
