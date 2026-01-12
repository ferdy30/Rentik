# 🚗 Flujo Completo del Viaje - Rentik

## 📊 Estados de Reserva

### Estados Actuales
```typescript
type ReservationStatus = 
  | 'pending'      // Solicitud enviada, esperando confirmación
  | 'confirmed'    // Aceptada por arrendador, esperando check-in
  | 'in-progress'  // Check-in completado, viaje activo
  | 'completed'    // Check-out completado
  | 'cancelled'    // Cancelada por usuario
  | 'denied'       // Rechazada por arrendador
```

---

## 🔄 Ciclo Completo del Viaje

### **FASE 1: PRE-RESERVA**
**Pantallas:** BookingStep1-4
- ✅ Selección de fechas
- ✅ Ubicación (pickup/delivery)
- ✅ Hora de recogida/devolución
- ✅ Confirmación y pago
- **Estado resultante:** `pending`

---

### **FASE 2: APROBACIÓN** 
**Rol:** Arrendador
**Pantallas:** ReservationDetails

#### Acciones del Arrendador:
1. **Confirmar reserva** → Estado: `confirmed`
2. **Rechazar reserva** → Estado: `denied`

#### Transiciones:
- `pending` → `confirmed` ✅
- `pending` → `denied` ✅
- `pending` → `cancelled` (por arrendatario) ✅

---

### **FASE 3: PRE CHECK-IN**
**Estado:** `confirmed`
**Disparador:** 24h antes del inicio
**Pantallas:**
1. `CheckInPreparation` - Lista de verificación
2. `CheckInProcessExplanation` - Tutorial del proceso

#### Para Arrendador:
- ✅ Vehículo limpio
- ✅ Tanque lleno
- ✅ Llaves listas
- ✅ Documentos preparados

#### Para Arrendatario:
- ✅ Licencia vigente
- ✅ Identificación
- ✅ Confirmación de pago
- ✅ Revisión de detalles

**Navegación:**
```
TripDetails → CheckInPreparation → CheckInProcessExplanation → CheckInStart
```

---

### **FASE 4: CHECK-IN**
**Estado inicial:** `confirmed`
**Estado final:** `in-progress`

#### Flujo de Pantallas:
```
1. CheckInStart          - Ubicación GPS + sincronización
2. CheckInPhotos         - 8 fotos (4 lados + 4 esquinas)
3. CheckInConditions     - Nivel combustible + kilometraje
4. CheckInDamageReport   - Reporte de daños (opcional)
5. CheckInKeys           - Código de llaves seguro
6. CheckInSignature      - Firmas digitales
7. CheckInComplete       - Confirmación ✅
```

#### Validaciones:
- ✅ Ambas partes presentes (GPS < 100m)
- ✅ Fotos obligatorias tomadas
- ✅ Condiciones registradas
- ✅ Código de llaves validado
- ✅ Firmas de ambas partes

**Transición:**
```typescript
// En CheckInSignature.tsx línea 60
await updateReservationStatus(reservation.id, 'in-progress');
```

---

### **FASE 5: DURANTE EL VIAJE** ⚠️ **REQUIERE MEJORAS**
**Estado:** `in-progress`
**Pantalla principal:** `TripDetails`

#### Problemas Actuales:
1. ❌ No hay diferenciación visual clara para estado `in-progress`
2. ❌ Falta sección "Durante el Viaje" en TripDetails
3. ❌ No hay acciones rápidas para viajes activos
4. ❌ Falta información de emergencia visible
5. ❌ No hay progreso del viaje visualizado

#### Mejoras Necesarias:

##### 1. **Detección de Estado Activo**
```typescript
// En TripDetails.tsx
const isTripActive = useMemo(() => {
  if (reservation.status !== 'in-progress') return false;
  const now = new Date();
  const start = reservation.startDate?.toDate();
  const end = reservation.endDate?.toDate();
  return start && end && now >= start && now <= end;
}, [reservation]);
```

##### 2. **Banner de Viaje Activo**
```tsx
{isTripActive && (
  <View style={styles.activeTripBanner}>
    <Ionicons name="car-sport" size={24} color="#10B981" />
    <Text>🚗 Viaje en curso - Disfruta tu aventura</Text>
  </View>
)}
```

##### 3. **Acciones Durante el Viaje**
- 📞 **Contacto de emergencia** (arrendador/soporte)
- 🗺️ **Navegación** a punto de devolución
- 💬 **Chat directo** con arrendador
- ⏰ **Recordatorio de check-out**
- 📊 **Progreso del viaje** (tiempo restante)

##### 4. **Información Visible**
- ⏱️ Tiempo restante del viaje
- 📍 Ubicación de devolución
- 🕐 Hora de check-out programada
- ⛽ Nivel de combustible requerido
- 📏 Kilometraje inicial

---

### **FASE 6: PRE CHECK-OUT** ⚠️ **REQUIERE IMPLEMENTACIÓN**
**Estado:** `in-progress`
**Disparador:** 2 horas antes del fin

