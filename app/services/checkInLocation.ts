import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../FirebaseConfig';

/**
 * Update participant's live location during check-in process
 */
export const updateParticipantLocation = async (
  checkInId: string,
  isOwner: boolean,
  location: { latitude: number; longitude: number; accuracy: number }
): Promise<void> => {
  const updateData: any = {
    updatedAt: new Date(),
  };

  if (isOwner) {
    updateData.ownerLocation = location;
  } else {
    updateData.renterLocation = location;
  }

  await updateDoc(doc(db, 'checkIns', checkInId), updateData);
};
