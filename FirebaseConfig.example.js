
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from "firebase/app";
import { getReactNativePersistence, initializeAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

/**
 * Firebase Configuration Example
 * 
 * INSTRUCCIONES:
 * 1. Copia este archivo: `copy FirebaseConfig.example.js FirebaseConfig.js`
 * 2. Ve a Firebase Console: https://console.firebase.google.com/
 * 3. Selecciona tu proyecto
 * 4. Ve a Configuración del proyecto → Tus apps → SDK setup and configuration
 * 5. Copia tus credenciales reales en FirebaseConfig.js
 * 6. NUNCA subas FirebaseConfig.js a Git (ya está en .gitignore)
 */

const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.firebasestorage.app",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};

// Initialize Firebase
export const Firebaseapp = initializeApp(firebaseConfig);
export const Firebaseauth = initializeAuth(Firebaseapp, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});
export const db = getFirestore(Firebaseapp);
export const storage = getStorage(Firebaseapp);
