import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import type { ArrendadorStackParamList } from '../../../navigation/ArrendadorStack';
import { styles } from './styles';

const MARCAS = ['Toyota', 'Honda', 'Nissan', 'Mazda', 'Hyundai', 'Kia', 'Ford', 'Chevrolet', 'Volkswagen', 'Mitsubishi'];

type NavigationProp = NativeStackNavigationProp<ArrendadorStackParamList, 'AddVehicleStep1Basic'>;

export default function Step1Basic() {
	const navigation = useNavigation<NavigationProp>();
	const [formData, setFormData] = useState({
		marca: '',
		modelo: '',
		anio: '',
		placa: '',
	});

	const currentYear = new Date().getFullYear();

	const isFormValid = () => {
		return (
			formData.marca &&
			formData.modelo &&
			formData.anio &&
			formData.placa
		);
	};

	const handleNext = () => {
		if (!isFormValid()) {
			Alert.alert('Campos incompletos', 'Por favor completa todos los campos obligatorios');
			return;
		}

		const anio = parseInt(formData.anio);
		if (anio < 1990 || anio > currentYear + 1) {
			Alert.alert('Año inválido', `El año debe estar entre 1990 y ${currentYear + 1}`);
			return;
		}

		if (formData.placa.length < 6) {
			Alert.alert('Placa inválida', 'La placa debe tener al menos 6 caracteres');
			return;
		}

		navigation.navigate('AddVehicleStep2Specs', {
			vehicleData: formData
		});
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
					<Text style={styles.headerTitle}>Información Básica</Text>
					<Text style={styles.headerSubtitle}>Paso 1 de 4</Text>
				</View>
				<View style={{ width: 40 }} />
			</View>

			{/* Progress Bar */}
			<View style={styles.progressContainer}>
				<View style={[styles.progressBar, { width: '25%' }]} />
			</View>

			<KeyboardAvoidingView
				behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
				style={{ flex: 1 }}
			>
				<ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
					<Text style={styles.sectionTitle}>¿Qué auto vas a rentar?</Text>

					{/* Marca */}
					<View style={styles.inputGroup}>
						<Text style={styles.label}>Marca *</Text>
						<ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsContainer}>
							{MARCAS.map((marca) => (
								<TouchableOpacity
									key={marca}
									style={[styles.chip, formData.marca === marca && styles.chipSelected]}
									onPress={() => setFormData({ ...formData, marca })}
								>
									<Text style={[styles.chipText, formData.marca === marca && styles.chipTextSelected]}>
										{marca}
									</Text>
								</TouchableOpacity>
							))}
						</ScrollView>
					</View>

					{/* Modelo */}
					<View style={styles.inputGroup}>
						<Text style={styles.label}>Modelo *</Text>
						<TextInput
							style={styles.input}
							placeholder="Ej: Corolla, Civic, Sentra"
							value={formData.modelo}
							onChangeText={(modelo) => setFormData({ ...formData, modelo })}
							placeholderTextColor="#9CA3AF"
						/>
					</View>

					{/* Año y Placa */}
					<View style={styles.row}>
						<View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
							<Text style={styles.label}>Año *</Text>
							<TextInput
								style={styles.input}
								placeholder={currentYear.toString()}
								value={formData.anio}
								onChangeText={(anio) => setFormData({ ...formData, anio })}
								keyboardType="numeric"
								maxLength={4}
								placeholderTextColor="#9CA3AF"
							/>
						</View>
						<View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
							<Text style={styles.label}>Placa *</Text>
							<TextInput
								style={styles.input}
								placeholder="ABC-1234"
								value={formData.placa}
								onChangeText={(placa) => setFormData({ ...formData, placa: placa.toUpperCase() })}
								autoCapitalize="characters"
								maxLength={10}
								placeholderTextColor="#9CA3AF"
							/>
						</View>
					</View>

					<View style={{ height: 100 }} />
				</ScrollView>
			</KeyboardAvoidingView>

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
