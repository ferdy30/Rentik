# 🔐 Configuración de Variables de Entorno - Rentik

Este documento explica cómo configurar las credenciales necesarias para el proyecto.

## ⚠️ IMPORTANTE

**NUNCA subas archivos con credenciales reales a Git**. Todos los archivos con secrets están protegidos en `.gitignore`.

---

## 📋 Configuración Inicial

### 1️⃣ Firebase Configuration

**Archivo**: `FirebaseConfig.js`

```bash
# 1. Copia el archivo de ejemplo
copy FirebaseConfig.example.js FirebaseConfig.js
```

**2. Obtén tus credenciales:**
- Ve a [Firebase Console](https://console.firebase.google.com/)
- Selecciona tu proyecto `rentik-d401e`
- Ve a **Configuración del proyecto** (ícono de engranaje) → **General**
- Busca la sección **Tus apps** → **SDK setup and configuration**
- Selecciona **Config** para ver el objeto JavaScript
- Copia los valores

**3. Edita `FirebaseConfig.js`** con tus valores reales:

```javascript
const firebaseConfig = {
  apiKey: "TU_API_KEY_AQUI",
  authDomain: "rentik-d401e.firebaseapp.com",
  projectId: "rentik-d401e",
  storageBucket: "rentik-d401e.firebasestorage.app",
  messagingSenderId: "TU_MESSAGING_SENDER_ID",
  appId: "TU_APP_ID",
  measurementId: "TU_MEASUREMENT_ID"
};
```

---

### 2️⃣ Cloud Functions Environment Variables

**Archivo**: `functions/.env`

```bash
# 1. Navega a la carpeta functions
cd functions

# 2. Copia el archivo de ejemplo
copy .env.example .env
```

**3. Edita `functions/.env`** con tus valores:

```env
# Stripe Secret Key (Test o Live)
STRIPE_SECRET=sk_test_TU_STRIPE_SECRET_KEY

# Stripe Webhook Secret
STRIPE_WEBHOOK_SECRET=whsec_TU_WEBHOOK_SECRET

# Google Maps API Key (para Cloud Functions)
GOOGLE_MAPS_API_KEY=TU_GOOGLE_MAPS_API_KEY
```

**Obtener Stripe keys:**
1. Ve a [Stripe Dashboard](https://dashboard.stripe.com/)
2. Cambia a modo **Test** (toggle arriba a la derecha)
3. Ve a **Developers** → **API keys**
4. Copia la **Secret key** (empieza con `sk_test_`)
5. Para el webhook secret, ve a **Developers** → **Webhooks** → crea un endpoint y copia el secret

**Obtener Google Maps API Key:**
1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Selecciona tu proyecto
3. Ve a **APIs & Services** → **Credentials**
4. Copia tu API key existente o crea una nueva

---

### 3️⃣ App Configuration

**Archivo**: `app.json`

Las siguientes claves ya están configuradas pero debes aplicar **restricciones** por seguridad:

**Google Maps API Keys** (líneas 22, 33, 51):
- Estas keys son públicas pero deben tener restricciones
- Ve a Google Cloud Console → API Keys
- Edita tu key y agrega:
  - **Application restrictions**: Bundle ID para iOS (`com.yourcompany.rentik`), Package name para Android
  - **API restrictions**: Solo habilita Maps SDK for iOS, Maps SDK for Android, Places API

**Stripe Publishable Key** (línea 48):
- La publishable key (`pk_test_...`) es segura en código cliente ✅
- Ya está configurada correctamente

**Google OAuth Client IDs** (líneas 45-47):
- Actualmente con placeholders
- Obtén tus Client IDs desde [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials
- Crea OAuth 2.0 Client IDs para Web, iOS, y Android
- Reemplaza los valores en `app.json`

---

## 🔒 Seguridad

### Restricciones de API Keys

#### Firebase API Key
1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. APIs & Services → Credentials
3. Encuentra tu Firebase API key
4. Agrega restricciones:
   - **Application restrictions**: HTTP referrers para web, Bundle ID/Package para apps
   - **API restrictions**: Solo habilita las APIs que uses (Firestore, Auth, Storage)

#### Google Maps API Key
- **Application restrictions**: Bundle ID para iOS, Package name para Android
- **API restrictions**: Maps SDK for iOS, Maps SDK for Android, Places API (New)

#### Stripe Keys
- Usa **test keys** (`sk_test_`, `pk_test_`) durante desarrollo
- Cambia a **live keys** solo en producción
- Webhook secret debe coincidir con el endpoint configurado en Stripe Dashboard

---

## ✅ Verificación

Antes de hacer commit, verifica:

```powershell
# 1. FirebaseConfig.js NO debe aparecer
git status

# 2. Debes ver FirebaseConfig.example.js como untracked
# 3. functions/.env NO debe aparecer
```

Si ves `FirebaseConfig.js` o `functions/.env` en `git status`:

```powershell
# Remover del tracking sin eliminar el archivo
git rm --cached FirebaseConfig.js
git rm --cached functions/.env
```

---

## 📚 Recursos

- [Firebase Console](https://console.firebase.google.com/)
- [Stripe Dashboard](https://dashboard.stripe.com/)
- [Google Cloud Console](https://console.cloud.google.com/)
- [Firebase Security Rules](https://firebase.google.com/docs/rules)
- [Stripe Connect Documentation](https://stripe.com/docs/connect)
- [Google Maps Platform](https://console.cloud.google.com/google/maps-apis)

---

## 🆘 Troubleshooting

### Error: "Firebase API key not found"
- Verifica que `FirebaseConfig.js` existe (no `.example`)
- Verifica que los valores no sean placeholders

### Error: "Stripe functions error"
- Verifica que `functions/.env` existe
- Verifica que las keys empiezan con `sk_test_` o `sk_live_`

### Error: "Google Maps not loading"
- Verifica que la API key en `app.json` tiene permisos correctos
- Verifica que Places API (New) está habilitada en Google Cloud

---

**Última actualización**: Noviembre 2025
