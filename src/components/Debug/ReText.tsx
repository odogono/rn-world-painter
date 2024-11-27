// from https://github.com/wcandillon/react-native-redash/blob/master/src/ReText.tsx
import React from 'react';
import {
  StyleSheet,
  TextInput,
  type TextProps as RNTextProps
} from 'react-native';

import Animated, {
  AnimatedProps,
  SharedValue,
  useAnimatedProps
} from 'react-native-reanimated';

const styles = StyleSheet.create({
  baseStyle: {
    color: 'black'
  }
});

Animated.addWhitelistedNativeProps({ text: true });

interface TextProps {
  text: SharedValue<string>;
  style?: AnimatedProps<RNTextProps>['style'];
}

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

export const ReText = (props: TextProps) => {
  const { text, style } = { style: {}, ...props };
  const animatedProps = useAnimatedProps(() => {
    return {
      text: text.value
      // Here we use any because the text prop is not available in the type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;
  });
  return (
    <AnimatedTextInput
      underlineColorAndroid='transparent'
      editable={false}
      value={text.value}
      style={[styles.baseStyle, style]}
      {...{ animatedProps }}
    />
  );
};
