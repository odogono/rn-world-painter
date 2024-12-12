import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useStore, useStoreState, useStoreViewDims } from '@model/useStore';

export type ControlsProps = {
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onReset?: () => void;
};

export const ZoomControls = (props: ControlsProps) => {
  const { zoomOnPoint } = useStore();

  const onZoomIn = () => {
    zoomOnPoint({ zoomFactor: 4 });
  };

  const onZoomOut = () => {
    zoomOnPoint({ zoomFactor: 0.5 });
  };

  const onReset = () => {
    zoomOnPoint({ toScale: 1 });
  };

  return (
    <View style={styles.zoomButtonsContainer}>
      <TouchableOpacity style={styles.zoomButton} onPress={onZoomIn}>
        <Text style={styles.zoomButtonText}>+</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.zoomButton} onPress={onZoomOut}>
        <Text style={styles.zoomButtonText}>-</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.zoomButton} onPress={onReset}>
        <Text style={styles.zoomButtonText}>R</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  zoomButtonsContainer: {
    position: 'absolute',
    top: 100,
    left: 20,
    flexDirection: 'column',
    rowGap: 10
  },
  zoomButton: {
    width: 50,
    height: 50,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 25,
    marginLeft: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84
  },
  zoomButtonText: {
    color: 'black',
    fontSize: 24,
    lineHeight: 28,
    fontWeight: 'bold'
  }
});
