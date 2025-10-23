import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

// Splash screen inspirado en renta de carros en El Salvador
export default function Splash() {
  return (
    <LinearGradient colors={['#FF5A5F', '#FFB347']} style={styles.container}>
      <View style={styles.content}>
        <Image source={require('../../assets/images/Logo.png')} style={styles.logo} />
        <Text style={styles.title}>Rentik</Text>
        <Text style={styles.subtitle}>¡Tu mejor opción para rentar carros en El Salvador!</Text>
        <Image source={require('../../assets/images/Logo.png')} style={styles.car} />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: 'white',
    marginBottom: 30,
    textAlign: 'center',
  },
  car: {
    width: 220,
    height: 120,
    resizeMode: 'contain',
    marginTop: 10,
  },
});
