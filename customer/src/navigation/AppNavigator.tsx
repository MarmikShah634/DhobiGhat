import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useAuthStore } from '../store/authStore';
import { AuthNavigator } from './AuthNavigator';
import { TabNavigator } from './TabNavigator';
import { View, ActivityIndicator } from 'react-native';
import { Colors } from '../theme/colors';
import { customersApi } from '../api/customers';

export function AppNavigator() {
  const { isAuthenticated, isLoading, loadTokens, setCustomer } = useAuthStore();
  const [bootstrapping, setBootstrapping] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      const hasTokens = await loadTokens();
      if (hasTokens) {
        try {
          const res = await customersApi.getProfile();
          setCustomer(res.data);
        } catch {
          // tokens invalid, will show auth
        }
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
