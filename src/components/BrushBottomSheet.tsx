import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@components/Icon';
import { createLogger } from '@helpers/log';
import { BottomSheet, BottomSheetProps } from './BottomSheet/BottomSheet';

const log = createLogger('BrushBottomSheet');

export type BrushBottomSheetProps = BottomSheetProps & {
  onBrushSelected: (selectedBrush: string) => void;
};

export const BrushBottomSheet = (props: BrushBottomSheetProps) => {
  const handleClosePress = useCallback(() => {
    props.onBrushSelected?.('rectangle');
  }, [props.onBrushSelected]);

  return (
    <BottomSheet {...props}>
      <View style={styles.contentContainer}>
        <Icon
          name='material-community:rectangle-outline'
          size={24}
          color='black'
        />
      </View>

      <Pressable style={styles.pressable} onPress={handleClosePress}>
        <View style={styles.okButton}>
          <Icon name='check' size={24} color='black' />
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
