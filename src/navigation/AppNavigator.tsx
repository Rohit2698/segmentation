import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import CameraScreen from '../screens/Camera/Index';
import SettingsScreen from '../screens/Settings/Index';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type RootTabParamList = {
  Camera: undefined;
  Home: undefined;
  MacroScan: undefined;
  Sections: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

// Predefined tab icon components (defined outside render to satisfy lint rules)
const CameraTabIcon = ({ color, size }: { color: string; size: number }) => (
  <Ionicons name="camera" size={size ?? 24} color={color} />
);
const SettingsTabIcon = ({ color, size }: { color: string; size: number }) => (
  <Ionicons name="settings" size={size ?? 24} color={color} />
);

export default function AppNavigator() {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 8); // ensure minimum touch area
  return (
    <NavigationContainer>
      <Tab.Navigator
        initialRouteName="Camera"
        screenOptions={{
          tabBarActiveTintColor: '#007bff',
          tabBarInactiveTintColor: '#6c757d',
          tabBarStyle: {
            // Increase height/padding by bottom inset so it's not hidden behind Android gesture bar
            paddingBottom: bottomInset,
            paddingTop: 6,
            height: 56 + bottomInset,
          },
          tabBarHideOnKeyboard: true,
          headerShown: true,
          headerStyle: {
            backgroundColor: '#fff',
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 1,
            borderBottomColor: '#e9ecef',
          },
          headerTitleStyle: {
            fontSize: 18,
            fontWeight: '600',
            color: '#1a1a1a',
          },
        }}
      >
        <Tab.Screen
          name="Camera"
          component={CameraScreen}
          options={{
            title: 'Scan',
            tabBarLabel: 'Scan',
            headerShown: false,
            tabBarIcon: CameraTabIcon,
          }}
        />
        
        <Tab.Screen
          name="Settings"
          component={SettingsScreen}
          options={{
            title: 'Settings',
            tabBarLabel: 'Settings',
            tabBarIcon: SettingsTabIcon,
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
