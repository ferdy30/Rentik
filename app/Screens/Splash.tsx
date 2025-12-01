import AsyncStorage from '@react-native-async-storage/async-storage';
import type { NavigationProp } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    Easing,
    ImageBackground,
    Platform,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../constants/colors';

// Pantalla de splash con secuencia de 3 pantallas de onboarding
const ONBOARDING_KEY = 'hasSeenOnboarding';
const { width, height } = Dimensions.get('window');

export default function Splash({ navigation }: { navigation?: NavigationProp<any> }) {
  // Estado para controlar qué pantalla mostrar (0, 1, o 2)
  const [currentScreen, setCurrentScreen] = useState(0);
  const [shouldShowOnboarding, setShouldShowOnboarding] = useState(false);
  const hasNavigation = Boolean(navigation);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  // Array con los datos de cada pantalla del onboarding
  const screens = [
    {
      title: 'Bienvenido a Rentik',
      subtitle: 'Tu viaje comienza aquí',
      description: 'La plataforma líder en El Salvador para rentar vehículos de forma segura y confiable.',
      image: require('../../assets/images/splash1.jpeg'),
    },
    {
      title: 'Viaja con Libertad',
      subtitle: 'Encuentra el auto perfecto',
      description: 'Desde compactos económicos hasta camionetas familiares. Elige el que mejor se adapte a tu aventura.',
      image: require('../../assets/images/splash2.jpeg'),
    },
    {
      title: 'Genera Ingresos',
      subtitle: 'Convierte tu auto en un activo',
      description: 'Únete como Host y empieza a ganar dinero rentando tu vehículo con total seguridad.',
      image: require('../../assets/images/RentaSplash.jpg'),
    },
  ];

  // Trigger content intro animation when screen changes
  useEffect(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(30);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
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
        <StatusBar barStyle="light-content" />
        <ImageBackground
          source={require('../../assets/images/splash1.jpeg')}
          style={styles.loadingBg}
          blurRadius={10}
        >
          <View style={styles.overlay} />
          <View style={styles.loadingContent}>
            <View style={styles.logoContainer}>
               <Text style={styles.logoText}>Rentik</Text>
            </View>
            <ActivityIndicator size="large" color="#fff" style={{ marginTop: 30 }} />
          </View>
        </ImageBackground>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      <ImageBackground
        source={currentData.image}
        style={styles.backgroundImage}
        resizeMode="cover"
        blurRadius={Platform.OS === 'ios' ? 6 : 3} // Desenfoque sutil pero notable
      >
        {/* Gradiente oscuro para legibilidad */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.85)', '#000']}
          locations={[0, 0.4, 0.7, 1]}
          style={StyleSheet.absoluteFill}
        />

        <SafeAreaView style={styles.safeArea}>
          {/* Header: Skip Button */}
          <View style={styles.header}>
            {shouldShowOnboarding && (
              <TouchableOpacity
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
              >
                <Text style={styles.skipText}>Saltar</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Main Content */}
          <View style={styles.contentContainer}>
            <Animated.View 
              style={[
                styles.textWrapper, 
                { 
                  opacity: fadeAnim, 
                  transform: [{ translateY: slideAnim }] 
                }
              ]}
            >
              <View style={styles.badgeContainer}>
                <Text style={styles.badgeText}>Rentik</Text>
              </View>
              
              <Text style={styles.title}>{currentData.title}</Text>
              <Text style={styles.subtitle}>{currentData.subtitle}</Text>
              <Text style={styles.description}>{currentData.description}</Text>
            </Animated.View>

            {/* Footer Controls */}
            <View style={styles.footer}>
              {/* Pagination Dots */}
              <View style={styles.pagination}>
                {screens.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.dot,
                      index === currentScreen && styles.dotActive,
                    ]}
                  />
                ))}
              </View>

              {/* Next Button */}
              {shouldShowOnboarding && (
                <TouchableOpacity
                  style={styles.nextButton}
                  onPress={handleNext}
                  activeOpacity={0.8}
                >
                  <Text style={styles.nextButtonText}>
                    {currentScreen < screens.length - 1 ? 'Siguiente' : 'Comenzar'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  safeArea: {
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
    paddingTop: 10,
  },
  skipButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  skipText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  contentContainer: {
    paddingHorizontal: 32,
    paddingBottom: Platform.OS === 'ios' ? 20 : 24,
    width: '100%',
  },
  textWrapper: {
    alignItems: 'flex-start', // Alineación a la izquierda para look más moderno/editorial
    marginBottom: 40,
  },
  badgeContainer: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 8,
    letterSpacing: -0.5,
    lineHeight: 42,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.primary, // Acento de color
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 26,
    fontWeight: '400',
  },
  footer: {
    width: '100%',
    gap: 30,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'flex-start', // Puntos alineados a la izquierda
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  dotActive: {
    backgroundColor: colors.primary,
    width: 24,
  },
  nextButton: {
    width: '100%',
    height: 58,
    backgroundColor: colors.primary,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  
  // Loading State Styles
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingBg: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  loadingContent: {
    alignItems: 'center',
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backdropFilter: 'blur(10px)', // Web support
  },
  logoText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
