/**
 * Script para limpiar check-ins duplicados
 * Ejecutar con: node scripts/cleanupCheckIns.js
 */

const admin = require('firebase-admin');

// Inicializar Firebase Admin (necesitas tu serviceAccountKey.json)
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function cleanupDuplicateCheckIns(reservationId) {
  try {
    console.log('Limpiando check-ins duplicados para reservación:', reservationId);
    
    // 1. Obtener la reservación
    const reservationDoc = await db.collection('reservations').doc(reservationId).get();
    if (!reservationDoc.exists) {
      console.log('❌ Reservación no encontrada');
      return;
    }
    
    const reservationData = reservationDoc.data();
    const correctCheckInId = reservationData.checkIn?.id;
    
    console.log('✓ Reservación encontrada');
    console.log('  - Check-in ID en reservación:', correctCheckInId || 'NINGUNO');
    console.log('  - Status:', reservationData.status);
    console.log('  - Check-in completed:', reservationData.checkIn?.completed);
    
    // 2. Buscar todos los check-ins para esta reservación
    const checkInsSnapshot = await db.collection('checkIns')
      .where('reservationId', '==', reservationId)
      .get();
    
    console.log('\n📋 Check-ins encontrados:', checkInsSnapshot.size);
    
    // 3. Listar todos los check-ins
    const checkIns = [];
    checkInsSnapshot.forEach(doc => {
      const data = doc.data();
      checkIns.push({
        id: doc.id,
        status: data.status,
        renterReady: data.renterReady,
        ownerReady: data.ownerReady,
        signatures: data.signatures,
        completedAt: data.completedAt
      });
      console.log(`  - ${doc.id}`);
      console.log(`    Status: ${data.status}`);
      console.log(`    Renter Ready: ${data.renterReady}, Owner Ready: ${data.ownerReady}`);
      console.log(`    Signatures: Renter=${!!data.signatures?.renter}, Owner=${!!data.signatures?.owner}`);
      console.log(`    Is correct: ${doc.id === correctCheckInId ? 'SÍ' : 'NO'}`);
    });
    
    // 4. Si no hay check-in ID en la reservación, usar el más completo
    let targetCheckInId = correctCheckInId;
    
    if (!targetCheckInId && checkIns.length > 0) {
      console.log('\n⚠️  No hay check-in ID en la reservación. Buscando el más completo...');
      
      // Buscar el check-in con firmas completas
      const completedCheckIn = checkIns.find(ci => 
        ci.signatures?.renter && ci.signatures?.owner
      );
      
      if (completedCheckIn) {
        targetCheckInId = completedCheckIn.id;
        console.log('✓ Usando check-in con firmas completas:', targetCheckInId);
      } else {
        // Usar el más avanzado
        targetCheckInId = checkIns.sort((a, b) => {
          const aScore = (a.renterReady ? 1 : 0) + (a.ownerReady ? 1 : 0);
          const bScore = (b.renterReady ? 1 : 0) + (b.ownerReady ? 1 : 0);
          return bScore - aScore;
        })[0].id;
        console.log('✓ Usando check-in más avanzado:', targetCheckInId);
      }
      
      // Actualizar la reservación
      await db.collection('reservations').doc(reservationId).update({
        'checkIn.id': targetCheckInId,
        'checkIn.completed': checkIns.find(ci => ci.id === targetCheckInId)?.status === 'completed'
      });
      console.log('✓ Reservación actualizada con check-in correcto');
    }
    
    // 5. Eliminar duplicados
    if (checkIns.length > 1) {
      console.log('\n🗑️  Eliminando duplicados...');
      let deletedCount = 0;
      
      for (const checkIn of checkIns) {
        if (checkIn.id !== targetCheckInId) {
          await db.collection('checkIns').doc(checkIn.id).delete();
          console.log(`  ✓ Eliminado: ${checkIn.id}`);
          deletedCount++;
        }
      }
      
      console.log(`\n✅ Limpieza completada. Eliminados ${deletedCount} duplicados.`);
    } else {
      console.log('\n✅ No hay duplicados que eliminar.');
    }
    
    // 6. Verificar el check-in final
    const finalCheckInDoc = await db.collection('checkIns').doc(targetCheckInId).get();
    if (finalCheckInDoc.exists) {
      const finalData = finalCheckInDoc.data();
      console.log('\n📊 Estado final del check-in:', targetCheckInId);
      console.log('  - Status:', finalData.status);
      console.log('  - Firmas completas:', !!(finalData.signatures?.renter && finalData.signatures?.owner));
      
      // Si las firmas están completas pero el status no es 'completed', arreglarlo
      if (finalData.signatures?.renter && finalData.signatures?.owner && finalData.status !== 'completed') {
        console.log('\n🔧 Las firmas están completas pero el status no. Actualizando...');
        await db.collection('checkIns').doc(targetCheckInId).update({
          status: 'completed',
          completedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        await db.collection('reservations').doc(reservationId).update({
          'checkIn.completed': true,
          status: 'in-progress'
        });
        console.log('✅ Check-in marcado como completado');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Ejecutar para la reservación específica
const reservationId = '4rVHL4Ccpdyo8qqhlz33';
cleanupDuplicateCheckIns(reservationId)
  .then(() => {
    console.log('\n🎉 Script completado');
    process.exit(0);
  })
  .catch(error => {
    console.error('Error fatal:', error);
    process.exit(1);
  });
