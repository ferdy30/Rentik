/**
 * Script para limpiar URLs de imágenes inválidas en Firestore
 * Ejecutar desde Firebase Console o como Cloud Function
 */

import { initializeApp } from 'firebase/app';
import { collection, doc, getDocs, getFirestore, updateDoc } from 'firebase/firestore';

// Configuración (usar tus credenciales)
const firebaseConfig = {
  // ... tu configuración
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function cleanInvalidImageUrls() {
  console.log('🔍 Buscando vehículos con URLs de imágenes inválidas...');
  
  const vehiclesRef = collection(db, 'vehicles');
  const snapshot = await getDocs(vehiclesRef);
  
  let fixed = 0;
  let errors = 0;
  
  for (const docSnap of snapshot.docs) {
    try {
      const data = docSnap.data();
      let needsUpdate = false;
      const updates = {}; // Eliminar anotación de tipo en archivo .js
      
      // Verificar URL principal
      if (data.imagen && !isValidFirebaseUrl(data.imagen)) {
        console.log(`❌ Vehículo ${docSnap.id}: URL principal inválida`);
        updates.imagen = '';
        needsUpdate = true;
      }
      
      // Verificar array de imágenes
      if (data.imagenes && Array.isArray(data.imagenes)) {
        const validImages = data.imagenes.filter(isValidFirebaseUrl);
        if (validImages.length !== data.imagenes.length) {
          console.log(`❌ Vehículo ${docSnap.id}: ${data.imagenes.length - validImages.length} URLs inválidas en array`);
          updates.imagenes = validImages.length > 0 ? validImages : [''];
          needsUpdate = true;
        }
      }
      
      // Verificar objeto photos
      if (data.photos) {
        const cleanedPhotos: any = {};
        let photosChanged = false;
        
        for (const [key, url] of Object.entries(data.photos)) {
          if (typeof url === 'string') {
            if (!isValidFirebaseUrl(url)) {
              console.log(`❌ Vehículo ${docSnap.id}: URL inválida en photos.${key}`);
              cleanedPhotos[key] = '';
              photosChanged = true;
            } else {
              cleanedPhotos[key] = url;
            }
          }
        }
        
        if (photosChanged) {
          updates.photos = cleanedPhotos;
          needsUpdate = true;
        }
      }
      
      // Aplicar actualizaciones si es necesario
      if (needsUpdate) {
        await updateDoc(doc(db, 'vehicles', docSnap.id), updates);
        fixed++;
        console.log(`✅ Vehículo ${docSnap.id}: URLs limpiadas`);
      }
      
    } catch (error) {
      errors++;
      console.error(`❌ Error procesando vehículo ${docSnap.id}:`, error);
    }
  }
  
  console.log(`\n✅ Proceso completado:`);
  console.log(`   - Vehículos corregidos: ${fixed}`);
  console.log(`   - Errores: ${errors}`);
  console.log(`   - Total procesados: ${snapshot.docs.length}`);
}

function isValidFirebaseUrl(url: string): boolean {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return false;
  }
  
  // Si no es URL de Firebase, considerarla válida (placeholder, etc)
  if (!url.includes('firebasestorage')) {
    return true;
  }
  
  // Verificar que tenga extensión de archivo
  const hasFileExtension = /\.(jpg|jpeg|png|gif|webp)/i.test(url);
  
  // Verificar que tenga formato correcto de Firebase
  const hasCorrectFormat = url.includes('/o/') && (url.includes('?alt=media') || hasFileExtension);
  
  return hasFileExtension && hasCorrectFormat;
}

// Ejecutar el script
cleanInvalidImageUrls().catch(console.error);

export { cleanInvalidImageUrls, isValidFirebaseUrl };
