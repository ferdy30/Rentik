import {
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
    Poppins_900Black,
    useFonts,
} from "@expo-google-fonts/poppins";
import * as SplashScreen from "expo-splash-screen";
import React, { useCallback, useEffect } from "react";
import { ActivityIndicator, LogBox, Text, View } from "react-native";
import { AuthProvider } from "./context/Auth";
import { FavoritesProvider } from "./context/FavoritesContext";
import { ToastProvider } from "./context/ToastContext";
import AppNavigation from "./navigation";

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

// Ignore specific warnings that we can't fix
LogBox.ignoreLogs([
  "AsyncStorage has been extracted from react-native",
  "Non-serializable values were found in the navigation state",
]);

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    "Poppins-Regular": Poppins_400Regular,
    "Poppins-Medium": Poppins_500Medium,
    "Poppins-SemiBold": Poppins_600SemiBold,
    "Poppins-Bold": Poppins_700Bold,
    "Poppins-ExtraBold": Poppins_800ExtraBold,
    "Poppins-Black": Poppins_900Black,
  });

  // Log font loading status for debugging
  useEffect(() => {
    if (fontError) {
      console.error("❌ Error loading fonts:", fontError);
    }
    if (fontsLoaded) {
      console.log("✅ Fonts loaded successfully");
    }
  }, [fontsLoaded, fontError]);

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  // Show loading screen while fonts are loading
  if (!fontsLoaded) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#F9FAFB",
        }}
      >
        <ActivityIndicator size="large" color="#0B729D" />
        <Text style={{ marginTop: 16, fontSize: 16, color: "#6B7280" }}>
          Cargando fuentes...
        </Text>
        {fontError && (
          <Text
            style={{
              marginTop: 8,
              fontSize: 12,
              color: "#EF4444",
              textAlign: "center",
            }}
          >
            Error cargando fuentes. Usando fuentes del sistema.
          </Text>
        )}
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <AuthProvider>
        <FavoritesProvider>
          <ToastProvider>
            <AppNavigation />
          </ToastProvider>
        </FavoritesProvider>
      </AuthProvider>
    </View>
  );
}
