import AsyncStorage from '@react-native-async-storage/async-storage';
import type { NavigationProp } from '@react-navigation/native';
// import { StackActions } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, ImageBackground, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../constants/colors';

// Pantalla de splash con secuencia de 3 pantallas de onboarding
const ONBOARDING_KEY = 'hasSeenOnboarding';

export default function Splash({ navigation }: { navigation?: NavigationProp<any> }) {
  // Estado para controlar qué pantalla mostrar (0, 1, o 2)
  const [currentScreen, setCurrentScreen] = useState(0);
  const [shouldShowOnboarding, setShouldShowOnboarding] = useState(false);
  const hasNavigation = Boolean(navigation);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.98)).current;

  // Array con los datos de cada pantalla del onboarding
  const screens = [
    {
      title: 'Rentik',
      subtitle: '¡Tu mejor opción para rentar carros en El Salvador!',
      description: 'Conectamos arrendadores y arrendatarios de manera segura y eficiente.',
      image: require('../../assets/images/splash1.jpeg'),
    },
    {
      title: 'Seguridad Garantizada',
      subtitle: 'Verificación completa de usuarios',
      description: 'Todos nuestros usuarios pasan por un proceso de verificación riguroso.',
      image: require('../../assets/images/splash2.jpeg'),
    },
    {
      title: 'Fácil y Rápido',
      subtitle: 'Encuentra tu carro ideal en minutos',
      description: 'Navega por nuestra amplia selección y reserva al instante.',
      image: require('../../assets/images/RentaSplash.jpg'),
    },
  ];

  // Trigger content intro animation when screen changes
  useEffect(() => {
    fadeAnim.setValue(0);
    scaleAnim.setValue(0.98);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 650,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
    ]).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentScreen]);

  // Decidir si mostramos onboarding o vamos directo al Login
  useEffect(() => {
    if (!hasNavigation) return; // Si es modo loading, no decidir aquí
    (async () => {
      try {
        const seen = await AsyncStorage.getItem(ONBOARDING_KEY);
        if (seen === 'true') {
          // Solo navega a Login si la ruta existe en el stack actual
          try {
            const state: any = navigation?.getState?.();
            const routeNames: string[] = state?.routeNames || state?.routes?.map((r: any) => r.name) || [];
            if (routeNames.includes('Login')) {
              navigation!.navigate('Login' as never);
            } else {
              // En otros stacks (loading/authenticated) no navegamos manualmente
              setShouldShowOnboarding(false);
            }
          } catch {
            setShouldShowOnboarding(false);
          }
        } else {
          setShouldShowOnboarding(true);
        }
      } catch {
        setShouldShowOnboarding(true);
      }
    })();
  }, [hasNavigation, navigation]);


  // Cuando llega a la última pantalla y presiona Siguiente, marcar como visto y navegar a Login
  const handleNext = async () => {
    if (currentScreen < screens.length - 1) {
      setCurrentScreen(currentScreen + 1);
    } else {
      try { await AsyncStorage.setItem(ONBOARDING_KEY, 'true'); } catch {}
      if (navigation) {
        try {
          const state: any = navigation.getState?.();
          const routeNames: string[] = state?.routeNames || state?.routes?.map((r: any) => r.name) || [];
          if (routeNames.includes('Login')) {
            navigation.navigate('Login' as never);
          }
        } catch {}
      }
    }
  };

  const currentData = screens[currentScreen];

  // Si no hay navegación, es modo "carga" - mostrar solo el logo y spinner
  if (!hasNavigation) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={colors.gradients.main as unknown as readonly [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.loadingContent}>
          <View style={styles.brandBadge}>
            <Text style={styles.brandText}>Rentik</Text>
          </View>
          <ActivityIndicator size="large" color="#fff" style={{ marginTop: 20 }} />
          <Text style={styles.loadingText}>Cargando...</Text>
        </View>
      </View>
    );
  }

  return (
    <ImageBackground
      source={currentData.image}
      style={styles.bg}
      resizeMode="cover"
    >
      {/* Capa con degradado para mejor contraste */}
      <LinearGradient
        colors={colors.gradients.main as unknown as readonly [string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.overlay}
      />
      {/* Botón para saltar el onboarding */}
      {shouldShowOnboarding && (
        <TouchableOpacity
          accessibilityRole="button"
          onPress={async () => {
            try { await AsyncStorage.setItem(ONBOARDING_KEY, 'true'); } catch {}
            if (navigation) {
              try {
                const state: any = navigation.getState?.();
                const routeNames: string[] = state?.routeNames || state?.routes?.map((r: any) => r.name) || [];
                if (routeNames.includes('Login')) {
                  navigation.navigate('Login' as never);
                }
              } catch {}
            }
          }}
          style={styles.skipButton}
          hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
        >
          <Text style={styles.skipText}>Saltar</Text>
        </TouchableOpacity>
      )}
      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        {/* Textos informativos */}
        <View style={styles.brandBadge}>
          <Text style={styles.brandText}>Rentik</Text>
        </View>
        <Text style={styles.title}>{currentData.title}</Text>
        <Text style={styles.subtitle}>{currentData.subtitle}</Text>
        <Text style={styles.description}>{currentData.description}</Text>

        {/* Indicadores de progreso - puntos que muestran en qué pantalla estás */}
        <View style={styles.progressContainer}>
          {screens.map((_, index) => (
            <View
              key={index}
              style={[
                styles.progressDot,
                index === currentScreen && styles.progressDotActive,
              ]}
            />
          ))}
        </View>
        {/* Botón de avance manual */}
        {shouldShowOnboarding && (
          <TouchableOpacity
            style={styles.nextButton}
            onPress={handleNext}
            accessibilityRole="button"
          >
            <Text style={styles.nextText}>{currentScreen < screens.length - 1 ? 'Siguiente' : 'Empezar'}</Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    // Gradient applied via LinearGradient component
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    opacity: 0.55,
  },
  skipButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 2,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(28,28,30,0.6)',
  },
  nextButton: {
    marginTop: 30,
    alignSelf: 'center',
    backgroundColor: 'rgba(11,114,157,0.95)',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 18,
    shadowColor: '#032B3C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    ...(Platform.OS === 'android' ? { elevation: 2 } : null),
  },
  nextText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  skipText: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingHorizontal: 20,
    zIndex: 1,
  },
  brandBadge: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    marginBottom: 18,
  },
  brandText: {
    color: colors.text.white,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 15,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 20,
    color: '#E6F1F5',
    marginBottom: 15,
    textAlign: 'center',
    fontWeight: '600',
  },
  description: {
    fontSize: 16,
    color: '#C7D9E1',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.35)',
    marginHorizontal: 5,
  },
  progressDotActive: {
    backgroundColor: '#FFFFFF',
    width: 16,
    borderRadius: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 20,
    fontWeight: '500',
  },
});
