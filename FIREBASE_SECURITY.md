# 🔐 Configuración de Firebase - Instrucciones de Seguridad

## ⚠️ IMPORTANTE: Protección de credenciales

Este proyecto usa Firebase y requiere credenciales sensibles que **NUNCA deben subirse a GitHub**.

## 📋 Configuración inicial

### Opción 1: Variables de Entorno (Recomendado)

1. **Crea un archivo `.env` desde el ejemplo:**
   ```bash
   copy .env.example .env
   ```

2. **Obtén tus credenciales:**
   - Ve a [Firebase Console](https://console.firebase.google.com/)
   - Selecciona tu proyecto
   - Ve a Configuración del proyecto → Tus apps → SDK setup and configuration
   - Copia la configuración

3. **Completa el archivo `.env`:**
   - Abre `.env`
   - Reemplaza todos los valores con tus credenciales reales
   - **NO subas este archivo a GitHub** (ya está en `.gitignore`)

### Opción 2: Archivo de Configuración Local

1. **Copia el archivo de ejemplo:**
   ```bash
   copy FirebaseConfig.example.js FirebaseConfig.js
   ```

2. **Reemplaza los valores en `FirebaseConfig.js`:**
   - Abre `FirebaseConfig.js`
   - Reemplaza todos los valores de ejemplo con tus credenciales reales
   - **NO subas este archivo a GitHub** (ya está en `.gitignore`)

## 🔒 Seguridad de la API Key

### Si tu API Key fue expuesta:

1. **Regenera inmediatamente:**
   - Ve a [Google Cloud Credentials](https://console.cloud.google.com/apis/credentials)
   - Busca tu clave expuesta
   - Haz clic en "Regenerar clave"
   - Actualiza `FirebaseConfig.js` con la nueva clave

2. **Aplica restricciones:**
   - En Google Cloud Console → API & Services → Credentials
   - Edita tu API Key
   - En "Application restrictions": selecciona "HTTP referrers" o "Android apps"
   - En "API restrictions": selecciona solo las APIs que uses (Firestore, Storage, Auth)

3. **Elimina el historial de Git:**
   ```bash
   # Opción 1: Usar BFG Repo-Cleaner (recomendado)
   # Descarga BFG de https://rtyley.github.io/bfg-repo-cleaner/
   java -jar bfg.jar --delete-files FirebaseConfig.js
   git reflog expire --expire=now --all
   git gc --prune=now --aggressive
   git push --force

   # Opción 2: Usar git filter-branch
   git filter-branch --force --index-filter \
   "git rm --cached --ignore-unmatch FirebaseConfig.js" \
   --prune-empty --tag-name-filter cat -- --all
   git push --force --all
   ```

## ✅ Verificación

Antes de hacer commit:
- ✅ `FirebaseConfig.js` está en `.gitignore`
- ✅ No ves `FirebaseConfig.js` en `git status`
- ✅ Solo `FirebaseConfig.example.js` se sube a GitHub

## 📚 Más información

- [Firebase Security Rules](https://firebase.google.com/docs/rules)
- [Best practices for API Keys](https://cloud.google.com/docs/authentication/api-keys)
