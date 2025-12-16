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
    Dimensions,
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
import { colors } from '../constants/colors';

const { width } = Dimensions.get('window');

const Login = ({ navigation }: any) => {
    // Estados para manejar el formulario
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
  
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
    if (!email || !password) {
      Alert.alert('Campos vacíos', 'Por favor ingresa tu correo y contraseña');
      return;
    }

    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(Firebaseauth, email, password);
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      
      if (userDoc.exists()) {
        // AuthContext handles navigation
      } else {
        Alert.alert('Error', 'No se encontraron datos del usuario.');
      }
    } catch (error: any) {
      console.error('Error en login:', error);
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
      
      <LinearGradient
        colors={[colors.background.gradientStart, colors.background.gradientEnd]}
        locations={[0.05, 0.82]}
        style={styles.backgroundGradient}
      />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <View style={styles.headerContainer}>
            <View style={styles.logoContainer}>
            <Image
                style={styles.logo}
                source={require('../../assets/images/Logo.png')}
                resizeMode="contain"
            />
            </View>
            <Text style={styles.welcomeText}>¡Hola de nuevo!</Text>
            <Text style={styles.subText}>Tu próxima aventura comienza aquí</Text>
        </View>

        <View style={styles.formCard}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Correo electrónico</Text>
            <View style={[styles.inputContainer, email.length > 0 && styles.inputActive]}>
                <Ionicons name="mail-outline" size={20} color={email.length > 0 ? colors.primary : "#9CA3AF"} style={styles.inputIcon} />
                <TextInput
                    value={email}
                    style={styles.input}
                    placeholder="ejemplo@correo.com"
                    placeholderTextColor="#D1D5DB"
                    autoCapitalize="none"
                    onChangeText={setEmail}
                    keyboardType="email-address"
                />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Contraseña</Text>
            <View style={[styles.inputContainer, password.length > 0 && styles.inputActive]}>
                <Ionicons name="lock-closed-outline" size={20} color={password.length > 0 ? colors.primary : "#9CA3AF"} style={styles.inputIcon} />
                <TextInput
                    secureTextEntry={!showPassword}
                    value={password}
                    style={styles.input}
                    placeholder="••••••••"
                    placeholderTextColor="#D1D5DB"
                    autoCapitalize="none"
                    onChangeText={setPassword}
                />
                <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
                >
                <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color="#9CA3AF"
                />
                </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={styles.forgotPassword}>
            <Text style={styles.forgotPasswordText}>¿Olvidaste tu contraseña?</Text>
          </TouchableOpacity>

          {loading ? (
            <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
          ) : (
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.signInButton}
                onPress={() => { void signIn(); }}
              >
                <Text style={styles.signInButtonText}>Iniciar Sesión</Text>
                <Ionicons name="arrow-forward" size={20} color="white" style={{ marginLeft: 8 }} />
              </TouchableOpacity>

              <View style={styles.dividerContainer}>
                <View style={styles.divider} />
                <Text style={styles.dividerText}>O continúa con</Text>
                <View style={styles.divider} />
              </View>

              <View style={styles.socialButtonsContainer}>
                <TouchableOpacity style={styles.socialButton} onPress={() => { void signInWithGoogle(); }}>
                    <Ionicons name="logo-google" size={24} color="#DB4437" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.socialButton}>
                    <Ionicons name="logo-apple" size={24} color="black" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        <View style={styles.footer}>
            <Text style={styles.footerText}>¿No tienes una cuenta?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('RegistroStep1')}>
                <Text style={styles.signUpText}>Regístrate aquí</Text>
            </TouchableOpacity>
        </View>

        {__DEV__ && (
            <TouchableOpacity
                style={styles.devButton}
                onPress={resetOnboarding}
            >
                <Text style={styles.devButtonText}>Reset Onboarding (dev)</Text>
            </TouchableOpacity>
        )}
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
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  logo: {
    width: 100,
    height: 100,
    tintColor: '#fff',
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  inputActive: {
    borderColor: colors.primary,
    backgroundColor: '#F0F9FF',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  eyeButton: {
    padding: 8,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  buttonContainer: {
    gap: 16,
  },
  signInButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  signInButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#6B7280',
    fontSize: 14,
  },
  socialButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  socialButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
    alignItems: 'center',
  },
  footerText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginRight: 4,
  },
  signUpText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  loader: {
    marginVertical: 20,
  },
  devButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  devButtonText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
  },
});
