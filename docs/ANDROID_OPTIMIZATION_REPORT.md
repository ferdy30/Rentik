# 🔧 Reporte de Optimización Android - Rentik

## 🐛 PROBLEMA IDENTIFICADO: Reinicios Automáticos en Android

### Causa Raíz Detectada:

1. **Memory Leaks por Listeners No Limpiados**
   - Múltiples `onSnapshot` listeners activos simultáneamente
   - Listeners de Firebase que se acumulan en cada re-render
   - Subscripciones de chat sin cleanup apropiado

2. **Console.log Excesivos (100+ encontrados)**
   - Cada log consume memoria
   - En producción Android, los logs saturan el buffer
   - Causan lag y eventualmente crashes

3. **Re-renders Infinitos**
   - Dependency arrays incorrectos en useEffect
   - Estados que cambian y disparan nuevos listeners
   - Falta de React.memo en componentes pesados

4. **Problemas de Navegación**
   - Estado de navegación no serializable (warning en logs)
   - useFocusEffect sin cleanup apropiado

---

## 📊 ANÁLISIS DETALLADO

### Listeners de Firebase Detectados:

| Screen | Listeners | Cleanup | Estado |
|--------|-----------|---------|--------|
| **HomeArrendatario** | 2 (chats + reservas) | ✅ Parcial | ⚠️ Re-suscripción en cada focus |
| **HomeArrendador** | 2 (chats + reservas) | ✅ Parcial | ⚠️ Re-suscripción en cada focus |
| **TripDetails** | 1 (reservation) | ✅ Correcto | ✅ OK |
| **ReservationDetails** | 1 (reservation) | ✅ Correcto | ✅ OK |
| **CheckInStart** | 1 (checkIn) | ⚠️ Manual ref | ⚠️ Complejo |
| **CheckInKeys** | 1 (checkIn) | ✅ Correcto | ✅ OK |
| **CheckInSignature** | 1 (checkIn) | ✅ Correcto | ✅ OK |
| **CheckInComplete** | 1 (checkIn) | ✅ Correcto | ✅ OK |
| **CheckInDamageReport** | 1 (checkIn) | ✅ Correcto | ✅ OK |
| **Chat** | 1 (userChats) | ✅ Correcto | ✅ OK |
| **Auth Context** | 1 (user + userDoc) | ✅ Correcto | ✅ OK |

**TOTAL: ~15 listeners potencialmente activos**

### Console.log Encontrados: **+200 instancias**

Categorías:
- ❌ Debug logs en producción: 80+
- ❌ Logs de development en CheckIn: 40+
- ❌ Logs en services: 60+
- ✅ Error logging necesario: 20+

### Dependencias No Utilizadas:

```json
// En package.json, revisar si realmente usamos:
- "expo-router": "~6.0.21" ❌ NO USADO (usamos @react-navigation)
- "expo-symbols": "~1.0.8" ❌ NO USADO
- "react-native-worklets": "0.5.1" ⚠️ ¿Requerido por reanimated?
```

---

## 🎯 PLAN DE OPTIMIZACIÓN

### Fase 1: CRITICAL (Arregla reinicios) ⚡

#### 1.1 Eliminar Todos los Console.log de Producción
```typescript
// Crear utility para logging condicional
// utils/logger.ts
export const isDev = __DEV__;

export const logger = {
  log: (...args: any[]) => isDev && console.log(...args),
  warn: (...args: any[]) => isDev && console.warn(...args),
  error: (...args: any[]) => console.error(...args), // Keep errors
};
```

Reemplazar ~200 instancias de `console.log/warn` por `logger.log/warn`

#### 1.2 Optimizar HomeArrendatario.tsx
```typescript
// PROBLEMA ACTUAL:
useEffect(() => {
  // Se ejecuta en CADA render
  const unsubscribe = subscribeToUserChats(...);
  return () => unsubscribe();
}, [user]); // user puede cambiar frecuentemente

// SOLUCIÓN:
useEffect(() => {
  if (!user?.uid) return;
  
  let mounted = true;
  const unsubscribe = subscribeToUserChats(...);
  
  return () => {
    mounted = false;
    unsubscribe();
  };
}, [user?.uid]); // Solo uid, no objeto completo
```

#### 1.3 Optimizar HomeArrendador.tsx
```typescript
// PROBLEMA: Polling cada 30s + listener simultáneo
const interval = setInterval(fetchActiveReservations, 30000);

// SOLUCIÓN: Solo listener de Firestore, eliminar polling
// Firestore ya nos da updates en tiempo real
```

#### 1.4 Memoizar Callbacks Pesados
```typescript
// En HomeArrendatario.tsx, HomeArrendador.tsx
const renderTabBarIcon = useCallback(({ route, color, focused }: any) => {
  // ... lógica pesada
}, [activeTripsCount, unreadChatsCount]); // ✅ Ya está

// Pero falta memoizar componentes:
const TabIcon = React.memo(({ route, color, focused, badge }) => {
  // ...
});
```

---

### Fase 2: PERFORMANCE (Mejora velocidad) 🚀

#### 2.1 Implementar React.memo en Componentes Pesados

