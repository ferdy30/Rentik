# 🔐 Configuración de Seguridad - Rentik

Este archivo explica cómo configurar las claves de API de forma segura.

## ⚠️ Archivos Sensibles (NO subirlos a Git)

Los siguientes archivos contienen claves de API y NO deben ser subidos al repositorio:

- ✅ `app.json` - Ya está en `.gitignore`
- ✅ `FirebaseConfig.js` - Ya está en `.gitignore`

## 📋 Configuración Inicial

### 1. Copiar el archivo de ejemplo

```bash
cp app.example.json app.json
```

### 2. Configurar Google Maps API Keys

Edita `app.json` y reemplaza los siguientes valores:

```json
{
  "expo": {
    "ios": {
      "config": {
        "googleMapsApiKey": "TU_API_KEY_IOS"
      }
    },
    "android": {
      "config": {
        "googleMaps": {
          "apiKey": "TU_API_KEY_ANDROID"
        }
      }
    },
    "extra": {
      "googleMapsApiKey": "TU_API_KEY_GENERAL"
    }
  }
}
```

### 3. APIs de Google que debes habilitar

En [Google Cloud Console](https://console.cloud.google.com/):

1. **Places API** (o Places API - New) - Para búsqueda de direcciones
2. **Geocoding API** - Para convertir coordenadas ↔ direcciones
3. **Maps SDK for Android** - Para mapas en Android
4. **Maps SDK for iOS** - Para mapas en iOS

### 4. Configurar Firebase

Copia el archivo de ejemplo:

```bash
cp FirebaseConfig.example.js FirebaseConfig.js
```

Luego edita `FirebaseConfig.js` con tus credenciales de Firebase.

### 5. Configurar Stripe

En `app.json`, actualiza:

```json
{
  "extra": {
    "stripePublishableKey": "TU_STRIPE_PUBLISHABLE_KEY"
  }
}
```

## 🚀 Para nuevos desarrolladores

1. Clona el repositorio
2. Ejecuta: `npm install`
3. Copia los archivos `.example` y configura tus propias claves
4. **Nunca** hagas commit de archivos con claves reales

## ⚠️ Importante

- Las claves de API deben ser únicas por desarrollador/proyecto
- No compartas tus claves en Discord, Slack, email, etc.
- Si una clave se filtra, revócala inmediatamente en Google Cloud Console

## 📝 Notas Adicionales

### Google Maps API Keys actuales:

- **iOS**: `AIzaSyA7iRMnvdgPPmohLZhHvyZAlsZcEaUPJr4`
- **Android**: `AIzaSyA7iRMnvdgPPmohLZhHvyZAlsZcEaUPJr4`
- **Geocoding**: `AIzaSyA7iRMnvdgPPmohLZhHvyZAlsZcEaUPJr4`

### Restricciones recomendadas:

- **Application restrictions**: Solo para tu bundle ID (`com.yourcompany.rentik`)
- **API restrictions**: Solo las APIs que necesitas
- **Cuotas**: Monitorea el uso para evitar cargos inesperados
