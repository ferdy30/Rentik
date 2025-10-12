
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";


const firebaseConfig = {
  apiKey: "AIzaSyAnnGnxGQERF_DOifRS44ohbuDTmBYXCXk",
  authDomain: "workfit-85179.firebaseapp.com",
  projectId: "workfit-85179",
  storageBucket: "workfit-85179.firebasestorage.app",
  messagingSenderId: "693493735111",
  appId: "1:693493735111:web:70e7105ed0509042d1e8e2",
  measurementId: "G-B3B4Z9V9CF"
};

// Initialize Firebase
export const Firebaseapp = initializeApp(firebaseConfig);
export const Firebaseauth = getAuth(Firebaseapp);
export const db = getFirestore(Firebaseapp);