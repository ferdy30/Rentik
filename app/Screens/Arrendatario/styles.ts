import { Dimensions, Platform, StatusBar, StyleSheet } from 'react-native';

const { width } = Dimensions.get('window');
export const CARD_WIDTH = (width - (16 * 3)) / 2; // (ancho total - (margenes laterales * 2 + espacio entre tarjetas)) / 2

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 16 : 60,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerSubtitle: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  headerTitle: {
    color: '#0B729D',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  appName: {
    color: '#0B729D',
    fontSize: 24,
    fontWeight: '700',
  },
  viewToggle: {
    padding: 10,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  // Search
  searchSection: {
    backgroundColor: '#FFFFFF',
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    height: 50,
    paddingHorizontal: 12,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchText: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  filterButton: {
    backgroundColor: '#F3F4F6',
    padding: 10,
    borderRadius: 10,
  },
  filterChip: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  // Categories
  categoryContainer: {
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  categoryList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  categoryChipActive: {
    backgroundColor: '#0B729D',
    borderWidth: 0,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
    color: '#6B7280',
  },
  categoryLabelActive: {
    color: '#fff',
  },

  // Content
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 16,
  },

  // Promotions
  promoContainer: {
    marginBottom: 16,
    marginTop: 10,
  },
  promoList: {
    gap: 12,
    paddingHorizontal: 0,
  },
  promoCard: {
    width: width * 0.85,
    height: width * 0.4,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#E5E7EB',
  },
  promoImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  promoGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '100%',
  },
  promoContent: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,    zIndex: 2,
  },
  promoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  promoSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },

  // Map
  mapContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  map: {
    width: '100%',
    height: '100%',
  },

  // Viajes Styles
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
  },
  cardDate: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  cardLocation: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  filterChipActive: {
    backgroundColor: '#0B729D',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterTextActive: {
    color: '#fff',
  },
});