#### Funcionalidad Necesaria:
1. **Notificación Push** (ya implementada en pushNotifications.ts)
   ```typescript
   scheduleCheckInReminder2h(reservation)
   ```

2. **Preparación en TripDetails:**
   ```tsx
   {showCheckOutPreparation && (
     <View style={styles.checkOutPrep}>
       <Text>⏰ Check-out en 2 horas</Text>
       <Text>Recuerda:</Text>
       <Text>• Llenar el tanque</Text>
       <Text>• Limpiar el vehículo</Text>
       <Text>• Llegar a tiempo</Text>
       <TouchableOpacity onPress={navigateToCheckOut}>
         <Text>Iniciar Check-out Anticipado</Text>
       </TouchableOpacity>
     </View>
   )}
   ```

3. **Validaciones Pre-Check-out:**
   - ✅ Dentro del rango de tiempo (2h antes - 2h después)
   - ✅ Ubicación cerca del punto de devolución
   - ✅ Fotos preparadas

---

### **FASE 7: CHECK-OUT**
**Estado inicial:** `in-progress`
**Estado final:** `completed`

#### Flujo de Pantallas:
```
1. CheckOutStart        - Ubicación + llegada a punto retorno
2. CheckOutPhotos       - Fotos finales (comparación con check-in)
3. CheckOutConditions   - Combustible + kilometraje final
4. CheckOutReview       - Revisión de daños + cargos
5. RateExperience       - Calificación y reseña
6. CheckOutComplete     - Confirmación ✅
```

#### Validaciones:
- ✅ Ubicación en punto de retorno (< 100m)
- ✅ Fotos finales tomadas
- ✅ Comparación con check-in
- ✅ Combustible correcto
- ✅ Sin daños nuevos (o reportados)

**Transición:**
```typescript
// En CheckOutReview o RateExperience
await updateReservationStatus(reservation.id, 'completed');
```

---

### **FASE 8: POST-VIAJE**
**Estado:** `completed`
**Pantalla:** `TripDetails`

#### Información Visible:
- ✅ Resumen del viaje
- ✅ Calificación dada/recibida
- ✅ Fotos del check-in/check-out
- ✅ Reporte de daños (si hubo)
- ✅ Recibo de pago
- ✅ Opción de volver a rentar

---

## 🎯 Mejoras Prioritarias Identificadas

### **Alta Prioridad** 🔴

#### 1. **Agregar Estado Activo en TripDetails**
**Archivo:** `app/Screens/Arrendatario/TripDetails.tsx`
```typescript
// Línea ~40 - Agregar detección de viaje activo
const isTripActive = useMemo(() => {
  return reservation.status === 'in-progress' && 
         isDateInRange(new Date(), startDate, endDate);
}, [reservation.status, reservation.startDate, reservation.endDate]);
```

#### 2. **Botones de Acción Durante Viaje**
```tsx
{isTripActive && (
  <View style={styles.activeTripActions}>
    {/* Emergencia */}
    <TouchableOpacity style={styles.emergencyButton}>
      <Ionicons name="call" size={20} color="#EF4444" />
      <Text>Emergencia</Text>
    </TouchableOpacity>
    
    {/* Navegación */}
    <TouchableOpacity onPress={navigateToReturn}>
      <Ionicons name="navigate" size={20} color="#0B729D" />
      <Text>Ir a devolución</Text>
    </TouchableOpacity>
    
    {/* Chat */}
    <TouchableOpacity onPress={openChat}>
      <Ionicons name="chatbubble" size={20} color="#0B729D" />
      <Text>Contactar</Text>
    </TouchableOpacity>
  </View>
)}
```

#### 3. **Información de Progreso**
```tsx
{isTripActive && (
  <View style={styles.tripProgress}>
    <View style={styles.progressBar}>
      <View style={[styles.progressFill, { width: `${progress}%` }]} />
    </View>
    <Text>{hoursRemaining}h restantes • {progress}% completado</Text>
  </View>
)}
```

### **Media Prioridad** 🟡

#### 4. **Pre Check-out Reminder**
**Archivo:** `app/Screens/Arrendatario/TripDetails.tsx`
```typescript
// Línea ~70 - Agregar detección de proximidad a check-out
const isCheckOutSoon = useMemo(() => {
  const now = new Date();
  const end = reservation.endDate?.toDate();
  if (!end) return false;
  const hoursUntilEnd = (end.getTime() - now.getTime()) / (1000 * 60 * 60);
  return hoursUntilEnd > 0 && hoursUntilEnd <= 2;
}, [reservation.endDate]);
```

#### 5. **Comparación de Fotos Check-in vs Check-out**
**Componente:** Ya creado en `PhotoComparison.tsx`
- Integrar en `CheckOutPhotos.tsx`
- Mostrar fotos lado a lado
- Resaltar diferencias

