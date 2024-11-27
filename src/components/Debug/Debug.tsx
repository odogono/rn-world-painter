import { StyleSheet, View } from 'react-native';

import { makeMutable } from 'react-native-reanimated';

import { ReText } from './ReText';

export const debugMsg = makeMutable<string>('Hello');
export const debugMsg2 = makeMutable<string>('World');
export const debugMsg3 = makeMutable<string>('!');
export const debugMsg4 = makeMutable<string>('4');
export const debugMsg5 = makeMutable<string>('5');

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
    width: '80%'
  },
  debugText: {
    color: '#fff'
  }
});
