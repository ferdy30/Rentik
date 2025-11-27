/**
 * Utilidades para manejo centralizado de errores
 * Proporciona mensajes de error amigables para el usuario
 */

import { Alert } from 'react-native';

export interface ErrorResponse {
  code: string;
  message: string;
  userMessage: string;
}

/**
 * Códigos de error comunes de Firebase
 */
const FIREBASE_ERROR_MESSAGES: Record<string, string> = {
  // Auth errors
  'auth/email-already-in-use': 'Este correo ya está registrado. Intenta iniciar sesión.',
  'auth/invalid-email': 'El correo electrónico no es válido.',
  'auth/operation-not-allowed': 'Operación no permitida. Contacta soporte.',
  'auth/weak-password': 'La contraseña es muy débil. Usa al menos 6 caracteres.',
  'auth/user-disabled': 'Esta cuenta ha sido deshabilitada.',
  'auth/user-not-found': 'Usuario no encontrado. Verifica tus credenciales.',
  'auth/wrong-password': 'Contraseña incorrecta. Intenta de nuevo.',
  'auth/too-many-requests': 'Demasiados intentos. Intenta más tarde.',
  'auth/network-request-failed': 'Error de conexión. Verifica tu internet.',

  // Firestore errors
  'permission-denied': 'No tienes permiso para realizar esta acción.',
  'unavailable': 'Servicio no disponible. Verifica tu conexión.',
  'not-found': 'Recurso no encontrado.',
  'already-exists': 'El recurso ya existe.',
  'resource-exhausted': 'Se excedió el límite de uso. Intenta más tarde.',
  'failed-precondition': 'Operación fallida. Verifica los datos.',
  'aborted': 'Operación cancelada. Intenta de nuevo.',
  'out-of-range': 'Valor fuera de rango permitido.',
  'unimplemented': 'Operación no implementada.',
  'internal': 'Error interno del servidor. Intenta más tarde.',
  'data-loss': 'Pérdida de datos. Contacta soporte.',
  'unauthenticated': 'Debes iniciar sesión para continuar.',

  // Storage errors
  'storage/unauthorized': 'No tienes permiso para subir archivos.',
  'storage/canceled': 'Carga cancelada por el usuario.',
  'storage/unknown': 'Error desconocido al subir archivo.',
  'storage/object-not-found': 'Archivo no encontrado.',
  'storage/bucket-not-found': 'Bucket de almacenamiento no encontrado.',
  'storage/project-not-found': 'Proyecto no encontrado.',
  'storage/quota-exceeded': 'Cuota de almacenamiento excedida.',
  'storage/unauthenticated': 'Debes iniciar sesión para subir archivos.',
  'storage/retry-limit-exceeded': 'Tiempo de espera agotado. Intenta de nuevo.',
  'storage/invalid-checksum': 'Archivo corrupto. Intenta de nuevo.',
  'storage/invalid-event-name': 'Evento inválido.',
  'storage/invalid-url': 'URL de archivo inválida.',
  'storage/invalid-argument': 'Argumento inválido.',
  'storage/no-default-bucket': 'No se configuró un bucket por defecto.',
  'storage/cannot-slice-blob': 'Archivo muy grande o corrupto.',
  'storage/server-file-wrong-size': 'Tamaño de archivo no coincide.',
};

/**
 * Mensajes genéricos para errores de red
 */
const NETWORK_ERROR_MESSAGES: Record<string, string> = {
  'Network request failed': 'Error de conexión. Verifica tu internet.',
  'Failed to fetch': 'No se pudo conectar al servidor. Verifica tu internet.',
  'timeout': 'La solicitud tardó demasiado. Intenta de nuevo.',
  'ETIMEDOUT': 'Tiempo de espera agotado. Verifica tu conexión.',
  'ECONNREFUSED': 'No se pudo conectar al servidor.',
  'ENOTFOUND': 'Servidor no encontrado. Verifica tu conexión.',
};

/**
 * Obtiene un mensaje de error amigable para el usuario
 */
export function getUserFriendlyError(error: any): ErrorResponse {
  // Si es un string simple
  if (typeof error === 'string') {
    return {
      code: 'unknown',
      message: error,
      userMessage: error,
    };
  }

  // Si tiene código de Firebase
  if (error?.code) {
    const userMessage = FIREBASE_ERROR_MESSAGES[error.code] || error.message || 'Error desconocido';
    return {
      code: error.code,
      message: error.message || '',
      userMessage,
    };
  }

  // Si es un error de red
  const errorMessage = error?.message || '';
  for (const [key, message] of Object.entries(NETWORK_ERROR_MESSAGES)) {
    if (errorMessage.includes(key)) {
      return {
        code: 'network-error',
        message: errorMessage,
        userMessage: message,
      };
    }
  }

  // Error genérico
  return {
    code: 'unknown',
    message: errorMessage,
    userMessage: 'Ocurrió un error inesperado. Intenta de nuevo.',
  };
}

/**
 * Muestra un Alert con el error formateado
 */
export function showErrorAlert(error: any, title: string = 'Error') {
  const errorResponse = getUserFriendlyError(error);
  Alert.alert(title, errorResponse.userMessage);
}

/**
 * Log de error para debugging (solo en desarrollo)
 */
export function logError(context: string, error: any) {
  if (__DEV__) {
    console.error(`[${context}]`, error);
  }
}

/**
 * Maneja un error de forma completa: log + alert
 */
export function handleError(context: string, error: any, title: string = 'Error') {
  logError(context, error);
  showErrorAlert(error, title);
}