### **Baja Prioridad** 🟢

#### 6. **Estadísticas del Viaje**
- Distancia recorrida (estimada)
- Tiempo de uso
- Ahorro vs taxi/Uber
- CO2 evitado

#### 7. **Timeline Mejorado**
- Mostrar eventos importantes
- Check-in completado
- Extensiones (si las hay)
- Check-out completado

---

## 📱 Navegación Optimizada

### **Flujo Arrendatario:**
```
HomeArrendatario
  → Viajes (Tab)
    → TripCard
      → TripDetails
        [PENDING]    → Wait / Cancel
        [CONFIRMED]  → CheckInPreparation → ... → CheckInComplete
        [IN-PROGRESS] → Active Trip Actions + CheckOutStart
        [COMPLETED]  → View Summary / Rebook
```

### **Flujo Arrendador:**
```
HomeArrendador
  → Reservas (Tab)
    → ReservationCard
      → ReservationDetails
        [PENDING]    → Confirm / Deny
        [CONFIRMED]  → CheckInPreparation → ... → CheckInComplete
        [IN-PROGRESS] → Manage Trip + CheckOutStart
        [COMPLETED]  → View Summary / Rate
```

---

## 🛠️ Implementación Recomendada

### **Paso 1: Mejorar TripDetails para estado in-progress**
```bash
Archivos a modificar:
- app/Screens/Arrendatario/TripDetails.tsx (líneas 40-600)
```

### **Paso 2: Agregar botones de acción**
```bash
Crear/Modificar:
- app/components/ActiveTripActions.tsx (nuevo)
- app/components/TripProgress.tsx (nuevo)
```

### **Paso 3: Integrar recordatorios pre-checkout**
```bash
Modificar:
- app/Screens/Arrendatario/TripDetails.tsx
- app/utils/tripNotifications.ts (ya existe)
```

### **Paso 4: Mejorar CheckOutStart**
```bash
Modificar:
- app/Screens/CheckOut/CheckOutStart.tsx
- Agregar validación de tiempo
- Agregar comparación de fotos
```

---

## ✅ Checklist de Mejoras

### **Durante el Viaje (Estado: in-progress)**
- [ ] Detección visual de viaje activo en TripDetails
- [ ] Banner "Viaje en curso" destacado
- [ ] Barra de progreso con tiempo restante
- [ ] Botón de emergencia visible
- [ ] Botón de navegación a punto de retorno
- [ ] Chat directo con arrendador
- [ ] Información de check-out visible (hora, lugar)
- [ ] Recordatorio 2h antes de check-out

### **Pre Check-out**
- [ ] Notificación push 2h antes
- [ ] Instrucciones de preparación
- [ ] Validación de tiempo permitido
- [ ] Validación de ubicación cercana

### **Check-out**
- [ ] Comparación automática de fotos
- [ ] Detección de daños nuevos
- [ ] Cálculo de kilometraje recorrido
- [ ] Validación de combustible
- [ ] Confirmación de ambas partes

---

## 🎨 Mejoras UI/UX

### **Estados Visuales:**
```typescript
const STATUS_THEMES = {
  pending: {
    color: '#F59E0B',
    icon: 'time',
    label: 'Esperando confirmación',
    banner: 'yellow'
  },
  confirmed: {
    color: '#3B82F6',
    icon: 'checkmark-circle',
    label: 'Confirmada - Prepárate',
    banner: 'blue'
  },
  'in-progress': {
    color: '#10B981',
    icon: 'car-sport',
    label: '¡Viaje activo!',
    banner: 'green',
    highlight: true
  },
  completed: {
    color: '#6B7280',
    icon: 'flag',
    label: 'Completado',
    banner: 'gray'
  }
};
```

### **Animaciones:**
- Pulso en botón de emergencia
- Barra de progreso animada
- Transiciones suaves entre estados
- Confetti al completar check-out

---

## 📊 Métricas de Éxito

- **Tiempo de check-in:** < 10 minutos
- **Tiempo de check-out:** < 8 minutos
- **% de check-in sin errores:** > 95%
- **% de usuarios que usan chat durante viaje:** > 40%
- **% de check-out a tiempo:** > 85%
- **Satisfacción usuario:** > 4.5/5

---

## 🔗 Referencias

### **Archivos Clave:**
- Estados: `app/services/reservations.ts` (línea 19)
- Check-in: `app/Screens/CheckIn/*`
- Check-out: `app/Screens/CheckOut/*`
- TripDetails: `app/Screens/Arrendatario/TripDetails.tsx`
- Notificaciones: `app/services/pushNotifications.ts`
- Timeline: `app/components/TripTimeline.tsx`

### **Componentes Nuevos Creados:**
- CheckInProgressIndicator.tsx ✅
- PhotoComparison.tsx ✅
- EmergencyMode.tsx ✅
- InteractiveGuide.tsx ✅

---

*Última actualización: 5 de Enero, 2026*
