import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Modal,
    ScrollView,
    StatusBar,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { EmptyPhotoIllustration } from '../../../components/Illustrations';
import { PhotoGalleryModal } from '../../../components/PhotoGalleryModal';
import { PhotoTips } from '../../../components/PhotoTips';
import { StepIndicator } from '../../../components/StepIndicator';
import type { ArrendadorStackParamList } from '../../../navigation/ArrendadorStack';
import { styles } from './styles';

type NavigationProp = NativeStackNavigationProp<ArrendadorStackParamList, 'AddVehicleStep3Photos'>;

type PhotoType = 'front' | 'sideLeft' | 'sideRight' | 'interior' | 'tarjetaCirculacion';

const REQUIRED_PHOTOS = [
	{ key: 'front', label: 'Frontal', required: true },
	{ key: 'sideLeft', label: 'Lateral Izquierda', required: true },
	{ key: 'sideRight', label: 'Lateral Derecha', required: true },
	{ key: 'interior', label: 'Interior', required: true },
	{ key: 'tarjetaCirculacion', label: 'Tarjeta de Circulación', required: true },
] as const;

const MAX_ADDITIONAL_PHOTOS = 4;

export default function Step3Photos() {
	const navigation = useNavigation<NavigationProp>();
	const route = useRoute<any>();
	const { vehicleData } = route.params || {};

	const [photos, setPhotos] = useState<{ [key in PhotoType]: string | null }>({
		front: vehicleData?.photos?.front || null,
		sideLeft: vehicleData?.photos?.sideLeft || null,
		sideRight: vehicleData?.photos?.sideRight || null,
		interior: vehicleData?.photos?.interior || null,
		tarjetaCirculacion: vehicleData?.photos?.tarjetaCirculacion || null,
	});

	const [additionalPhotos, setAdditionalPhotos] = useState<string[]>(vehicleData?.additionalPhotos || []);
	const [photoMetadata, setPhotoMetadata] = useState<{ [key: string]: { size: number; width: number; height: number; quality: 'excellent' | 'good' | 'acceptable' | 'poor' } }>({});

	const [loadingPhoto, setLoadingPhoto] = useState<string | null>(null);
	const [showPhotoOptions, setShowPhotoOptions] = useState<PhotoType | 'additional' | null>(null);
	const [queuedAction, setQueuedAction] = useState<{kind: 'pick' | 'camera', type: PhotoType | 'additional'} | null>(null);

	const [galleryVisible, setGalleryVisible] = useState(false);
	const [galleryStartIndex, setGalleryStartIndex] = useState(0);

	// Use hook-based permissions to avoid deprecated flows and improve UX
	const [mediaPermission, requestMediaPermission] = ImagePicker.useMediaLibraryPermissions();
	const [cameraPermission, requestCameraPermission] = ImagePicker.useCameraPermissions();

	// Ejecutar acción encolada cuando se cierra el modal (compatible con Android/iOS)
	useEffect(() => {
		if (showPhotoOptions === null && queuedAction) {
			const { kind, type } = queuedAction;
			setQueuedAction(null);
			
			// Esperar un poco para asegurar que el modal se cerró visualmente
			setTimeout(() => {
				if (kind === 'pick') {
					pickImage(type);
				} else {
					takePhoto(type);
				}
			}, 500);
		}
	}, [showPhotoOptions, queuedAction]);

	const ensurePermission = async (kind: 'camera' | 'media') => {
		const current = kind === 'camera' ? cameraPermission : mediaPermission;
		if (current?.status === 'granted') return true;

		const request = kind === 'camera' ? await requestCameraPermission() : await requestMediaPermission();
		if (request?.status === 'granted') return true;

		Alert.alert(
			'Permiso denegado',
			kind === 'camera'
				? 'Necesitamos acceso a tu cámara para tomar fotos.'
				: 'Necesitamos acceso a tu galería para subir las fotos.'
		);
		setShowPhotoOptions(null);
		return false;
	};

	// Validar y comprimir imagen
	const validateAndCompressImage = async (uri: string, type: PhotoType | 'additional'): Promise<{ uri: string; metadata: { size: number; width: number; height: number; quality: 'excellent' | 'good' | 'acceptable' | 'poor' } } | null> => {
		try {
			console.log(`🔄 Iniciando procesamiento de imagen: ${uri}`);
			
			// 1. Procesar imagen - solo comprimir, sin resize forzado
			const manipResult = await ImageManipulator.manipulateAsync(
				uri,
				[],
				{ 
					compress: 0.8, 
					format: ImageManipulator.SaveFormat.JPEG,
					base64: false
				}
			);

			const finalUri = manipResult.uri;
			const width = manipResult.width;
			const height = manipResult.height;

			console.log(`✅ Imagen procesada: ${width}x${height}px`);

			// 2. Estimar tamaño (evitar fetch que puede fallar en iOS)
			const finalSize = Math.floor(width * height * 0.3); // Estimación conservadora

			// 3. Determinar calidad de la imagen
			let quality: 'excellent' | 'good' | 'acceptable' | 'poor';
			if (width >= 1920 && height >= 1080) quality = 'excellent';
			else if (width >= 1280 && height >= 720) quality = 'good';
			else if (width >= 800 && height >= 600) quality = 'acceptable';
			else quality = 'poor';

			return {
				uri: finalUri,
				metadata: {
					size: finalSize,
					width,
					height,
					quality
				}
			};
		} catch (error) {
			console.error('❌ Error en validateAndCompressImage:', error);
			// En lugar de fallar, retornar la imagen original
			return {
				uri: uri,
				metadata: {
					size: 0,
					width: 1280,
					height: 720,
					quality: 'good'
				}
			};
		}
	};

	const savePhoto = (type: PhotoType | 'additional', uri: string, metadata: { size: number; width: number; height: number; quality: 'excellent' | 'good' | 'acceptable' | 'poor' }) => {
		const photoId = type === 'additional' ? `additional_${Date.now()}` : type;

		if (type === 'additional') {
			setAdditionalPhotos((prev) => [...prev, uri]);
			setPhotoMetadata((prev) => ({ ...prev, [photoId]: metadata }));
			return;
		}

		setPhotos((prev) => ({ ...prev, [type]: uri }));
		setPhotoMetadata((prev) => ({ ...prev, [type]: metadata }));
	};

	const takePhoto = async (type: PhotoType | 'additional') => {
		console.log(`📸 Iniciando captura de foto para: ${type}`);

		try {
			const hasPermission = await ensurePermission('camera');
			if (!hasPermission) return;

			setShowPhotoOptions(null);
			setLoadingPhoto(type === 'additional' ? 'additional' : type);

			console.log('📷 Abriendo cámara...');
			const result = await ImagePicker.launchCameraAsync({
				mediaTypes: ImagePicker.MediaTypeOptions.Images,
				allowsEditing: false,
				quality: 0.85,
				base64: false,
				exif: false,
			});

			console.log('📷 Respuesta de cámara:', result.canceled ? 'Cancelado' : 'Foto capturada');

			if (result.canceled) {
				setLoadingPhoto(null);
				return;
			}

			const asset = result.assets?.[0];
			if (!asset) {
				setLoadingPhoto(null);
				return;
			}

			// Procesar imagen igual que en pickImage para asegurar formato y compresión
			const processed = await validateAndCompressImage(asset.uri, type);
			const metadata = processed?.metadata || {
				size: asset.fileSize || Math.floor((asset.width || 1280) * (asset.height || 720) * 0.3),
				width: asset.width || 1280,
				height: asset.height || 720,
				quality: (asset.width || 0) >= 1920 && (asset.height || 0) >= 1080
					? 'excellent'
					: (asset.width || 0) >= 1280 && (asset.height || 0) >= 720
						? 'good'
						: (asset.width || 0) >= 800 && (asset.height || 0) >= 600
							? 'acceptable'
							: 'poor',
			};

			console.log('✅ Foto capturada, guardando...');
			savePhoto(type, processed?.uri || asset.uri, metadata);
		} catch (error) {
			console.error('❌ Error en takePhoto:', error);
			Alert.alert('Error', 'Hubo un problema al tomar la foto. Intenta nuevamente.');
		} finally {
			setLoadingPhoto(null);
		}
	};

	const pickImage = async (type: PhotoType | 'additional') => {
		console.log(`🖼️ Iniciando selección de imagen para: ${type}`);

		try {
			const hasPermission = await ensurePermission('media');
			if (!hasPermission) return;

			setShowPhotoOptions(null);
			setLoadingPhoto(type === 'additional' ? 'additional' : type);

			console.log('📱 Abriendo galería...');
			const result = await ImagePicker.launchImageLibraryAsync({
				mediaTypes: ImagePicker.MediaTypeOptions.Images,
				allowsEditing: false,
				allowsMultipleSelection: false,
				quality: 0.85,
			});

			if (result.canceled) {
				setLoadingPhoto(null);
				return;
			}

			const asset = result.assets?.[0];
			if (!asset) {
				setLoadingPhoto(null);
				return;
			}

			const processed = await validateAndCompressImage(asset.uri, type);
			const metadata = processed?.metadata || {
				size: asset.fileSize || Math.floor((asset.width || 1280) * (asset.height || 720) * 0.3),
				width: asset.width || 1280,
				height: asset.height || 720,
				quality: 'good' as const,
			};

			savePhoto(type, processed?.uri || asset.uri, metadata);
			console.log('✅ Imagen guardada exitosamente');
		} catch (error) {
			console.error('❌ Error en pickImage:', error);
			Alert.alert(
				'Error con la Galería',
				'Hubo un problema al abrir la galería. Si el problema continúa en iOS con Expo Go, prueba usando la cámara temporalmente.'
			);
		} finally {
			setLoadingPhoto(null);
		}
	};

	const pickAdditionalPhoto = async () => {
		setShowPhotoOptions('additional');
	};

	const removeAdditionalPhoto = (index: number) => {
		setAdditionalPhotos((prev) => prev.filter((_, i) => i !== index));
	};

	const openGallery = (startIndex: number = 0) => {
		setGalleryStartIndex(startIndex);
		setGalleryVisible(true);
	};

	const getAllPhotos = (): string[] => {
		const allPhotos: string[] = [];
		if (photos.front) allPhotos.push(photos.front);
		if (photos.sideLeft) allPhotos.push(photos.sideLeft);
		if (photos.sideRight) allPhotos.push(photos.sideRight);
		if (photos.interior) allPhotos.push(photos.interior);
		if (photos.tarjetaCirculacion) allPhotos.push(photos.tarjetaCirculacion);
		allPhotos.push(...additionalPhotos);
		return allPhotos;
	};

	const isFormValid = () => {
		// Requerir todas las fotos obligatorias
		return photos.front && photos.sideLeft && photos.sideRight && photos.interior && photos.tarjetaCirculacion;
	};

	const handleNext = () => {
		if (!isFormValid()) {
			Alert.alert('Faltan fotos', 'Por favor sube todas las fotos requeridas para continuar.');
			return;
		}

		console.log('📸 Step3Photos - Navegando con:', {
			photos,
			additionalPhotos,
			totalAdicionales: additionalPhotos.length
		});

		navigation.navigate('AddVehicleStep4Price', {
			vehicleData: {
				...vehicleData,
				photos,
				additionalPhotos,
			}
		});
	};

	const renderPhotoInput = (type: PhotoType, label: string) => {
		const metadata = photoMetadata[type];
		const getQualityColor = (quality?: 'excellent' | 'good' | 'acceptable' | 'poor') => {
			if (!quality) return '#9CA3AF';
			if (quality === 'excellent') return '#16A34A';
			if (quality === 'good') return '#059669';
			if (quality === 'acceptable') return '#F59E0B';
			return '#DC2626';
		};

		const getQualityLabel = (quality?: 'excellent' | 'good' | 'acceptable' | 'poor') => {
			if (!quality) return '';
			if (quality === 'excellent') return 'Excelente';
			if (quality === 'good') return 'Buena';
			if (quality === 'acceptable') return 'Aceptable';
			return 'Baja';
		};

		return (
			<View style={{ marginBottom: 20 }}>
				<View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
					<Text style={styles.label}>{label} *</Text>
					{photos[type] && (
						<>
							<View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 8 }}>
								<Ionicons name="checkmark-circle" size={16} color="#16A34A" />
								<Text style={{ fontSize: 11, color: '#16A34A', fontWeight: '600' }}>Listo</Text>
							</View>
							{metadata && (
								<View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 8, backgroundColor: '#F9FAFB', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 }}>
									<Ionicons name="image" size={12} color={getQualityColor(metadata.quality)} />
									<Text style={{ fontSize: 10, color: getQualityColor(metadata.quality), fontWeight: '600', marginLeft: 4 }}>
										{getQualityLabel(metadata.quality)}
									</Text>
									<Text style={{ fontSize: 9, color: '#6B7280', marginLeft: 4 }}>
										• {(metadata.size / 1024).toFixed(0)}KB
									</Text>
								</View>
							)}
						</>
					)}
				</View>
				<TouchableOpacity 
					style={[styles.photoPlaceholder, photos[type] ? { borderWidth: 0 } : {}]} 
					onPress={() => setShowPhotoOptions(type)}
					disabled={loadingPhoto === type}
				>
					{loadingPhoto === type ? (
						<View style={{ alignItems: 'center' }}>
							<ActivityIndicator size="large" color="#0B729D" />
							<Text style={[styles.photoPlaceholderText, { marginTop: 12 }]}>Procesando imagen...</Text>
						</View>
					) : photos[type] ? (
						<TouchableOpacity 
							style={{ width: '100%', height: '100%', position: 'relative' }}
							onPress={() => openGallery(Object.values(photos).filter(p => p !== null).indexOf(photos[type]!))}
							activeOpacity={0.9}
						>
							<Image source={{ uri: photos[type]! }} style={styles.uploadedPhoto} />
							<View style={styles.editPhotoOverlay}>
								<Ionicons name="pencil" size={16} color="white" />
							</View>
							<View style={styles.photoCheckmark}>
								<Ionicons name="checkmark-circle" size={32} color="#16A34A" />
							</View>
							<View style={styles.photoPreviewBadge}>
								<Ionicons name="eye-outline" size={14} color="white" />
							</View>
						</TouchableOpacity>
					) : (
						<View style={{ alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
							{/* Guía visual (silueta) */}
							<View style={{ position: 'absolute', opacity: 0.1, width: '80%', height: '80%', alignItems: 'center', justifyContent: 'center' }}>
								<Ionicons 
									name={
										type === 'front' ? 'car-sport' : 
										type === 'sideLeft' ? 'car-sport-outline' : 
										type === 'sideRight' ? 'car-sport-outline' : 
										type === 'interior' ? 'speedometer-outline' :
										'card-outline'
									} 
									size={120} 
									color="#032B3C" 
									style={type === 'sideRight' ? { transform: [{ scaleX: -1 }] } : {}}
								/>
							</View>
							<EmptyPhotoIllustration size={60} />
							<Text style={[styles.photoPlaceholderText, { marginTop: 8 }]}>Agregar foto</Text>
						</View>
					)}
				</TouchableOpacity>
			</View>
		);
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
					<Text style={styles.headerTitle}>Fotos del Vehículo</Text>
					<Text style={styles.headerSubtitle}>Muestra tu auto</Text>
				</View>
				<View style={{ width: 40 }} />
			</View>

			{/* Step Indicator */}
			<StepIndicator 
				currentStep={3} 
				totalSteps={4}
				labels={['Básico', 'Specs', 'Fotos', 'Precio']}
			/>

			{/* Progress Bar */}
			<View style={styles.progressContainer}>
				<View style={[styles.progressBar, { width: '75%' }]} />
			</View>

			<ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
				<View style={{ marginBottom: 8 }}>
					<Text style={styles.sectionTitle}>Fotos de tu Vehículo</Text>
					<Text style={{ fontSize: 14, color: '#6B7280', marginTop: 4, lineHeight: 20 }}>
						Sube al menos 4 fotos para mostrar tu auto desde todos los ángulos
					</Text>
				</View>
				
				{/* Photo Tips */}
				<PhotoTips />

				{/* Fotos Requeridas */}
				<View style={{ marginTop: 20, marginBottom: 8 }}>
					<View style={{ flexDirection: 'row', alignItems: 'center' }}>
						<Text style={styles.label}>Fotos Requeridas</Text>
						<View style={{ backgroundColor: '#DBEAFE', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, marginLeft: 8 }}>
							<Text style={{ fontSize: 11, color: '#0B729D', fontWeight: '600' }}>
								{Object.values(photos).filter(Boolean).length}/5 completas
							</Text>
						</View>
					</View>
				</View>
				
				<Text style={{ color: '#6B7280', marginBottom: 24 }}>
					Las buenas fotos aumentan tus posibilidades de alquiler. Asegúrate de que el auto esté limpio y con buena iluminación.
				</Text>

				{renderPhotoInput('front', 'Foto Principal (Frente)')}
				{renderPhotoInput('sideLeft', 'Lateral Izquierdo')}
				{renderPhotoInput('sideRight', 'Lateral Derecho')}
				{renderPhotoInput('interior', 'Interior')}
				
				<View style={{ marginVertical: 16, padding: 16, backgroundColor: '#F0F9FF', borderRadius: 12, borderWidth: 1, borderColor: '#BAE6FD' }}>
					<View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
						<Ionicons name="document-text-outline" size={24} color="#0B729D" style={{ marginRight: 8 }} />
						<Text style={{ fontSize: 16, fontWeight: '700', color: '#032B3C' }}>Documentación</Text>
					</View>
					<Text style={{ fontSize: 14, color: '#4B5563', marginBottom: 16 }}>
						Necesitamos verificar que eres el propietario. Sube una foto clara de la Tarjeta de Circulación vigente.
					</Text>
					{renderPhotoInput('tarjetaCirculacion', 'Tarjeta de Circulación')}
				</View>

				{/* Fotos Adicionales */}
				<View style={{ marginTop: 32, marginBottom: 20 }}>
					<View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
						<Text style={styles.sectionTitle}>Fotos Adicionales</Text>
						<View style={{ backgroundColor: '#EFF6FF', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, marginLeft: 8 }}>
							<Text style={{ fontSize: 11, color: '#0B729D', fontWeight: '600' }}>Opcional</Text>
						</View>
					</View>
					<Text style={{ color: '#6B7280', marginBottom: 16 }}>
						Agrega hasta {MAX_ADDITIONAL_PHOTOS} fotos más para mostrar mejor tu vehículo (detalles, maletero, motor, etc.)
					</Text>

					{/* Grid de fotos adicionales */}
					<View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
						{additionalPhotos.map((photo, index) => (
							<View key={index} style={{ width: '47%', aspectRatio: 4/3, position: 'relative', marginBottom: 12 }}>
								<Image source={{ uri: photo }} style={{ width: '100%', height: '100%', borderRadius: 12 }} />
								<TouchableOpacity
									style={{
										position: 'absolute',
										top: 8,
										right: 8,
										backgroundColor: 'rgba(220, 38, 38, 0.9)',
										borderRadius: 16,
										padding: 6,
									}}
									onPress={() => removeAdditionalPhoto(index)}
								>
									<Ionicons name="trash-outline" size={16} color="white" />
								</TouchableOpacity>
							</View>
						))}

						{/* Botón agregar más fotos */}
						{additionalPhotos.length < MAX_ADDITIONAL_PHOTOS && (
							<TouchableOpacity
								style={[
									styles.photoPlaceholder,
									{ width: '47%', aspectRatio: 4/3, marginBottom: 0 }
								]}
								onPress={pickAdditionalPhoto}
								disabled={loadingPhoto === 'additional'}
							>
								{loadingPhoto === 'additional' ? (
									<ActivityIndicator size="large" color="#0B729D" />
								) : (
									<>
										<Ionicons name="add-circle-outline" size={40} color="#0B729D" />
										<Text style={[styles.photoPlaceholderText, { color: '#0B729D' }]}>
											Agregar
										</Text>
									</>
								)}
							</TouchableOpacity>
						)}
					</View>

					{additionalPhotos.length > 0 && (
						<View style={{ marginTop: 12, backgroundColor: '#ECFDF5', padding: 12, borderRadius: 8, flexDirection: 'row' }}>
							<Ionicons name="checkmark-circle" size={18} color="#16A34A" style={{ marginRight: 8 }} />
							<Text style={{ fontSize: 13, color: '#16A34A', flex: 1 }}>
								{additionalPhotos.length} foto{additionalPhotos.length > 1 ? 's' : ''} adicional{additionalPhotos.length > 1 ? 'es' : ''} agregada{additionalPhotos.length > 1 ? 's' : ''}
							</Text>
						</View>
					)}

					{/* Botón de vista previa */}
					{getAllPhotos().length > 0 && (
						<TouchableOpacity
							style={{
								marginTop: 16,
								flexDirection: 'row',
								alignItems: 'center',
								justifyContent: 'center',
								backgroundColor: '#EFF6FF',
								padding: 14,
								borderRadius: 12,
								borderWidth: 1,
								borderColor: '#0B729D',
							}}
							onPress={() => openGallery(0)}
						>
							<Ionicons name="images-outline" size={20} color="#0B729D" style={{ marginRight: 8 }} />
							<Text style={{ fontSize: 15, color: '#0B729D', fontWeight: '600' }}>
								Ver galería ({getAllPhotos().length} fotos)
							</Text>
						</TouchableOpacity>
					)}
				</View>

				<View style={{ height: 100 }} />
			</ScrollView>

			{/* Footer */}
			<View style={styles.footer}>
				<TouchableOpacity
					style={[styles.nextButton, !isFormValid() && styles.nextButtonDisabled]}
					onPress={handleNext}
					disabled={!isFormValid()}
				>
					<Text style={styles.nextButtonText}>Siguiente</Text>
					<Ionicons name="arrow-forward" size={20} color="white" />
				</TouchableOpacity>
			</View>

			{/* Modal de Galería */}
			<PhotoGalleryModal
				visible={galleryVisible}
				photos={getAllPhotos()}
				currentIndex={galleryStartIndex}
				onClose={() => setGalleryVisible(false)}
			/>

			{/* Modal de Opciones de Foto */}
			<Modal
				visible={showPhotoOptions !== null}
				transparent
				animationType="fade"
				onRequestClose={() => setShowPhotoOptions(null)}
			>
				<TouchableOpacity 
					style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
					activeOpacity={1}
					onPress={() => setShowPhotoOptions(null)}
				>
					<View style={{ backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 20 }}>
						<View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }}>
							<Text style={{ fontSize: 18, fontWeight: '700', color: '#032B3C', textAlign: 'center' }}>
								Agregar Foto
							</Text>
						</View>
						<View style={{ padding: 16 }}>
							<TouchableOpacity
								style={{
									flexDirection: 'row',
									alignItems: 'center',
									backgroundColor: '#EFF6FF',
									padding: 16,
									borderRadius: 12,
									marginBottom: 12,
								}}
								onPress={() => {
									if (showPhotoOptions) {
										setQueuedAction({kind: 'camera', type: showPhotoOptions});
										setShowPhotoOptions(null);
									}
								}}
							>
								<View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#0B729D', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
									<Ionicons name="camera" size={24} color="white" />
								</View>
								<View style={{ flex: 1 }}>
									<Text style={{ fontSize: 16, fontWeight: '700', color: '#032B3C', marginBottom: 2 }}>
										Tomar Foto
									</Text>
									<Text style={{ fontSize: 13, color: '#6B7280' }}>
										Usa tu cámara ahora
									</Text>
								</View>
								<Ionicons name="chevron-forward" size={20} color="#6B7280" />
							</TouchableOpacity>
							<TouchableOpacity
								style={{
									flexDirection: 'row',
									alignItems: 'center',
									backgroundColor: '#F3F4F6',
									padding: 16,
									borderRadius: 12,
								}}
								onPress={() => {
									if (showPhotoOptions) {
										setQueuedAction({kind: 'pick', type: showPhotoOptions});
										setShowPhotoOptions(null);
									}
								}}
							>
								<View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#6B7280', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
									<Ionicons name="images" size={24} color="white" />
								</View>
								<View style={{ flex: 1 }}>
									<Text style={{ fontSize: 16, fontWeight: '700', color: '#032B3C', marginBottom: 2 }}>
										Elegir de Galería
									</Text>
									<Text style={{ fontSize: 13, color: '#6B7280' }}>
										Selecciona una foto existente
									</Text>
								</View>
								<Ionicons name="chevron-forward" size={20} color="#6B7280" />
							</TouchableOpacity>
						</View>
					</View>
				</TouchableOpacity>
			</Modal>
		</View>
	);
}
