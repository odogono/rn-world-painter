import { useEffect, useState } from 'react';

import * as NavigationBar from 'expo-navigation-bar';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';

import 'react-native-reanimated';

import { Platform, Text, View } from 'react-native';

import * as Font from 'expo-font';

import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { createLogger } from '@helpers/log';

const log = createLogger('App');

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default () => {
  const [areFontsLoaded, setAreFontsLoaded] = useState(false);

  // const [areFontsLoaded, error] = useFonts({
  //   MaterialIcons: require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/MaterialIcons.ttf'),
  //   MaterialCommunityIcons: require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/MaterialCommunityIcons.ttf')
  // });

  // console.log('areFontsLoaded', areFontsLoaded);
  // console.log('error', error);

  useEffect(() => {
    const loadFonts = async () => {
      try {
        await Font.loadAsync(MaterialIcons.font);
        await Font.loadAsync(MaterialCommunityIcons.font);
        log.info('fonts loaded');
        setAreFontsLoaded(true);
      } catch (error) {
        log.error('Error loading fonts:', error);
      }
    };
    loadFonts();
  }, []);

  useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setVisibilityAsync('hidden');
    }
    if (areFontsLoaded) SplashScreen.hideAsync();
  }, [areFontsLoaded]);

  if (!areFontsLoaded) {
    return <AppLoading />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
};

const AppLoading = () => {
  return (
    <View>
      <Text>Loading...</Text>
    </View>
  );
};
