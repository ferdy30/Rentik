import {
    addDoc,
    collection,
    doc,
    DocumentSnapshot,
    getDoc,
    getDocs,
    limit,
    onSnapshot,
    orderBy,
    query,
    QueryDocumentSnapshot,
    serverTimestamp,
    setDoc,
    startAfter,
    Timestamp,
    updateDoc,
    where
} from 'firebase/firestore';
import { db } from '../../FirebaseConfig';

export interface Message {
  id: string;
  text: string;
  senderId: string;
  createdAt: Timestamp;
  read: boolean;
}

export type { QueryDocumentSnapshot, DocumentSnapshot };

export interface Chat {
  id: string;
  reservationId: string;
  participants: string[];
  participantNames: { [userId: string]: string };
  lastMessage: string;
  lastMessageTimestamp: Timestamp;
  lastMessageSenderId?: string;
  updatedAt: Timestamp;
  unreadCount: { [userId: string]: number };
  vehicleInfo?: {
    marca: string;
    modelo: string;
    imagen: string;
  };
}

export const getChatId = (reservationId: string) => reservationId;

export const createChatIfNotExists = async (reservationId: string, participants: string[], vehicleInfo: any, participantNames: { [userId: string]: string }) => {
  const chatId = getChatId(reservationId);
  const chatRef = doc(db, 'chats', chatId);
  
  try {
    const chatSnap = await getDoc(chatRef);

    if (!chatSnap.exists()) {
      const unreadCount: { [userId: string]: number } = {};
      participants.forEach(p => unreadCount[p] = 0);
      
      await setDoc(chatRef, {
        id: chatId,
        reservationId,
        participants,
        participantNames,
        lastMessage: '',
        lastMessageTimestamp: serverTimestamp(),
        lastMessageSenderId: '',
        updatedAt: serverTimestamp(),
        unreadCount,
        vehicleInfo
      });
    }
    return chatId;
  } catch (error) {
    console.error('Error in createChatIfNotExists:', error);
    throw error;
  }
};

export const sendMessage = async (chatId: string, text: string, senderId: string) => {
  try {
    // 1. Add message to subcollection
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    await addDoc(messagesRef, {
      text,
      senderId,
      createdAt: serverTimestamp(),
      read: false
    });

    // 2. Get chat to find other participant
    const chatRef = doc(db, 'chats', chatId);
    const chatSnap = await getDoc(chatRef);
    
    if (chatSnap.exists()) {
      const chatData = chatSnap.data();
      const otherParticipant = chatData.participants.find((p: string) => p !== senderId);
      
      // 3. Update chat document with last message and increment unread count for other user
      const updateData: any = {
        lastMessage: text,
        lastMessageTimestamp: serverTimestamp(),
        lastMessageSenderId: senderId,
        updatedAt: serverTimestamp()
      };
      
      if (otherParticipant) {
        updateData[`unreadCount.${otherParticipant}`] = (chatData.unreadCount?.[otherParticipant] || 0) + 1;
      }
      
      await updateDoc(chatRef, updateData);
    }
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

export const subscribeToMessages = (chatId: string, callback: (messages: Message[]) => void) => {
  const q = query(
    collection(db, 'chats', chatId, 'messages'),
    orderBy('createdAt', 'desc'),
    limit(50)
  );

  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Message));
    callback(messages);
  });
};

// New function: Subscribe to recent messages with pagination support
export const subscribeToRecentMessages = (
  chatId: string,
  limitCount: number,
  callback: (messages: Message[], lastDoc: QueryDocumentSnapshot | null) => void
) => {
  const q = query(
    collection(db, 'chats', chatId, 'messages'),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );

  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Message));
    
    const lastDoc = snapshot.docs.length > 0 
      ? snapshot.docs[snapshot.docs.length - 1] 
      : null;
    
    callback(messages, lastDoc);
  });
};

// New function: Load older messages (pagination)
export const loadOlderMessages = async (
  chatId: string,
  lastVisible: QueryDocumentSnapshot,
  limitCount: number
): Promise<Message[]> => {
  try {
    const q = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('createdAt', 'desc'),
      startAfter(lastVisible),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Message));
  } catch (error) {
    console.error('Error loading older messages:', error);
    throw error;
  }
};

export const subscribeToUserChats = (
  userId: string, 
  limitCount: number,
  callback: (chats: Chat[], lastDoc: QueryDocumentSnapshot | null) => void,
  errorCallback?: (error: any) => void
) => {
  // Query with limit for pagination
  const q = query(
    collection(db, 'chats'),
    where('participants', 'array-contains', userId),
    limit(limitCount)
  );

  return onSnapshot(q, (snapshot) => {
    const chats = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Chat))
    // Sort locally instead of in query
    .sort((a, b) => {
      const aTime = a.updatedAt?.toMillis() || 0;
      const bTime = b.updatedAt?.toMillis() || 0;
      return bTime - aTime;
    });
    
    const lastDoc = snapshot.docs.length > 0 
      ? snapshot.docs[snapshot.docs.length - 1] 
      : null;
    
    callback(chats, lastDoc);
  }, (error) => {
    console.error("Error subscribing to user chats:", error);
    if (errorCallback) {
      errorCallback(error);
    }
  });
};

// Load older chats for pagination
export const loadOlderChats = async (
  userId: string,
  lastVisible: QueryDocumentSnapshot,
  limitCount: number
): Promise<Chat[]> => {
  try {
    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', userId),
      startAfter(lastVisible),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    
    const chats = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Chat))
    .sort((a, b) => {
      const aTime = a.updatedAt?.toMillis() || 0;
      const bTime = b.updatedAt?.toMillis() || 0;
      return bTime - aTime;
    });

    return chats;
  } catch (error) {
    console.error('Error loading older chats:', error);
    throw error;
  }
};

export const markChatAsRead = async (chatId: string, userId: string) => {
  try {
    const chatRef = doc(db, 'chats', chatId);
    await updateDoc(chatRef, {
      [`unreadCount.${userId}`]: 0
    });
  } catch (error) {
    console.error('Error marking chat as read:', error);
  }
};
