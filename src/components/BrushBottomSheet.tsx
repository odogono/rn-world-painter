import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Pressable, StyleSheet, Text, View } from 'react-native';

import {
  Canvas,
  FitBox,
  Group,
  Path,
  Rect,
  Skia,
  rect
} from '@shopify/react-native-skia';
import { useDerivedValue } from 'react-native-reanimated';

import shapes from '@assets/shapes.json';
import { Icon } from '@components/Icon';
import { createLogger } from '@helpers/log';
import { PaintMode, ShapeTemplate } from '@model/types';
import { useStoreState } from '@model/useStore';
import { BottomSheet, BottomSheetProps } from './BottomSheet/BottomSheet';

const log = createLogger('BrushBottomSheet');

export type BrushBottomSheetProps = BottomSheetProps & {
  onBrushSelected: (selectedBrush: string) => void;
};

const brushSizes = [10, 20, 40, 60];

export const BrushBottomSheet = (props: BrushBottomSheetProps) => {
  const brushColor = useStoreState().use.brushColor();
  const brushShape = useStoreState().use.brushShape();
  const setBrushShape = useStoreState().use.setBrushShape();
  const setBrushSize = useStoreState().use.setBrushSize();
  const brushSize = useStoreState().use.brushSize();
  const brushMode = useStoreState().use.brushMode();
  const setBrushMode = useStoreState().use.setBrushMode();

  const handleClosePress = useCallback(() => {
    props.onBrushSelected?.('rectangle');
  }, [props.onBrushSelected]);

  const handleShapePress = useCallback((shape: ShapeTemplate) => {
    setBrushShape(shape);
  }, []);

  const handleSizePress = useCallback((size: number) => {
    setBrushSize(size);
  }, []);

  const handleModePress = useCallback((mode: PaintMode) => {
    log.debug('[handleModePress]', mode);
    setBrushMode(mode);
  }, []);

  const shapeButtons = useMemo(
    () =>
      Object.entries(shapes).map(([key, value]) => {
        return (
          <ShapeButton
            key={key}
            shape={key as ShapeTemplate}
            isSelected={brushShape === key}
            brushColor={brushColor}
            onPress={() => handleShapePress(key as ShapeTemplate)}
          />
        );
      }),
    [brushColor, brushShape]
  );

  const sizeButtons = useMemo(
    () =>
      brushSizes.map((size) => {
        return (
          <SizeButton
            key={size}
            shape={brushShape}
            brushColor={brushColor}
            size={size}
            isSelected={brushSize === size}
            onPress={() => handleSizePress(size)}
          />
        );
      }),
    [brushColor, brushShape, brushSize]
  );

  const modeButtons = useMemo(() => {
    return Object.entries(PaintMode).map(([key, value]) => {
      return (
        <ModeButton
          key={key}
          mode={value as PaintMode}
          brushColor={brushColor}
          isSelected={brushMode === value}
          onPress={() => handleModePress(value as PaintMode)}
        />
      );
    });
  }, [brushColor, brushMode]);

  return (
    <BottomSheet {...props}>
      <View style={styles.contentContainer}>
        <View style={styles.shapeButtonContainer}>{shapeButtons}</View>
        <View style={styles.shapeButtonContainer}>{sizeButtons}</View>
        <View style={styles.modeButtonContainer}>{modeButtons}</View>
      </View>

      <Pressable style={styles.pressable} onPress={handleClosePress}>
        <View style={styles.okButton}>
          <Icon name='check' size={24} color='black' />
        </View>
      </Pressable>
    </BottomSheet>
  );
};

const ModeButton = ({
  isSelected,
  brushColor,
  mode,
  onPress
}: {
  isSelected: boolean;
  mode: PaintMode;
  brushColor: string;
  onPress: () => void;
}) => {
  const color = isSelected ? brushColor : '#999';
  return (
    <Pressable onPress={onPress}>
      <View
        style={[
          styles.modeButton,
          isSelected && styles.modeButtonSelected,
          isSelected && { borderColor: brushColor }
        ]}
      >
        {mode === PaintMode.PLACE ? (
          <Icon name='material-community:select' size={60} color={color} />
        ) : (
          <Icon name='format-paint' size={60} color={color} />
        )}
      </View>
    </Pressable>
  );
};

const ShapeButton = ({
  isSelected,
  shape,
  brushColor,
  onPress
}: {
  isSelected: boolean;
  shape: ShapeTemplate;
  brushColor: string;
  onPress: () => void;
}) => {
  return (
    <Pressable onPress={onPress}>
      <View style={styles.shapeButton}>
        <Canvas style={styles.canvas}>
          <Rect x={0} y={0} width={100} height={100} color='white' />
          <Rect
            x={0}
            y={0}
            width={60}
            height={60}
            color={isSelected ? 'black' : '#999'}
            style='stroke'
            strokeWidth={isSelected ? 2 : 0.5}
          />
          <FitBox src={rect(0, 0, 100, 100)} dst={rect(5, 5, 50, 50)}>
            <Path
              path={shapes[shape].path}
              style='fill'
              strokeWidth={30}
              color={isSelected ? brushColor : '#999'}
            />
          </FitBox>
        </Canvas>
      </View>
    </Pressable>
  );
};

type SelectButtonProps = React.PropsWithChildren<{
  isSelected: boolean;
  onPress: () => void;
}>;

const SelectButton = ({ isSelected, onPress, children }: SelectButtonProps) => {
  return (
    <Pressable onPress={onPress}>
      <View style={styles.shapeButton}>
        <Canvas style={styles.canvas}>
          <Rect x={0} y={0} width={100} height={100} color='white' />
          <Rect
            x={0}
            y={0}
            width={60}
            height={60}
            color={isSelected ? 'black' : '#999'}
            style='stroke'
            strokeWidth={isSelected ? 2 : 0.5}
          />
          {children}
        </Canvas>
      </View>
    </Pressable>
  );
};

const SizeButton = ({
  brushColor,
  size,
  isSelected,
  shape,
  onPress
}: {
  brushColor: string;
  size: number;
  isSelected: boolean;
  shape: ShapeTemplate;
  onPress: () => void;
}) => {
  const fitToRect = rect(50 - size / 2, 50 - size / 2, size, size);

  return (
    <Pressable onPress={onPress}>
      <View style={styles.shapeButton}>
        <Canvas style={styles.canvas}>
          <Rect x={0} y={0} width={100} height={100} color='white' />
          <Rect
            x={0}
            y={0}
            width={60}
            height={60}
            color={isSelected ? 'black' : '#999'}
            style='stroke'
            strokeWidth={isSelected ? 2 : 0.5}
          />
          <Group
            transform={[
              { translateX: -fitToRect.x / 2 },
              { translateY: -fitToRect.y / 2 }
            ]}
          >
            <FitBox src={rect(0, 0, 100, 100)} dst={fitToRect}>
              <Path
                path={shapes[shape].path}
                style='fill'
                strokeWidth={30}
                color={isSelected ? brushColor : '#999'}
              />
            </FitBox>
          </Group>
        </Canvas>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  canvas: {
    flex: 1,
    width: '100%'
  },
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
  },
  shapeButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30
  },
  modeButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
    gap: 30
  },
  shapeButton: {
    width: 60,
    height: 60,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modeButton: {
    width: 60,
    height: 60,
    borderColor: 'black',
    borderWidth: 0.5,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modeButtonSelected: {
    borderColor: 'black',
    borderWidth: 2
  }
});
