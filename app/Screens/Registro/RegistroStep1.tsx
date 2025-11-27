import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { colors } from '../../constants/colors';
import { RootStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'RegistroStep1'>;

// Paso 1: Información Personal
export default function RegistroStep1({ navigation }: Props) {
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [countryCode, setCountryCode] = useState('+503');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [birthday, setBirthday] = useState<Date | null>(null);
  const [showCodePicker, setShowCodePicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const isDefaultCode = countryCode === '+503' && !phoneNumber;

  const COUNTRY_CODES = [
    { code: '+503', name: 'El Salvador', flag: '🇸🇻' },
    { code: '+502', name: 'Guatemala', flag: '🇬🇹' },
    { code: '+504', name: 'Honduras', flag: '🇭🇳' },
    { code: '+505', name: 'Nicaragua', flag: '🇳🇮' },
    { code: '+506', name: 'Costa Rica', flag: '🇨🇷' },
    { code: '+507', name: 'Panamá', flag: '🇵🇦' },
    { code: '+52', name: 'México', flag: '🇲🇽' },
    { code: '+1', name: 'EE.UU.', flag: '🇺🇸' },
  ];

  const validateEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const validatePassword = (password: string) => {
    // Al menos 8 caracteres, una mayúscula, una minúscula y un número
    const minLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    return minLength && hasUpperCase && hasLowerCase && hasNumber;
  };

  const validateAge = (birthDate: Date) => {
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      return age - 1 >= 18;
    }
    return age >= 18;
  };

  const handleContinue = () => {
    let errors = [];

    // Validación de nombre y apellido
    if (!nombre.trim()) {
      errors.push('Nombre es obligatorio');
    } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(nombre.trim())) {
      errors.push('El nombre solo puede contener letras');
    } else if (nombre.trim().length < 2) {
      errors.push('El nombre debe tener al menos 2 caracteres');
    }

    if (!apellido.trim()) {
      errors.push('Apellido es obligatorio');
    } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(apellido.trim())) {
      errors.push('El apellido solo puede contener letras');
    } else if (apellido.trim().length < 2) {
      errors.push('El apellido debe tener al menos 2 caracteres');
    }

    // Validación de email
    if (!email.trim()) {
      errors.push('Correo electrónico es obligatorio');
    } else if (!validateEmail(email)) {
      errors.push('Correo electrónico no válido');
    }

    // Validación de contraseña
    if (!password) {
      errors.push('Contraseña es obligatoria');
    } else if (!validatePassword(password)) {
      errors.push('La contraseña debe tener: mínimo 8 caracteres, una mayúscula, una minúscula y un número');
    }

    if (!confirmPassword) {
      errors.push('Confirmar contraseña es obligatorio');
    } else if (password !== confirmPassword) {
      errors.push('Las contraseñas no coinciden');
    }

    // Validación de teléfono
    if (!phoneNumber.trim()) {
      errors.push('Número de teléfono es obligatorio');
    } else {
      const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
      if (cleanPhone.length < 8) {
        errors.push('El teléfono debe tener al menos 8 dígitos');
      }
    }

    // Validación de fecha de nacimiento
    if (!birthday) {
      errors.push('Fecha de cumpleaños es obligatoria');
    } else if (!validateAge(birthday)) {
      errors.push('Debes ser mayor de 18 años para registrarte');
    }

    if (errors.length > 0) {
      setError(errors.join('\n• '));
      return;
    }

    // Pasar datos al siguiente paso (convertir Date a string ISO)
    navigation.navigate('RegistroStep2', {
      nombre,
      apellido,
      email,
      password,
      countryCode,
      telefono: phoneNumber.replace(/[^0-9]/g, ''),
      fechaNacimiento: birthday.toISOString(),
    });
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
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header con progreso */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <View style={styles.progressContainer}>
              <View style={[styles.progressDot, styles.progressDotActive]} />
              <View style={styles.progressLine} />
              <View style={styles.progressDot} />
              <View style={styles.progressLine} />
              <View style={styles.progressDot} />
            </View>
            <Text style={styles.stepText}>Paso 1 de 3</Text>
            <Text style={styles.title}>Información Personal</Text>
            <Text style={styles.subtitle}>Completa tus datos básicos</Text>
          </View>

          {/* Formulario */}
          <View style={styles.formContainer}>
            {/* Nombre */}
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Nombre"
                placeholderTextColor="#9CA3AF"
                value={nombre}
                onChangeText={setNombre}
              />
            </View>

            {/* Apellido */}
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Apellido"
                placeholderTextColor="#9CA3AF"
                value={apellido}
                onChangeText={setApellido}
              />
            </View>

            {/* Correo */}
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Correo electrónico"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            {/* Teléfono */}
            <View style={[styles.inputWrapper, { paddingHorizontal: 0 }]}>
              <View style={styles.phoneRow}>
                <TouchableOpacity style={styles.codeBox} onPress={() => setShowCodePicker(true)}>
                  <Text style={[styles.codeText, isDefaultCode && styles.placeholderText]}>{countryCode}</Text>
                  <Ionicons name="chevron-down" size={18} color="#6B7280" />
                </TouchableOpacity>
                <TextInput
                  style={[styles.input, styles.phoneInput]}
                  placeholder="Número de teléfono"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="phone-pad"
                  value={phoneNumber}
                  onChangeText={(t) => setPhoneNumber(t.replace(/[^0-9]/g, ''))}
                />
              </View>
            </View>

            {/* Cumpleaños */}
            <TouchableOpacity style={styles.inputWrapper} onPress={() => setShowDatePicker(true)}>
              <Ionicons name="calendar-outline" size={20} color="#6B7280" style={styles.inputIcon} />
              <Text style={[styles.input, styles.dateText, !birthday && styles.placeholderText]}>
                {birthday ? birthday.toLocaleDateString('es-SV', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Fecha de cumpleaños'}
              </Text>
            </TouchableOpacity>

            {/* Android: DatePicker directo */}
            {showDatePicker && Platform.OS === 'android' && (
              <DateTimePicker
                value={birthday || new Date(2000, 0, 1)}
                mode="date"
                display="default"
                maximumDate={new Date()}
                onChange={(event: DateTimePickerEvent, date?: Date) => {
                  setShowDatePicker(false);
                  if (event.type === 'set' && date) {
                    setBirthday(date);
                  }
                }}
              />
            )}

            {/* Contraseña */}
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Contraseña"
                placeholderTextColor="#9CA3AF"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity style={styles.eyeButton} onPress={() => setShowPassword(!showPassword)}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Confirmar Contraseña */}
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Confirmar Contraseña"
                placeholderTextColor="#9CA3AF"
                secureTextEntry={!showConfirmPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Ionicons
                  name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#6B7280"
                />
              </TouchableOpacity>
            </View>

            {/* Mensaje de error */}
            {error ? <Text style={styles.error}>• {error}</Text> : null}

            {/* Botón continuar */}
            <TouchableOpacity style={styles.button} onPress={handleContinue}>
              <Text style={styles.buttonText}>Continuar</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </TouchableOpacity>

            {/* Link para volver atrás (si estás autenticado, evita ir a Login fuera del stack actual) */}
            <TouchableOpacity style={styles.linkContainer} onPress={() => navigation.goBack()}>
              <Text style={styles.link}>¿Ya tienes cuenta? </Text>
              <Text style={[styles.link, { color: colors.primary, fontWeight: '600' }]}>Inicia sesión</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal de códigos de país */}
      <Modal visible={showCodePicker} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Selecciona tu código</Text>
            <ScrollView style={{ maxHeight: 400 }}>
              {COUNTRY_CODES.map((item) => (
                <TouchableOpacity
                  key={item.code}
                  style={styles.modalItem}
                  onPress={() => {
                    setCountryCode(item.code);
                    setShowCodePicker(false);
                  }}
                >
                  <Text style={styles.modalItemFlag}>{item.flag}</Text>
                  <Text style={styles.modalItemText}>{item.name}</Text>
                  <Text style={styles.modalItemCode}>{item.code}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.modalClose} onPress={() => setShowCodePicker(false)}>
              <Text style={styles.modalCloseText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal de fecha de nacimiento (Solo iOS) */}
      {Platform.OS === 'ios' && (
        <Modal visible={showDatePicker} transparent animationType="slide">
          <View style={styles.datePickerOverlay}>
            <View style={styles.datePickerModal}>
              <View style={styles.datePickerHeader}>
                <Text style={styles.modalTitle}>Fecha de Nacimiento</Text>
              </View>
              <DateTimePicker
                value={birthday || new Date(2000, 0, 1)}
                mode="date"
                display="inline"
                maximumDate={new Date()}
                onChange={(event: DateTimePickerEvent, date?: Date) => {
                  if (date) {
                    setBirthday(date);
                  }
                }}
                style={{ height: 260 }}
              />
              <TouchableOpacity
                style={styles.modalClose}
                onPress={() => setShowDatePicker(false)}
              >
                <Text style={styles.modalCloseText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

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
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 10,
    padding: 8,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  progressDotActive: {
    backgroundColor: colors.accent,
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  progressLine: {
    width: 40,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: 8,
  },
  stepText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 8,
    fontWeight: '500',
  },
  title: {
    fontSize: 32,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.85)',
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 15,
    height: 50,
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
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  codeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    height: 50,
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
  },
  codeText: {
    fontSize: 16,
    color: '#032B3C',
    fontWeight: '600',
  },
  phoneInput: {
    paddingHorizontal: 15,
  },
  dateText: {
    textAlignVertical: 'center',
    color: '#032B3C',
  },
  placeholderText: {
    color: '#9CA3AF',
  },
  eyeButton: {
    padding: 8,
  },
  error: {
    color: '#EF4444',
    marginBottom: 12,
    fontSize: 14,
    lineHeight: 20,
  },
  button: {
    width: '100%',
    height: 52,
    backgroundColor: colors.primary,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    gap: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  linkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  link: {
    color: '#6B7280',
    fontSize: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#032B3C',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 12,
  },
  modalItemFlag: {
    fontSize: 24,
  },
  modalItemText: {
    flex: 1,
    fontSize: 16,
    color: '#032B3C',
  },
  modalItemCode: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '600',
  },
  modalClose: {
    marginTop: 16,
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.primary,
  },
  modalCloseText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  datePickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  datePickerModal: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    width: '90%',
    maxWidth: 400,
    alignSelf: 'center',
    marginBottom: 20,
  },
  datePickerHeader: {
    marginBottom: 16,
  },
});
