// Quick script to fix stuck check-in
const { initializeApp } = require("firebase/app");
const { getFirestore, doc, updateDoc } = require("firebase/firestore");

// Your Firebase config (same as in your app)
const firebaseConfig = {
  // Add your config from FirebaseConfig.js here
  // Or import it if possible
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function fixCheckIn() {
  const reservationId = "lk0eMvFJ1RsK5dSGjC9k";

  try {
    console.log("Fixing stuck check-in for reservation:", reservationId);

    await updateDoc(doc(db, "reservations", reservationId), {
      "checkIn.status": "completed",
      "checkIn.completedAt": new Date(),
      "checkIn.completed": true,
    });

    console.log("✅ Check-in fixed successfully!");
    console.log("The reservation should now show as completed in the app.");
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

fixCheckIn();
