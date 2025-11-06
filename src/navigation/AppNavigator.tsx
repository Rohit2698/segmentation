import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MacroScanScreen from '../screens/MacroScan/Index';

export type RootStackParamList = {
  MacroScan: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="MacroScan">
        <Stack.Screen name="MacroScan" component={MacroScanScreen} options={{ title: 'Macro Scan' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
