import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Firebaseauth, db } from '../../FirebaseConfig';

// Pantalla de registro de usuario
export default function Registro({ navigation }: any) {
	const [nombre, setNombre] = useState('');
	const [apellido, setApellido] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [role, setRole] = useState<'arrendatario' | 'arrendador' | null>(null);
	// La captura de licencia se mueve a una pantalla dedicada
	const [loading, setLoading] = useState(false);
	 
	const [error, setError] = useState('');
	 

	// Función para validar email
	const validateEmail = (email: string) => {
		const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return regex.test(email);
	};

	// Función para validar contraseña (mínimo 6 caracteres)
	const validatePassword = (password: string) => {
		return password.length >= 6;
	};


	// Función para registrar usuario en Firebase
	const handleRegister = async () => {
		if (!nombre || !apellido || !email || !password || !confirmPassword || !role) {
			setError('Todos los campos son obligatorios.');
			return;
		}
		if (!validateEmail(email)) {
			setError('Correo electrónico no válido.');
			return;
		}
		if (!validatePassword(password)) {
			setError('La contraseña debe tener al menos 6 caracteres.');
			return;
		}
		if (password !== confirmPassword) {
			setError('Las contraseñas no coinciden.');
			return;
		}

		setLoading(true);
		setError('');
		try {
			const userCredential = await createUserWithEmailAndPassword(Firebaseauth, email, password);
			const user = userCredential.user;

			// Esperar a que el token de autenticación esté listo
			await user.reload();
			const idToken = await user.getIdToken(true);
			
			if (!idToken) {
				throw new Error('Token de autenticación no disponible');
			}

			// Guardar datos básicos en Firestore (sin licencia aún)
			await setDoc(doc(db, 'users', user.uid), {
				nombre,
				apellido,
				email,
				role,
				createdAt: serverTimestamp(),
			});

			// Flujo según rol
			if (role === 'arrendatario') {
				// Cerrar sesión para volver a Login, como solicitaste
				await signOut(Firebaseauth);
				Alert.alert('Registro completado', 'Tu cuenta se creó. Inicia sesión para continuar.');
				navigation.reset({ index: 0, routes: [{ name: 'Login' as never }] });
			} else {
				// Mantener sesión iniciada y llevar a la pantalla de licencia
				Alert.alert('Paso siguiente', 'Sube una foto de tu licencia para continuar.');
				navigation.reset({ index: 0, routes: [{ name: 'LicenseUpload' as never }] });
			}
		} catch (error: any) {
			console.error('Registration error:', error);
			setError('Error al registrar. Verifica tus datos.');
		} finally {
			setLoading(false);
		}
	};

	return (
		<KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
			<Text style={styles.title}>Crear cuenta</Text>
			<TextInput
				style={styles.input}
				placeholder="Nombre"
				value={nombre}
				onChangeText={setNombre}
			/>
			<TextInput
				style={styles.input}
				placeholder="Apellido"
				value={apellido}
				onChangeText={setApellido}
			/>
			<TextInput
				style={styles.input}
				placeholder="Correo electrónico"
				autoCapitalize="none"
				keyboardType="email-address"
				value={email}
				onChangeText={setEmail}
			/>
			<TextInput
				style={styles.input}
				placeholder="Contraseña"
				secureTextEntry
				value={password}
				onChangeText={setPassword}
			/>
			<TextInput
				style={styles.input}
				placeholder="Confirmar Contraseña"
				secureTextEntry
				value={confirmPassword}
				onChangeText={setConfirmPassword}
			/>
			<Text style={styles.roleTitle}>Selecciona tu rol:</Text>
			<View style={styles.roleContainer}>
				<TouchableOpacity
					style={[styles.roleButton, role === 'arrendatario' && styles.roleButtonSelected]}
					onPress={() => setRole('arrendatario')}
				>
					<Text style={styles.roleButtonText}>Arrendatario</Text>
				</TouchableOpacity>
				<TouchableOpacity
					style={[styles.roleButton, role === 'arrendador' && styles.roleButtonSelected]}
					onPress={() => setRole('arrendador')}
				>
					<Text style={styles.roleButtonText}>Arrendador</Text>
				</TouchableOpacity>
			</View>
			{error ? <Text style={styles.error}>{error}</Text> : null}
			{loading ? (
				<ActivityIndicator color="#FF5A5F" />
			) : (
				<TouchableOpacity style={styles.button} onPress={handleRegister}>
					<Text style={styles.buttonText}>Registrarse</Text>
				</TouchableOpacity>
			)}
			<TouchableOpacity onPress={() => navigation.replace('Login')}>
				<Text style={styles.link}>¿Ya tienes cuenta? Inicia sesión</Text>
			</TouchableOpacity>
		</KeyboardAvoidingView>
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
	roleTitle: {
		fontSize: 18,
		fontWeight: 'bold',
		color: '#333',
		marginBottom: 10,
	},
	roleContainer: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		width: '100%',
		marginBottom: 20,
	},
	roleButton: {
		flex: 1,
		height: 50,
		borderColor: '#ccc',
		borderWidth: 1,
		borderRadius: 10,
		justifyContent: 'center',
		alignItems: 'center',
		marginHorizontal: 5,
		backgroundColor: '#f8f9fa',
	},
	roleButtonSelected: {
		backgroundColor: '#FF5A5F',
		borderColor: '#FF5A5F',
	},
	roleButtonText: {
		color: '#333',
		fontSize: 16,
		fontWeight: 'bold',
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
	link: {
		color: '#FF5A5F',
		marginTop: 10,
		fontSize: 16,
	},
	error: {
		color: 'red',
		marginBottom: 10,
	},
});