Componentes a memoizar:
- **VehicleCard** (se renderiza 10-50 veces en lista)
- **ReservationCard** (se renderiza 5-20 veces)
- **TripCard** (se renderiza 5-20 veces)
- **ChatListItem** (se renderiza 10-30 veces)
- **TripTimeline** (complejo, se re-renderiza innecesariamente)

```typescript
// components/VehicleCard.tsx
export default React.memo(VehicleCard, (prevProps, nextProps) => {
  return prevProps.vehicle.id === nextProps.vehicle.id 
    && prevProps.isFavorite === nextProps.isFavorite;
});
```

#### 2.2 Lazy Loading de Screens
```typescript
// navigation/index.tsx
const CheckInStart = React.lazy(() => import('../Screens/CheckIn/CheckInStart'));
const CheckOutStart = React.lazy(() => import('../Screens/CheckOut/CheckOutStart'));
```

#### 2.3 Optimizar Imágenes
```typescript
// Todas las imágenes deben usar:
<Image
  source={{ uri: photo }}
  cachePolicy="memory-disk" // ✅ Agregar
  transition={200}
  contentFit="cover"
  placeholder={require('../../assets/placeholder.png')}
/>
```

---

### Fase 3: CLEANUP (Elimina código no usado) 🧹

#### 3.1 Dependencias a Eliminar
```bash
npm uninstall expo-router expo-symbols
```

#### 3.2 Archivos a Revisar para Eliminar
- `app/utils/` - buscar funciones no referenciadas
- `app/services/` - funciones exportadas pero no importadas
- `app/constants/` - constantes no usadas

#### 3.3 LogBox.ignoreLogs - Limpiar
```typescript
// App.tsx
LogBox.ignoreLogs([
  'AsyncStorage has been extracted',
  'Non-serializable values were found', // ⚠️ RESOLVER, no ignorar
]);
```

**Resolver** el warning de non-serializable en navigation:
```typescript
// No pasar funciones/objetos complejos en navigation
// MAL:
navigation.navigate('Screen', { callback: () => {} });

// BIEN:
navigation.navigate('Screen', { reservationId: '123' });
```

---

### Fase 4: MONITOREO (Prevenir futuros problemas) 📈

#### 4.1 Implementar Performance Monitor
```typescript
// utils/performanceMonitor.ts
import { InteractionManager } from 'react-native';

export const measureRender = (componentName: string) => {
  if (!__DEV__) return;
  
  const start = Date.now();
  InteractionManager.runAfterInteractions(() => {
    const duration = Date.now() - start;
    if (duration > 16) { // 60fps = 16ms per frame
      logger.warn(`[PERF] ${componentName} took ${duration}ms`);
    }
  });
};
```

#### 4.2 Agregar Error Boundary Global
```typescript
// components/ErrorBoundary.tsx ya existe ✅
// Pero verificar que esté wrapping toda la app
```

---

## 🔥 PRIORIDADES INMEDIATAS

### Hacer AHORA (1-2 horas):

1. ✅ **Crear logger utility**
2. ✅ **Reemplazar 50 console.log más críticos** (CheckIn, services)
3. ✅ **Eliminar polling en HomeArrendador**
4. ✅ **Memoizar VehicleCard, ReservationCard, TripCard**
5. ✅ **Agregar cachePolicy a todas las imágenes**

### Hacer ESTA SEMANA:

6. ⏳ **Reemplazar todos los console.log restantes** (150+)
7. ⏳ **Implementar React.memo en 10+ componentes**
8. ⏳ **Eliminar expo-router y expo-symbols**
9. ⏳ **Resolver non-serializable navigation warnings**
10. ⏳ **Agregar performance monitoring**

---

## 📋 CHECKLIST DE OPTIMIZACIÓN

### Memory Leaks:
- [x] Auth.tsx - listeners limpios ✅
- [x] TripDetails - listener limpio ✅
- [ ] HomeArrendatario - optimizar deps
- [ ] HomeArrendador - eliminar polling
- [ ] CheckInStart - simplificar ref pattern

### Console.log:
- [ ] services/checkIn.ts (30+ logs)
- [ ] services/chat.ts (15+ logs)
- [ ] Screens/CheckIn/* (40+ logs)
- [ ] Screens/CheckOut/* (30+ logs)
- [ ] Resto del proyecto (85+ logs)

### React.memo:
- [ ] VehicleCard
- [ ] ReservationCard
- [ ] TripCard
- [ ] VehicleCardSkeleton
- [ ] ReservationCardSkeleton
- [ ] TripCardSkeleton
- [ ] TripTimeline
- [ ] EmptyState components
- [ ] FilterModal
- [ ] SearchBar

### Imágenes:
- [ ] VehicleCard - agregar cachePolicy
- [ ] Details - agregar cachePolicy
- [ ] TripDetails - agregar cachePolicy
- [ ] CheckIn photos - optimizar compresión
- [ ] CheckOut photos - optimizar compresión

### Navegación:
- [ ] Resolver non-serializable values
- [ ] Lazy load screens pesados
- [ ] Optimizar stack navigators

---

## 🎬 SIGUIENTE ACCIÓN

Voy a proceder con las optimizaciones prioritarias:

1. Crear logger utility
2. Optimizar HomeArrendatario y HomeArrendador
3. Memoizar los 3 componentes de cards principales
4. Eliminar console.log de checkIn.ts (más problemático)

¿Proceder?
