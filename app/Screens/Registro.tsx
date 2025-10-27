import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Firebaseauth, db } from '../../FirebaseConfig';
import { colors } from '../constants/colors';

// Pantalla de registro de usuario
export default function Registro({ navigation }: any) {
	// Estados del formulario
	const [nombre, setNombre] = useState('');
	const [apellido, setApellido] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [role, setRole] = useState<'arrendatario' | 'arrendador' | null>(null);
	// Teléfono y cumpleaños
	const [countryCode, setCountryCode] = useState('+503');
	const [phoneNumber, setPhoneNumber] = useState('');
	const [showCodePicker, setShowCodePicker] = useState(false);
	const [birthday, setBirthday] = useState<Date | null>(null);
	const [showDatePicker, setShowDatePicker] = useState(false);
	const [loading, setLoading] = useState(false);
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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

	// Lista simple de códigos de país (puedes ampliar esta lista)
	const COUNTRY_CODES = [
		{ code: '+503', name: 'El Salvador' },
		{ code: '+502', name: 'Guatemala' },
		{ code: '+504', name: 'Honduras' },
		{ code: '+505', name: 'Nicaragua' },
		{ code: '+506', name: 'Costa Rica' },
		{ code: '+507', name: 'Panamá' },
		{ code: '+52', name: 'México' },
		{ code: '+1', name: 'EE.UU.' },
	];

	const sanitizePhone = (value: string) => value.replace(/[^0-9]/g, '');


	// Función para registrar usuario en Firebase
	const handleRegister = async () => {
		let errors = [];

		if (!nombre.trim()) {
			errors.push('Nombre es obligatorio');
		}
		if (!apellido.trim()) {
			errors.push('Apellido es obligatorio');
		}
		if (!email.trim()) {
			errors.push('Correo electrónico es obligatorio');
		} else if (!validateEmail(email)) {
			errors.push('Correo electrónico no tiene un formato válido');
		}
		if (!password) {
			errors.push('Contraseña es obligatoria');
		} else if (!validatePassword(password)) {
			errors.push('La contraseña debe tener al menos 6 caracteres');
		}
		if (!confirmPassword) {
			errors.push('Confirmar contraseña es obligatorio');
		} else if (password !== confirmPassword) {
			errors.push('Las contraseñas no coinciden');
		}
		if (!role) {
			errors.push('Debes seleccionar un rol (Arrendatario o Arrendador)');
		}
		if (!phoneNumber.trim()) {
			errors.push('Número de teléfono es obligatorio');
		}
		if (!birthday) {
			errors.push('Fecha de cumpleaños es obligatoria');
		}

		if (errors.length > 0) {
			setError(errors.join('\n• '));
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
			const cleanNumber = sanitizePhone(phoneNumber);
			const e164 = `${countryCode}${cleanNumber}`;
			await setDoc(doc(db, 'users', user.uid), {
				nombre,
				apellido,
				email,
				role,
				phone: {
					countryCode,
					number: cleanNumber,
					e164,
				},
				birthday: birthday ? birthday : null,
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
				navigation.navigate('LicenseUpload');
			}
		} catch (error: any) {
			console.error('Registration error:', error);
			setError('Error al registrar. Verifica tus datos.');
		} finally {
			setLoading(false);
		}
	};

	return (
		<View style={styles.container}>
			<StatusBar barStyle="light-content" />
			
			{/* Fondo con degradado azul */}
			<LinearGradient
				colors={[colors.background.gradientStart, colors.background.gradientEnd]}
				locations={[0.05, 0.82]}
				style={styles.backgroundGradient}
			/>
			
			<KeyboardAvoidingView 
				style={styles.content}
				behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
			>
				{/* ScrollView porque el formulario es largo */}
				<ScrollView 
					contentContainerStyle={styles.scrollContent}
					showsVerticalScrollIndicator={false}
				>
					{/* Título */}
					<View style={styles.header}>
						<Text style={styles.title}>Crear cuenta</Text>
						<Text style={styles.subtitle}>Completa tus datos para empezar</Text>
					</View>

					{/* Formulario con fondo blanco */}
					<View style={styles.formContainer}>
						{/* Campo de nombre */}
						<View style={styles.inputWrapper}>
							<Ionicons name="person-outline" size={20} color="#6B7280" style={styles.inputIcon} />
							<TextInput
								style={styles.input}
								placeholder="Nombre"
								placeholderTextColor="#9CA3AF"
								value={nombre}
								onChangeText={setNombre}
							/>
						</View>

						{/* Campo de apellido */}
						<View style={styles.inputWrapper}>
							<Ionicons name="person-outline" size={20} color="#6B7280" style={styles.inputIcon} />
							<TextInput
								style={styles.input}
								placeholder="Apellido"
								placeholderTextColor="#9CA3AF"
								value={apellido}
								onChangeText={setApellido}
							/>
						</View>

						{/* Campo de correo */}
						<View style={styles.inputWrapper}>
							<Ionicons name="mail-outline" size={20} color="#6B7280" style={styles.inputIcon} />
							<TextInput
								style={styles.input}
								placeholder="Correo electrónico"
								placeholderTextColor="#9CA3AF"
								autoCapitalize="none"
								keyboardType="email-address"
								value={email}
								onChangeText={setEmail}
							/>
						</View>

						{/* Campo de teléfono: código de país + número */}
						<View style={[styles.inputWrapper, { paddingHorizontal: 0 }]}> 
							<View style={styles.phoneRow}>
								<TouchableOpacity
									style={styles.codeBox}
									onPress={() => setShowCodePicker(true)}
								>
									<Text style={styles.codeText}>{countryCode}</Text>
									<Ionicons name="chevron-down" size={18} color="#6B7280" />
								</TouchableOpacity>
								<TextInput
									style={[styles.input, styles.phoneInput]}
									placeholder="Número de teléfono"
									placeholderTextColor="#9CA3AF"
									keyboardType="phone-pad"
									value={phoneNumber}
									onChangeText={(t) => setPhoneNumber(t.replace(/[^0-9]/g, ''))}
								/>
							</View>
						</View>

						{/* Selector de cumpleaños */}
						<TouchableOpacity style={styles.inputWrapper} onPress={() => setShowDatePicker(true)}>
							<Ionicons name="calendar-outline" size={20} color="#6B7280" style={styles.inputIcon} />
							<Text style={[styles.input, styles.dateText]}> 
								{birthday ? new Date(birthday).toLocaleDateString() : 'Fecha de cumpleaños'}
							</Text>
						</TouchableOpacity>

						{showDatePicker && (
							<DateTimePicker
								value={birthday || new Date(2000, 0, 1)}
								mode="date"
								display={Platform.OS === 'ios' ? 'inline' : 'default'}
								maximumDate={new Date()}
								onChange={(event: DateTimePickerEvent, date?: Date) => {
									if (event.type === 'set' && date) {
										setBirthday(date);
									}
									if (Platform.OS !== 'ios') setShowDatePicker(false);
								}}
							/>
						)}

						{/* Campo de contraseña con toggle */}
						<View style={styles.inputWrapper}>
							<Ionicons name="lock-closed-outline" size={20} color="#6B7280" style={styles.inputIcon} />
							<TextInput
								style={styles.input}
								placeholder="Contraseña"
								placeholderTextColor="#9CA3AF"
								secureTextEntry={!showPassword}
								value={password}
								onChangeText={setPassword}
							/>
							<TouchableOpacity
								style={styles.eyeButton}
								onPress={() => setShowPassword(!showPassword)}
							>
								<Ionicons
									name={showPassword ? "eye-off-outline" : "eye-outline"}
									size={20}
									color="#6B7280"
								/>
							</TouchableOpacity>
						</View>

						{/* Campo de confirmar contraseña con toggle */}
						<View style={styles.inputWrapper}>
							<Ionicons name="lock-closed-outline" size={20} color="#6B7280" style={styles.inputIcon} />
							<TextInput
								style={styles.input}
								placeholder="Confirmar Contraseña"
								placeholderTextColor="#9CA3AF"
								secureTextEntry={!showConfirmPassword}
								value={confirmPassword}
								onChangeText={setConfirmPassword}
							/>
							<TouchableOpacity
								style={styles.eyeButton}
								onPress={() => setShowConfirmPassword(!showConfirmPassword)}
							>
								<Ionicons
									name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
									size={20}
									color="#6B7280"
								/>
							</TouchableOpacity>
						</View>

						{/* Selección de rol */}
						<Text style={styles.roleTitle}>Selecciona tu rol:</Text>
						<View style={styles.roleContainer}>
							<TouchableOpacity
								style={[styles.roleButton, role === 'arrendatario' && styles.roleButtonSelected]}
								onPress={() => setRole('arrendatario')}
							>
								<Ionicons 
									name="car-outline" 
									size={24} 
									color={role === 'arrendatario' ? '#fff' : colors.primary} 
								/>
								<Text style={[styles.roleButtonText, role === 'arrendatario' && styles.roleButtonTextSelected]}>
									Arrendatario
								</Text>
							</TouchableOpacity>
							<TouchableOpacity
								style={[styles.roleButton, role === 'arrendador' && styles.roleButtonSelected]}
								onPress={() => setRole('arrendador')}
							>
								<Ionicons 
									name="key-outline" 
									size={24} 
									color={role === 'arrendador' ? '#fff' : colors.primary} 
								/>
								<Text style={[styles.roleButtonText, role === 'arrendador' && styles.roleButtonTextSelected]}>
									Arrendador
								</Text>
							</TouchableOpacity>
						</View>

						{/* Mensaje de error */}
						{error ? <Text style={styles.error}>• {error}</Text> : null}

						{/* Botón de registro */}
						{loading ? (
							<ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
						) : (
							<TouchableOpacity 
								style={styles.button} 
								onPress={handleRegister}
							>
								<Text style={styles.buttonText}>Registrarse</Text>
							</TouchableOpacity>
						)}

						{/* Link para volver al login */}
						<TouchableOpacity 
							style={styles.linkContainer}
							onPress={() => navigation.replace('Login')}
						>
							<Text style={styles.link}>¿Ya tienes cuenta? </Text>
							<Text style={[styles.link, { color: colors.primary, fontWeight: '600' }]}>Inicia sesión</Text>
						</TouchableOpacity>
					</View>
				</ScrollView>
			</KeyboardAvoidingView>

			{/* Modal de selección de código telefónico */}
			<Modal visible={showCodePicker} transparent animationType="fade">
				<View style={styles.modalOverlay}>
					<View style={styles.modalCard}>
						<Text style={styles.modalTitle}>Selecciona tu código</Text>
						<ScrollView style={{ maxHeight: 300 }}>
							{COUNTRY_CODES.map((item) => (
								<TouchableOpacity
									key={item.code}
									style={styles.modalItem}
									onPress={() => {
										setCountryCode(item.code);
										setShowCodePicker(false);
									}}
								>
									<Text style={styles.modalItemText}>{item.name}</Text>
									<Text style={styles.modalItemCode}>{item.code}</Text>
								</TouchableOpacity>
							))}
						</ScrollView>
						<TouchableOpacity style={styles.modalClose} onPress={() => setShowCodePicker(false)}>
							<Text style={styles.modalCloseText}>Cerrar</Text>
						</TouchableOpacity>
					</View>
				</View>
			</Modal>
		</View>

	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: colors.background.primary,
	},
	backgroundGradient: {
		position: 'absolute',
		left: 0,
		right: 0,
		top: 0,
		height: '100%',
	},
	content: {
		flex: 1,
		width: '100%',
	},
	scrollContent: {
		paddingHorizontal: 20,
		paddingTop: 60,
		paddingBottom: 40,
	},
	header: {
		alignItems: 'center',
		marginBottom: 30,
	},
	title: {
		fontSize: 32,
		fontWeight: '600',
		color: '#fff',
		marginBottom: 8,
	},
	subtitle: {
		fontSize: 16,
		color: 'rgba(255,255,255,0.85)',
	},
	formContainer: {
		backgroundColor: '#fff',
		borderRadius: 20,
		padding: 24,
		shadowColor: '#000',
		shadowOffset: {
			width: 0,
			height: 4,
		},
		shadowOpacity: 0.3,
		shadowRadius: 5,
		elevation: 8,
	},
	inputWrapper: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#F9FAFB',
		borderRadius: 12,
		paddingHorizontal: 15,
		marginBottom: 15,
		height: 50,
		borderWidth: 1,
		borderColor: '#E5E7EB',
	},
	inputIcon: {
		marginRight: 10,
	},
	input: {
		flex: 1,
		height: 50,
		color: '#032B3C',
		fontSize: 16,
		fontWeight: '500',
		backgroundColor: 'transparent',
	},
	phoneRow: {
		flexDirection: 'row',
		alignItems: 'center',
		flex: 1,
	},
	codeBox: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
		paddingHorizontal: 12,
		height: 50,
		borderRightWidth: 1,
		borderRightColor: '#E5E7EB',
	},
	codeText: {
		fontSize: 16,
		color: '#032B3C',
		fontWeight: '600',
	},
	phoneInput: {
		paddingHorizontal: 15,
	},
	dateText: {
		textAlignVertical: 'center',
		color: '#032B3C',
	},
	modalOverlay: {
		flex: 1,
		backgroundColor: 'rgba(0,0,0,0.4)',
		justifyContent: 'center',
		alignItems: 'center',
		padding: 20,
	},
	modalCard: {
		width: '100%',
		maxWidth: 420,
		backgroundColor: '#fff',
		borderRadius: 16,
		padding: 16,
	},
	modalTitle: {
		fontSize: 18,
		fontWeight: '600',
		color: '#032B3C',
		marginBottom: 10,
	},
	modalItem: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingVertical: 12,
		borderBottomWidth: 1,
		borderBottomColor: '#F3F4F6',
	},
	modalItemText: {
		fontSize: 16,
		color: '#032B3C',
	},
	modalItemCode: {
		fontSize: 16,
		color: '#6B7280',
		fontWeight: '600',
	},
	modalClose: {
		marginTop: 10,
		alignSelf: 'center',
		paddingHorizontal: 16,
		paddingVertical: 10,
		borderRadius: 12,
		backgroundColor: '#0B729D',
	},
	modalCloseText: {
		color: '#fff',
		fontWeight: '600',
	},
	eyeButton: {
		padding: 8,
	},
	roleTitle: {
		fontSize: 18,
		fontWeight: '600',
		color: '#032B3C',
		marginBottom: 12,
		marginTop: 8,
	},
	roleContainer: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginBottom: 20,
		gap: 10,
	},
	roleButton: {
		flex: 1,
		height: 80,
		borderColor: colors.primary,
		borderWidth: 1.5,
		borderRadius: 12,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: '#F9FAFB',
		gap: 8,
	},
	roleButtonSelected: {
		backgroundColor: colors.primary,
		borderColor: colors.primary,
	},
	roleButtonText: {
		color: colors.primary,
		fontSize: 14,
		fontWeight: '600',
	},
	roleButtonTextSelected: {
		color: '#fff',
	},
	button: {
		width: '100%',
		height: 52,
		backgroundColor: colors.primary,
		borderRadius: 14,
		alignItems: 'center',
		justifyContent: 'center',
		marginTop: 10,
		shadowColor: colors.primary,
		shadowOffset: {
			width: 0,
			height: 3,
		},
		shadowOpacity: 0.3,
		shadowRadius: 5,
		elevation: 4,
	},
	buttonText: {
		color: '#fff',
		fontSize: 18,
		fontWeight: '600',
	},
	linkContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		marginTop: 16,
	},
	link: {
		color: '#6B7280',
		fontSize: 15,
	},
	error: {
		color: '#EF4444',
		marginBottom: 12,
		fontSize: 14,
		lineHeight: 20,
	},
	loader: {
		marginVertical: 20,
	},
});
