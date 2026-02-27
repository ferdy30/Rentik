import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { doc, getDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { db, storage } from "../FirebaseConfig";
import { useAuth } from "../context/Auth";
import {
  createChatIfNotExists,
  loadOlderMessages,
  markChatAsRead,
  Message,
  sendMessage,
  subscribeToRecentMessages,
} from "../services/chat";

export default function ChatRoom() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { reservationId, participants, vehicleInfo } = route.params;
  const { user } = useAuth();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastVisible, setLastVisible] = useState<any>(null);
  const [otherUserPhoto, setOtherUserPhoto] = useState<string | null>(null);
  const [otherUserName, setOtherUserName] = useState<string>("Usuario");
  const [otherUserId, setOtherUserId] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const initChat = async () => {
      if (reservationId && participants && user) {
        try {
          setLoading(true);
          setError(null);

          // Fetch real participant names and photos
          const participantNames: { [key: string]: string } = {};
          const participantPhotos: { [key: string]: string | null } = {};

          await Promise.all(
            participants.map(async (pid: string) => {
              try {
                const userDoc = await getDoc(doc(db, "users", pid));
                if (userDoc.exists()) {
                  const userData = userDoc.data();
                  participantNames[pid] = userData.nombre || "Usuario";
                  participantPhotos[pid] = userData.photoURL || null;
                } else {
                  participantNames[pid] = "Usuario";
                  participantPhotos[pid] = null;
                }
              } catch (e) {
                console.error("Error fetching user", pid, e);
                participantNames[pid] = "Usuario";
                participantPhotos[pid] = null;
              }
            }),
          );

          const otherId = participants.find((p: string) => p !== user.uid);
          if (otherId) {
            setOtherUserId(otherId);
            setOtherUserPhoto(participantPhotos[otherId] || null);
            setOtherUserName(participantNames[otherId] || "Usuario");
          }

          await createChatIfNotExists(
            reservationId,
            participants,
            vehicleInfo,
            participantNames,
          );

          // Mark chat as read when user opens it
          await markChatAsRead(reservationId, user.uid);

          // Subscribe to recent messages with pagination
          unsubscribeRef.current = subscribeToRecentMessages(
            reservationId,
            20, // Initial load: 20 messages
            (newMessages, lastDoc) => {
              setMessages(newMessages);
              setLastVisible(lastDoc);
              setHasMore(newMessages.length === 20);
              setLoading(false);
            },
          );
        } catch (error: any) {
          console.error("Error initializing chat:", error);
          setLoading(false);

          if (error.code === "permission-denied") {
            setError("No tienes permiso para acceder a este chat");
          } else if (error.code === "unavailable") {
            setError("Sin conexión. Verifica tu internet.");
          } else {
            setError("Error al cargar el chat. Intenta de nuevo.");
          }
        }
      }
    };

    initChat();

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [reservationId, participants, user, vehicleInfo, retryKey]);

  const loadMoreMessages = useCallback(async () => {
    if (loadingMore || !hasMore || !lastVisible) return;

    setLoadingMore(true);
    try {
      const olderMessages = await loadOlderMessages(
        reservationId,
        lastVisible,
        20,
      );

      if (olderMessages.length > 0) {
        setMessages((prev) => [...prev, ...olderMessages]);
        setLastVisible(olderMessages[olderMessages.length - 1]);
        setHasMore(olderMessages.length === 20);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Error loading more messages:", error);
      Alert.alert("Error", "No se pudieron cargar más mensajes");
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, lastVisible, reservationId]);

  const handlePickImage = useCallback(async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0].uri) {
        setSendingMessage(true);
        const uri = result.assets[0].uri;

        // Upload to Firebase Storage
        const response = await fetch(uri);
        const blob = await response.blob();
        const filename = `chat/${reservationId}/${Date.now()}.jpg`;
        const storageRef = ref(storage, filename);

        await uploadBytes(storageRef, blob);
        const downloadURL = await getDownloadURL(storageRef);

        // Send message with image
        await sendMessage(
          reservationId,
          "",
          user!.uid,
          downloadURL,
          otherUserId ?? undefined,
        );
        setSendingMessage(false);
      }
    } catch (error) {
      console.error("Error picking/uploading image:", error);
      Alert.alert("Error", "No se pudo enviar la imagen");
      setSendingMessage(false);
    }
  }, [reservationId, user, otherUserId]);

  const handleSend = useCallback(async () => {
    if (inputText.trim().length === 0 || !user || sendingMessage) return;

    const text = inputText.trim();
    setInputText("");
    setSendingMessage(true);

    try {
      await sendMessage(
        reservationId,
        text,
        user.uid,
        undefined,
        otherUserId ?? undefined,
      );
    } catch (error: any) {
      console.error("Error sending message:", error);
      setInputText(text); // Restore text on error

      if (error.code === "permission-denied") {
        Alert.alert(
          "Error",
          "No tienes permiso para enviar mensajes en este chat",
        );
      } else if (error.code === "unavailable") {
        Alert.alert("Sin conexión", "Verifica tu conexión a internet");
      } else {
        Alert.alert("Error", "No se pudo enviar el mensaje. Intenta de nuevo.");
      }
    } finally {
      setSendingMessage(false);
    }
  }, [inputText, user, sendingMessage, reservationId, otherUserId]);

  const renderMessage = useCallback(
    ({ item }: { item: Message }) => {
      const isMyMessage = item.senderId === user?.uid;

      return (
        <View
          style={[
            styles.messageContainer,
            isMyMessage
              ? styles.myMessageContainer
              : styles.theirMessageContainer,
          ]}
        >
          <View
            style={[
              styles.messageBubble,
              isMyMessage ? styles.myMessageBubble : styles.theirMessageBubble,
            ]}
          >
            {item.image ? (
              <Image
                source={{ uri: item.image }}
                style={{
                  width: 200,
                  height: 200,
                  borderRadius: 8,
                  marginBottom: 4,
                }}
                resizeMode="cover"
              />
            ) : null}
            {item.text ? (
              <Text
                style={[
                  styles.messageText,
                  isMyMessage ? styles.myMessageText : styles.theirMessageText,
                ]}
              >
                {item.text}
              </Text>
            ) : null}
            <Text
              style={[
                styles.messageTime,
                isMyMessage ? styles.myMessageTime : styles.theirMessageTime,
              ]}
            >
              {item.createdAt
                ?.toDate()
                .toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </Text>
          </View>
        </View>
      );
    },
    [user],
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        {otherUserPhoto ? (
          <Image
            source={{ uri: otherUserPhoto }}
            style={styles.headerAvatar}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.headerAvatar, styles.headerAvatarPlaceholder]}>
            <Text style={styles.headerAvatarInitials}>
              {otherUserName.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>
            {otherUserName !== "Usuario" ? otherUserName : "Chat"}
          </Text>
          {vehicleInfo && (
            <Text style={styles.headerSubtitle}>
              {vehicleInfo.marca} {vehicleInfo.modelo}
            </Text>
          )}
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 24}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0B729D" />
            <Text style={styles.loadingText}>Cargando mensajes...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={48} color="#EF4444" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => {
                setError(null);
                setLoading(true);
                setRetryKey((k) => k + 1);
              }}
            >
              <Text style={styles.retryButtonText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            inverted
            onEndReached={loadMoreMessages}
            onEndReachedThreshold={0.4}
            removeClippedSubviews={Platform.OS === "android"}
            maxToRenderPerBatch={10}
            windowSize={10}
            initialNumToRender={15}
            keyboardShouldPersistTaps="handled"
            maintainVisibleContentPosition={
              Platform.OS === "android" ? { minIndexForVisible: 0 } : undefined
            }
            ListFooterComponent={
              loadingMore ? (
                <View style={styles.loadingMoreContainer}>
                  <ActivityIndicator size="small" color="#0B729D" />
                  <Text style={styles.loadingMoreText}>
                    Cargando más mensajes...
                  </Text>
                </View>
              ) : !hasMore && messages.length > 0 ? (
                <View style={styles.endContainer}>
                  <Text style={styles.endText}>Inicio de la conversación</Text>
                </View>
              ) : null
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons
                  name="chatbubbles-outline"
                  size={64}
                  color="#D1D5DB"
                />
                <Text style={styles.emptyText}>No hay mensajes aún</Text>
                <Text style={styles.emptySubtext}>Inicia la conversación</Text>
              </View>
            }
          />
        )}

        <View style={styles.inputContainer}>
          <TouchableOpacity
            style={styles.attachButton}
            onPress={handlePickImage}
            disabled={sendingMessage}
          >
            <Ionicons name="image-outline" size={24} color="#6B7280" />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder="Escribe un mensaje..."
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!inputText.trim() || sendingMessage) &&
                styles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            disabled={!inputText.trim() || sendingMessage}
          >
            {sendingMessage ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="send" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight! + 10 : 12,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  headerAvatarPlaceholder: {
    backgroundColor: "#E0F2FE",
    alignItems: "center",
    justifyContent: "center",
  },
  headerAvatarInitials: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0B729D",
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#6B7280",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  messageContainer: {
    marginBottom: 12,
    flexDirection: "row",
  },
  myMessageContainer: {
    justifyContent: "flex-end",
  },
  theirMessageContainer: {
    justifyContent: "flex-start",
  },
  messageBubble: {
    maxWidth: "80%",
    padding: 12,
    borderRadius: 20,
  },
  myMessageBubble: {
    backgroundColor: "#0B729D",
    borderBottomRightRadius: 4,
  },
  theirMessageBubble: {
    backgroundColor: "#F3F4F6",
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  myMessageText: {
    color: "#fff",
  },
  theirMessageText: {
    color: "#111827",
  },
  messageTime: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: "flex-end",
  },
  myMessageTime: {
    color: "rgba(255,255,255,0.7)",
  },
  theirMessageTime: {
    color: "#9CA3AF",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    backgroundColor: "#fff",
  },
  input: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 12,
    fontSize: 16,
    maxHeight: 100,
  },
  attachButton: {
    padding: 8,
    marginRight: 4,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#0B729D",
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    backgroundColor: "#E5E7EB",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#6B7280",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: "#EF4444",
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "#0B729D",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    minHeight: 400,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  emptySubtext: {
    marginTop: 4,
    fontSize: 14,
    color: "#6B7280",
  },
  loadingMoreContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
    gap: 8,
  },
  loadingMoreText: {
    fontSize: 14,
    color: "#6B7280",
  },
  endContainer: {
    paddingVertical: 20,
    alignItems: "center",
  },
  endText: {
    fontSize: 12,
    color: "#9CA3AF",
    fontStyle: "italic",
  },
});
