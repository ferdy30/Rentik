import { useNavigation } from '@react-navigation/native';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { useState } from 'react';
import { Alert, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { db } from '../../FirebaseConfig';
import { useAuth } from '../../context/Auth';
import { NavigationProps } from '../types/navigation';

export default function PerfilVehiculo() {
  const navigation = useNavigation<NavigationProps>();
  const { user } = useAuth();
	const [marca, setMarca] = useState('');
	const [modelo, setModelo] = useState('');
	const [anio, setAnio] = useState('');
	const [placa, setPlaca] = useState('');
	const [color, setColor] = useState('');

  const handleSave = async () => {
		if (!marca || !modelo || !anio || !placa || !color) {
			Alert.alert('Error', 'Todos los campos son obligatorios.');
			return;
		}
    try {
      if (!user?.uid) {
        Alert.alert('Sesión requerida', 'Vuelve a iniciar sesión para continuar.');
        return;
      }
      await setDoc(
        doc(db, 'users', user.uid),
        {
          vehicleProfileComplete: true,
          vehicleProfile: { marca, modelo, anio, placa, color },
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      Alert.alert('Éxito', 'Perfil del vehículo guardado.');
      // Navegar a la pantalla principal del arrendador
      navigation.navigate('HomeArrendador');
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'No se pudo guardar el perfil.');
    }
	};

	return (
		<View style={styles.container}>
			<Text style={styles.title}>Perfil del Vehículo</Text>
			<TextInput
				style={styles.input}
        placeholder="Marca"
        placeholderTextColor="#B0B8C1"
        value={marca}
        onChangeText={setMarca}
      />
			<TextInput
				style={styles.input}
        placeholder="Modelo"
        placeholderTextColor="#B0B8C1"
        value={modelo}
        onChangeText={setModelo}
      />
			<TextInput
				style={styles.input}
        placeholder="Año"
        placeholderTextColor="#B0B8C1"
        value={anio}
        onChangeText={setAnio}
        keyboardType="numeric"
      />
			<TextInput
				style={styles.input}
        placeholder="Placa"
        placeholderTextColor="#B0B8C1"
        value={placa}
        onChangeText={setPlaca}
      />
			<TextInput
				style={styles.input}
        placeholder="Color"
        placeholderTextColor="#B0B8C1"
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
    fontWeight: '600',
    color: '#0B729D',
    marginBottom: 30,
    fontFamily: Platform.OS === 'ios' ? 'San Francisco' : 'Roboto',
    letterSpacing: 0.5,
  },
  input: {
    width: '100%',
    height: 50,
    borderColor: '#E0E0E0',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 15,
    backgroundColor: '#fff',
    color: '#032B3C',
    fontSize: 16,
    shadowColor: '#0B729D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#0B729D',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    shadowColor: '#032B3C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'ios' ? 'San Francisco' : 'Roboto',
	},
});