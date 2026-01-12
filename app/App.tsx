import React from 'react';
import { LogBox } from 'react-native';
import { AuthProvider } from './context/Auth';
import { ToastProvider } from './context/ToastContext';
import { FavoritesProvider } from './context/FavoritesContext';
import AppNavigation from './navigation';

// Ignore specific warnings that we can't fix
LogBox.ignoreLogs([
  'AsyncStorage has been extracted from react-native',
  'Non-serializable values were found in the navigation state',
]);

export default function App() {
  return (
    <AuthProvider>
      <FavoritesProvider>
        <ToastProvider>
          <AppNavigation />
        </ToastProvider>
      </FavoritesProvider>
    </AuthProvider>
  );
}