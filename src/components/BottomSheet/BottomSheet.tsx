import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated';

import GorhomBottomSheet, {
  BottomSheetView as GorhomBottomSheetView,
  SCREEN_WIDTH
} from '@gorhom/bottom-sheet';
import { createLogger } from '@helpers/log';

const log = createLogger('BottomSheet');

export type BottomSheetProps = React.PropsWithChildren & {
  isOpen?: boolean;
  onOpen?: () => void;
  onClose?: () => void;
};

export const BottomSheet = ({
  children,
  isOpen,
  onOpen,
  onClose
}: BottomSheetProps) => {
  const ref = useRef<GorhomBottomSheet | null>(null);
  const opacity = useSharedValue(0);

  const handleSheetChange = useCallback(
    (index: number) => {
      if (index === -1) {
        onClose?.();
      }
    },
    [onClose]
  );

  const handleClosePress = () => onClose?.();

  useEffect(() => {
    if (isOpen) {
      ref.current?.expand();
      opacity.value = withTiming(1, { duration: 200 });
    } else {
      ref.current?.close();
      opacity.value = withTiming(0, { duration: 200 });
    }
  }, [isOpen, opacity]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value
  }));

  return (
    <>
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClosePress} />
      </Animated.View>
      <GorhomBottomSheet
        ref={ref}
        enableDynamicSizing
        index={-1}
        onChange={handleSheetChange}
        containerStyle={styles.bottomSheetContainer}
        handleStyle={styles.handleStyle}
        backgroundStyle={styles.backgroundStyle}
        enableOverDrag={false}
        enablePanDownToClose
      >
        <GorhomBottomSheetView style={styles.contentContainer}>
          {children}
        </GorhomBottomSheetView>
      </GorhomBottomSheet>
    </>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000
  },
  bottomSheetContainer: {
    marginHorizontal: SCREEN_WIDTH > 500 ? (SCREEN_WIDTH - 500) / 2 : 0,
    zIndex: 1001
  },
  contentContainer: {
    flex: 1,
    padding: 10,
    alignItems: 'center'
  },
  handleStyle: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15
  },
  backgroundStyle: {
    backgroundColor: '#fff'
  }
});
