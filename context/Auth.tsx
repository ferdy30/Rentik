import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { db, Firebaseauth } from '../FirebaseConfig';

export type AppRole = 'arrendador' | 'arrendatario' | string | null | undefined;

export interface UserData {
  role?: AppRole;
  // Puedes añadir aquí más campos del perfil
  [key: string]: any;
}

interface AuthContextValue {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue>({ user: null, userData: null, loading: true });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(Firebaseauth, async (u) => {
      try {
        if (u) {
          // Fetch user data from Firestore
          const userDoc = await getDoc(doc(db, 'users', u.uid));
          if (userDoc.exists()) {
            setUserData(userDoc.data() as UserData);
          } else {
            setUserData(null);
          }
        } else {
          setUserData(null);
        }
        setUser(u);
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  const value: AuthContextValue = { user, userData, loading };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}

export default AuthContext;
