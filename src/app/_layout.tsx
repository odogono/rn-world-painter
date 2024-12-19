import { useEffect, useState } from 'react';

import * as NavigationBar from 'expo-navigation-bar';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';

import 'react-native-reanimated';

import { Platform } from 'react-native';

import * as Font from 'expo-font';

import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default () => {
  const [areFontsLoaded, setAreFontsLoaded] = useState(false);

  useEffect(() => {
    const loadFonts = async () => {
      try {
        await Font.loadAsync(MaterialIcons.font);
        await Font.loadAsync(MaterialCommunityIcons.font);
        console.log('fonts loaded');
        setAreFontsLoaded(true);
      } catch (error) {
        console.error('Error loading fonts:', error);
      }
    };
    loadFonts();
  }, []);

  // const [fontsLoaded, error] = useFonts({
  //   ...MaterialIcons.font,
  //   ...MaterialCommunityIcons.font
  // });

  // console.log('fonts loaded', fontsLoaded);
  // console.log('fonts error', error);

  useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setVisibilityAsync('hidden');
    }
    if (areFontsLoaded) SplashScreen.hideAsync();
  }, [areFontsLoaded]);

  if (!areFontsLoaded) {
    return null;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
};
