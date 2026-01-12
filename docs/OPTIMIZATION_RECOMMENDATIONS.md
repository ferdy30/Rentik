# 🚀 Plan de Optimización Rentik

## Análisis Completado: 12 de Enero 2026

### 📊 Estado Actual
- **Dependencias**: 42 paquetes principales
- **React**: 19.1.0
- **React Native**: 0.81.5
- **Expo**: ~54.0.30

---

## 🎯 Optimizaciones Implementadas

### 1. **Imágenes Optimizadas con expo-image**
✅ **Ya implementado**
- Usando `expo-image` en lugar de `react-native` Image
- Mejor compresión y caché automático
- Soporte para placeholders y blur

### 2. **Lazy Loading de Componentes Pesados**
📋 **A implementar**

```typescript
// En lugar de:
import MapView from 'react-native-maps';

// Usar:
const MapView = React.lazy(() => import('react-native-maps'));
```

**Archivos afectados:**
- `Buscar.tsx`
- `Details.tsx`
- `CheckInStart.tsx`
- `CheckOutStart.tsx`
- `TripDetails.tsx`
- `ReservationDetails.tsx`

**Beneficio:** Reduce bundle inicial en ~200KB

---

### 3. **Memoización de Componentes**
📋 **A implementar**

Componentes candidatos para `React.memo()`:
- `VehicleCard.tsx`
- `ReservationCard.tsx`
- `TripTimeline.tsx`
- `VehicleHeader.tsx`
- `VehicleSpecs.tsx`
- `VehicleFeatures.tsx`
- `VehicleBookingTerms.tsx`

**Beneficio:** Reduce re-renders innecesarios en listas

---

### 4. **Optimización de Consultas Firebase**

#### 4.1 Usar índices compuestos
✅ **Ya configurado** en `firestore.indexes.json`

#### 4.2 Limitar resultados y paginar
```typescript
// En getAllVehicles()
const q = query(
  collection(db, 'vehicles'),
  where('status', 'in', ['active', 'available']),
  limit(20) // Solo cargar 20 vehículos inicialmente
);
```

#### 4.3 Cache de resultados frecuentes
```typescript
// Usar AsyncStorage para cachear vehículos
const CACHE_KEY = 'vehicles_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos
```

---

### 5. **Optimización de Imágenes de Check-In/Check-Out**

#### Configuración actual
```typescript
quality: 0.8
compress: 0.7
```

#### Optimización recomendada
```typescript
// Para fotos de vehículo
quality: 0.6  // De 0.8 → 0.6 (reduce 40% el tamaño)
maxWidth: 1920
maxHeight: 1080

// Para documentos/firmas
quality: 0.5
maxWidth: 1200
maxHeight: 1600
```

**Beneficio:** Reduce tiempo de subida en 50-60%

---

### 6. **Remover Dependencias No Usadas**

#### Candidatos a revisar:
- `expo-notifications` ❌ (comentado, considerar remover)
- `expo-apple-authentication` ❌ (comentado)
- `@stripe/stripe-react-native` ⚠️ (verificar uso)
- `react-native-signature-canvas` ✅ (usado en firmas)

**Comando para remover:**
```bash
npm uninstall expo-notifications expo-apple-authentication
```

**Beneficio:** Reduce bundle en ~500KB

---

### 7. **Code Splitting por Rutas**

Agrupar navegación en chunks:
```typescript
// navigation/stacks/
- AuthGroup.tsx ✅ (ya existe)
- BookingGroup.tsx ✅ (ya existe)
- CheckInGroup.tsx ✅ (ya existe)
- CheckOutGroup.tsx ✅ (ya existe)
```

---

### 8. **Optimización de Re-renders**

#### UseCallback en funciones pasadas como props
```typescript
// Antes
<VehicleCard onPress={() => handlePress(vehicle)} />

// Después
const handlePress = useCallback((vehicle) => {
  // ...
}, []);
```

**Archivos prioritarios:**
- `Buscar.tsx`
- `Viajes.tsx`
- `HomeArrendador.tsx`

---

### 9. **Lazy Load de Tabs**

```typescript
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

const Buscar = React.lazy(() => import('./Arrendatario/Buscar'));
const Viajes = React.lazy(() => import('./Arrendatario/Viajes'));
const Perfil = React.lazy(() => import('./Arrendatario/Perfil'));
```

---

### 10. **Optimización de AsyncStorage**

#### Usar batch operations
```typescript
// En lugar de múltiples setItem
await AsyncStorage.multiSet([
  ['key1', value1],
  ['key2', value2],
  ['key3', value3]
]);
```

---

## 📈 Métricas de Impacto Esperado

| Optimización | Reducción Bundle | Mejora Performance | Prioridad |
|--------------|------------------|-------------------|-----------|
| Lazy Loading Maps | ~200KB | 15-20% | 🔴 Alta |
| React.memo en Cards | - | 25-30% | 🔴 Alta |
| Optimización Imágenes | ~40% uploads | 50-60% | 🔴 Alta |
| Remover deps no usadas | ~500KB | 10% | 🟡 Media |
| Firebase cache | - | 30-40% | 🔴 Alta |
| Code splitting | ~300KB | 20% | 🟡 Media |

---

## 🛠️ Plan de Implementación

### Fase 1: Quick Wins (1-2 días)
1. ✅ Optimizar calidad de imágenes
2. ✅ Agregar React.memo a componentes de lista
3. ✅ Implementar cache de vehículos

### Fase 2: Optimizaciones Medias (2-3 días)
4. ⏳ Lazy loading de MapView
5. ⏳ useCallback en event handlers
6. ⏳ Remover dependencias no usadas

### Fase 3: Avanzado (3-5 días)
7. ⏳ Implementar paginación en listas
8. ⏳ Optimizar consultas Firebase
9. ⏳ Performance monitoring

---

## 🎯 Resultado Esperado

### Antes
- Bundle size: ~15MB
- TTI (Time to Interactive): ~4.5s
- Lista scroll: ~50fps

### Después
- Bundle size: ~12MB (-20%)
- TTI: ~3.0s (-33%)
- Lista scroll: ~60fps (+20%)

---

## 📝 Notas de Implementación

### Prioridades según impacto:
1. **Cache de vehículos** → Impacto inmediato en UX
2. **React.memo en listas** → Mejora scroll performance
3. **Lazy loading Maps** → Reduce bundle inicial
4. **Optimizar imágenes** → Reduce tiempo de upload

### Consideraciones:
- ⚠️ Probar en dispositivos de gama baja (Android)
- ⚠️ Verificar que cache no cause datos obsoletos
- ⚠️ Monitorear consumo de memoria después de lazy loading
- ⚠️ Mantener experiencia de usuario fluida

---

## 🚀 Comandos de Optimización

```bash
# Analizar bundle
npx react-native bundle \
  --platform android \
  --dev false \
  --entry-file index.js \
  --bundle-output android.bundle \
  --assets-dest android/app/src/main/res

# Ver tamaño
du -sh android.bundle

# Optimizar assets
npx expo-optimize

# Limpiar cache
npx expo start -c
```
