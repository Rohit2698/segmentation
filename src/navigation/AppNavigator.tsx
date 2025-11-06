import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import CameraScreen from '../screens/Camera/Index';
import HomeScreen from '../screens/Home/Index';
import MacroScanScreen from '../screens/MacroScan/Index';
import SectionsScreen from '../screens/Sections/Index';
import SettingsScreen from '../screens/Settings/Index';

export type RootTabParamList = {
  Camera: undefined;
  Home: undefined;
  MacroScan: undefined;
  Sections: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

const EmptyIcon = () => null;

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        initialRouteName="Camera"
        screenOptions={{
          tabBarActiveTintColor: '#007bff',
          tabBarInactiveTintColor: '#6c757d',
          tabBarStyle: {
            paddingBottom: 5,
            paddingTop: 5,
            height: 60,
          },
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
            tabBarIcon: EmptyIcon,
            headerShown: false,
          }} 
        />
        <Tab.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{ 
            title: 'Home',
            tabBarLabel: 'Home',
            tabBarIcon: EmptyIcon,
          }} 
        />
        <Tab.Screen 
          name="MacroScan" 
          component={MacroScanScreen} 
          options={{ 
            title: 'Gallery Scan',
            tabBarLabel: 'Gallery',
            tabBarIcon: EmptyIcon,
          }} 
        />
        <Tab.Screen 
          name="Sections" 
          component={SectionsScreen} 
          options={{ 
            title: 'Available Sections',
            tabBarLabel: 'Models',
            tabBarIcon: EmptyIcon,
          }} 
        />
        <Tab.Screen 
          name="Settings" 
          component={SettingsScreen} 
          options={{ 
            title: 'Settings',
            tabBarLabel: 'Settings',
            tabBarIcon: EmptyIcon,
          }} 
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
