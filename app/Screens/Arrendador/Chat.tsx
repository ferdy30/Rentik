import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useAuth } from '../../context/Auth';
import { Chat, loadOlderChats, subscribeToUserChats } from '../../services/chat';

export default function ChatScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastVisible, setLastVisible] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    const unsubscribe = subscribeToUserChats(
      user.uid,
      15, // Load 15 chats initially
      (newChats, lastDoc) => {
        setChats(newChats);
        setLastVisible(lastDoc);
        setHasMore(newChats.length === 15);
        setLoading(false);
      },
      (error) => {
        console.error('Error loading chats:', error);
        setLoading(false);
        setError('Error al cargar los chats');
      }
    );
    
    return () => unsubscribe();
  }, [user]);

  const loadMoreChats = async () => {
    if (loadingMore || !hasMore || !lastVisible || !user) return;

    setLoadingMore(true);
    try {
      const olderChats = await loadOlderChats(user.uid, lastVisible, 15);
      
      if (olderChats.length > 0) {
        setChats(prev => [...prev, ...olderChats]);
        setLastVisible(olderChats[olderChats.length - 1]);
        setHasMore(olderChats.length === 15);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error loading more chats:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const renderItem = ({ item }: { item: Chat }) => {
    const otherUserId = item.participants.find(p => p !== user?.uid);
    const otherUserName = otherUserId && item.participantNames?.[otherUserId] ? item.participantNames[otherUserId] : 'Cliente';
    const vehicleName = item.vehicleInfo ? `${item.vehicleInfo.marca} ${item.vehicleInfo.modelo}` : 'Reserva';
    const displayName = `${otherUserName} - ${vehicleName}`;
    const unreadCount = user?.uid ? (item.unreadCount?.[user.uid] || 0) : 0;

    return (
      <TouchableOpacity 
        style={styles.chatItem}
        onPress={() => navigation.navigate('ChatRoom', {
          reservationId: item.reservationId,
          participants: item.participants,
          vehicleInfo: item.vehicleInfo
        })}
      >
        <View style={styles.avatarContainer}>
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarInitials}>{otherUserName.charAt(0).toUpperCase()}</Text>
          </View>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
            </View>
          )}
        </View>
        
        <View style={styles.chatContent}>
          <View style={styles.chatHeader}>
            <Text style={[styles.name, unreadCount > 0 && styles.nameUnread]} numberOfLines={1}>{displayName}</Text>
            <Text style={styles.time}>
              {item.lastMessageTimestamp?.toDate().toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.messageContainer}>
            <Text style={[styles.lastMessage, unreadCount > 0 && styles.lastMessageUnread]} numberOfLines={1}>
              {item.lastMessage || 'Inicia la conversación...'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mensajes</Text>
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0B729D" />
          <Text style={styles.loadingText}>Cargando chats...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : chats.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="chatbubbles-outline" size={64} color="#D1D5DB" />
          <Text style={styles.emptyText}>No tienes mensajes aún</Text>
        </View>
      ) : (
        <FlatList
          data={chats}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          onEndReached={loadMoreChats}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.loadingMoreContainer}>
                <ActivityIndicator size="small" color="#0B729D" />
                <Text style={styles.loadingMoreText}>Cargando más...</Text>
              </View>
            ) : null
          }
        />
      )}
    </View>
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
  },
  listContent: {
    paddingBottom: 20,
  },
  chatItem: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F3F4F6',
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E0F2FE',
  },
  avatarInitials: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0B729D',
  },
  chatContent: {
    flex: 1,
    justifyContent: 'center',
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  time: {
    fontSize: 12,
    color: '#6B7280',
  },
  messageContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
    marginRight: 8,
  },
  separator: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginLeft: 92,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  unreadBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  unreadText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  nameUnread: {
    fontWeight: '800',
  },
  lastMessageUnread: {
    color: '#111827',
    fontWeight: '600',
  },
  vehicleLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
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
  },
  loadingMoreContainer: {
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  loadingMoreText: {
    fontSize: 14,
    color: '#6B7280',
  },
});
