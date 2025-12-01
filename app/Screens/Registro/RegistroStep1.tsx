import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
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
  // const [confirmPassword, setConfirmPassword] = useState(''); // Eliminado por redundancia
  const [countryCode, setCountryCode] = useState('+503');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [birthday, setBirthday] = useState<Date | null>(null);
  const [showCodePicker, setShowCodePicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Validation State
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [passwordStrength, setPasswordStrength] = useState(0);

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

  // Real-time validation effects
  useEffect(() => {
    if (touched.nombre) validateField('nombre', nombre);
  }, [nombre]);

  useEffect(() => {
    if (touched.apellido) validateField('apellido', apellido);
  }, [apellido]);

  useEffect(() => {
    if (touched.email) validateField('email', email);
  }, [email]);

  useEffect(() => {
    validateField('password', password);
    calculatePasswordStrength(password);
  }, [password]);

  useEffect(() => {
    if (touched.phoneNumber) validateField('phoneNumber', phoneNumber);
  }, [phoneNumber]);

  useEffect(() => {
    if (birthday) validateField('birthday', birthday);
  }, [birthday]);

  const calculatePasswordStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[a-z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++; // Bonus for special chars
    setPasswordStrength(Math.min(score, 4));
  };

  const validateField = (field: string, value: any) => {
    let error = '';
    switch (field) {
      case 'nombre':
        if (!value.trim()) error = 'Nombre es obligatorio';
        else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(value.trim())) error = 'Solo letras permitidas';
        else if (value.trim().length < 2) error = 'Mínimo 2 caracteres';
        break;
      case 'apellido':
        if (!value.trim()) error = 'Apellido es obligatorio';
        else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(value.trim())) error = 'Solo letras permitidas';
        else if (value.trim().length < 2) error = 'Mínimo 2 caracteres';
        break;
      case 'email':
        if (!value.trim()) error = 'Correo es obligatorio';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) error = 'Correo inválido';
        break;
      case 'password':
        if (!value) error = 'Contraseña obligatoria';
        else if (value.length < 8) error = 'Mínimo 8 caracteres';
        else if (!/[A-Z]/.test(value)) error = 'Falta una mayúscula';
        else if (!/[a-z]/.test(value)) error = 'Falta una minúscula';
        else if (!/[0-9]/.test(value)) error = 'Falta un número';
        break;
      case 'phoneNumber':
        if (!value.trim()) error = 'Teléfono obligatorio';
        else if (value.replace(/[^0-9]/g, '').length < 8) error = 'Mínimo 8 dígitos';
        break;
      case 'birthday':
        if (!value) error = 'Fecha obligatoria';
        else {
          const today = new Date();
          const age = today.getFullYear() - value.getFullYear();
          const m = today.getMonth() - value.getMonth();
          if (m < 0 || (m === 0 && today.getDate() < value.getDate())) {
            if (age - 1 < 18) error = 'Debes ser mayor de 18 años';
          } else {
            if (age < 18) error = 'Debes ser mayor de 18 años';
          }
        }
        break;
    }
    setErrors(prev => ({ ...prev, [field]: error }));
    return error;
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    // Trigger validation on blur
    switch(field) {
        case 'nombre': validateField('nombre', nombre); break;
        case 'apellido': validateField('apellido', apellido); break;
        case 'email': validateField('email', email); break;
        case 'phoneNumber': validateField('phoneNumber', phoneNumber); break;
    }
  };

  const handleContinue = () => {
    // Mark all as touched
    setTouched({
      nombre: true,
      apellido: true,
      email: true,
      password: true,
      phoneNumber: true,
      birthday: true,
    });

    // Validate all
    const e1 = validateField('nombre', nombre);
    const e2 = validateField('apellido', apellido);
    const e3 = validateField('email', email);
    const e4 = validateField('password', password);
    const e5 = validateField('phoneNumber', phoneNumber);
    const e6 = validateField('birthday', birthday);

    if (e1 || e2 || e3 || e4 || e5 || e6) {
      return;
    }

    // Pasar datos al siguiente paso
    navigation.navigate('RegistroStep2', {
      nombre,
      apellido,
      email,
      password,
      countryCode,
      telefono: phoneNumber.replace(/[^0-9]/g, ''),
      fechaNacimiento: birthday!.toISOString(),
    });
  };

  const getStrengthColor = () => {
    if (passwordStrength <= 1) return '#EF4444'; // Red
    if (passwordStrength === 2) return '#F59E0B'; // Yellow
    if (passwordStrength === 3) return '#10B981'; // Green
    return '#059669'; // Dark Green
  };

  const getStrengthLabel = () => {
    if (passwordStrength <= 1) return 'Débil';
    if (passwordStrength === 2) return 'Regular';
    if (passwordStrength === 3) return 'Buena';
    return 'Fuerte';
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

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
              <Ionicons name="arrow-back" size={24} color={colors.primary} />
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
            <View style={[styles.inputWrapper, touched.nombre && errors.nombre ? styles.inputError : null]}>
              <Ionicons name="person-outline" size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Nombre"
                placeholderTextColor="#9CA3AF"
                value={nombre}
                onChangeText={setNombre}
                onBlur={() => handleBlur('nombre')}
              />
              {touched.nombre && !errors.nombre && nombre.length > 0 && <Ionicons name="checkmark-circle" size={20} color={colors.status.success} />}
            </View>
            {touched.nombre && errors.nombre && <Text style={styles.errorText}>{errors.nombre}</Text>}

            {/* Apellido */}
            <View style={[styles.inputWrapper, touched.apellido && errors.apellido ? styles.inputError : null]}>
              <Ionicons name="person-outline" size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Apellido"
                placeholderTextColor="#9CA3AF"
                value={apellido}
                onChangeText={setApellido}
                onBlur={() => handleBlur('apellido')}
              />
              {touched.apellido && !errors.apellido && apellido.length > 0 && <Ionicons name="checkmark-circle" size={20} color={colors.status.success} />}
            </View>
            {touched.apellido && errors.apellido && <Text style={styles.errorText}>{errors.apellido}</Text>}

            {/* Correo */}
            <View style={[styles.inputWrapper, touched.email && errors.email ? styles.inputError : null]}>
              <Ionicons name="mail-outline" size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Correo electrónico"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                onBlur={() => handleBlur('email')}
              />
              {touched.email && !errors.email && email.length > 0 && <Ionicons name="checkmark-circle" size={20} color={colors.status.success} />}
            </View>
            {touched.email && errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

            {/* Teléfono */}
            <View style={[styles.inputWrapper, { paddingHorizontal: 0 }, touched.phoneNumber && errors.phoneNumber ? styles.inputError : null]}>
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
                  onBlur={() => handleBlur('phoneNumber')}
                />
              </View>
            </View>
            {touched.phoneNumber && errors.phoneNumber && <Text style={styles.errorText}>{errors.phoneNumber}</Text>}

            {/* Cumpleaños */}
            <TouchableOpacity 
              style={[styles.inputWrapper, touched.birthday && errors.birthday ? styles.inputError : null]} 
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons name="calendar-outline" size={20} color="#6B7280" style={styles.inputIcon} />
              <Text style={[styles.input, styles.dateText, !birthday && styles.placeholderText]}>
                {birthday ? birthday.toLocaleDateString('es-SV', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Fecha de cumpleaños'}
              </Text>
              {touched.birthday && !errors.birthday && birthday && <Ionicons name="checkmark-circle" size={20} color={colors.status.success} />}
            </TouchableOpacity>
            {touched.birthday && errors.birthday && <Text style={styles.errorText}>{errors.birthday}</Text>}

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
                    handleBlur('birthday');
                  }
                }}
              />
            )}

            {/* Contraseña */}
            <View style={[styles.inputWrapper, touched.password && errors.password ? styles.inputError : null]}>
              <Ionicons name="lock-closed-outline" size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Contraseña"
                placeholderTextColor="#9CA3AF"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                onBlur={() => handleBlur('password')}
              />
              <TouchableOpacity style={styles.eyeButton} onPress={() => setShowPassword(!showPassword)}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            {/* Password Strength Meter */}
            {password.length > 0 && (
              <View style={styles.strengthContainer}>
                <View style={styles.strengthBarContainer}>
                  <View style={[styles.strengthBar, { width: `${(passwordStrength / 4) * 100}%`, backgroundColor: getStrengthColor() }]} />
                </View>
                <Text style={[styles.strengthText, { color: getStrengthColor() }]}>
                  {getStrengthLabel()}
                </Text>
              </View>
            )}
            
            {touched.password && errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
            
            <View style={styles.passwordRequirements}>
              <Text style={styles.reqTitle}>La contraseña debe tener:</Text>
              <View style={styles.reqItem}>
                <Ionicons name={password.length >= 8 ? "checkmark-circle" : "ellipse-outline"} size={14} color={password.length >= 8 ? colors.status.success : "#9CA3AF"} />
                <Text style={[styles.reqText, password.length >= 8 && styles.reqTextActive]}>Mínimo 8 caracteres</Text>
              </View>
              <View style={styles.reqItem}>
                <Ionicons name={/[A-Z]/.test(password) ? "checkmark-circle" : "ellipse-outline"} size={14} color={/[A-Z]/.test(password) ? colors.status.success : "#9CA3AF"} />
                <Text style={[styles.reqText, /[A-Z]/.test(password) && styles.reqTextActive]}>Una mayúscula</Text>
              </View>
              <View style={styles.reqItem}>
                <Ionicons name={/[0-9]/.test(password) ? "checkmark-circle" : "ellipse-outline"} size={14} color={/[0-9]/.test(password) ? colors.status.success : "#9CA3AF"} />
                <Text style={[styles.reqText, /[0-9]/.test(password) && styles.reqTextActive]}>Un número</Text>
              </View>
            </View>

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
  container: { flex: 1, backgroundColor: '#fff' },
  content: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 },
  
  // Header & Progress
  header: { alignItems: 'center', marginBottom: 32 },
  backButton: { position: 'absolute', left: 0, top: 0, padding: 8, zIndex: 10 },
  
  progressContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 20, marginTop: 10 },
  progressDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#E5E7EB' },
  progressDotActive: { backgroundColor: colors.primary, transform: [{ scale: 1.2 }] },
  progressLine: { width: 30, height: 2, backgroundColor: '#E5E7EB', marginHorizontal: 4 },
  
  stepText: { color: colors.primary, fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  title: { fontSize: 28, fontWeight: '700', color: '#111827', textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#6B7280', marginTop: 4, textAlign: 'center' },

  // Form Container
  formContainer: {
    width: '100%',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 16,
    height: 56,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  inputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: -12,
    marginBottom: 12,
    marginLeft: 4,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: '100%',
    color: '#111827',
    fontSize: 16,
    fontWeight: '500',
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    height: '100%',
  },
  codeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    height: '100%',
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
  },
  codeText: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '600',
  },
  phoneInput: {
    paddingHorizontal: 15,
  },
  dateText: {
    textAlignVertical: 'center',
    color: '#111827',
    fontSize: 16,
  },
  placeholderText: {
    color: '#9CA3AF',
  },
  eyeButton: {
    padding: 8,
  },
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    marginTop: -8,
  },
  strengthBarContainer: {
    flex: 1,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    marginRight: 10,
    overflow: 'hidden',
  },
  strengthBar: {
    height: '100%',
    borderRadius: 2,
  },
  strengthText: {
    fontSize: 12,
    fontWeight: '600',
    width: 50,
    textAlign: 'right',
  },
  passwordRequirements: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  reqTitle: {
    fontSize: 13,
    color: '#4B5563',
    marginBottom: 8,
    fontWeight: '600',
  },
  reqItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  reqText: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  reqTextActive: {
    color: '#374151',
    fontWeight: '500',
  },
  button: {
    width: '100%',
    height: 56,
    backgroundColor: colors.primary,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    gap: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  linkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
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
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 16,
  },
  modalItemFlag: {
    fontSize: 28,
  },
  modalItemText: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  modalItemCode: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '600',
  },
  modalClose: {
    marginTop: 20,
    alignSelf: 'center',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  modalCloseText: {
    color: '#374151',
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
