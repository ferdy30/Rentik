
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { initializeApp } from "firebase/app";
import { getReactNativePersistence, initializeAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";
import { getStorage } from "firebase/storage";

// Cargar configuración desde variables de entorno
const env = Constants.expoConfig?.extra || {};

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || env.firebaseApiKey || "AIzaSyDrzeQYyY0Uvq70WpYBk0_uNWS4xjSPQqk",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || env.firebaseAuthDomain || "rentik-d401e.firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID || env.firebaseProjectId || "rentik-d401e",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || env.firebaseStorageBucket || "rentik-d401e.firebasestorage.app",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || env.firebaseMessagingSenderId || "1066128652427",
  appId: process.env.FIREBASE_APP_ID || env.firebaseAppId || "1:1066128652427:web:f3a7a8a0c0d6e39a67fc8e",
  measurementId: process.env.FIREBASE_MEASUREMENT_ID || env.firebaseMeasurementId || "G-WG8E85HCLZ"
};

// Initialize Firebase
export const Firebaseapp = initializeApp(firebaseConfig);
export const Firebaseauth = initializeAuth(Firebaseapp, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});
export const db = getFirestore(Firebaseapp);
export const storage = getStorage(Firebaseapp);
export const functions = getFunctions(Firebaseapp);