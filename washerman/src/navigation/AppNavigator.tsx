import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { View, ActivityIndicator } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { washermenApi } from '../api/washermen';
import { Colors } from '../theme/colors';
import { AuthNavigator } from './AuthNavigator';
import { TabNavigator } from './TabNavigator';

export function AppNavigator() {
  const { isAuthenticated, isLoading, loadTokens, setWasherman } = useAuthStore();
  const [bootstrapping, setBootstrapping] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      const hasTokens = await loadTokens();
      if (hasTokens) {
        try { const r = await washermenApi.getProfile(); setWasherman(r.data); } catch {}
      }
      setBootstrapping(false);
    };
    bootstrap();
  }, []);

  if (bootstrapping || isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bgPrimary, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={Colors.gold} size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <TabNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
