import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Button, Pressable, StyleSheet, Text } from 'react-native';

import { createLogger } from '@helpers/log';
import { BottomSheet, BottomSheetProps } from '../BottomSheet/BottomSheet';

const log = createLogger('PaletteBottomSheet');

export const PaletteBottomSheet = (props: BottomSheetProps) => {
  const handleClosePress = useCallback(() => {
    // ref.current?.close();
    props.onClose?.();
  }, [props.onClose]);

  return (
    <BottomSheet {...props}>
      <Button title='Close Sheet' onPress={handleClosePress} />
      <Text>Hello Painter</Text>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    padding: 36,
    alignItems: 'center',
    height: 500
  }
});
