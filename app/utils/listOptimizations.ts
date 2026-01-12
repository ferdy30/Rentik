import { FlexStyle } from 'react-native';

/**
 * Configuración optimizada para FlatList
 * Mejora el rendimiento al renderizar listas grandes
 */
export const FLATLIST_OPTIMIZATIONS = {
  // Renderizar solo los elementos visibles + buffer
  windowSize: 10,
  
  // Cantidad de elementos iniciales a renderizar
  initialNumToRender: 6,
  
  // Items fuera de vista a mantener en memoria
  maxToRenderPerBatch: 5,
  
  // Tiempo de espera antes de renderizar el siguiente batch
  updateCellsBatchingPeriod: 50,
  
  // Remover elementos cuando salen del viewport
  removeClippedSubviews: true,
  
  // Cantidad de pantallas a mantener en memoria
  getItemLayout: (itemHeight: number) => (data: any, index: number) => ({
    length: itemHeight,
    offset: itemHeight * index,
    index,
  }),
};

/**
 * Props recomendadas para FlatList de vehículos
 */
export const VEHICLE_LIST_PROPS = {
  windowSize: 10,
  initialNumToRender: 6,
  maxToRenderPerBatch: 5,
  updateCellsBatchingPeriod: 50,
  removeClippedSubviews: true,
  keyExtractor: (item: any) => item.id,
};

/**
 * Props para listas de reservaciones/viajes
 */
export const RESERVATION_LIST_PROPS = {
  windowSize: 8,
  initialNumToRender: 5,
  maxToRenderPerBatch: 3,
  updateCellsBatchingPeriod: 50,
  removeClippedSubviews: true,
  keyExtractor: (item: any) => item.id,
};

/**
 * Estilo común para listas
 */
export const LIST_CONTAINER_STYLE: FlexStyle = {
  flex: 1,
};

export const LIST_CONTENT_STYLE: FlexStyle = {
  paddingBottom: 20,
};
