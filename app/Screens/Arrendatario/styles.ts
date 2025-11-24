import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '600',
    color: '#0B729D',
  },
  appName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0B729D',
    letterSpacing: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#032B3C',
    marginBottom: 15,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  viewToggle: {
    padding: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
  },
  mapContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  promoContainer: {
    marginBottom: 10,
  },
  promoList: {
    paddingHorizontal: 20,
    gap: 16,
  },
  promoCard: {
    width: 280,
    height: 140,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    padding: 20,
  },
  promoContent: {
    zIndex: 2,
    maxWidth: '45%',
  },
  promoTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  promoSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  promoImage: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: '55%',
    height: '100%',
    resizeMode: 'contain',
  },
  categoryContainer: {
    backgroundColor: '#fff',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  categoryList: {
    paddingHorizontal: 20,
    gap: 24,
  },
  categoryItem: {
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    opacity: 0.6,
  },
  categoryItemActive: {
    opacity: 1,
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  categoryLabelActive: {
    color: '#0B729D',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: 2,
    backgroundColor: '#0B729D',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#032B3C',
  },
});
