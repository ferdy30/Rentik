import AsyncStorage from '@react-native-async-storage/async-storage';
import type { NavigationProp } from '@react-navigation/native';
import { StackActions } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { ImageBackground, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../constants/colors';

// Pantalla de splash con secuencia de 3 pantallas de onboarding
const ONBOARDING_KEY = 'hasSeenOnboarding';

export default function Splash({ navigation }: { navigation?: NavigationProp<any> }) {
  // Estado para controlar qué pantalla mostrar (0, 1, o 2)
  const [currentScreen, setCurrentScreen] = useState(0);
  const [shouldShowOnboarding, setShouldShowOnboarding] = useState(false);
  const hasNavigation = Boolean(navigation);

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

  // Decidir si mostramos onboarding o vamos directo al Login
  useEffect(() => {
    if (!hasNavigation) return; // Si es modo loading, no decidir aquí
    (async () => {
      try {
        const seen = await AsyncStorage.getItem(ONBOARDING_KEY);
        if (seen === 'true') {
          navigation!.dispatch(StackActions.replace('Login'));
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
      navigation && navigation.dispatch(StackActions.replace('Login'));
    }
  };

  const currentData = screens[currentScreen];

  return (
    <ImageBackground
      source={currentData.image}
      style={styles.bg}
      resizeMode="cover"
    >
      {/* Capa oscura para mejorar la legibilidad sobre la imagen */}
      <View style={styles.overlay} />
      {/* Botón para saltar el onboarding */}
      {shouldShowOnboarding && (
        <TouchableOpacity
          accessibilityRole="button"
          onPress={async () => {
            try { await AsyncStorage.setItem(ONBOARDING_KEY, 'true'); } catch {}
            navigation && navigation.dispatch(StackActions.replace('Login'));
          }}
          style={styles.skipButton}
          hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
        >
          <Text style={styles.skipText}>Saltar</Text>
        </TouchableOpacity>
      )}
      <View style={styles.content}>
        {/* Textos informativos */}
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
      </View>
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
    backgroundColor: 'rgba(11,114,157,0.25)', // azul degradado overlay para resaltar texto
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
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
    backgroundColor: 'rgba(11,114,157,0.85)',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 18,
    shadowColor: '#032B3C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
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
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 15,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 20,
    color: '#e0e0e0',
    marginBottom: 15,
    textAlign: 'center',
    fontWeight: '600',
  },
  description: {
    fontSize: 16,
    color: '#b0b0b0',
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
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#555',
    marginHorizontal: 5,
  },
  progressDotActive: {
    backgroundColor: colors.accent,
  },
});
