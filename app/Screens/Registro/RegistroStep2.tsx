import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { httpsCallable } from 'firebase/functions';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
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
import { functions } from '../../../FirebaseConfig';
import { StepIndicator } from '../../components/StepIndicator';
import { colors } from '../../constants/colors';
import { RootStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'RegistroStep2'>;

export default function RegistroStep2({ route, navigation }: Props) {
  const userData = route.params;
  const [photoFront, setPhotoFront] = useState<string | null>(null);
  const [photoBack, setPhotoBack] = useState<string | null>(null);
  const [selfieWithLicense, setSelfieWithLicense] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Country Selection
  const [selectedCountry, setSelectedCountry] = useState('SV');
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  
  // Extracted Data State
  const [licenseNumber, setLicenseNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [showManualEntry, setShowManualEntry] = useState(false);
  
  // Validation State
  const [licenseError, setLicenseError] = useState('');
  const [expiryError, setExpiryError] = useState('');
  
  // Image Quality
  const [frontQualityScore, setFrontQualityScore] = useState(0);
  const [backQualityScore, setBackQualityScore] = useState(0);

  const COUNTRIES = [
    { code: 'SV', name: 'El Salvador', flag: '🇺🇻', format: '00000000-0 (DUI)', info: 'Tu DUI es tu número de licencia' },
    { code: 'GT', name: 'Guatemala', flag: '🇬🇹', format: 'A-00000000', info: null },
    { code: 'HN', name: 'Honduras', flag: '🇭🇳', format: '0000-0000-00000', info: null },
    { code: 'NI', name: 'Nicaragua', flag: '🇳🇮', format: '000-000000-0000A', info: null },
    { code: 'CR', name: 'Costa Rica', flag: '🇨🇷', format: '000000000', info: null },
    { code: 'PA', name: 'Panamá', flag: '🇵🇦', format: 'N-000-0000', info: null },
    { code: 'MX', name: 'México', flag: '🇲🇽', format: 'A00000000', info: null },
    { code: 'US', name: 'Estados Unidos', flag: '🇺🇸', format: 'Varies by state', info: null },
    { code: 'OTHER', name: 'Otro país', flag: '🌍', format: 'General', info: null },
  ];

  const validateLicenseNumber = (value: string) => {
    const cleaned = value.replace(/[^0-9A-Za-z]/g, '');
    if (!cleaned) {
      setLicenseError('Número de licencia requerido');
      return false;
    }
    
    // Validación específica para El Salvador (DUI)
    if (selectedCountry === 'SV') {
      if (cleaned.length !== 9) {
        setLicenseError('DUI incompleto (debe tener 9 dígitos)');
        return false;
      }
      if (!/^\d{9}$/.test(cleaned)) {
        setLicenseError('DUI debe contener solo números');
        return false;
      }
    } else if (cleaned.length < 5) {
      setLicenseError('Número muy corto');
      return false;
    }
    
    setLicenseError('');
    return true;
  };

  const validateExpiryDate = (value: string) => {
    if (!value || value.length < 7) {
      setExpiryError('Fecha de vencimiento requerida');
      return false;
    }
    
    const parts = value.split('/');
    if (parts.length !== 2) {
      setExpiryError('Formato inválido (MM/AAAA)');
      return false;
    }
    
    const month = parseInt(parts[0]);
    const year = parseInt(parts[1]);
    
    if (month < 1 || month > 12) {
      setExpiryError('Mes inválido');
      return false;
    }
    
    // Check if license is expired
    const expiryDateObj = new Date(year, month - 1, 1);
    const today = new Date();
    
    if (expiryDateObj < today) {
      setExpiryError('Licencia vencida');
      return false;
    }
    
    setExpiryError('');
    return true;
  };

  // Detección básica de calidad de imagen
  const analyzeImageQuality = async (uri: string): Promise<number> => {
    try {
      // Simulación de análisis de calidad (en producción usarías ML o APIs)
      // Factores: tamaño, formato, metadatos
      const response = await fetch(uri);
      const blob = await response.blob();
      
      let score = 100;
      
      // Penalizar imágenes muy pequeñas (posible screenshot)
      if (blob.size < 50000) score -= 30; // menor a 50KB
      
      // Penalizar imágenes muy grandes sin comprimir (posible captura de pantalla)
      if (blob.size > 5000000) score -= 20; // mayor a 5MB
      
      return Math.max(0, score);
    } catch {
      return 50; // Score neutral si no se puede analizar
    }
  };

  const requestPermissions = async (type: 'camera' | 'library') => {
    if (type === 'camera') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permisos requeridos', 'Necesitamos acceso a la cámara para continuar.');
        return false;
      }
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permisos requeridos', 'Necesitamos acceso a tu galería para continuar.');
        return false;
      }
    }
    return true;
  };

  const processLicense = async (base64Image: string) => {
    setIsProcessing(true);
    try {
        const detectLicense = httpsCallable(functions, 'detectLicense');
        const result = await detectLicense({ image: base64Image });
        const data = result.data as any;
        
        if (data.licenseNumber) setLicenseNumber(data.licenseNumber);
        if (data.expiryDate) setExpiryDate(data.expiryDate);
        
        setShowManualEntry(true);
        Alert.alert('Licencia Detectada', 'Hemos extraído los datos de tu licencia. Por favor verifícalos.');
    } catch (error: any) {
        console.log('OCR Error (Ignored):', error.message);
        // Si la función no existe (not-found) o falla, simplemente mostramos el formulario manual
        // sin alertar al usuario, para una experiencia fluida.
        setShowManualEntry(true);
    } finally {
        setIsProcessing(false);
    }
  };

  const pickImage = async (source: 'camera' | 'library', side: 'front' | 'back') => {
    const hasPermission = await requestPermissions(source);
    if (!hasPermission) return;

    setIsCapturing(true);
    const options: ImagePicker.ImagePickerOptions = {
      allowsEditing: true,
      aspect: [3, 2],
      quality: 0.8,
      base64: true,
    };

    try {
      const result =
        source === 'camera'
          ? await ImagePicker.launchCameraAsync(options)
          : await ImagePicker.launchImageLibraryAsync({
              ...options,
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
            });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        let finalUri = asset.uri;
        let finalBase64 = asset.base64;

        // Compress if needed (though launchCameraAsync quality handles this mostly)
        // If we need to resize, we use manipulateAsync
        const compressed = await manipulateAsync(
            asset.uri,
            [{ resize: { width: 1024 } }],
            { compress: 0.7, format: SaveFormat.JPEG, base64: true }
        );
        finalUri = compressed.uri;
        finalBase64 = compressed.base64;

        // Analizar calidad de la imagen
        const qualityScore = await analyzeImageQuality(finalUri);

        if (side === 'front') {
            setPhotoFront(finalUri);
            setFrontQualityScore(qualityScore);
            if (qualityScore < 50) {
              Alert.alert(
                'Calidad Baja', 
                'La imagen podría tener baja calidad. Asegúrate de que sea clara y legible.',
                [
                  { text: 'Reintentar', onPress: () => { setPhotoFront(null); } },
                  { text: 'Continuar', style: 'cancel' }
                ]
              );
            }
            if (finalBase64) {
                processLicense(finalBase64);
            }
        } else {
            setPhotoBack(finalUri);
            setBackQualityScore(qualityScore);
            if (qualityScore < 50) {
              Alert.alert(
                'Calidad Baja',
                'La imagen podría tener baja calidad. Asegúrate de que sea clara y legible.',
                [
                  { text: 'Reintentar', onPress: () => { setPhotoBack(null); } },
                  { text: 'Continuar', style: 'cancel' }
                ]
              );
            }
        }
      }
    } catch (e) {
        console.error(e);
        Alert.alert('Error', 'Hubo un problema al procesar la imagen.');
    } finally {
      setIsCapturing(false);
    }
  };

  const handleContinue = () => {
    if (!photoFront || !photoBack) {
      Alert.alert('Faltan fotos', 'Por favor toma fotos de ambos lados de tu licencia.');
      return;
    }
    
    if (!selfieWithLicense) {
      Alert.alert('Selfie requerida', 'Por favor toma una selfie sosteniendo tu licencia para verificar tu identidad.');
      return;
    }
    
    // Verificar calidad mínima
    if (frontQualityScore < 40 || backQualityScore < 40) {
      Alert.alert(
        'Calidad insuficiente',
        'Las fotos de tu licencia tienen baja calidad. Por favor vuelve a tomarlas con mejor iluminación.',
        [
          { text: 'Reintentar', onPress: () => { setPhotoFront(null); setPhotoBack(null); } },
          { text: 'Continuar de todos modos', style: 'cancel', onPress: () => proceedToNextStep() }
        ]
      );
      return;
    }
    
    proceedToNextStep();
  };
  
  const proceedToNextStep = () => {
    const isLicenseValid = validateLicenseNumber(licenseNumber);
    const isExpiryValid = validateExpiryDate(expiryDate);
    
    if (!isLicenseValid || !isExpiryValid) {
      Alert.alert('Datos incompletos', 'Por favor verifica los datos de tu licencia.');
      return;
    }

    // Navigate to next step
    navigation.navigate('RegistroStep3', {
      ...userData,
      licenseCountry: selectedCountry,
      licensePhotos: {
        front: photoFront,
        back: photoBack,
        selfie: selfieWithLicense,
      },
      licenseData: {
        number: licenseNumber,
        expiry: expiryDate,
        country: selectedCountry,
      },
      qualityScores: {
        front: frontQualityScore,
        back: backQualityScore,
      }
    } as any);
  };

  const showImageOptions = (side: 'front' | 'back' | 'selfie') => {
    if (side === 'selfie') {
      Alert.alert('Selfie con Licencia', '¿Cómo deseas tomar la foto?', [
        { text: 'Cámara', onPress: () => pickSelfie('camera') },
        { text: 'Galería', onPress: () => pickSelfie('library') },
        { text: 'Cancelar', style: 'cancel' },
      ]);
    } else {
      const sideText = side === 'front' ? 'frente' : 'reverso';
      Alert.alert(`Licencia - ${sideText}`, '¿Cómo deseas agregar la foto?', [
        { text: 'Cámara', onPress: () => pickImage('camera', side) },
        { text: 'Galería', onPress: () => pickImage('library', side) },
        { text: 'Cancelar', style: 'cancel' },
      ]);
    }
  };
  
  const pickSelfie = async (source: 'camera' | 'library') => {
    const hasPermission = await requestPermissions(source);
    if (!hasPermission) return;

    setIsCapturing(true);
    const options: ImagePicker.ImagePickerOptions = {
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
      cameraType: ImagePicker.CameraType.front,
    };

    try {
      const result = source === 'camera'
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync({
            ...options,
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
          });

      if (!result.canceled && result.assets[0]) {
        const compressed = await manipulateAsync(
          result.assets[0].uri,
          [{ resize: { width: 800 } }],
          { compress: 0.7, format: SaveFormat.JPEG }
        );
        setSelfieWithLicense(compressed.uri);
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Hubo un problema al procesar la imagen.');
    } finally {
      setIsCapturing(false);
    }
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
            <Text style={styles.headerTitle}>Verificar Licencia</Text>
            <Text style={styles.headerSubtitle}>Paso 2 de 3</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <StepIndicator currentStep={2} totalSteps={3} labels={['Datos', 'Licencia', 'Rol']} />

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <View style={styles.titleContainer}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={styles.title}>Escanea tu Licencia</Text>
              <View style={{ backgroundColor: '#EFF6FF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: colors.primary }}>
                  ~2 min
                </Text>
              </View>
            </View>
            <Text style={styles.subtitle}>
              Toma una foto clara del frente y reverso de tu licencia de conducir.
            </Text>
            
            {/* Instrucciones / Tips */}
            <View style={{ marginTop: 20, backgroundColor: '#EFF6FF', padding: 16, borderRadius: 12, borderLeftWidth: 4, borderLeftColor: colors.primary }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                    <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', marginRight: 10 }}>
                        <Ionicons name="bulb" size={18} color="white" />
                    </View>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: '#1E3A8A', flex: 1 }}>
                        Consejos para una buena foto:
                    </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6, paddingLeft: 8 }}>
                    <Ionicons name="sunny-outline" size={16} color="#3B82F6" style={{ marginRight: 10 }} />
                    <Text style={{ fontSize: 13, color: '#1E40AF', flex: 1 }}>Busca un lugar con buena iluminación</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6, paddingLeft: 8 }}>
                    <Ionicons name="scan-outline" size={16} color="#3B82F6" style={{ marginRight: 10 }} />
                    <Text style={{ fontSize: 13, color: '#1E40AF', flex: 1 }}>Evita reflejos sobre el texto</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', paddingLeft: 8 }}>
                    <Ionicons name="text-outline" size={16} color="#3B82F6" style={{ marginRight: 10 }} />
                    <Text style={{ fontSize: 13, color: '#1E40AF', flex: 1 }}>Asegura que los datos sean legibles</Text>
                </View>
            </View>
          </View>

          {/* Formulario */}
          <View style={styles.formContainer}>
            
            {/* Selector de País */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>País Emisor de la Licencia</Text>
              <TouchableOpacity
                style={styles.countrySelector}
                onPress={() => setShowCountryPicker(true)}
              >
                <Text style={{ fontSize: 24, marginRight: 10 }}>
                  {COUNTRIES.find(c => c.code === selectedCountry)?.flag}
                </Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: '#1F2937' }}>
                    {COUNTRIES.find(c => c.code === selectedCountry)?.name}
                  </Text>
                  <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
                    Formato: {COUNTRIES.find(c => c.code === selectedCountry)?.format}
                  </Text>
                </View>
                <Ionicons name="chevron-down" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            {/* Frente de la licencia */}
            <View style={styles.photoSection}>
              <Text style={styles.photoLabel}>Frente de la Licencia</Text>
              {photoFront ? (
                <View style={styles.photoPreviewContainer}>
                  <Image source={{ uri: photoFront }} style={styles.photoPreview} />
                  <View style={styles.photoOverlay}>
                    <View style={styles.successBadge}>
                      <Ionicons name="checkmark-circle" size={20} color="#fff" />
                      <Text style={styles.successText}>Listo</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.retakeButton}
                      onPress={() => showImageOptions('front')}
                    >
                      <Ionicons name="refresh" size={20} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.addPhotoButton}
                  onPress={() => showImageOptions('front')}
                  disabled={isCapturing}
                >
                  {isProcessing ? (
                      <ActivityIndicator size="large" color={colors.primary} />
                  ) : (
                    <>
                        <View style={styles.addPhotoIconContainer}>
                            <Ionicons name="camera" size={32} color={colors.primary} />
                        </View>
                        <Text style={styles.addPhotoText}>Tomar foto del frente</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>

            {/* Reverso de la licencia */}
            <View style={styles.photoSection}>
              <Text style={styles.photoLabel}>Reverso de la Licencia</Text>
              {photoBack ? (
                <View style={styles.photoPreviewContainer}>
                  <Image source={{ uri: photoBack }} style={styles.photoPreview} />
                  <View style={styles.photoOverlay}>
                    <View style={styles.successBadge}>
                      <Ionicons name="checkmark-circle" size={20} color="#fff" />
                      <Text style={styles.successText}>Listo</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.retakeButton}
                      onPress={() => showImageOptions('back')}
                    >
                      <Ionicons name="refresh" size={20} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.addPhotoButton, !photoFront && styles.addPhotoButtonDisabled]}
                  onPress={() => showImageOptions('back')}
                  disabled={isCapturing || !photoFront}
                >
                  <View style={[styles.addPhotoIconContainer, !photoFront && styles.iconDisabled]}>
                    <Ionicons 
                      name="camera" 
                      size={32} 
                      color={!photoFront ? '#BDBDBD' : colors.primary} 
                    />
                  </View>
                  <Text style={[styles.addPhotoText, !photoFront && styles.addPhotoTextDisabled]}>
                    Tomar foto del reverso
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Selfie con Licencia */}
            <View style={styles.photoSection}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <Text style={styles.photoLabel}>Selfie con tu Licencia</Text>
                <View style={{ backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginLeft: 10 }}>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: '#92400E' }}>Requerido</Text>
                </View>
              </View>
              
              <View style={{ backgroundColor: '#FFFBEB', padding: 12, borderRadius: 12, marginBottom: 12, borderLeftWidth: 3, borderLeftColor: '#F59E0B' }}>
                <Text style={{ fontSize: 13, color: '#92400E', lineHeight: 18 }}>
                  <Ionicons name="shield-checkmark" size={14} color="#F59E0B" /> Toma una foto de tu rostro sosteniendo tu licencia al lado. Asegúrate de que ambos sean visibles y claros.
                </Text>
              </View>
              
              {selfieWithLicense ? (
                <View style={styles.photoPreviewContainer}>
                  <Image source={{ uri: selfieWithLicense }} style={styles.photoPreview} />
                  <View style={styles.photoOverlay}>
                    <View style={styles.successBadge}>
                      <Ionicons name="checkmark-circle" size={20} color="#fff" />
                      <Text style={styles.successText}>Listo</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.retakeButton}
                      onPress={() => showImageOptions('selfie')}
                    >
                      <Ionicons name="refresh" size={20} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.addPhotoButton, (!photoFront || !photoBack) && styles.addPhotoButtonDisabled]}
                  onPress={() => showImageOptions('selfie')}
                  disabled={isCapturing || !photoFront || !photoBack}
                >
                  <View style={[styles.addPhotoIconContainer, (!photoFront || !photoBack) && styles.iconDisabled]}>
                    <Ionicons 
                      name="person" 
                      size={32} 
                      color={(!photoFront || !photoBack) ? '#BDBDBD' : colors.primary} 
                    />
                  </View>
                  <Text style={[styles.addPhotoText, (!photoFront || !photoBack) && styles.addPhotoTextDisabled]}>
                    Tomar selfie con licencia
                  </Text>
                  {(!photoFront || !photoBack) && (
                    <Text style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>
                      Primero completa fotos de la licencia
                    </Text>
                  )}
                </TouchableOpacity>
              )}
            </View>

            {/* Extracted Data Form */}
            {(showManualEntry || photoFront) && (
                <View style={styles.extractedDataContainer}>
                    <Text style={styles.sectionTitle}>Datos de la Licencia</Text>
                    
                    {selectedCountry === 'SV' && (
                      <View style={{ backgroundColor: '#EFF6FF', padding: 12, borderRadius: 12, marginBottom: 16, borderLeftWidth: 3, borderLeftColor: colors.primary }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Ionicons name="information-circle" size={16} color={colors.primary} />
                          <Text style={{ fontSize: 13, color: '#1E40AF', marginLeft: 6, fontWeight: '600' }}>
                            Para salvadoreños:
                          </Text>
                        </View>
                        <Text style={{ fontSize: 12, color: '#1E40AF', marginTop: 4, lineHeight: 18 }}>
                          Tu número de licencia es el mismo que tu DUI (Documento Único de Identidad). Ingresa tu DUI completo.
                        </Text>
                      </View>
                    )}
                    
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>
                          {selectedCountry === 'SV' ? 'Número de DUI / Licencia' : 'Número de Licencia'}
                        </Text>
                        <View style={[styles.inputWrapper, licenseError ? styles.inputError : null]}>
                            <Ionicons name="card-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder={COUNTRIES.find(c => c.code === selectedCountry)?.format || '00000000'}
                                value={licenseNumber}
                                onChangeText={(text) => {
                                  let formatted = text;
                                  
                                  // Auto-formato para DUI salvadoreño
                                  if (selectedCountry === 'SV') {
                                    const cleaned = text.replace(/[^0-9]/g, '');
                                    if (cleaned.length <= 9) {
                                      if (cleaned.length > 8) {
                                        formatted = cleaned.slice(0, 8) + '-' + cleaned.slice(8);
                                      } else {
                                        formatted = cleaned;
                                      }
                                    } else {
                                      formatted = licenseNumber; // No permitir más de 9 dígitos
                                    }
                                  } else {
                                    formatted = text.replace(/[^0-9A-Za-z-]/g, '');
                                  }
                                  
                                  setLicenseNumber(formatted);
                                  if (licenseError) validateLicenseNumber(formatted);
                                }}
                                onBlur={() => validateLicenseNumber(licenseNumber)}
                                placeholderTextColor="#9CA3AF"
                                maxLength={selectedCountry === 'SV' ? 10 : 25}
                                keyboardType={selectedCountry === 'SV' ? 'number-pad' : 'default'}
                            />
                            {!licenseError && licenseNumber.replace(/[^0-9]/g, '').length >= (selectedCountry === 'SV' ? 9 : 5) && (
                              <Ionicons name="checkmark-circle" size={20} color={colors.status.success} />
                            )}
                        </View>
                        {licenseError && <Text style={styles.errorText}>{licenseError}</Text>}
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Fecha de Vencimiento</Text>
                        <View style={[styles.inputWrapper, expiryError ? styles.inputError : null]}>
                            <Ionicons name="calendar-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="MM/AAAA"
                                value={expiryDate}
                                onChangeText={(text) => {
                                    // Auto-format MM/YYYY
                                    const cleaned = text.replace(/[^0-9]/g, '');
                                    if (cleaned.length <= 6) {
                                      if (cleaned.length > 2) {
                                        setExpiryDate(cleaned.slice(0, 2) + '/' + cleaned.slice(2));
                                      } else {
                                        setExpiryDate(cleaned);
                                      }
                                    }
                                    if (expiryError) validateExpiryDate(text);
                                }}
                                onBlur={() => validateExpiryDate(expiryDate)}
                                maxLength={7}
                                keyboardType="number-pad"
                                placeholderTextColor="#9CA3AF"
                            />
                            {!expiryError && expiryDate.length === 7 && (
                              <Ionicons name="checkmark-circle" size={20} color={colors.status.success} />
                            )}
                        </View>
                        {expiryError ? (
                          <Text style={styles.errorText}>{expiryError}</Text>
                        ) : expiryDate.length === 7 && (
                          <Text style={{ fontSize: 12, color: colors.status.success, marginTop: 4, marginLeft: 4 }}>
                            ✓ Licencia válida
                          </Text>
                        )}
                    </View>
                </View>
            )}

          </View>
          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
            style={[styles.nextButton, (!photoFront || !photoBack || !licenseNumber) && { opacity: 0.7 }]}
            onPress={handleContinue}
            disabled={!photoFront || !photoBack || !licenseNumber}
        >
            <Text style={styles.nextButtonText}>Continuar</Text>
            <Ionicons name="arrow-forward" size={20} color="white" />
        </TouchableOpacity>
      </View>
      
      {/* Country Picker Modal */}
      <Modal
        visible={showCountryPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCountryPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecciona el país emisor</Text>
              <TouchableOpacity onPress={() => setShowCountryPicker(false)}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {COUNTRIES.map((country) => (
                <TouchableOpacity
                  key={country.code}
                  style={styles.countryItem}
                  onPress={() => {
                    setSelectedCountry(country.code);
                    setShowCountryPicker(false);
                  }}
                >
                  <Text style={{ fontSize: 28, marginRight: 12 }}>{country.flag}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, color: '#374151', fontWeight: '600' }}>{country.name}</Text>
                    <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>Formato: {country.format}</Text>
                  </View>
                  {selectedCountry === country.code && (
                    <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  content: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  
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
  backButton: { padding: 8, marginLeft: -8 },
  headerCenter: { alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#032B3C' },
  headerSubtitle: { fontSize: 12, color: '#6B7280' },

  titleContainer: { padding: 24, paddingBottom: 0 },
  title: { fontSize: 28, fontWeight: '800', color: '#032B3C', marginBottom: 12, letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: '#6B7280', lineHeight: 22 },

  formContainer: { padding: 24 },
  
  photoSection: { marginBottom: 24 },
  photoLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 12 },
  
  addPhotoButton: {
    height: 180,
    backgroundColor: '#FAFAFA',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  addPhotoButtonDisabled: { backgroundColor: '#F3F4F6', borderColor: '#E5E7EB' },
  addPhotoIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  iconDisabled: { backgroundColor: '#E5E7EB' },
  addPhotoText: { fontSize: 16, fontWeight: '600', color: '#032B3C' },
  addPhotoTextDisabled: { color: '#9CA3AF' },
  
  photoPreviewContainer: {
    height: 220,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#000',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  photoPreview: { width: '100%', height: '100%', resizeMode: 'cover', opacity: 0.8 },
  photoOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
  },
  successText: { color: 'white', fontWeight: '700', marginLeft: 8 },
  retakeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  extractedDataContainer: {
    marginTop: 16,
    padding: 24,
    backgroundColor: 'white',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#032B3C', marginBottom: 16 },
  
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },  inputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
    borderWidth: 2,
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
    marginLeft: 4,
  },  inputWrapper: {
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
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, color: '#1F2937' },

  footer: {
    padding: 24,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  nextButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
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
  nextButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
    marginRight: 8,
  },
  
  countrySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
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
