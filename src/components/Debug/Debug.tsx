import { StyleSheet, View } from 'react-native';

import { makeMutable } from 'react-native-reanimated';

import { BBox, Vector2 } from '@types';
import { ReText } from './ReText';

export const debugMsg = makeMutable<string>('▪');
export const debugMsg2 = makeMutable<string>('▪');
export const debugMsg3 = makeMutable<string>('▪');
export const debugMsg4 = makeMutable<string>('▪');
export const debugMsg5 = makeMutable<string>('▪');

export const setDebugMsg1 = (msg: string) => {
  'worklet';
  debugMsg.value = msg;
};
export const setDebugMsg2 = (msg: string) => {
  'worklet';
  debugMsg2.value = msg;
};
export const setDebugMsg3 = (msg: string) => {
  'worklet';
  debugMsg3.value = msg;
};
export const setDebugMsg4 = (msg: string) => {
  'worklet';
  debugMsg4.value = msg;
};
export const setDebugMsg5 = (msg: string) => {
  'worklet';
  debugMsg5.value = msg;
};

const formatFixed = (value: number, precision: number = 2) => {
  'worklet';
  if (value < 0) {
    return value.toFixed(precision);
  } else {
    return `+${value.toFixed(precision)}`;
  }
};

export const formatVector2 = (value: Vector2) => {
  'worklet';
  return `x: ${formatFixed(value.x)}, y: ${formatFixed(value.y)}`;
};

export const formatBBox = (value: BBox) => {
  'worklet';
  const [minX, minY, maxX, maxY] = value;
  const x = minX;
  const y = minY;
  const w = maxX - minX;
  const h = maxY - minY;
  return `x: ${formatFixed(x, 0)}, y: ${formatFixed(y, 0)}, w: ${formatFixed(w, 0)}, h: ${formatFixed(h, 0)}`;
};

export const Debug = () => {
  return (
    <View style={styles.container}>
      <ReText style={styles.debugText} text={debugMsg} />
      <ReText style={styles.debugText} text={debugMsg2} />
      <ReText style={styles.debugText} text={debugMsg3} />
      <ReText style={styles.debugText} text={debugMsg4} />
      <ReText style={styles.debugText} text={debugMsg5} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 46,
    left: 16,
    width: '80%'
  },
  debugText: {
    color: '#000'
  }
});
