# 🚀 Guía de Deployment y Testing - Mejoras Check-In

## 📋 Pre-requisitos

Antes de integrar las mejoras, asegúrate de tener:

- ✅ Node.js v16 o superior
- ✅ Expo CLI instalado globalmente
- ✅ Android Studio (para testing Android)
- ✅ Xcode (para testing iOS, solo macOS)
- ✅ Cuenta de Firebase configurada
- ✅ Permisos de notificaciones configurados

---

## 🔧 Instalación de Dependencias

Todas las dependencias ya deberían estar instaladas. Si encuentras errores, ejecuta:

```bash
npm install
```

### Verificar Dependencias Críticas

```bash
npx expo install expo-location expo-notifications expo-image-picker
```

---

## 📱 Configuración de Plataformas

### iOS (Info.plist)

Agrega estos permisos en `ios/[TuApp]/Info.plist`:

```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>Rentik necesita tu ubicación para verificar que estás en el punto de check-in</string>

<key>NSLocationAlwaysUsageDescription</key>
<string>Rentik usa tu ubicación para mejorar la experiencia de check-in</string>

<key>NSCameraUsageDescription</key>
<string>Rentik necesita acceso a la cámara para documentar el estado del vehículo</string>

<key>NSPhotoLibraryUsageDescription</key>
<string>Rentik necesita acceso a tus fotos para cargar imágenes del vehículo</string>
```

### Android (AndroidManifest.xml)

Agrega estos permisos en `android/app/src/main/AndroidManifest.xml`:

```xml
<!-- Ubicación -->
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />

<!-- Cámara -->
<uses-permission android:name="android.permission.CAMERA" />

<!-- Notificaciones (Android 13+) -->
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />

<!-- Internet -->
<uses-permission android:name="android.permission.INTERNET" />
```

### Firestore Security Rules

Actualiza las reglas de seguridad para permitir el nuevo campo `errors` en check-ins:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /checkIns/{checkInId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null && 
        (request.resource.data.renterId == request.auth.uid || 
         request.resource.data.ownerId == request.auth.uid);
      allow delete: if request.auth != null && 
        (resource.data.renterId == request.auth.uid || 
         resource.data.ownerId == request.auth.uid);
    }
  }
}
```

---

## 🧪 Testing en Desarrollo

### 1. Testing con Expo Go (Limitado)

```bash
npx expo start
```

**Limitaciones en Expo Go:**
- ❌ Notificaciones push no funcionarán completamente
- ✅ UI y navegación funcionan
- ✅ Ubicación funciona
- ✅ Cámara funciona

### 2. Testing con Development Build (Recomendado)

#### Android:

```bash
# Crear build de desarrollo
npx eas build --profile development --platform android

# O build local
npx expo run:android
```

#### iOS:

```bash
# Crear build de desarrollo
npx eas build --profile development --platform ios

# O build local (solo macOS)
npx expo run:ios
```

---

## 🔍 Plan de Testing

### Test Suite Completo

#### 1. Test de Servicios

**checkIn.ts:**
```bash
# Test manual - Ejecutar en consola de desarrollo
```

```typescript
// En una pantalla de test
import {
  revertCheckIn,
  cancelAbandonedCheckIn,
  generateSecureKeyCode,
  verifyKeyCode,
  validateOdometer,
  logCheckInError,
} from './services/checkIn';

// Test 1: Código de llaves
const code = generateSecureKeyCode();
console.log('Generated code:', code); // Debe ser 6 caracteres

// Test 2: Validación de kilometraje
const validation = await validateOdometer('vehicleId', 100000);
console.log('Odometer validation:', validation);

// Test 3: Error logging
await logCheckInError('checkInId', 'TestScreen', 'Test error', 'TEST_CODE');
```

**location.ts:**
```typescript
import { getCurrentLocation, calculateDistance } from './services/location';

// Test ubicación
const { location, error } = await getCurrentLocation();
console.log('Current location:', location);

