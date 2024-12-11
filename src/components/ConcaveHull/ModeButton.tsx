import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { MaterialIcons } from '@expo/vector-icons';

type Mode = 'draw' | 'move';

export const ModeButton = () => {
  const [mode, setMode] = useState<Mode>('draw');

  const toggleMode = () => {
    setMode(mode === 'draw' ? 'move' : 'draw');
  };

  return (
    <Pressable style={styles.modeButton} onPress={toggleMode}>
      <MaterialIcons
        name={mode === 'draw' ? 'edit' : 'pan-tool'}
        size={24}
        color='black'
      />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  modeButton: {
    position: 'absolute',
    bottom: 32,
    right: 32,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    borderWidth: 1,
    borderColor: 'black'
  }
});
