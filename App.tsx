import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Text, View, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

import { TodayScreen } from './src/screens/TodayScreen';
import { FocusScreen } from './src/screens/FocusScreen';
import { StreakScreen } from './src/screens/StreakScreen';
import { FriendsScreen } from './src/screens/FriendsScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { useStore } from './src/store/useStore';
import { Colors } from './src/theme';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const Tab = createBottomTabNavigator();

const TabIcon = ({
  emoji, label, focused,
}: {
  emoji: string; label: string; focused: boolean;
}) => (
  <View style={{ alignItems: 'center', gap: 2, width: 50 }}>
    <Text style={{ fontSize: 20 }}>{emoji}</Text>
    <Text
      numberOfLines={1}
      style={{
        fontSize: 10,
        color: focused ? Colors.flame : Colors.textMuted,
        fontWeight: focused ? '600' : '400',
      }}
    >
      {label}
    </Text>
  </View>
);

const NavTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: Colors.bg },
};

export default function App() {
  const { hasOnboarded, notificationsEnabled } = useStore();

  // Request notification permissions on mount
  useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web') {
        await Notifications.requestPermissionsAsync();
      }
    })();
  }, []);

  if (!hasOnboarded) {
    return (
      <SafeAreaProvider>
        <StatusBar style="light" />
        <LoginScreen />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer theme={NavTheme}>
        <StatusBar style="light" />
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarStyle: {
              backgroundColor: Colors.surface,
              borderTopColor: Colors.border,
              borderTopWidth: 1,
              height: 72,
              paddingBottom: 12,
              paddingTop: 8,
            },
            tabBarShowLabel: false,
          }}
        >
          <Tab.Screen
            name="Today"
            component={TodayScreen}
            options={{
              tabBarIcon: ({ focused }) => (
                <TabIcon emoji="🗒" label="Aujourd'hui" focused={focused} />
              ),
            }}
          />
          <Tab.Screen
            name="Focus"
            component={FocusScreen}
            options={{
              tabBarIcon: ({ focused }) => (
                <TabIcon emoji="⏱" label="Focus" focused={focused} />
              ),
            }}
          />
          <Tab.Screen
            name="Streak"
            component={StreakScreen}
            options={{
              tabBarIcon: ({ focused }) => (
                <TabIcon emoji="🔥" label="Flamme" focused={focused} />
              ),
            }}
          />
          <Tab.Screen
            name="Friends"
            component={FriendsScreen}
            options={{
              tabBarIcon: ({ focused }) => (
                <TabIcon emoji="👥" label="Amis" focused={focused} />
              ),
            }}
          />
          <Tab.Screen
            name="Settings"
            component={SettingsScreen}
            options={{
              tabBarIcon: ({ focused }) => (
                <TabIcon emoji="⚙️" label="Réglages" focused={focused} />
              ),
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
