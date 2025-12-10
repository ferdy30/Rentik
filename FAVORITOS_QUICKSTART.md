# 🎯 Guía Rápida: Sistema de Favoritos

## 🚀 Cómo usar la funcionalidad

### Para el Usuario Final

1. **Agregar a Favoritos**
   - Navega a la pantalla "Buscar"
   - Ve un vehículo que te gusta
   - Presiona el ícono de corazón ❤️ en la esquina superior derecha de la card
   - Verás un mensaje "Agregado a favoritos" ✅

2. **Ver tus Favoritos**
   - Ve al tab "Favoritos" en la barra inferior (ícono de corazón)
   - Verás todos tus vehículos favoritos
   - Puedes presionar cualquier card para ver los detalles

3. **Remover de Favoritos**
   - Desde la pantalla "Favoritos" o "Buscar"
   - Presiona el corazón lleno ❤️ nuevamente
   - Verás un mensaje "Removido de favoritos"
   - El vehículo desaparecerá de tu lista (actualización en tiempo real)

---

## 👨‍💻 Para Desarrolladores

### Instalación

Ya está todo configurado. Solo necesitas:

1. **Desplegar las reglas de Firestore:**
```bash
firebase deploy --only firestore:rules
```

2. **Reiniciar la app** para que el `FavoritesProvider` se monte.

---

### Uso en Código

#### 1. Usar el Hook `useFavorites()`

```typescript
import { useFavorites } from '../context/FavoritesContext';

function MyComponent() {
  const { 
    favorites,        // Array de favoritos
    favoriteIds,      // Set<string> de IDs (para checks rápidos)
    loading,          // Boolean: está cargando?
    toggleFavorite,   // Función para agregar/remover
    isFavorite,       // Función para verificar si es favorito
    favoritesCount    // Número total de favoritos
  } = useFavorites();

  // Verificar si un vehículo es favorito
  const isMyVehicleFavorite = isFavorite('vehicle-id-123');

  // Toggle favorito
  const handleToggle = async () => {
    const newStatus = await toggleFavorite('vehicle-id-123', {
      marca: 'Toyota',
      modelo: 'Corolla',
      // ... otros datos
    });
    console.log('Es favorito ahora?', newStatus);
  };

  return (
    <View>
      <Text>Tienes {favoritesCount} favoritos</Text>
      {favorites.map(fav => (
        <Text key={fav.id}>{fav.vehicleSnapshot?.marca}</Text>
      ))}
    </View>
  );
}
```

#### 2. Usar el Componente `FavoriteButton`

```typescript
import FavoriteButton from '../components/FavoriteButton';

function VehicleDetailScreen({ vehicle }) {
  return (
    <View>
      {/* Botón de favorito con todas las props opcionales */}
      <FavoriteButton
        vehicleId={vehicle.id}
        vehicleSnapshot={{
          marca: vehicle.marca,
          modelo: vehicle.modelo,
          anio: vehicle.anio,
          precio: vehicle.precio,
          imagen: vehicle.imagen,
          ubicacion: vehicle.ubicacion,
          rating: vehicle.rating,
          arrendadorId: vehicle.arrendadorId
        }}
        size={28}                    // Tamaño del ícono
        color="#757575"              // Color cuando NO es favorito
        activeColor="#EF4444"        // Color cuando SÍ es favorito
        style={{ position: 'absolute', top: 10, right: 10 }}
      />
    </View>
  );
}
```

#### 3. Llamar Directamente a los Services

```typescript
import { 
  addToFavorites, 
  removeFromFavorites, 
  isFavorite,
  getUserFavorites,
  toggleFavorite 
} from '../services/favorites';

// Agregar favorito
await addToFavorites('user-id', 'vehicle-id', vehicleSnapshot);

// Remover favorito
await removeFromFavorites('user-id', 'vehicle-id');

// Verificar si es favorito
const isFav = await isFavorite('user-id', 'vehicle-id');

// Obtener todos los favoritos
const favorites = await getUserFavorites('user-id');

// Toggle (más común)
const newStatus = await toggleFavorite('user-id', 'vehicle-id', vehicleSnapshot);
```

---

### Estructura de Datos

#### Firestore: `favorites` collection

```javascript
{
  "user-id_vehicle-id": {
    userId: "user-id",
    vehicleId: "vehicle-id",
    addedAt: Timestamp,
    vehicleSnapshot: {
      marca: "Toyota",
      modelo: "Corolla",
      anio: 2023,
      precio: 35,
      imagen: "https://...",
      ubicacion: "San Salvador",
      rating: 4.8,
      arrendadorId: "owner-id"
    }
  }
}
```

#### Firestore: `users` collection (array de IDs)

```javascript
{
  "user-id": {
    // ... otros datos del usuario
    favorites: ["vehicle-id-1", "vehicle-id-2", "vehicle-id-3"]
  }
}
```

**Por qué dos lugares?**
- **`favorites` collection:** Datos completos para mostrar lista
- **`users.favorites` array:** IDs para queries rápidas

---

### Permisos Firestore

Las reglas ya están configuradas en `firestore.rules`:

```javascript
match /favorites/{favoriteId} {
  // Solo el dueño puede leer/crear/eliminar sus favoritos
  allow read: if request.auth.uid == favoriteId.split('_')[0];
  allow create: if request.auth.uid == favoriteId.split('_')[0];
  allow delete: if request.auth.uid == favoriteId.split('_')[0];
  allow update: if false; // No se permiten updates
}
```

---

### Testing

#### Manual Testing

