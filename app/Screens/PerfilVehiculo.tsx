import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { NavigationProps } from '../types/navigation';

export default function PerfilVehiculo() {
	const navigation = useNavigation<NavigationProps>();
	const [marca, setMarca] = useState('');
	const [modelo, setModelo] = useState('');
	const [anio, setAnio] = useState('');
	const [placa, setPlaca] = useState('');
	const [color, setColor] = useState('');

	const handleSave = () => {
		if (!marca || !modelo || !anio || !placa || !color) {
			Alert.alert('Error', 'Todos los campos son obligatorios.');
			return;
		}
		// Aquí puedes guardar los datos en Firebase Firestore
		Alert.alert('Éxito', 'Perfil del vehículo guardado.');
		// Navegar a la pantalla principal o donde corresponda
		navigation.navigate('List'); // Asumiendo que 'List' es la pantalla principal
	};

	return (
		<View style={styles.container}>
			<Text style={styles.title}>Perfil del Vehículo</Text>
			<TextInput
				style={styles.input}
				placeholder="Marca"
				value={marca}
				onChangeText={setMarca}
			/>
			<TextInput
				style={styles.input}
				placeholder="Modelo"
				value={modelo}
				onChangeText={setModelo}
			/>
			<TextInput
				style={styles.input}
				placeholder="Año"
				value={anio}
				onChangeText={setAnio}
				keyboardType="numeric"
			/>
			<TextInput
				style={styles.input}
				placeholder="Placa"
				value={placa}
				onChangeText={setPlaca}
			/>
			<TextInput
				style={styles.input}
				placeholder="Color"
				value={color}
				onChangeText={setColor}
			/>
			<TouchableOpacity style={styles.button} onPress={handleSave}>
				<Text style={styles.buttonText}>Guardar</Text>
			</TouchableOpacity>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: '#fff',
		padding: 20,
	},
	title: {
		fontSize: 28,
		fontWeight: 'bold',
		color: '#FF5A5F',
		marginBottom: 30,
	},
	input: {
		width: '100%',
		height: 50,
		borderColor: '#ccc',
		borderWidth: 1,
		borderRadius: 10,
		paddingHorizontal: 15,
		marginBottom: 15,
		backgroundColor: '#f8f9fa',
	},
	button: {
		width: '100%',
		height: 50,
		backgroundColor: '#FF5A5F',
		borderRadius: 10,
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: 10,
	},
	buttonText: {
		color: '#fff',
		fontSize: 18,
		fontWeight: 'bold',
	},
});