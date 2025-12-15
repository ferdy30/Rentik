import { Ionicons } from '@expo/vector-icons';
import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Props {
	children: ReactNode;
	fallback?: ReactNode;
	onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
	hasError: boolean;
	error: Error | null;
}

/**
 * Error Boundary Component
 * Captura errores en componentes hijos y muestra UI de fallback
 */
export class ErrorBoundary extends Component<Props, State> {
	constructor(props: Props) {
		super(props);
		this.state = {
			hasError: false,
			error: null,
		};
	}

	static getDerivedStateFromError(error: Error): State {
		return {
			hasError: true,
			error,
		};
	}

	componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
		console.error('ErrorBoundary caught an error:', error, errorInfo);
		
		// Llamar callback personalizado si existe
		if (this.props.onError) {
			this.props.onError(error, errorInfo);
		}
	}

	handleReset = (): void => {
		this.setState({
			hasError: false,
			error: null,
		});
	};

	render(): ReactNode {
		if (this.state.hasError) {
			// Si hay un fallback personalizado, usarlo
			if (this.props.fallback) {
				return this.props.fallback;
			}

			// UI de error por defecto
			return (
				<View style={styles.container}>
					<View style={styles.iconContainer}>
						<Ionicons name="alert-circle-outline" size={64} color="#DC2626" />
					</View>
					<Text style={styles.title}>¡Algo salió mal!</Text>
					<Text style={styles.message}>
						Lo sentimos, ocurrió un error inesperado.
					</Text>
					{__DEV__ && this.state.error && (
						<View style={styles.errorBox}>
							<Text style={styles.errorText}>{this.state.error.message}</Text>
						</View>
					)}
					<TouchableOpacity style={styles.button} onPress={this.handleReset}>
						<Ionicons name="refresh" size={20} color="white" />
						<Text style={styles.buttonText}>Reintentar</Text>
					</TouchableOpacity>
				</View>
			);
		}

		return this.props.children;
	}
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		padding: 24,
		backgroundColor: '#F9FAFB',
	},
	iconContainer: {
		marginBottom: 24,
	},
	title: {
		fontSize: 24,
		fontWeight: '700',
		color: '#1F2937',
		marginBottom: 12,
		textAlign: 'center',
	},
	message: {
		fontSize: 16,
		color: '#6B7280',
		textAlign: 'center',
		marginBottom: 24,
		lineHeight: 24,
	},
	errorBox: {
		backgroundColor: '#FEE2E2',
		padding: 16,
		borderRadius: 8,
		marginBottom: 24,
		width: '100%',
	},
	errorText: {
		fontSize: 12,
		color: '#DC2626',
		fontFamily: 'monospace',
	},
	button: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		backgroundColor: '#0B729D',
		paddingHorizontal: 24,
		paddingVertical: 12,
		borderRadius: 8,
	},
	buttonText: {
		color: 'white',
		fontSize: 16,
		fontWeight: '600',
	},
});
