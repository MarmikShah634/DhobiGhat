import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text, View } from 'react-native';
import { Colors } from '../theme/colors';
import { HomeScreen } from '../screens/home/HomeScreen';
import { BrowseScreen } from '../screens/browse/BrowseScreen';
import { WashermanProfileScreen } from '../screens/browse/WashermanProfileScreen';
import { OrdersListScreen } from '../screens/orders/OrdersListScreen';
import { NewOrderScreen } from '../screens/orders/NewOrderScreen';
import { OrderConfirmScreen } from '../screens/orders/OrderConfirmScreen';
import { OrderDetailScreen } from '../screens/orders/OrderDetailScreen';
import { FavouritesScreen } from '../screens/favourites/FavouritesScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { EditProfileScreen } from '../screens/profile/EditProfileScreen';
import { NotificationsScreen } from '../screens/profile/NotificationsScreen';
import { AccountingScreen } from '../screens/profile/AccountingScreen';
import { useNotificationStore } from '../store/notificationStore';

const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();
const BrowseStack = createNativeStackNavigator();
const OrdersStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();

function TabIcon({ icon, focused }: { icon: string; focused: boolean }) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>{icon}</Text>
    </View>
  );
}

function HomeStackNav() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="HomeMain" component={HomeScreen} />
      <HomeStack.Screen name="OrderDetail" component={OrderDetailScreen} />
      <HomeStack.Screen name="WashermanProfile" component={WashermanProfileScreen} />
    </HomeStack.Navigator>
  );
}

function BrowseStackNav() {
  return (
    <BrowseStack.Navigator screenOptions={{ headerShown: false }}>
      <BrowseStack.Screen name="BrowseMain" component={BrowseScreen} />
      <BrowseStack.Screen name="WashermanProfile" component={WashermanProfileScreen} />
    </BrowseStack.Navigator>
  );
}

function OrdersStackNav() {
  return (
    <OrdersStack.Navigator screenOptions={{ headerShown: false }}>
      <OrdersStack.Screen name="OrdersList" component={OrdersListScreen} />
      <OrdersStack.Screen name="NewOrder" component={NewOrderScreen} />
      <OrdersStack.Screen name="OrderConfirm" component={OrderConfirmScreen} />
      <OrdersStack.Screen name="OrderDetail" component={OrderDetailScreen} />
    </OrdersStack.Navigator>
  );
}

function ProfileStackNav() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="ProfileMain" component={ProfileScreen} />
      <ProfileStack.Screen name="EditProfile" component={EditProfileScreen} />
      <ProfileStack.Screen name="Notifications" component={NotificationsScreen} />
      <ProfileStack.Screen name="Accounting" component={AccountingScreen} />
    </ProfileStack.Navigator>
  );
}

export function TabNavigator() {
  const unreadCount = useNotificationStore((s) => s.unreadCount);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.bgPrimary,
          borderTopColor: Colors.surfaceBorder,
          height: 64,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: Colors.gold,
        tabBarInactiveTintColor: Colors.textDisabled,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeStackNav}
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="🏠" focused={focused} /> }}
      />
      <Tab.Screen
        name="Browse"
        component={BrowseStackNav}
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="🔍" focused={focused} /> }}
      />
      <Tab.Screen
        name="Orders"
        component={OrdersStackNav}
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="📋" focused={focused} /> }}
      />
      <Tab.Screen
        name="Favourites"
        component={FavouritesScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="♥" focused={focused} /> }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStackNav}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="👤" focused={focused} />,
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
          tabBarBadgeStyle: { backgroundColor: Colors.gold, color: Colors.bgPrimary },
        }}
      />
    </Tab.Navigator>
  );
}
