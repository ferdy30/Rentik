# 🔐 Configuración de Google Sign-In

## ✅ Estado Actual
- ✅ Código de Google Auth implementado y activado
- ✅ Componente SocialAuthButtons listo
- ✅ Firebase Auth configurado
- ⚠️ Falta configurar credenciales OAuth de Google

## 📋 Pasos para Activar Google Sign-In

### 1️⃣ Habilitar Google Sign-In en Firebase Console

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto: **rentik-d401e**
3. Ve a **Authentication** → **Sign-in method**
4. Click en **Google** → **Enable**
5. Configura el email de soporte del proyecto
6. Guarda los cambios

---

### 2️⃣ Obtener Web Client ID (Para Expo)

**Ya está configurado automáticamente por Firebase.**

En la configuración de Google en Firebase, copia el **Web Client ID**.

Debería verse así:
```
1066128652427-XXXXXXXXXXXXXXXXX.apps.googleusercontent.com
```

---

### 3️⃣ Configurar Google Cloud Console

#### A. Crear credenciales OAuth para Android

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Selecciona el proyecto de Firebase (rentik-d401e)
3. Ve a **APIs & Services** → **Credentials**
4. Click **+ CREATE CREDENTIALS** → **OAuth client ID**
5. Selecciona **Android**
6. Nombre: `Rentik Android`
7. **Package name**: `com.yourcompany.rentik` (del app.json)
8. **SHA-1 certificate fingerprint**:

   **Para development (debug):**
   ```bash
   # En Windows PowerShell:
   cd C:\Users\lovoj\.android
   keytool -list -v -keystore debug.keystore -alias androiddebugkey -storepass android -keypass android
   ```
   
   Copia el **SHA1** que aparece.

   **Para production:**
   ```bash
   # Genera keystore de producción si no existe:
   keytool -genkey -v -keystore rentik-release.keystore -alias rentik -keyalg RSA -keysize 2048 -validity 10000
   
   # Obtén SHA-1:
   keytool -list -v -keystore rentik-release.keystore -alias rentik
   ```

9. Click **CREATE**
10. Copia el **Client ID** generado

#### B. Crear credenciales OAuth para iOS (Opcional, si tienes Mac)

1. En Google Cloud Console → **Credentials**
2. Click **+ CREATE CREDENTIALS** → **OAuth client ID**
3. Selecciona **iOS**
4. Nombre: `Rentik iOS`
5. **Bundle ID**: `com.yourcompany.rentik` (del app.json)
6. Click **CREATE**
7. Copia el **Client ID** generado

---

### 4️⃣ Actualizar app.json con las credenciales

Edita `app.json` y reemplaza los valores en `extra`:

```json
"extra": {
  "googleWebClientId": "1066128652427-XXXXXXXXX.apps.googleusercontent.com",
  "googleAndroidClientId": "1066128652427-YYYYYYYYY.apps.googleusercontent.com",
  "googleIosClientId": "1066128652427-ZZZZZZZZZ.apps.googleusercontent.com",
  ...
}
```

**Importante:** 
- `googleWebClientId` = El Web Client ID de Firebase (termina en `.apps.googleusercontent.com`)
- `googleAndroidClientId` = El Android Client ID que creaste en paso 3A
- `googleIosClientId` = El iOS Client ID que creaste en paso 3B (o déjalo en blanco si no tienes iOS)

---

### 5️⃣ Rebuild de la app

```bash
# Limpiar caché
npx expo start -c

# O en terminal separado:
npm start -- --clear
```

---

## 🧪 Probar Google Sign-In

1. Abre la app en tu dispositivo/emulador
2. En la pantalla de Login, deberías ver el botón **"Continuar con Google"**
3. Click en el botón
4. Selecciona una cuenta de Google
5. Autoriza los permisos
6. Deberías ser redirigido automáticamente a la app

---

## 🔍 Troubleshooting

### Error: "Developer Error" o "10" en Android
**Causa:** SHA-1 fingerprint incorrecto o falta agregarlo.

**Solución:**
1. Obtén el SHA-1 correcto:
   ```bash
   cd C:\Users\lovoj\.android
   keytool -list -v -keystore debug.keystore -alias androiddebugkey -storepass android -keypass android
   ```
2. Agrégalo en Google Cloud Console → Credentials → Edit Android OAuth Client
3. Espera 5-10 minutos para que se propague
4. Reinicia la app

### Error: "Sign in with Google temporarily disabled"
**Causa:** Google Auth no está habilitado en Firebase Console.

**Solución:**
1. Firebase Console → Authentication → Sign-in method
2. Enable Google
3. Guarda

### Error: "No idToken received"
**Causa:** Los Client IDs no coinciden o están mal configurados.

**Solución:**
1. Verifica que `googleWebClientId` en `app.json` sea el correcto (de Firebase)
2. Verifica que `googleAndroidClientId` coincida con el de Google Cloud Console
3. Asegúrate de que el package name sea exactamente `com.yourcompany.rentik`

### Error: "DEVELOPER_ERROR" en expo-auth-session
**Causa:** El redirect URI no está autorizado.

**Solución:**
1. En Google Cloud Console → Credentials → Web OAuth Client
2. En **Authorized redirect URIs**, agrega:
   - `https://auth.expo.io/@yourUsername/rentik`
   - Para Expo Go: Ya está configurado automáticamente
   - Para standalone: `com.yourcompany.rentik:/oauthredirect`

### La pantalla de Google se cierra inmediatamente
**Causa:** El `scheme` en app.json no coincide.

**Solución:**
1. Verifica que `app.json` tenga: `"scheme": "rentik"`
2. Reconstruye la app: `npx expo start -c`

---

## 📱 Testing Checklist

- [ ] Habilitar Google en Firebase Console
- [ ] Crear Android OAuth Client con SHA-1 correcto
- [ ] Actualizar app.json con todos los Client IDs
- [ ] Rebuild con caché limpio
- [ ] Probar login en Android
- [ ] Verificar que crea usuario en Firestore con datos de Google
- [ ] Verificar que muestra nombre/email de Google en perfil
- [ ] Probar cerrar sesión y volver a entrar con Google

---

## 🚀 Próximos Pasos (Opcional)

### Apple Sign-In (Requiere Apple Developer Program $99/año)
1. Inscribirse en [Apple Developer Program](https://developer.apple.com/programs/)
2. Crear App ID con Sign In with Apple capability
3. Configurar en Firebase Console
4. Descomentar código de Apple Auth en `SocialAuthButtons.tsx`

### Facebook Login
1. Crear app en [Facebook Developers](https://developers.facebook.com/)
2. Habilitar Facebook Login
3. Configurar en Firebase Console
4. Instalar: `expo install expo-auth-session expo-facebook`
5. Implementar similar a Google

---

## 📊 Beneficios de Social Login

- ✅ **40-60% más conversión** en signup
- ✅ **Menos abandono** (no llenar formularios largos)
- ✅ **Datos verificados** (email real de Google)
- ✅ **Foto de perfil** automática
- ✅ **UX moderna** (standard de la industria)

---

## 🔗 Links Útiles

- [Firebase Console](https://console.firebase.google.com/)
- [Google Cloud Console](https://console.cloud.google.com/)
- [Expo Google Auth Docs](https://docs.expo.dev/guides/authentication/#google)
- [Firebase Auth Docs](https://firebase.google.com/docs/auth/web/google-signin)

---

**¿Necesitas ayuda?** Revisa los errores en la consola con `console.log('[GOOGLE_LOGIN]', ...)` 

El código ya tiene logs detallados para debugging.
