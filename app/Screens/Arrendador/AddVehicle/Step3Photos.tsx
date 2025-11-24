import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import {
    Alert,
    Image,
    ScrollView,
    StatusBar,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import type { ArrendadorStackParamList } from '../../../navigation/ArrendadorStack';
import { styles } from './styles';

type NavigationProp = NativeStackNavigationProp<ArrendadorStackParamList, 'AddVehicleStep3Photos'>;

type PhotoType = 'front' | 'sideLeft' | 'sideRight' | 'interior';

export default function Step3Photos() {
	const navigation = useNavigation<NavigationProp>();
	const route = useRoute<any>();
	const { vehicleData } = route.params || {};

	const [photos, setPhotos] = useState<{ [key in PhotoType]: string | null }>({
		front: null,
		sideLeft: null,
		sideRight: null,
		interior: null,
	});

	const pickImage = async (type: PhotoType) => {
		// Solicitar permisos (aunque en versiones recientes de Expo/iOS/Android a veces no es necesario explícitamente para la galería)
		const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
		if (status !== 'granted') {
			Alert.alert('Permiso denegado', 'Necesitamos acceso a tu galería para subir las fotos.');
			return;
		}

		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ImagePicker.MediaTypeOptions.Images,
			allowsEditing: true,
			aspect: [4, 3],
			quality: 0.8,
		});

		if (!result.canceled) {
			setPhotos((prev) => ({ ...prev, [type]: result.assets[0].uri }));
		}
	};

	const isFormValid = () => {
		// Requerir al menos la foto frontal y una del interior para ser "profesional"
		// O idealmente todas. Vamos a requerir todas para este ejemplo.
		return photos.front && photos.sideLeft && photos.sideRight && photos.interior;
	};

	const handleNext = () => {
		if (!isFormValid()) {
			Alert.alert('Faltan fotos', 'Por favor sube todas las fotos requeridas para continuar.');
			return;
		}

		navigation.navigate('AddVehicleStep4Price', {
			vehicleData: { ...vehicleData, photos }
		});
	};

	const renderPhotoInput = (type: PhotoType, label: string) => (
		<View style={{ marginBottom: 20 }}>
			<Text style={styles.label}>{label} *</Text>
			<TouchableOpacity 
				style={[styles.photoPlaceholder, photos[type] ? { borderWidth: 0 } : {}]} 
				onPress={() => pickImage(type)}
			>
				{photos[type] ? (
					<View style={{ width: '100%', height: '100%', position: 'relative' }}>
						<Image source={{ uri: photos[type]! }} style={styles.uploadedPhoto} />
						<View style={styles.editPhotoOverlay}>
							<Ionicons name="pencil" size={16} color="white" />
						</View>
					</View>
				) : (
					<>
						<Ionicons name="camera-outline" size={40} color="#9CA3AF" />
						<Text style={styles.photoPlaceholderText}>Agregar foto</Text>
					</>
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
					<Text style={styles.headerSubtitle}>Paso 3 de 4</Text>
				</View>
				<View style={{ width: 40 }} />
			</View>

			{/* Progress Bar */}
			<View style={styles.progressContainer}>
				<View style={[styles.progressBar, { width: '75%' }]} />
			</View>

			<ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
				<Text style={styles.sectionTitle}>Sube fotos de tu auto</Text>
				<Text style={{ color: '#6B7280', marginBottom: 24 }}>
					Las buenas fotos aumentan tus posibilidades de alquiler. Asegúrate de que el auto esté limpio y con buena iluminación.
				</Text>

				{renderPhotoInput('front', 'Foto Principal (Frente)')}
				{renderPhotoInput('sideLeft', 'Lateral Izquierdo')}
				{renderPhotoInput('sideRight', 'Lateral Derecho')}
				{renderPhotoInput('interior', 'Interior')}

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
		</View>
	);
}
