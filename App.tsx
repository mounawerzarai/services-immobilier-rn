import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { onAuthStateChanged, User } from 'firebase/auth';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as NativeSplash from 'expo-splash-screen';

import { auth } from './src/core/firebase';
import RootNavigator from './src/navigation';
import AuthScreen from './src/features/auth/AuthScreen';
import SplashScreen from './src/components/SplashScreen';
import { colors } from './src/theme';

// Garde le splash natif (même fond vert, même logo) jusqu'au premier rendu du splash animé.
NativeSplash.preventAutoHideAsync().catch(() => {});

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    return onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setReady(true);
    });
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style={user && splashDone ? 'dark' : 'light'} />
      <View
        style={{ flex: 1, backgroundColor: colors.primary }}
        onLayout={() => NativeSplash.hideAsync().catch(() => {})}
      >
        {ready ? user ? <RootNavigator /> : <AuthScreen /> : null}
        {!splashDone ? <SplashScreen ready={ready} onFinish={() => setSplashDone(true)} /> : null}
      </View>
    </SafeAreaProvider>
  );
}
