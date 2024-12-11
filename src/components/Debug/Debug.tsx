import { StyleSheet, View } from 'react-native';

import { makeMutable } from 'react-native-reanimated';

import { ReText } from './ReText';

export const debugMsg = makeMutable<string>('▪');
export const debugMsg2 = makeMutable<string>('▪');
export const debugMsg3 = makeMutable<string>('▪');
export const debugMsg4 = makeMutable<string>('▪');
export const debugMsg5 = makeMutable<string>('▪');

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
