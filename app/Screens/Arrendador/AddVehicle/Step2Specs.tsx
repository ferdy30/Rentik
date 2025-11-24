import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import {
    Alert,
    ScrollView,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import type { ArrendadorStackParamList } from '../../../navigation/ArrendadorStack';
import { styles } from './styles';

const TIPOS = ['Sedán', 'SUV', 'Pickup', 'Hatchback', 'Minivan', 'Coupé'];
const TRANSMISIONES = ['Automático', 'Manual'];
const COMBUSTIBLES = ['Gasolina', 'Diésel', 'Híbrido', 'Eléctrico'];

type NavigationProp = NativeStackNavigationProp<ArrendadorStackParamList, 'AddVehicleStep2Specs'>;

export default function Step2Specs() {
	const navigation = useNavigation<NavigationProp>();
	const route = useRoute<any>();
	const { vehicleData } = route.params || {};

	const [formData, setFormData] = useState({
		tipo: '',
		transmision: '',
		combustible: '',
		pasajeros: '',
		puertas: '',
		color: '',
	});

	const isFormValid = () => {
		return (
			formData.tipo &&
			formData.transmision &&
			formData.combustible &&
			formData.pasajeros &&
			formData.puertas
		);
	};

	const handleNext = () => {
		if (!isFormValid()) {
			Alert.alert('Campos incompletos', 'Por favor completa todos los campos obligatorios');
			return;
		}

		const pasajeros = parseInt(formData.pasajeros);
		const puertas = parseInt(formData.puertas);

		if (isNaN(pasajeros) || pasajeros < 1 || pasajeros > 20) {
			Alert.alert('Pasajeros inválido', 'El número de pasajeros debe estar entre 1 y 20');
			return;
		}

		if (isNaN(puertas) || puertas < 2 || puertas > 5) {
			Alert.alert('Puertas inválido', 'El número de puertas debe estar entre 2 y 5');
			return;
		}

		navigation.navigate('AddVehicleStep3Photos', {
			vehicleData: { ...vehicleData, ...formData }
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
					<Text style={styles.headerTitle}>Especificaciones</Text>
					<Text style={styles.headerSubtitle}>Paso 2 de 4</Text>
				</View>
				<View style={{ width: 40 }} />
			</View>

			{/* Progress Bar */}
			<View style={styles.progressContainer}>
				<View style={[styles.progressBar, { width: '50%' }]} />
			</View>

			<ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
				<Text style={styles.sectionTitle}>Características del Vehículo</Text>

				{/* Tipo */}
				<View style={styles.inputGroup}>
					<Text style={styles.label}>Tipo de Vehículo *</Text>
					<ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsContainer}>
						{TIPOS.map((tipo) => (
							<TouchableOpacity
								key={tipo}
								style={[styles.chip, formData.tipo === tipo && styles.chipSelected]}
								onPress={() => setFormData({ ...formData, tipo })}
							>
								<Text style={[styles.chipText, formData.tipo === tipo && styles.chipTextSelected]}>
									{tipo}
								</Text>
							</TouchableOpacity>
						))}
					</ScrollView>
				</View>

				{/* Transmisión */}
				<View style={styles.inputGroup}>
					<Text style={styles.label}>Transmisión *</Text>
					<View style={styles.optionsRow}>
						{TRANSMISIONES.map((trans) => (
							<TouchableOpacity
								key={trans}
								style={[styles.optionCard, formData.transmision === trans && styles.optionCardSelected]}
								onPress={() => setFormData({ ...formData, transmision: trans })}
							>
								<Ionicons
									name={trans === 'Automático' ? 'settings-outline' : 'cog-outline'}
									size={24}
									color={formData.transmision === trans ? '#0B729D' : '#6B7280'}
								/>
								<Text style={[styles.optionText, formData.transmision === trans && styles.optionTextSelected]}>
									{trans}
								</Text>
							</TouchableOpacity>
						))}
					</View>
				</View>

				{/* Combustible */}
				<View style={styles.inputGroup}>
					<Text style={styles.label}>Tipo de Combustible *</Text>
					<ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsContainer}>
						{COMBUSTIBLES.map((comb) => (
							<TouchableOpacity
								key={comb}
								style={[styles.chip, formData.combustible === comb && styles.chipSelected]}
								onPress={() => setFormData({ ...formData, combustible: comb })}
							>
								<Text style={[styles.chipText, formData.combustible === comb && styles.chipTextSelected]}>
									{comb}
								</Text>
							</TouchableOpacity>
						))}
					</ScrollView>
				</View>

				{/* Pasajeros y Puertas */}
				<View style={styles.row}>
					<View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
						<Text style={styles.label}>Pasajeros *</Text>
						<TextInput
							style={styles.input}
							placeholder="Ej: 5"
							value={formData.pasajeros}
							onChangeText={(pasajeros) => setFormData({ ...formData, pasajeros })}
							keyboardType="numeric"
							maxLength={2}
							placeholderTextColor="#9CA3AF"
						/>
					</View>
					<View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
						<Text style={styles.label}>Puertas *</Text>
						<TextInput
							style={styles.input}
							placeholder="Ej: 4"
							value={formData.puertas}
							onChangeText={(puertas) => setFormData({ ...formData, puertas })}
							keyboardType="numeric"
							maxLength={1}
							placeholderTextColor="#9CA3AF"
						/>
					</View>
				</View>

				{/* Color */}
				<View style={styles.inputGroup}>
					<Text style={styles.label}>Color (opcional)</Text>
					<TextInput
						style={styles.input}
						placeholder="Ej: Blanco, Negro, Azul"
						value={formData.color}
						onChangeText={(color) => setFormData({ ...formData, color })}
						placeholderTextColor="#9CA3AF"
					/>
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
		</View>
	);
}
