import { Pressable, StyleSheet } from 'react-native';

import { MaterialIcons } from '@expo/vector-icons';

export const ModeButton = ({
  isWorldMoveEnabled,
  onPress
}: {
  isWorldMoveEnabled: boolean;
  onPress: () => void;
}) => {
  return (
    <Pressable style={styles.modeButton} onPress={onPress}>
      <MaterialIcons
        name={isWorldMoveEnabled ? 'pan-tool' : 'edit'}
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
    shadowRadius: 3.84
  }
});