// Test distancia
const distance = calculateDistance(13.7040, -89.2181, 13.7041, -89.2182);
console.log('Distance:', distance, 'meters');
```

**pushNotifications.ts:**
```typescript
import { scheduleAllCheckInReminders } from './services/pushNotifications';

// Test notificaciones (requiere build standalone)
const startDate = new Date(Date.now() + 25 * 60 * 60 * 1000); // 25 horas después
const ids = await scheduleAllCheckInReminders(
  'test-reservation',
  startDate,
  'Toyota Corolla 2020',
  'San Salvador'
);
console.log('Notification IDs:', ids);
```

#### 2. Test de Componentes UI

**CheckInProgressIndicator:**
- [ ] Se muestra correctamente
- [ ] Actualiza el paso actual
- [ ] Muestra porcentaje correcto
- [ ] Pasos completados tienen checkmark

**PhotoPreviewModal:**
- [ ] Abre al tocar foto
- [ ] Zoom funciona (pellizcar)
- [ ] Navegación entre fotos funciona
- [ ] Eliminar foto funciona
- [ ] Cerrar modal funciona

**PreviousDamagesDisplay:**
- [ ] Carga daños anteriores
- [ ] Expandir/colapsar funciona
- [ ] Ver fotos de daños funciona
- [ ] Muestra mensaje si no hay daños

**PhotoComparison:**
- [ ] Muestra fotos lado a lado
- [ ] Labels "ANTES" y "AHORA" visibles
- [ ] Tocar foto amplía
- [ ] Timestamps se muestran

**InteractiveGuide:**
- [ ] Abre correctamente
- [ ] Navegación entre pasos funciona
- [ ] Barra de progreso actualiza
- [ ] Cerrar funciona
- [ ] "Entendido" en último paso cierra

**EmergencyMode:**
- [ ] Abre al tocar botón SOS
- [ ] Contactos se muestran
- [ ] Llamar funciona
- [ ] Compartir ubicación funciona

#### 3. Test de Integración

**Flujo Completo de Check-In:**

1. **Inicio**
   - [ ] Indicador de progreso en paso 0
   - [ ] Botón de ayuda muestra guía
   - [ ] Botón SOS siempre visible

2. **Fotos**
   - [ ] Tomar foto obligatoria
   - [ ] Vista previa funciona
   - [ ] Eliminar foto funciona
   - [ ] Daños previos se muestran
   - [ ] Error logging si falla subida

3. **Condiciones**
   - [ ] Validación de kilometraje funciona
   - [ ] Warning si kilometraje inválido
   - [ ] Se guardan condiciones

4. **Daños**
   - [ ] Comparación con daños previos
   - [ ] Agregar nuevo daño
   - [ ] Foto de daño funciona

5. **Llaves**
   - [ ] Código generado automáticamente
   - [ ] Verificación de código funciona

6. **Firma**
   - [ ] Firma digital funciona
   - [ ] Guardar firma

7. **Completar**
   - [ ] Notificación de completado
   - [ ] Datos guardados en Firestore

---

## 🚀 Deployment a Producción

### 1. Preparar Build de Producción

#### Android (Google Play)

```bash
# Configurar app.json
{
  "expo": {
    "android": {
      "permissions": [
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "CAMERA",
        "POST_NOTIFICATIONS"
      ],
      "config": {
        "googleMaps": {
          "apiKey": "TU_API_KEY"
        }
      }
    }
  }
}

