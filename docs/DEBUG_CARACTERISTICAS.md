# Debug: Características y Descripción no se muestran en Details

## Problema
Al crear un vehículo con características y descripción en Add Vehicle, estos datos no aparecen en Car Details.

## Flujo de datos implementado

### 1. Creación del vehículo
```
Step1Basic → Step2Specs → Step2Features → Step3Photos → Step4Price
```

- **Step2Features.tsx**: Usuario selecciona características y se guardan en `selectedFeatures` array
- Al hacer "Siguiente", se navega a Step3Photos con: `{ ...vehicleData, caracteristicas: selectedFeatures }`

### 2. Publicación (Step4Price)
- Recibe `vehicleData` que incluye `caracteristicas` array
- Crea `finalData` usando spread operator: `{ ...vehicleData, precio, descripcion, ... }`
- Llama a `addVehicle(finalData, user.uid)`

### 3. Guardado en Firestore (services/vehicles.ts)
- Función `addVehicle` recibe todos los datos
- Crea `newVehicle` con spread: `{ ...vehicleData, photos, imagenes, ... }`
- Guarda en Firestore con `addDoc(collection(db, 'vehicles'), newVehicle)`

### 4. Lectura en Details
- Recibe vehículo por parámetros de navegación: `{ vehicle: rawVehicle }`
- Normaliza datos: `normalizeVehicleData(rawVehicle.id, rawVehicle)`
- Pasa a componentes:
  - `<VehicleDescription description={vehicle.descripcion} />`
  - `<VehicleFeatures features={vehicle.caracteristicas} />`

## Console.logs agregados para debug

### En Step4Price (antes de publicar):
```javascript
console.log('📋 Datos completos a publicar:', {
  descripcion: finalData.descripcion,
  caracteristicas: finalData.caracteristicas,
  caracteristicasLength: finalData.caracteristicas?.length
});
```

### En services/vehicles.ts (antes de guardar):
```javascript
console.log('💾 Guardando en Firestore:', {
  descripcion: newVehicle.descripcion,
  caracteristicas: newVehicle.caracteristicas,
  caracteristicasIsArray: Array.isArray(newVehicle.caracteristicas)
});
```

### En Details.tsx (al cargar):
```javascript
console.log('📋 Vehicle Data en Details:', {
  descripcion: normalized.descripcion,
  caracteristicas: normalized.caracteristicas,
  caracteristicasLength: normalized.caracteristicas?.length
});
```

## Pasos para depurar

1. **Crear un vehículo nuevo con características y descripción:**
   - En Step2Features, selecciona al menos 3 características
   - En Step4Price, escribe una descripción de al menos 50 caracteres
   - Publica el vehículo

2. **Revisar console.logs en orden:**
   - Verifica que `📋 Datos completos a publicar` muestre las características y descripción
   - Verifica que `💾 Guardando en Firestore` muestre los mismos datos
   - Verifica que `📋 Vehicle Data en Details` muestre los datos cargados

3. **Verificar en Firestore directamente:**
   - Abre Firebase Console → Firestore Database
   - Busca la colección `vehicles`
   - Encuentra el vehículo recién creado
   - Verifica que tenga los campos `descripcion` y `caracteristicas`

## Posibles causas del problema

### ✅ Ya verificado/corregido:
- Componentes VehicleFeatures y VehicleDescription ahora siempre se muestran
- normalizeVehicleData asegura que caracteristicas sea array vacío si no existe
- Console.logs agregados para trazabilidad

### ⚠️ Por verificar:
1. **AsyncStorage draft sobrescribiendo datos:**
   - Step2Features guarda características en draft
   - ¿Se pierden al navegar entre steps?

2. **Spread operator no preservando arrays:**
   - JavaScript spread debería copiar arrays correctamente
   - Pero verificar que `caracteristicas` no esté siendo undefined

3. **Firestore no guardando arrays:**
   - Firebase soporta arrays nativamente
   - Verificar si hay alguna transformación

## Siguiente acción

Ejecutar la app y crear un vehículo nuevo, luego compartir los console.logs para identificar en qué punto se pierden los datos.
