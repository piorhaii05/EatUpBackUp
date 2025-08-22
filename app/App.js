import { NavigationContainer } from '@react-navigation/native';
import React from 'react';
import Toast from 'react-native-toast-message';
import AppNavigator from './navigation/AppNavigator';

export default function App() {
  return (
    <>
      <NavigationContainer>
        <AppNavigator />
        <Toast />
      </NavigationContainer>
    </>
  );
}
