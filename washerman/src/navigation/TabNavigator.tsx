import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';
import { Colors } from '../theme/colors';
import { HomeDashboardScreen } from '../screens/home/HomeDashboardScreen';
import { OrdersListScreen } from '../screens/orders/OrdersListScreen';
import { OrderDetailScreen } from '../screens/orders/OrderDetailScreen';
import { PriceGridScreen } from '../screens/pricing/PriceGridScreen';
import { AccountingDashboardScreen } from '../screens/accounting/AccountingDashboardScreen';
import { CustomerLedgerScreen } from '../screens/accounting/CustomerLedgerScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { EditProfileScreen } from '../screens/profile/EditProfileScreen';
import { ReviewsScreen } from '../screens/profile/ReviewsScreen';
import { NotificationsScreen } from '../screens/profile/NotificationsScreen';

const Tab = createBottomTabNavigator();
const OrdersStack = createNativeStackNavigator();
const AccountingStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();

function TabIcon({ icon, focused }: { icon: string; focused: boolean }) {
  return <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>{icon}</Text>;
}

function OrdersStackNav() {
  return (
    <OrdersStack.Navigator screenOptions={{ headerShown: false }}>
      <OrdersStack.Screen name="OrdersList" component={OrdersListScreen} />
      <OrdersStack.Screen name="OrderDetail" component={OrderDetailScreen} />
    </OrdersStack.Navigator>
  );
}

function AccountingStackNav() {
  return (
    <AccountingStack.Navigator screenOptions={{ headerShown: false }}>
      <AccountingStack.Screen name="AccountingDashboard" component={AccountingDashboardScreen} />
      <AccountingStack.Screen name="CustomerLedger" component={CustomerLedgerScreen} />
    </AccountingStack.Navigator>
  );
}

function ProfileStackNav() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="ProfileMain" component={ProfileScreen} />
      <ProfileStack.Screen name="EditProfile" component={EditProfileScreen} />
      <ProfileStack.Screen name="Reviews" component={ReviewsScreen} />
      <ProfileStack.Screen name="Notifications" component={NotificationsScreen} />
    </ProfileStack.Navigator>
  );
}

export function TabNavigator() {
  return (
    <Tab.Navigator screenOptions={{
      headerShown: false,
      tabBarStyle: { backgroundColor: Colors.bgPrimary, borderTopColor: Colors.surfaceBorder, height: 64, paddingBottom: 8 },
      tabBarActiveTintColor: Colors.gold, tabBarInactiveTintColor: Colors.textDisabled,
      tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
    }}>
      <Tab.Screen name="Home" component={HomeDashboardScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="🏠" focused={focused} /> }} />
      <Tab.Screen name="Orders" component={OrdersStackNav}
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="📋" focused={focused} /> }} />
      <Tab.Screen name="Pricing" component={PriceGridScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="🏷️" focused={focused} /> }} />
      <Tab.Screen name="Accounting" component={AccountingStackNav}
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="📊" focused={focused} /> }} />
      <Tab.Screen name="Profile" component={ProfileStackNav}
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="👤" focused={focused} /> }} />
    </Tab.Navigator>
  );
}