# Build para producción
eas build --profile production --platform android
```

#### iOS (App Store)

```bash
# Build para producción
eas build --profile production --platform ios
```

### 2. Verificar Funcionalidades en Build

Antes de publicar, probar en build de producción:

```bash
# Instalar build en dispositivo de prueba
eas build:run -p android
eas build:run -p ios
```

**Checklist de verificación:**
- [ ] Notificaciones push funcionan
- [ ] Ubicación se obtiene correctamente
- [ ] Fotos se suben a Firebase Storage
- [ ] Check-in completo se guarda en Firestore
- [ ] Errores se registran correctamente
- [ ] No hay crashes

### 3. Monitoreo Post-Deployment

#### Firebase Crashlytics

Agregar en `app.json`:
```json
{
  "expo": {
    "plugins": [
      "@react-native-firebase/crashlytics"
    ]
  }
}
```

#### Analytics de Errores

Los errores ya se registran automáticamente con `logCheckInError()`. 

Para monitorear:
```typescript
// Crear dashboard en Firebase Console
// Firestore > checkIns > filtrar por campo "errors"
```

---

## 📊 Métricas a Monitorear

### KPIs del Check-In

1. **Tasa de Completitud**
   - Check-ins iniciados vs completados
   - Tiempo promedio de completitud
   - Abandono por paso

2. **Errores**
   - Frecuencia de errores por tipo
   - Pasos con más errores
   - Tiempo promedio para recuperación

3. **Uso de Funcionalidades**
   - % de usuarios que ven la guía
   - % de uso de vista previa de fotos
   - % de check-ins con daños reportados

### Consultas de Firestore

```javascript
// Check-ins con errores
db.collection('checkIns')
  .where('errors', '!=', null)
  .get();

// Check-ins revertidos
db.collection('checkIns')
  .where('revertedAt', '!=', null)
  .get();

// Check-ins cancelados
db.collection('checkIns')
  .where('status', '==', 'cancelled')
  .get();
```

---

## 🐛 Troubleshooting

### Problema: Notificaciones no funcionan

**Solución:**
1. Verificar permisos en AndroidManifest.xml / Info.plist
2. Confirmar que se está usando build standalone (no Expo Go)
3. Verificar que el canal de Android está creado
4. Revisar logs con `adb logcat` (Android) o Console.app (iOS)

### Problema: Ubicación no se obtiene

**Solución:**
1. Verificar permisos de ubicación
2. Activar GPS en el dispositivo
3. Verificar que se está en exterior (mejor señal GPS)
4. Aumentar timeout en `getCurrentLocation()`

### Problema: Fotos no se suben

**Solución:**
1. Verificar conexión a Internet
2. Revisar reglas de Firebase Storage
3. Comprimir imágenes antes de subir
4. Verificar logs de error con `logCheckInError()`

### Problema: Error en TypeScript

**Solución:**
```bash
# Limpiar caché
npx expo start --clear

# Verificar tipos
npx tsc --noEmit

# Reinstalar dependencias
rm -rf node_modules
npm install
```

---

## 📚 Recursos Adicionales

### Documentación

- [Expo Location](https://docs.expo.dev/versions/latest/sdk/location/)
- [Expo Notifications](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [Firebase Firestore](https://firebase.google.com/docs/firestore)
- [React Navigation](https://reactnavigation.org/docs/getting-started)

### Support

- GitHub Issues: [Reportar bugs]
- Slack: #rentik-support
- Email: support@rentik.com

---

## ✅ Checklist Final de Deployment

### Pre-Deployment
- [ ] Todos los tests pasan
- [ ] No hay errores de TypeScript
- [ ] Permisos configurados (iOS y Android)
- [ ] Firebase configurado correctamente
- [ ] Builds de desarrollo probados

### Deployment
- [ ] Build de producción creado
- [ ] Testing en dispositivos reales
- [ ] Notificaciones funcionan
- [ ] Ubicación funciona
- [ ] Errores se registran

### Post-Deployment
- [ ] Monitoreo activo de errores
- [ ] Analytics configurado
- [ ] Feedback de usuarios recopilado
- [ ] Documentación actualizada

---

**¡Éxito en el deployment! 🚀**

Si encuentras problemas, consulta la sección de Troubleshooting o contacta al equipo de desarrollo.

---

*Última actualización: 5 de enero de 2026*
