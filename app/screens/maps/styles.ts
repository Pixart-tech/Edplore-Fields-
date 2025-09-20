import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  screenContent: {
    flex: 1,
  },
  searchSection: {
    flex: 8,
    justifyContent: 'center',
  },
  searchContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  assignedWrapper: {
    flex: 7,
    justifyContent: 'center',
  },
  assignedSection: {
    flexShrink: 0,
    marginHorizontal: 16,
    marginBottom: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  assignedScroll: {
    flexDirection: 'row',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  cityChip: {
    backgroundColor: '#E3F2FD',
  },
  cityChipText: {
    color: '#1976D2',
  },
  areaChip: {
    backgroundColor: '#E8F5E8',
  },
  areaChipText: {
    color: '#2E7D32',
  },
  noticeContainer: {
    marginHorizontal: 16,
    marginBottom: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#FFF3E0',
  },
  noticeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  noticeText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
    color: '#F57C00',
  },
  legendContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  legendScroll: {
    flexDirection: 'row',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    fontWeight: '500',
  },
  clusterToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginTop: 8,
  },
  clusterToggleLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  mapSection: {
    flex: 85,
    position: 'relative',
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  mapFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 20,
  },
  mapFallbackText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  mapFallbackSubtext: {
    marginTop: 8,
    fontSize: 14,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  mapOverlay: {
    ...StyleSheet.absoluteFillObject,
    padding: 16,
    justifyContent: 'flex-start',
  },
  toolbarWrapper: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  toolbarScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 12,
  },
  toolbarButtonWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toolbarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  toolbarButtonText: {
    marginLeft: 6,
    fontWeight: '600',
  },
  toolbarClearButton: {
    marginLeft: 8,
    padding: 6,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toolbarSwitch: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  toolbarSwitchLabel: {
    marginLeft: 6,
    marginRight: 8,
    fontWeight: '600',
  },
  badge: {
    marginLeft: 8,
    minWidth: 20,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  overlayPanels: {
    marginTop: 12,
    rowGap: 12,
  },
  overlayCard: {
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  filterDropdown: {
    left: 0,
    right: 0,
  },
  legendTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  legendOverlayContainer: {
    borderBottomWidth: 0,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  legendOverlayTitle: {
    marginBottom: 12,
  },
});

export default styles;
