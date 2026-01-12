import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import type { MapViewProps, MarkerProps, CircleProps, CalloutProps } from 'react-native-maps';

/**
 * Componente MapView con carga diferida
 * Reduce el tamaño del bundle inicial al cargar react-native-maps solo cuando se necesita
 */
export const LazyMapView: React.FC<MapViewProps> = (props) => {
  const [MapViewComponent, setMapViewComponent] = useState<any>(null);

  useEffect(() => {
    import('react-native-maps').then((module) => {
      setMapViewComponent(() => module.default);
    });
  }, []);

  if (!MapViewComponent) {
    return (
      <View style={[styles.loadingContainer, props.style]}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return <MapViewComponent {...props} />;
};

/**
 * Componente Marker con carga diferida
 */
export const LazyMarker: React.FC<MarkerProps> = (props) => {
  const [MarkerComponent, setMarkerComponent] = useState<any>(null);

  useEffect(() => {
    import('react-native-maps').then((module) => {
      setMarkerComponent(() => module.Marker);
    });
  }, []);

  if (!MarkerComponent) return null;
  return <MarkerComponent {...props} />;
};

/**
 * Componente Circle con carga diferida
 */
export const LazyCircle: React.FC<CircleProps> = (props) => {
  const [CircleComponent, setCircleComponent] = useState<any>(null);

  useEffect(() => {
    import('react-native-maps').then((module) => {
      setCircleComponent(() => module.Circle);
    });
  }, []);

  if (!CircleComponent) return null;
  return <CircleComponent {...props} />;
};

/**
 * Componente Callout con carga diferida
 */
export const LazyCallout: React.FC<CalloutProps> = (props) => {
  const [CalloutComponent, setCalloutComponent] = useState<any>(null);

  useEffect(() => {
    import('react-native-maps').then((module) => {
      setCalloutComponent(() => module.Callout);
    });
  }, []);

  if (!CalloutComponent) return null;
  return <CalloutComponent {...props} />;
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
});

// Re-exportar constantes que no necesitan lazy loading
export { PROVIDER_GOOGLE } from 'react-native-maps';
export type { Region } from 'react-native-maps';

