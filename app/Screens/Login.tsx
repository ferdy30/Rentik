import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { signInWithEmailAndPassword } from 'firebase/auth';
import React from 'react';
import {
  ActivityIndicator,
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
import { Firebaseauth } from '../../FirebaseConfig';



const Login = ({ navigation }: any) => {

    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [loading, setLoading] = React.useState(false);
    const auth = Firebaseauth;
   
  const signIn = async () => {  
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);

    } catch (error) {
      console.error(error);
      alert ('Error al iniciar sesión. Por favor, verifica tus credenciales.');
    }   finally {   
        setLoading(false);
    }
  }
  




  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#FF5A5F', '#FF415E']}
        style={styles.backgroundGradient}
      />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <View style={styles.header}>
          <Text style={styles.welcomeText}>Bienvenido</Text>
          <Text style={styles.subText}>Inicia sesión para continuar</Text>
        </View>

        <View style={styles.logoContainer}>
          <Image 
            style={styles.logo} 
            source={require('../../assets/images/Logo.png')}
            resizeMode="contain"
          />
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={24} color="#666" style={styles.inputIcon} />
            <TextInput
              value={email}
              style={styles.input}
              placeholder="Correo electrónico"
              placeholderTextColor="#999"
              autoCapitalize="none"
              onChangeText={(text) => setEmail(text)}
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={24} color="#666" style={styles.inputIcon} />
            <TextInput
              secureTextEntry={true}
              value={password}
              style={styles.input}
              placeholder="Contraseña"
              placeholderTextColor="#999"
              autoCapitalize="none"
              onChangeText={(text) => setPassword(text)}
            />
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#FF5A5F" style={styles.loader} />
          ) : (
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.signInButton}
                onPress={() => { void signIn(); }}
              >
                <Text style={styles.signInButtonText}>Iniciar sesión</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.signUpButton}
                onPress={() => navigation.replace('Registro')}
              >
                <Text style={styles.signUpButtonText}>Crear cuenta nueva</Text>
              </TouchableOpacity>
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
    backgroundColor: 'white',
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
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  welcomeText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  subText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 120,
    height: 120,
    tintColor: 'white',
  },
  formContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    marginBottom: 15,
    paddingHorizontal: 15,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    color: '#333',
    fontSize: 16,
  },
  buttonContainer: {
    marginTop: 20,
  },
  loader: {
    marginTop: 20,
  },
  signInButton: {
    backgroundColor: '#FF5A5F',
    borderRadius: 10,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    shadowColor: '#FF5A5F',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
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
    color: '#FF5A5F',
    fontSize: 16,
    fontWeight: '600',
  },
});
