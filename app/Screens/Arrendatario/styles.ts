import { Dimensions, Platform, StatusBar, StyleSheet } from 'react-native';

const { width, height } = Dimensions.get('window');
export const CARD_WIDTH = (width - 22) / 2; // 2 columnas: 8px padding izq + 8px padding der + 6px gap

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
    paddingHorizontal: 0,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1F2937',
    marginTop: 20,
    marginBottom: 16,
    paddingHorizontal: 8,
    letterSpacing: -0.3,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
    rowGap: 12,
    columnGap: 6,
    paddingHorizontal: 8,
  },

  // Promotions
  promoContainer: {
    marginBottom: 28,
    marginTop: 12,
    paddingHorizontal: 0,
  },
  promoList: {
    gap: 12,
    paddingHorizontal: 8,
  },
  promoCard: {
    width: width * 0.78,
    height: width * 0.40,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
    borderWidth: 0,
    flexShrink: 0,
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
    zIndex: 1,
  },
  promoContent: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    zIndex: 2,
  },
  promoTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
    letterSpacing: -0.3,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  promoSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.95)',
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
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
  
  // New Styles
  activeFiltersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  activeFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  activeFilterText: {
    fontSize: 12,
    color: '#1D4ED8',
    marginRight: 4,
    fontWeight: '500',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D1D5DB',
  },
  paginationDotActive: {
    backgroundColor: '#0B729D',
    width: 24,
  },
  calloutContainer: {
    width: 200,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  calloutImage: {
    width: '100%',
    height: 100,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#F3F4F6',
  },
  calloutTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  calloutPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0B729D',
  },
  calloutRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  calloutRatingText: {
    fontSize: 12,
    color: '#4B5563',
    marginLeft: 4,
  },
});
