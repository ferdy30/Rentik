/**
 * Script para verificar el estado de una reservación y sus check-ins
 * Ejecutar con: node scripts/checkReservationStatus.js RESERVATION_ID
 */

const admin = require('firebase-admin');

// Inicializar Firebase Admin
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkReservationStatus(reservationId) {
  try {
    console.log('🔍 Verificando estado de reservación:', reservationId);
    console.log('═'.repeat(60));
    
    // 1. Obtener la reservación
    const reservationDoc = await db.collection('reservations').doc(reservationId).get();
    if (!reservationDoc.exists) {
      console.log('❌ Reservación no encontrada');
      return;
    }
    
    const reservation = reservationDoc.data();
    
    console.log('\n📄 DATOS DE RESERVACIÓN:');
    console.log('  - Status:', reservation.status);
    console.log('  - checkIn existe:', !!reservation.checkIn);
    console.log('  - checkIn.id:', reservation.checkIn?.id || 'N/A');
    console.log('  - checkIn.completed:', reservation.checkIn?.completed);
    console.log('  - checkIn.status:', reservation.checkIn?.status);
    
    // 2. Buscar todos los check-ins para esta reservación
    const checkInsSnapshot = await db.collection('checkIns')
      .where('reservationId', '==', reservationId)
      .get();
    
    console.log('\n📋 CHECK-INS ENCONTRADOS:', checkInsSnapshot.size);
    console.log('─'.repeat(60));
    
    checkInsSnapshot.forEach(doc => {
      const checkIn = doc.data();
      console.log(`\n  ID: ${doc.id}`);
      console.log(`  - Status: ${checkIn.status}`);
      console.log(`  - Renter Ready: ${checkIn.renterReady}`);
      console.log(`  - Owner Ready: ${checkIn.ownerReady}`);
      console.log(`  - Renter Signature: ${!!checkIn.signatures?.renter}`);
      console.log(`  - Owner Signature: ${!!checkIn.signatures?.owner}`);
      console.log(`  - Created: ${checkIn.createdAt?.toDate?.()}`);
      console.log(`  - Updated: ${checkIn.updatedAt?.toDate?.()}`);
      
      const isCorrect = doc.id === reservation.checkIn?.id;
      console.log(`  - ⭐ Es el check-in vinculado: ${isCorrect ? 'SÍ' : 'NO'}`);
    });
    
    // 3. Diagnóstico y recomendaciones
    console.log('\n═'.repeat(60));
    console.log('💡 DIAGNÓSTICO:');
    
    if (!reservation.checkIn) {
      console.log('❌ La reservación NO tiene check-in vinculado');
      console.log('   → El botón "Preparar Check-in" debe aparecer');
    } else if (!reservation.checkIn.completed) {
      console.log('⚠️  El check-in NO está marcado como completado');
      console.log('   → El botón "Continuar Check-in" aparecerá');
      console.log('   → Necesitas verificar si ambas firmas existen');
    } else {
      console.log('✅ El check-in está completado correctamente');
      console.log('   → El botón NO debe aparecer');
    }
    
    if (checkInsSnapshot.size > 1) {
      console.log('\n⚠️  HAY CHECK-INS DUPLICADOS');
      console.log('   → Ejecuta: node scripts/cleanupCheckIns.js', reservationId);
    }
    
    console.log('═'.repeat(60));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
}

// Obtener ID de reservación de argumentos
const reservationId = process.argv[2];

if (!reservationId) {
  console.log('❌ Falta el ID de reservación');
  console.log('Uso: node scripts/checkReservationStatus.js RESERVATION_ID');
  process.exit(1);
}

checkReservationStatus(reservationId);
