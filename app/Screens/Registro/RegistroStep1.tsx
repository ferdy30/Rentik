import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Keyboard,
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
import { StepIndicator } from '../../components/StepIndicator';
import { colors } from '../../constants/colors';
import { RootStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'RegistroStep1'>;

// Paso 1: Información Personal
export default function RegistroStep1({ navigation }: Props) {
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [countryCode, setCountryCode] = useState('+503');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [birthday, setBirthday] = useState<Date | null>(null);
  const [showCodePicker, setShowCodePicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Phone Verification State
  const [verificationCode, setVerificationCode] = useState('');
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  
  // Validation State
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [passwordStrength, setPasswordStrength] = useState(0);

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

  useEffect(() => {
    if (touched.nombre) validateField('nombre', nombre);
  }, [nombre, touched.nombre]);

  useEffect(() => {
    if (touched.apellido) validateField('apellido', apellido);
  }, [apellido, touched.apellido]);

  useEffect(() => {
    if (touched.email) validateField('email', email);
  }, [email, touched.email]);

  useEffect(() => {
    validateField('password', password);
    calculatePasswordStrength(password);
  }, [password]);

  useEffect(() => {
    if (touched.phoneNumber) validateField('phoneNumber', phoneNumber);
  }, [phoneNumber, touched.phoneNumber]);

  useEffect(() => {
    if (birthday) validateField('birthday', birthday);
  }, [birthday]);

  const calculatePasswordStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[a-z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
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
    switch(field) {
        case 'nombre': validateField('nombre', nombre); break;
        case 'apellido': validateField('apellido', apellido); break;
        case 'email': validateField('email', email); break;
        case 'phoneNumber': validateField('phoneNumber', phoneNumber); break;
    }
  };

  const sendVerificationCode = async () => {
    if (!phoneNumber || phoneNumber.length < 8) {
        Alert.alert('Error', 'Ingresa un número válido');
        return;
    }
    setIsVerifying(true);
    // Simulate API call
    setTimeout(() => {
        setIsVerifying(false);
        setShowVerifyModal(true);
        Alert.alert('Código enviado', 'Tu código de verificación es 123456 (Simulado)');
    }, 1500);
  };

  const confirmVerificationCode = () => {
    if (verificationCode === '123456') {
        setPhoneVerified(true);
        setShowVerifyModal(false);
        Alert.alert('Éxito', 'Teléfono verificado correctamente');
    } else {
        Alert.alert('Error', 'Código incorrecto');
    }
  };

  const handleContinue = () => {
    setTouched({
      nombre: true,
      apellido: true,
      email: true,
      password: true,
      phoneNumber: true,
      birthday: true,
    });

    const e1 = validateField('nombre', nombre);
    const e2 = validateField('apellido', apellido);
    const e3 = validateField('email', email);
    const e4 = validateField('password', password);
    const e5 = validateField('phoneNumber', phoneNumber);
    const e6 = validateField('birthday', birthday);

    if (e1 || e2 || e3 || e4 || e5 || e6) {
      return;
    }

    if (!phoneVerified) {
        Alert.alert('Verificación requerida', 'Por favor verifica tu número de teléfono para continuar.');
        return;
    }

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
    if (passwordStrength <= 1) return '#EF4444';
    if (passwordStrength === 2) return '#F59E0B';
    if (passwordStrength === 3) return '#10B981';
    return '#059669';
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
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#032B3C" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Crear Cuenta</Text>
            <Text style={styles.headerSubtitle}>Paso 1 de 3</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <StepIndicator currentStep={1} totalSteps={3} labels={['Datos', 'Licencia', 'Rol']} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.titleContainer}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={styles.title}>Información Personal</Text>
              <View style={{ backgroundColor: '#EFF6FF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: colors.primary }}>
                  ~3 min
                </Text>
              </View>
            </View>
            <Text style={styles.subtitle}>
              Necesitamos tus datos para verificar tu identidad y mantener la seguridad de la comunidad.
            </Text>
          </View>

          {/* Formulario */}
          <View style={styles.formContainer}>
            {/* Nombre */}
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Nombre</Text>
                <View style={[styles.inputWrapper, touched.nombre && errors.nombre ? styles.inputError : null]}>
                <Ionicons name="person-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                <TextInput
                    style={styles.input}
                    placeholder="Tu nombre"
                    placeholderTextColor="#9CA3AF"
                    value={nombre}
                    onChangeText={setNombre}
                    onBlur={() => handleBlur('nombre')}
                />
                {touched.nombre && !errors.nombre && nombre.length > 0 && <Ionicons name="checkmark-circle" size={20} color={colors.status.success} />}
                </View>
                {touched.nombre && errors.nombre && <Text style={styles.errorText}>{errors.nombre}</Text>}
            </View>

            {/* Apellido */}
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Apellido</Text>
                <View style={[styles.inputWrapper, touched.apellido && errors.apellido ? styles.inputError : null]}>
                <Ionicons name="person-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                <TextInput
                    style={styles.input}
                    placeholder="Tu apellido"
                    placeholderTextColor="#9CA3AF"
                    value={apellido}
                    onChangeText={setApellido}
                    onBlur={() => handleBlur('apellido')}
                />
                {touched.apellido && !errors.apellido && apellido.length > 0 && <Ionicons name="checkmark-circle" size={20} color={colors.status.success} />}
                </View>
                {touched.apellido && errors.apellido && <Text style={styles.errorText}>{errors.apellido}</Text>}
            </View>

            {/* Correo */}
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Correo Electrónico</Text>
                <View style={[styles.inputWrapper, touched.email && errors.email ? styles.inputError : null]}>
                <Ionicons name="mail-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                <TextInput
                    style={styles.input}
                    placeholder="ejemplo@correo.com"
                    placeholderTextColor="#9CA3AF"
                    value={email}
                    onChangeText={setEmail}
                    onBlur={() => handleBlur('email')}
                    keyboardType="email-address"
                    autoCapitalize="none"
                />
                {touched.email && !errors.email && email.length > 0 && <Ionicons name="checkmark-circle" size={20} color={colors.status.success} />}
                </View>
                {touched.email && errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
            </View>

            {/* Teléfono con Verificación */}
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Teléfono Móvil</Text>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                    <TouchableOpacity 
                        style={[styles.inputWrapper, { width: 100, marginRight: 8, justifyContent: 'center' }]}
                        onPress={() => setShowCodePicker(true)}
                    >
                        <Text style={{ fontSize: 24, marginRight: 4 }}>
                            {COUNTRY_CODES.find(c => c.code === countryCode)?.flag}
                        </Text>
                        <Text style={{ fontSize: 16, color: '#374151', fontWeight: '600' }}>{countryCode}</Text>
                        <Ionicons name="chevron-down" size={16} color="#6B7280" style={{ marginLeft: 4 }} />
                    </TouchableOpacity>
                    
                    <View style={{ flex: 1 }}>
                        <View style={[styles.inputWrapper, touched.phoneNumber && errors.phoneNumber ? styles.inputError : null]}>
                            <TextInput
                                style={styles.input}
                                placeholder="0000-0000"
                                placeholderTextColor="#9CA3AF"
                                value={phoneNumber}
                                onChangeText={(text) => {
                                  // Auto-format phone number with dash
                                  const cleaned = text.replace(/[^0-9]/g, '');
                                  if (cleaned.length <= 8) {
                                    if (cleaned.length > 4) {
                                      setPhoneNumber(cleaned.slice(0, 4) + '-' + cleaned.slice(4));
                                    } else {
                                      setPhoneNumber(cleaned);
                                    }
                                  }
                                }}
                                onBlur={() => handleBlur('phoneNumber')}
                                keyboardType="phone-pad"
                                maxLength={9}
                            />
                            {phoneVerified ? (
                                <Ionicons name="checkmark-circle" size={20} color={colors.status.success} />
                            ) : (
                                <TouchableOpacity 
                                    onPress={sendVerificationCode}
                                    disabled={isVerifying || phoneNumber.length < 8}
                                >
                                    {isVerifying ? (
                                        <ActivityIndicator size="small" color={colors.primary} />
                                    ) : (
                                        <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 12 }}>Verificar</Text>
                                    )}
                                </TouchableOpacity>
                            )}
                        </View>
                        {touched.phoneNumber && errors.phoneNumber && <Text style={styles.errorText}>{errors.phoneNumber}</Text>}
                    </View>
                </View>
            </View>

            {/* Fecha de Nacimiento */}
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Fecha de Nacimiento</Text>
                <TouchableOpacity
                    style={[styles.inputWrapper, touched.birthday && errors.birthday ? styles.inputError : null]}
                    onPress={() => setShowDatePicker(true)}
                >
                    <Ionicons name="calendar-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                    {birthday ? (
                      <View style={{ flex: 1, justifyContent: 'center' }}>
                        <Text style={[styles.input, { color: '#1F2937', marginBottom: 0 }]}>
                            {birthday.toLocaleDateString('es-SV', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </Text>
                        <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
                          {new Date().getFullYear() - birthday.getFullYear()} años
                        </Text>
                      </View>
                    ) : (
                      <Text style={[styles.input, { color: '#9CA3AF', textAlignVertical: 'center' }]}>
                        Selecciona tu fecha de nacimiento
                      </Text>
                    )}
                    {touched.birthday && !errors.birthday && birthday && <Ionicons name="checkmark-circle" size={20} color={colors.status.success} />}
                </TouchableOpacity>
                {touched.birthday && errors.birthday && <Text style={styles.errorText}>{errors.birthday}</Text>}
            </View>

            {/* Contraseña */}
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Contraseña</Text>
                <View style={[styles.inputWrapper, touched.password && errors.password ? styles.inputError : null]}>
                <Ionicons name="lock-closed-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                <TextInput
                    style={styles.input}
                    placeholder="Mínimo 8 caracteres"
                    placeholderTextColor="#9CA3AF"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#6B7280" />
                </TouchableOpacity>
                </View>
                
                {/* Password Strength Indicator */}
                {password.length > 0 && (
                    <View style={{ marginTop: 8 }}>
                        <View style={{ flexDirection: 'row', height: 4, borderRadius: 2, backgroundColor: '#E5E7EB', overflow: 'hidden' }}>
                            <View style={{ flex: 1, backgroundColor: passwordStrength >= 1 ? getStrengthColor() : 'transparent' }} />
                            <View style={{ width: 2, backgroundColor: 'white' }} />
                            <View style={{ flex: 1, backgroundColor: passwordStrength >= 2 ? getStrengthColor() : 'transparent' }} />
                            <View style={{ width: 2, backgroundColor: 'white' }} />
                            <View style={{ flex: 1, backgroundColor: passwordStrength >= 3 ? getStrengthColor() : 'transparent' }} />
                            <View style={{ width: 2, backgroundColor: 'white' }} />
                            <View style={{ flex: 1, backgroundColor: passwordStrength >= 4 ? getStrengthColor() : 'transparent' }} />
                        </View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                          <Text style={{ fontSize: 12, color: getStrengthColor(), fontWeight: '600' }}>
                              {getStrengthLabel()}
                          </Text>
                          {passwordStrength < 3 && (
                            <Text style={{ fontSize: 11, color: '#6B7280' }}>
                              {!/[A-Z]/.test(password) && 'A-Z '}
                              {!/[a-z]/.test(password) && 'a-z '}
                              {!/[0-9]/.test(password) && '0-9 '}
                              {!/[^A-Za-z0-9]/.test(password) && '@#$'}
                            </Text>
                          )}
                        </View>
                    </View>
                )}
                {touched.password && errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
            </View>

          </View>
          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
            style={[styles.nextButton, (!phoneVerified && phoneNumber.length > 0) && { opacity: 0.7 }]}
            onPress={handleContinue}
        >
            <Text style={styles.nextButtonText}>Continuar</Text>
            <Ionicons name="arrow-forward" size={20} color="white" />
        </TouchableOpacity>
      </View>

      {/* Country Code Picker Modal */}
      <Modal
        visible={showCodePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCodePicker(false)}
      >
        <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Selecciona tu país</Text>
                    <TouchableOpacity onPress={() => setShowCodePicker(false)}>
                        <Ionicons name="close" size={24} color="#374151" />
                    </TouchableOpacity>
                </View>
                <ScrollView>
                    {COUNTRY_CODES.map((country) => (
                        <TouchableOpacity
                            key={country.code}
                            style={styles.countryItem}
                            onPress={() => {
                                setCountryCode(country.code);
                                setShowCodePicker(false);
                            }}
                        >
                            <Text style={{ fontSize: 24, marginRight: 12 }}>{country.flag}</Text>
                            <Text style={{ fontSize: 16, color: '#374151', flex: 1 }}>{country.name}</Text>
                            <Text style={{ fontSize: 16, color: '#6B7280', fontWeight: '600' }}>{country.code}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>
        </View>
      </Modal>

      {/* Verification Code Modal */}
      <Modal
        visible={showVerifyModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowVerifyModal(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <TouchableOpacity 
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={() => Keyboard.dismiss()}
          >
              <TouchableOpacity 
                  style={[styles.modalContent, { padding: 24 }]}
                  activeOpacity={1}
              >
                  <Text style={{ fontSize: 20, fontWeight: '700', color: '#032B3C', marginBottom: 8, textAlign: 'center' }}>
                      Verifica tu teléfono
                  </Text>
                  <Text style={{ fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 24 }}>
                      Ingresa el código de 6 dígitos enviado a {countryCode} {phoneNumber}
                  </Text>
                  
                  <TextInput
                      style={{ 
                          width: '100%',
                          textAlign: 'center', 
                          fontSize: 32, 
                          letterSpacing: 8, 
                          marginBottom: 24, 
                          borderBottomWidth: 2, 
                          borderColor: colors.primary,
                          color: '#032B3C',
                          backgroundColor: '#F3F4F6',
                          height: 80,
                          borderRadius: 12,
                          paddingHorizontal: 10
                      }}
                      placeholder="000000"
                      placeholderTextColor="#9CA3AF"
                      value={verificationCode}
                      onChangeText={setVerificationCode}
                      keyboardType="number-pad"
                      maxLength={6}
                      autoFocus
                      returnKeyType="done"
                      onSubmitEditing={() => {
                          Keyboard.dismiss();
                          if (verificationCode.length === 6) {
                              confirmVerificationCode();
                          }
                      }}
                      blurOnSubmit={true}
                  />

                  <TouchableOpacity
                      style={[styles.nextButton, { width: '100%' }]}
                      onPress={confirmVerificationCode}
                  >
                      <Text style={styles.nextButtonText}>Verificar</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                      style={{ marginTop: 16, alignSelf: 'center' }}
                      onPress={() => setShowVerifyModal(false)}
                  >
                      <Text style={{ color: '#6B7280' }}>Cancelar</Text>
                  </TouchableOpacity>
              </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>

      {/* Date Picker Modal - Mejor UX para iOS */}
      <Modal
        visible={showDatePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: Platform.OS === 'ios' ? 40 : 20 }]}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                <Text style={{ color: '#6B7280', fontSize: 16 }}>Cancelar</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Fecha de Nacimiento</Text>
              <TouchableOpacity onPress={() => {
                if (birthday) {
                  const age = new Date().getFullYear() - birthday.getFullYear();
                  if (age < 18) {
                    Alert.alert('Edad mínima', 'Debes tener al menos 18 años para registrarte.');
                    return;
                  }
                }
                setShowDatePicker(false);
              }}>
                <Text style={{ color: colors.primary, fontSize: 16, fontWeight: '600' }}>Listo</Text>
              </TouchableOpacity>
            </View>
            
            {birthday && (
              <View style={{ padding: 16, backgroundColor: '#F0F9FF', marginHorizontal: 20, borderRadius: 12, marginBottom: 10 }}>
                <Text style={{ fontSize: 14, color: '#1E40AF', textAlign: 'center' }}>
                  Edad: {new Date().getFullYear() - birthday.getFullYear()} años
                </Text>
              </View>
            )}
            
            <DateTimePicker
              value={birthday || new Date(2000, 0, 1)}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              maximumDate={new Date()}
              minimumDate={new Date(1940, 0, 1)}
              onChange={(event, selectedDate) => {
                if (selectedDate) {
                  setBirthday(selectedDate);
                }
              }}
              textColor="#1F2937"
              style={{ height: 200 }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: 20,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#032B3C',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  content: {
    flex: 1,
  },
  titleContainer: {
    padding: 24,
    paddingBottom: 0,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#032B3C',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    lineHeight: 22,
  },
  formContainer: {
    padding: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 54,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  inputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
    borderWidth: 2,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
    marginLeft: 4,
  },
  footer: {
    padding: 24,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  nextButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  nextButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
    marginRight: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#032B3C',
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
});
