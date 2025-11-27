import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/Auth';
import { createChatIfNotExists, markChatAsRead, Message, sendMessage, subscribeToMessages } from '../services/chat';

export default function ChatRoom() {
    const navigation = useNavigation();
    const route = useRoute<any>();
    const { reservationId, participants, vehicleInfo } = route.params;
    const { user } = useAuth();
    
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(true);
    const [sendingMessage, setSendingMessage] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        let unsubscribe: (() => void) | undefined;

        const initChat = async () => {
            if (reservationId && participants && user) {
                try {
                    setLoading(true);
                    setError(null);
                    
                    await createChatIfNotExists(reservationId, participants, vehicleInfo);
                    
                    // Mark chat as read when user opens it
                    await markChatAsRead(reservationId, user.uid);
                    
                    unsubscribe = subscribeToMessages(reservationId, (newMessages) => {
                        setMessages(newMessages);
                        setLoading(false);
                    });
                } catch (error: any) {
                    console.error("Error initializing chat:", error);
                    setLoading(false);
                    
                    if (error.code === 'permission-denied') {
                        setError('No tienes permiso para acceder a este chat');
                    } else if (error.code === 'unavailable') {
                        setError('Sin conexión. Verifica tu internet.');
                    } else {
                        setError('Error al cargar el chat. Intenta de nuevo.');
                    }
                }
            }
        };
        
        initChat();

        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, [reservationId]);

    const handleSend = async () => {
        if (inputText.trim().length === 0 || !user || sendingMessage) return;
        
        const text = inputText.trim();
        setInputText('');
        setSendingMessage(true);
        
        try {
            await sendMessage(reservationId, text, user.uid);
        } catch (error: any) {
            console.error('Error sending message:', error);
            setInputText(text); // Restore text on error
            
            if (error.code === 'permission-denied') {
                Alert.alert('Error', 'No tienes permiso para enviar mensajes en este chat');
            } else if (error.code === 'unavailable') {
                Alert.alert('Sin conexión', 'Verifica tu conexión a internet');
            } else {
                Alert.alert('Error', 'No se pudo enviar el mensaje. Intenta de nuevo.');
            }
        } finally {
            setSendingMessage(false);
        }
    };

    const renderMessage = ({ item }: { item: Message }) => {
        const isMyMessage = item.senderId === user?.uid;
        
        return (
            <View style={[
                styles.messageContainer, 
                isMyMessage ? styles.myMessageContainer : styles.theirMessageContainer
            ]}>
                <View style={[
                    styles.messageBubble,
                    isMyMessage ? styles.myMessageBubble : styles.theirMessageBubble
                ]}>
                    <Text style={[
                        styles.messageText,
                        isMyMessage ? styles.myMessageText : styles.theirMessageText
                    ]}>
                        {item.text}
                    </Text>
                    <Text style={[
                        styles.messageTime,
                        isMyMessage ? styles.myMessageTime : styles.theirMessageTime
                    ]}>
                        {item.createdAt?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />
            
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#111827" />
                </TouchableOpacity>
                <View style={styles.headerInfo}>
                    <Text style={styles.headerTitle}>Chat</Text>
                    {vehicleInfo && (
                        <Text style={styles.headerSubtitle}>{vehicleInfo.marca} {vehicleInfo.modelo}</Text>
                    )}
                </View>
            </View>

            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
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
                            onPress={() => window.location.reload()}
                        >
                            <Text style={styles.retryButtonText}>Reintentar</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <FlatList
                        ref={flatListRef}
                        data={messages}
                        renderItem={renderMessage}
                        keyExtractor={item => item.id}
                        contentContainerStyle={styles.listContent}
                        inverted
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Ionicons name="chatbubbles-outline" size={64} color="#D1D5DB" />
                                <Text style={styles.emptyText}>No hay mensajes aún</Text>
                                <Text style={styles.emptySubtext}>Inicia la conversación</Text>
                            </View>
                        }
                    />
                )}

                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Escribe un mensaje..."
                        value={inputText}
                        onChangeText={setInputText}
                        multiline
                        maxLength={500}
                    />
                    <TouchableOpacity 
                        style={[styles.sendButton, (!inputText.trim() || sendingMessage) && styles.sendButtonDisabled]} 
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
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight! + 10 : 12,
    },
    backButton: {
        padding: 8,
        marginRight: 12,
    },
    headerInfo: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
    },
    headerSubtitle: {
        fontSize: 12,
        color: '#6B7280',
    },
    listContent: {
        paddingHorizontal: 16,
        paddingVertical: 20,
    },
    messageContainer: {
        marginBottom: 12,
        flexDirection: 'row',
    },
    myMessageContainer: {
        justifyContent: 'flex-end',
    },
    theirMessageContainer: {
        justifyContent: 'flex-start',
    },
    messageBubble: {
        maxWidth: '80%',
        padding: 12,
        borderRadius: 20,
    },
    myMessageBubble: {
        backgroundColor: '#0B729D',
        borderBottomRightRadius: 4,
    },
    theirMessageBubble: {
        backgroundColor: '#F3F4F6',
        borderBottomLeftRadius: 4,
    },
    messageText: {
        fontSize: 16,
        lineHeight: 22,
    },
    myMessageText: {
        color: '#fff',
    },
    theirMessageText: {
        color: '#111827',
    },
    messageTime: {
        fontSize: 10,
        marginTop: 4,
        alignSelf: 'flex-end',
    },
    myMessageTime: {
        color: 'rgba(255,255,255,0.7)',
    },
    theirMessageTime: {
        color: '#9CA3AF',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        backgroundColor: '#fff',
    },
    input: {
        flex: 1,
        backgroundColor: '#F9FAFB',
        borderRadius: 24,
        paddingHorizontal: 16,
        paddingVertical: 10,
        marginRight: 12,
        fontSize: 16,
        maxHeight: 100,
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#0B729D',
        alignItems: 'center',
        justifyContent: 'center',
    },
    sendButtonDisabled: {
        backgroundColor: '#E5E7EB',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#6B7280',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        marginTop: 12,
        fontSize: 16,
        color: '#EF4444',
        textAlign: 'center',
        marginBottom: 20,
    },
    retryButton: {
        backgroundColor: '#0B729D',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    },
    retryButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 16,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
        minHeight: 400,
    },
    emptyText: {
        marginTop: 16,
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
    },
    emptySubtext: {
        marginTop: 4,
        fontSize: 14,
        color: '#6B7280',
    },
});
