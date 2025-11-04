import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Google from 'expo-auth-session/providers/google';
import Constants from 'expo-constants';
import { LinearGradient } from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';
import { GoogleAuthProvider, signInWithCredential, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { Firebaseauth, db } from '../../FirebaseConfig';
import SocialAuthButtons from '../components/SocialAuthButtons';
import { colors } from '../constants/colors';
// import { getHomeRouteByRole } from '../navigation/role';

const Login = ({ navigation }: any) => {
    // Estados para manejar el formulario
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false); // Para mostrar/ocultar contraseña
  
    // Completar sesión en web (Google)
    WebBrowser.maybeCompleteAuthSession();
  
    // Google provider
    const googleWebClientId = (Constants.expoConfig?.extra as any)?.googleWebClientId;
    const googleIosClientId = (Constants.expoConfig?.extra as any)?.googleIosClientId;
    const googleAndroidClientId = (Constants.expoConfig?.extra as any)?.googleAndroidClientId;
    const rawScheme: any = Constants.expoConfig?.scheme;
    const scheme = Array.isArray(rawScheme) ? (rawScheme[0] || 'rentik') : (rawScheme || 'rentik');
    const [ , , promptGoogle] = Google.useAuthRequest(
      {
        clientId: googleWebClientId,
        iosClientId: googleIosClientId,
        androidClientId: googleAndroidClientId,
        responseType: 'id_token',
        scopes: ['profile', 'email'],
      },
      { scheme }
    );
   
  // Función para iniciar sesión con Firebase
  const signIn = async () => {  
    // Validación básica antes de intentar login
    if (!email || !password) {
      Alert.alert('Campos vacíos', 'Por favor ingresa tu correo y contraseña');
      return;
    }

    console.log('[LOGIN] Intentando login con email:', email);
    setLoading(true);
    try {
      // Intento de login con Firebase Auth
      console.log('[LOGIN] Llamando a signInWithEmailAndPassword...');
      const userCredential = await signInWithEmailAndPassword(Firebaseauth, email, password);
      console.log('[LOGIN] Login exitoso, UID:', userCredential.user.uid);
      
      // Obtener datos del usuario desde Firestore para determinar el rol
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      console.log('[LOGIN] UserDoc exists:', userDoc.exists());
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        console.log('[LOGIN] UserData:', { role: userData.role, profileComplete: userData.profileComplete });
        
        // NO navegamos manualmente - el AuthContext y AppNavigation se encargan automáticamente
        // Al cambiar el estado de autenticación, el stack se reconstruye con las rutas correctas
        // y el usuario será redirigido según su rol y estado (ver AppNavigation)
        console.log('[LOGIN] Login completado, esperando reconstrucción del stack...');
      } else {
        console.log('[LOGIN] UserDoc no existe');
        Alert.alert('Error', 'No se encontraron datos del usuario.');
      }
    } catch (error: any) {
      console.error('Error en login:', error);
      // Mensajes de error más específicos según el código
      if (error.code === 'auth/invalid-credential') {
        Alert.alert('Error', 'Correo o contraseña incorrectos');
      } else if (error.code === 'auth/user-not-found') {
        Alert.alert('Error', 'No existe una cuenta con ese correo');
      } else if (error.code === 'auth/wrong-password') {
        Alert.alert('Error', 'Contraseña incorrecta');
      } else {
        Alert.alert('Error', 'No se pudo iniciar sesión. Verifica tus datos.');
      }
    } finally {   
      setLoading(false);
    }
  }
  
  // Registro / Login con Google
  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      if (!googleWebClientId && !googleIosClientId && !googleAndroidClientId) {
        Alert.alert('Configuración requerida', 'Agrega tus Google Client IDs en app.json (expo.extra.*)');
        return;
      }
      const res = await promptGoogle();
      if (res.type !== 'success') {
        if (res.type !== 'dismiss') Alert.alert('Google', 'Inicio de sesión cancelado.');
        return;
      }
      const idToken = (res.params as any)?.id_token || (res as any)?.authentication?.idToken;
      if (!idToken) {
        Alert.alert('Google', 'No se recibió idToken. Revisa configuración de OAuth.');
        return;
      }
      const credential = GoogleAuthProvider.credential(idToken);
      const userCred = await signInWithCredential(Firebaseauth, credential);
      // Asegurar doc de usuario en Firestore
      const uid = userCred.user.uid;
      const ref = doc(db, 'users', uid);
      const snapshot = await getDoc(ref);
      if (!snapshot.exists()) {
        const name = userCred.user.displayName || '';
        const [nombre = '', apellido = ''] = name.split(' ');
        await (await import('firebase/firestore')).setDoc(ref, {
          nombre,
          apellido,
          email: userCred.user.email || '',
          telefono: '',
          fechaNacimiento: '',
          role: null,
          profileComplete: false,
          paymentComplete: false,
          createdAt: new Date().toISOString(),
        }, { merge: true });
      }
    } catch (e) {
      console.error('[GOOGLE_LOGIN] error', e);
      Alert.alert('Error', 'No se pudo iniciar sesión con Google.');
    } finally {
      setLoading(false);
    }
  };

  const resetOnboarding = async () => {
    try {
      await AsyncStorage.removeItem('hasSeenOnboarding');
      try {
        const state: any = navigation.getState?.();
        const routeNames: string[] = state?.routeNames || state?.routes?.map((r: any) => r.name) || [];
        if (routeNames.includes('Splash')) {
          navigation.navigate('Splash');
        }
      } catch {
        // ignore
      }
    } catch (e) {
      console.warn('No se pudo reiniciar el onboarding', e);
    }
  };


  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Fondo con degradado azul */}
      <LinearGradient
        colors={[colors.background.gradientStart, colors.background.gradientEnd]}
        locations={[0.05, 0.82]}
        style={styles.backgroundGradient}
      />
      
      {/* KeyboardAvoidingView para que el teclado no tape los inputs */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        {/* Logo de la app */}
        <View style={styles.logoContainer}>
          <Image
            style={styles.logo}
            source={require('../../assets/images/Logo.png')}
            resizeMode="contain"
          />
        </View>

        {/* Mensaje de bienvenida */}
        <View style={styles.header}>
          <Text style={styles.welcomeText}>Bienvenido</Text>
          <Text style={styles.subText}>Inicia sesión para continuar</Text>
        </View>

        {/* Formulario principal con fondo blanco */}
        <View style={styles.formContainer}>
          {/* Campo de correo con icono */}
          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={24} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                value={email}
                style={styles.input}
                placeholder="Correo electrónico"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="none"
                onChangeText={(text) => setEmail(text)}
                keyboardType="email-address"
              />
          </View>

          {/* Campo de contraseña con toggle */}
          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={24} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                secureTextEntry={!showPassword}
                value={password}
                style={styles.input}
                placeholder="Contraseña"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="none"
                onChangeText={(text) => setPassword(text)}
              />
            {/* Botón para mostrar/ocultar contraseña */}
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={24}
                color="#6B7280"
              />
            </TouchableOpacity>
          </View>

          {/* Botones de acción */}
          {loading ? (
            <ActivityIndicator size="large" color="#0B729D" style={styles.loader} />
          ) : (
            <View style={styles.buttonContainer}>
              {/* Botón principal de login */}
              <TouchableOpacity
                style={styles.signInButton}
                onPress={() => { void signIn(); }}
              >
                <Text style={styles.signInButtonText}>Iniciar sesión</Text>
              </TouchableOpacity>

              {/* Link para ir a registro */}
              <TouchableOpacity
                style={styles.signUpButton}
                onPress={() => navigation.navigate('RegistroStep1')}
              >
                <Text style={styles.signUpButtonText}>Crear cuenta nueva</Text>
              </TouchableOpacity>

              {/* Social auth */}
              <SocialAuthButtons
                onGoogle={() => { void signInWithGoogle(); }}
                // Apple Sign-In comentado hasta tener Apple Developer Program
              />

              {__DEV__ && (
                <TouchableOpacity
                  style={styles.devButton}
                  onPress={resetOnboarding}
                >
                  <Text style={styles.devButtonText}>Reset Onboarding (dev)</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  )
};

export default Login;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  backgroundGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: '100%',
  },
  content: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 25,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    width: 120,
    height: 120,
    tintColor: '#fff',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  welcomeText: {
    fontSize: 32,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 10,
  },
  subText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.85)',
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 15,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    color: '#032B3C',
    fontSize: 16,
    fontWeight: '500',
    backgroundColor: 'transparent',
  },
  eyeButton: {
    marginLeft: 10,
    padding: 5,
  },
  buttonContainer: {
    marginTop: 20,
  },
  loader: {
    marginTop: 20,
  },
  signInButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  signInButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  signUpButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  signUpButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  
  
  devButton: {
    marginTop: 12,
    alignItems: 'center',
    paddingVertical: 8,
  },
  devButtonText: {
    color: '#9CA3AF',
    fontSize: 12,
  },
});
