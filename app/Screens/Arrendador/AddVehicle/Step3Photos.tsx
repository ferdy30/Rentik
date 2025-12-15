import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
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
		front: null,
		sideLeft: null,
		sideRight: null,
		interior: null,
		tarjetaCirculacion: null,
	});

	const [additionalPhotos, setAdditionalPhotos] = useState<string[]>([]);

	const [loadingPhoto, setLoadingPhoto] = useState<string | null>(null);
	const [showPhotoOptions, setShowPhotoOptions] = useState<PhotoType | 'additional' | null>(null);

	const [galleryVisible, setGalleryVisible] = useState(false);
	const [galleryStartIndex, setGalleryStartIndex] = useState(0);

	// Use hook-based permissions to avoid deprecated flows and improve UX
	const [mediaPermission, requestMediaPermission] = ImagePicker.useMediaLibraryPermissions();
	const [cameraPermission, requestCameraPermission] = ImagePicker.useCameraPermissions();

	const takePhoto = async (type: PhotoType | 'additional') => {
		try {
			if (!cameraPermission || cameraPermission.status !== 'granted') {
				const perm = await requestCameraPermission();
				if (!perm || perm.status !== 'granted') {
					Alert.alert('Permiso denegado', 'Necesitamos acceso a tu cámara para tomar fotos.');
					setLoadingPhoto(null);
					setShowPhotoOptions(null);
					return;
				}
			}

			setShowPhotoOptions(null);
			setLoadingPhoto(type === 'additional' ? 'additional' : type);
			
			const result = await ImagePicker.launchCameraAsync({
				allowsEditing: false,
				quality: 0.8,
			});

			if (!result.canceled && result.assets && result.assets.length > 0) {
				if (type === 'additional') {
					setAdditionalPhotos((prev) => [...prev, result.assets[0].uri]);
				} else {
					setPhotos((prev) => ({ ...prev, [type]: result.assets[0].uri }));
				}
			}
		} catch (error) {
			console.error('Error taking photo:', error);
			Alert.alert('Error', 'Hubo un problema al tomar la foto. Intenta de nuevo.');
		} finally {
			setLoadingPhoto(null);
		}
	};

	const pickImage = async (type: PhotoType | 'additional') => {
		try {
			// If permission is undetermined or denied, request it via hook
			if (!mediaPermission || mediaPermission.status !== 'granted') {
				const perm = await requestMediaPermission();
				if (!perm || perm.status !== 'granted') {
					Alert.alert('Permiso denegado', 'Necesitamos acceso a tu galería para subir las fotos.');
					setLoadingPhoto(null);
					setShowPhotoOptions(null);
					return;
				}
			}

			setShowPhotoOptions(null);
			setLoadingPhoto(type === 'additional' ? 'additional' : type);
			
			const result = await ImagePicker.launchImageLibraryAsync({
				mediaTypes: ['images'],
				allowsEditing: false,
				quality: 0.8,
			});

			if (!result.canceled && result.assets && result.assets.length > 0) {
				if (type === 'additional') {
					setAdditionalPhotos((prev) => [...prev, result.assets[0].uri]);
				} else {
					setPhotos((prev) => ({ ...prev, [type]: result.assets[0].uri }));
				}
			}
		} catch (error) {
			console.error('Error picking image:', error);
			Alert.alert('Error', 'Hubo un problema al seleccionar la imagen. Intenta de nuevo.');
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

		navigation.navigate('AddVehicleStep4Price', {
			vehicleData: { 
				...vehicleData, 
				photos,
				additionalPhotos 
			}
		});
	};

	const renderPhotoInput = (type: PhotoType, label: string) => (
		<View style={{ marginBottom: 20 }}>
			<View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
				<Text style={styles.label}>{label} *</Text>
				{photos[type] && (
					<View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 8 }}>
						<Ionicons name="checkmark-circle" size={16} color="#16A34A" />
						<Text style={{ fontSize: 11, color: '#16A34A', fontWeight: '600' }}>Listo</Text>
					</View>
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
						<Text style={[styles.photoPlaceholderText, { marginTop: 12 }]}>Cargando...</Text>
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
										takePhoto(showPhotoOptions);
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
										pickImage(showPhotoOptions);
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
