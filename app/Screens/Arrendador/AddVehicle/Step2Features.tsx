import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import {
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import type { ArrendadorStackParamList } from '../../../navigation/ArrendadorStack';
import { styles as commonStyles } from './styles';

type NavigationProp = NativeStackNavigationProp<ArrendadorStackParamList, 'AddVehicleStep2Features'>;

const FEATURES_LIST = [
    { id: 'ac', label: 'Aire Acondicionado', icon: 'snow-outline' },
    { id: 'bluetooth', label: 'Bluetooth', icon: 'bluetooth-outline' },
    { id: 'gps', label: 'GPS / Navegación', icon: 'map-outline' },
    { id: 'camera', label: 'Cámara de Reversa', icon: 'camera-reverse-outline' },
    { id: 'sensors', label: 'Sensores de Parqueo', icon: 'radio-outline' },
    { id: 'carplay', label: 'Apple CarPlay', icon: 'logo-apple' },
    { id: 'android', label: 'Android Auto', icon: 'logo-android' },
    { id: 'leather', label: 'Asientos de Cuero', icon: 'shirt-outline' }, // using shirt as proxy for seat material
    { id: 'sunroof', label: 'Sunroof / Quemacocos', icon: 'sunny-outline' },
    { id: '4x4', label: '4x4 / AWD', icon: 'car-sport-outline' },
    { id: 'third_row', label: 'Tercera Fila', icon: 'people-outline' },
    { id: 'heated_seats', label: 'Asientos Calefactables', icon: 'flame-outline' },
    { id: 'usb', label: 'Entrada USB / Aux', icon: 'musical-notes-outline' },
    { id: 'keyless', label: 'Entrada sin Llave', icon: 'key-outline' },
];

export default function Step2Features() {
    const navigation = useNavigation<NavigationProp>();
    const route = useRoute<any>();
    const { vehicleData } = route.params || {};

    const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);

    const toggleFeature = (label: string) => {
        setSelectedFeatures(prev => 
            prev.includes(label) 
                ? prev.filter(f => f !== label)
                : [...prev, label]
        );
    };

    const handleNext = () => {
        // It's okay if no features are selected, but usually at least one is good.
        // We'll allow empty.
        navigation.navigate('AddVehicleStep3Photos', {
            vehicleData: { ...vehicleData, caracteristicas: selectedFeatures }
        });
    };

    return (
        <View style={commonStyles.container}>
            <StatusBar barStyle="dark-content" />
            
            {/* Header */}
            <View style={commonStyles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={commonStyles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#032B3C" />
                </TouchableOpacity>
                <View style={commonStyles.headerCenter}>
                    <Text style={commonStyles.headerTitle}>Características</Text>
                    <Text style={commonStyles.headerSubtitle}>Paso 3 de 5</Text>
                </View>
                <View style={{ width: 40 }} />
            </View>

            {/* Progress Bar */}
            <View style={commonStyles.progressContainer}>
                <View style={[commonStyles.progressBar, { width: '60%' }]} />
            </View>

            <ScrollView style={commonStyles.content} showsVerticalScrollIndicator={false}>
                <Text style={commonStyles.sectionTitle}>¿Qué tiene tu auto?</Text>
                <Text style={{ color: '#6B7280', marginBottom: 20 }}>
                    Selecciona todas las características que apliquen. Los autos con más detalles suelen rentarse más rápido.
                </Text>

                <View style={styles.grid}>
                    {FEATURES_LIST.map((feature) => {
                        const isSelected = selectedFeatures.includes(feature.label);
                        return (
                            <TouchableOpacity
                                key={feature.id}
                                style={[styles.featureCard, isSelected && styles.featureCardSelected]}
                                onPress={() => toggleFeature(feature.label)}
                                activeOpacity={0.7}
                            >
                                <Ionicons 
                                    name={feature.icon as any} 
                                    size={28} 
                                    color={isSelected ? '#0B729D' : '#6B7280'} 
                                />
                                <Text style={[styles.featureLabel, isSelected && styles.featureLabelSelected]}>
                                    {feature.label}
                                </Text>
                                {isSelected && (
                                    <View style={styles.checkIcon}>
                                        <Ionicons name="checkmark-circle" size={20} color="#0B729D" />
                                    </View>
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Footer */}
            <View style={commonStyles.footer}>
                <TouchableOpacity
                    style={commonStyles.nextButton}
                    onPress={handleNext}
                >
                    <Text style={commonStyles.nextButtonText}>Siguiente</Text>
                    <Ionicons name="arrow-forward" size={20} color="white" />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 12,
    },
    featureCard: {
        width: '48%',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        minHeight: 100,
        position: 'relative',
    },
    featureCardSelected: {
        borderColor: '#0B729D',
        backgroundColor: '#F0F9FF',
        borderWidth: 2,
    },
    featureLabel: {
        fontSize: 13,
        fontWeight: '500',
        color: '#374151',
        textAlign: 'center',
    },
    featureLabelSelected: {
        color: '#0B729D',
        fontWeight: '700',
    },
    checkIcon: {
        position: 'absolute',
        top: 8,
        right: 8,
    },
});