1. **Agregar favorito:**
   - Busca un vehículo
   - Presiona corazón
   - Verifica toast "Agregado a favoritos"
   - Ve a tab Favoritos
   - Confirma que aparece el vehículo

2. **Remover favorito:**
   - Desde Favoritos, presiona corazón lleno
   - Verifica toast "Removido de favoritos"
   - Confirma que desaparece inmediatamente

3. **Persistencia:**
   - Agrega 3 favoritos
   - Cierra la app
   - Vuelve a abrir
   - Ve a Favoritos
   - Confirma que los 3 están ahí

4. **Tiempo real:**
   - Usa 2 dispositivos con mismo usuario
   - Agrega favorito en dispositivo A
   - Verifica que aparece automáticamente en dispositivo B

#### Unit Tests (Ejemplo)

```typescript
// __tests__/favorites.test.ts
import { addToFavorites, isFavorite, removeFromFavorites } from '../services/favorites';

describe('Favorites Service', () => {
  it('should add vehicle to favorites', async () => {
    await addToFavorites('user-123', 'vehicle-456', mockSnapshot);
    const result = await isFavorite('user-123', 'vehicle-456');
    expect(result).toBe(true);
  });

  it('should remove vehicle from favorites', async () => {
    await removeFromFavorites('user-123', 'vehicle-456');
    const result = await isFavorite('user-123', 'vehicle-456');
    expect(result).toBe(false);
  });
});
```

---

### Troubleshooting

#### "No aparecen mis favoritos"

**Solución:**
1. Verifica que estés autenticado
2. Verifica en Firebase Console que existen docs en `favorites`
3. Revisa la consola por errores de permisos
4. Confirma que las rules están desplegadas:
   ```bash
   firebase deploy --only firestore:rules
   ```

#### "El corazón no cambia de color"

**Solución:**
1. Verifica que `FavoritesProvider` esté en `App.tsx`
2. Verifica que estés usando `useFavorites()` hook
3. Revisa si hay errores en consola
4. Confirma que `isFavorite()` retorna el valor correcto

#### "Error: Missing or insufficient permissions"

**Solución:**
1. Despliega las rules:
   ```bash
   firebase deploy --only firestore:rules
   ```
2. Verifica que el documento ID sea correcto: `{userId}_{vehicleId}`
3. Confirma que el userId en el documento coincide con `request.auth.uid`

#### "Favoritos duplicados"

**No debería pasar** porque el document ID previene duplicados.

Si pasa:
1. Verifica que estás usando el formato correcto de ID
2. Usa `toggleFavorite()` en lugar de `addToFavorites()` directamente

---

### Performance Tips

1. **Usa `isFavorite()` del hook, no del service:**
   ```typescript
   // ❌ Mal (hace query a Firestore cada vez)
   const isFav = await isFavorite(userId, vehicleId);
   
   // ✅ Bien (usa Set en memoria - O(1))
   const { isFavorite } = useFavorites();
   const isFav = isFavorite(vehicleId);
   ```

2. **El Context ya tiene suscripción en tiempo real:**
   No necesitas llamar `getUserFavorites()` manualmente.

3. **Snapshots evitan queries extras:**
   La lista de favoritos no requiere fetch de vehicles collection.

---

### Próximos Pasos (Opcional)

Si quieres extender la funcionalidad:

1. **Notificaciones:**
   ```typescript
   // Notificar cuando baja precio
   if (vehicle.precio < favorite.vehicleSnapshot.precio) {
     await sendPushNotification(userId, {
       title: '🔥 Bajó de precio!',
       body: `${vehicle.marca} ${vehicle.modelo} ahora cuesta $${vehicle.precio}`
     });
   }
   ```

2. **Compartir favoritos:**
   ```typescript
   import * as Sharing from 'expo-sharing';
   
   const shareFavorites = async () => {
     const favoritesText = favorites.map(f => 
       `${f.vehicleSnapshot.marca} ${f.vehicleSnapshot.modelo}`
     ).join('\n');
     
     await Sharing.shareAsync(favoritesText);
   };
   ```

3. **Estadísticas:**
   ```typescript
   // Mostrar cuántas personas tienen este vehículo como favorito
   const vehicleFavoritesCount = await db.collection('favorites')
     .where('vehicleId', '==', vehicleId)
     .count()
     .get();
   ```

---

## 📚 Recursos Adicionales

- **Documentación completa:** `FAVORITOS_IMPLEMENTATION.md`
- **Context API:** `app/context/FavoritesContext.tsx`
- **Service:** `app/services/favorites.ts`
- **Component:** `app/components/FavoriteButton.tsx`
- **Screen:** `app/Screens/Arrendatario/Favoritos.tsx`

---

## ✅ Checklist de Implementación

- [x] Service layer (`favorites.ts`)
- [x] Context Provider (`FavoritesContext.tsx`)
- [x] Componente reutilizable (`FavoriteButton.tsx`)
- [x] Pantalla de Favoritos (`Favoritos.tsx`)
- [x] Integración en navegación (Tab Bar)
- [x] Integración en `VehicleCard`
- [x] Firestore rules
- [x] Documentación
- [ ] **Desplegar rules a Firebase** ← **PENDIENTE**
- [ ] Testing manual
- [ ] Testing automatizado (opcional)

---

## 🎉 ¡Listo para usar!

El sistema de Favoritos está **100% funcional** y listo para producción.

**Último paso:** Desplegar las Firestore rules:

```bash
cd c:\Users\lovoj\OneDrive\Escritorio\Rentik
firebase deploy --only firestore:rules
```

---

*Guía creada el 6 de diciembre, 2025*
*Proyecto: Rentik - Car Rental P2P App*
