import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Pressable, StyleSheet, Text, View } from 'react-native';

import ColorPicker, {
  HueSlider,
  OpacitySlider,
  Panel5,
  Preview,
  Swatches,
  returnedResults
} from 'reanimated-color-picker';

import { MaterialIcons } from '@expo/vector-icons';
import { createLogger } from '@helpers/log';
import { BottomSheet, BottomSheetProps } from '../BottomSheet/BottomSheet';

const log = createLogger('PaletteBottomSheet');

export type PaletteBottomSheetProps = BottomSheetProps & {
  onColorSelected: (selectedColor: string) => void;
};

export const PaletteBottomSheet = (props: PaletteBottomSheetProps) => {
  const [selectedColor, setSelectedColor] = useState('#5c5c5c');

  const handleClosePress = useCallback(() => {
    props.onColorSelected?.(selectedColor);
  }, [props.onColorSelected, selectedColor]);

  const onSelectColor = useCallback(({ hex }: returnedResults) => {
    setSelectedColor(hex);
  }, []);

  return (
    <BottomSheet {...props}>
      <ColorPicker
        style={styles.contentContainer}
        value={selectedColor}
        onComplete={onSelectColor}
      >
        <Panel5 />
      </ColorPicker>

      <Pressable style={styles.pressable} onPress={handleClosePress}>
        <View style={styles.okButton}>
          <MaterialIcons name='check' size={24} color='black' />
        </View>
      </Pressable>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  contentContainer: {
    width: '80%',
    marginBottom: 30
  },
  okButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
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
    marginBottom: 30
  },
  pressable: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  }
});
