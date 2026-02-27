import { onAuthStateChanged, User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import React, { createContext, useContext, useEffect, useState } from "react";
import { db, Firebaseauth } from "../FirebaseConfig";
import { registerForPushNotificationsAsync } from "../services/notifications";

export type AppRole = "arrendador" | "arrendatario" | string | null | undefined;

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

const AuthContext = createContext<AuthContextValue>({
  user: null,
  userData: null,
  loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeSnapshot: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(Firebaseauth, async (u) => {
      try {
        // Si ya había un snapshot previo, desuscribir antes de continuar
        if (unsubscribeSnapshot) {
          unsubscribeSnapshot();
          unsubscribeSnapshot = null;
        }

        setUser(u);

        if (u) {
          // Registrar token de notificaciones push (silencioso, no bloquea)
          registerForPushNotificationsAsync(u.uid).catch(() => null);
          // Usar onSnapshot para escuchar cambios en tiempo real en el documento del usuario
          unsubscribeSnapshot = onSnapshot(
            doc(db, "users", u.uid),
            (userDoc) => {
              if (userDoc.exists()) {
                setUserData(userDoc.data() as UserData);
              } else {
                setUserData(null);
              }
              setLoading(false);
            },
            (error) => {
              console.error("Error fetching user data:", error);
              setUserData(null);
              setLoading(false);
            },
          );
        } else {
          // Cerrar cualquier listener activo al cerrar sesión
          if (unsubscribeSnapshot) {
            unsubscribeSnapshot();
            unsubscribeSnapshot = null;
          }
          setUserData(null);
          setLoading(false);
        }
      } catch (error) {
        console.error("Error in auth state change:", error);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
      }
    };
  }, []);

  const value = React.useMemo<AuthContextValue>(
    () => ({
      user,
      userData,
      loading,
    }),
    [user, userData, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}

export default AuthContext;
