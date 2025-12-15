import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Modal,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { StepIndicator } from '../../../components/StepIndicator';
import type { ArrendadorStackParamList } from '../../../navigation/ArrendadorStack';
import { styles as commonStyles } from './styles';

type NavigationProp = NativeStackNavigationProp<ArrendadorStackParamList, 'AddVehicleStep2Features'>;

const FEATURES_LIST = [
    // Confort
    { id: 'ac', label: 'Aire Acondicionado', icon: 'snow-outline', category: 'Confort' },
    { id: 'leather', label: 'Asientos de Cuero', icon: 'shirt-outline', category: 'Confort' },
    { id: 'sunroof', label: 'Sunroof / Quemacocos', icon: 'sunny-outline', category: 'Confort' },
    { id: 'heated_seats', label: 'Asientos Calefactables', icon: 'flame-outline', category: 'Confort' },
    { id: 'third_row', label: 'Tercera Fila', icon: 'people-outline', category: 'Confort' },
    
    // Tecnología
    { id: 'bluetooth', label: 'Bluetooth', icon: 'bluetooth-outline', category: 'Tecnología' },
    { id: 'gps', label: 'GPS / Navegación', icon: 'map-outline', category: 'Tecnología' },
    { id: 'carplay', label: 'Apple CarPlay', icon: 'logo-apple', category: 'Tecnología' },
    { id: 'android', label: 'Android Auto', icon: 'logo-android', category: 'Tecnología' },
    { id: 'usb', label: 'Entrada USB / Aux', icon: 'musical-notes-outline', category: 'Tecnología' },
    { id: 'keyless', label: 'Entrada sin Llave', icon: 'key-outline', category: 'Tecnología' },

    // Seguridad
    { id: 'camera', label: 'Cámara de Reversa', icon: 'camera-reverse-outline', category: 'Seguridad' },
    { id: 'sensors', label: 'Sensores de Parqueo', icon: 'radio-outline', category: 'Seguridad' },
    { id: '4x4', label: '4x4 / AWD', icon: 'car-sport-outline', category: 'Seguridad' },
];

const CATEGORIES = ['Confort', 'Tecnología', 'Seguridad'];

export default function Step2Features() {
    const navigation = useNavigation<NavigationProp>();
    const route = useRoute<any>();
    const { vehicleData } = route.params || {};

    const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
    const [showCustomModal, setShowCustomModal] = useState(false);
    const [customFeature, setCustomFeature] = useState('');
    const scaleAnims = useRef<{[key: string]: Animated.Value}>({
        ...Object.fromEntries(FEATURES_LIST.map(f => [f.id, new Animated.Value(1)]))
    }).current;

    // Cargar features guardadas
    useEffect(() => {
        const loadDraft = async () => {
            try {
                const draft = await AsyncStorage.getItem('@add_vehicle_draft');
                if (draft) {
                    const parsed = JSON.parse(draft);
                    if (parsed.features) {
                        setSelectedFeatures(parsed.features);
                    }
                }
            } catch (error) {
                console.log('Error loading features:', error);
            }
        };
        loadDraft();
    }, []);

    // Autoguardar features
    useEffect(() => {
        const saveDraft = async () => {
            if (selectedFeatures.length === 0) return;
            try {
                let existing = {};
                const draft = await AsyncStorage.getItem('@add_vehicle_draft');
                if (draft) existing = JSON.parse(draft);
                await AsyncStorage.setItem(
                    '@add_vehicle_draft',
                    JSON.stringify({
                        ...existing,
                        features: selectedFeatures,
                        timestamp: new Date().toISOString(),
                    })
                );
            } catch (error) {
                console.log('Error saving features:', error);
            }
        };
        saveDraft();
    }, [selectedFeatures]);

    const toggleFeature = (id: string, label: string) => {
        // Animar botón
        Animated.sequence([
            Animated.timing(scaleAnims[id], {
                toValue: 0.9,
                duration: 100,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnims[id], {
                toValue: 1,
                friction: 3,
                tension: 100,
                useNativeDriver: true,
            })
        ]).start();

        setSelectedFeatures(prev => 
            prev.includes(label) 
                ? prev.filter(f => f !== label)
                : [...prev, label]
        );
    };

    const addCustomFeature = () => {
        if (customFeature.trim() && !selectedFeatures.includes(customFeature.trim())) {
            setSelectedFeatures(prev => [...prev, customFeature.trim()]);
            setCustomFeature('');
            setShowCustomModal(false);
        }
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
                    <Text style={commonStyles.headerSubtitle}>Extras y comodidades</Text>
                </View>
                <View style={{ width: 40 }} />
            </View>

            {/* Step Indicator */}
            <StepIndicator 
                currentStep={2} 
                totalSteps={4}
                labels={['Básico', 'Specs', 'Fotos', 'Precio']}
            />

            {/* Progress Bar */}
            <View style={commonStyles.progressContainer}>
                <View style={[commonStyles.progressBar, { width: '60%' }]} />
            </View>

            <ScrollView style={commonStyles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.headerRow}>
                    <Text style={commonStyles.sectionTitle}>¿Qué tiene tu auto?</Text>
                    <View style={styles.counterBadge}>
                        <Text style={styles.counterText}>
                            {selectedFeatures.length}/{FEATURES_LIST.length}
                        </Text>
                    </View>
                </View>
                <Text style={{ color: '#6B7280', marginBottom: 24, lineHeight: 20 }}>
                    Selecciona las características que tiene tu vehículo. Los autos con más detalles reciben más reservas.
                </Text>

                <View style={{ marginBottom: 20 }}>
                    {CATEGORIES.map((category) => (
                        <View key={category} style={{ marginBottom: 24 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, paddingHorizontal: 4 }}>
                                <Ionicons 
                                    name={
                                        category === 'Confort' ? 'leaf-outline' : 
                                        category === 'Tecnología' ? 'hardware-chip-outline' : 
                                        'shield-checkmark-outline'
                                    } 
                                    size={20} 
                                    color="#0B729D" 
                                    style={{ marginRight: 8 }} 
                                />
                                <Text style={{ fontSize: 18, fontWeight: '700', color: '#032B3C' }}>
                                    {category}
                                </Text>
                            </View>
                            
                            <View style={styles.grid}>
                                {FEATURES_LIST.filter(f => f.category === category).map((feature) => {
                                    const isSelected = selectedFeatures.includes(feature.label);
                                    return (
                                        <View key={feature.id} style={styles.featureCard}>
                                            <Animated.View
                                                style={{ transform: [{ scale: scaleAnims[feature.id] }] }}
                                            >
                                                <TouchableOpacity
                                                    style={[styles.featureCardInner, isSelected && styles.featureCardInnerSelected]}
                                                    onPress={() => toggleFeature(feature.id, feature.label)}
                                                    activeOpacity={0.8}
                                                >
                                                    <Ionicons 
                                                        name={feature.icon as any} 
                                                        size={32} 
                                                        color={isSelected ? '#0B729D' : '#6B7280'} 
                                                    />
                                                    <Text style={[styles.featureLabel, isSelected && styles.featureLabelSelected]}>
                                                        {feature.label}
                                                    </Text>
                                                    {isSelected && (
                                                        <View style={styles.checkIcon}>
                                                            <Ionicons name="checkmark-circle" size={22} color="#0B729D" />
                                                        </View>
                                                    )}
                                                </TouchableOpacity>
                                            </Animated.View>
                                        </View>
                                    );
                                })}
                            </View>
                        </View>
                    ))}
                </View>

                {/* Botón para agregar característica custom */}
                <TouchableOpacity
                    style={{
                        backgroundColor: '#FFFFFF',
                        borderWidth: 2,
                        borderColor: '#0B729D',
                        borderStyle: 'dashed',
                        borderRadius: 14,
                        padding: 18,
                        alignItems: 'center',
                        marginTop: 8,
                        marginBottom: 8,
                    }}
                    onPress={() => setShowCustomModal(true)}
                    activeOpacity={0.7}
                >
                    <Ionicons name="add-circle-outline" size={36} color="#0B729D" />
                    <Text style={{ fontSize: 15, color: '#032B3C', fontWeight: '700', marginTop: 10 }}>
                        Agregar Otra Caracter\u00edstica
                    </Text>
                    <Text style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>
                        \u00bfTiene algo m\u00e1s? Agr\u00e9galo aqu\u00ed
                    </Text>
                </TouchableOpacity>

                {/* Mostrar caracter\u00edsticas custom */}
                {selectedFeatures.filter(f => !FEATURES_LIST.find(fl => fl.label === f)).length > 0 && (
                    <View style={{ marginTop: 16, marginBottom: 8 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                            <Ionicons name="star" size={18} color="#0B729D" style={{ marginRight: 6 }} />
                            <Text style={{ fontSize: 15, fontWeight: '700', color: '#032B3C' }}>
                                Caracter\u00edsticas Personalizadas
                            </Text>
                        </View>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                            {selectedFeatures
                                .filter(f => !FEATURES_LIST.find(fl => fl.label === f))
                                .map((feat, index) => (
                                    <View
                                        key={index}
                                        style={{
                                            backgroundColor: '#F0F9FF',
                                            borderWidth: 1.5,
                                            borderColor: '#0B729D',
                                            borderRadius: 22,
                                            paddingHorizontal: 14,
                                            paddingVertical: 8,
                                            marginRight: 8,
                                            marginBottom: 8,
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                        }}
                                    >
                                        <Text style={{ fontSize: 14, color: '#0B729D', fontWeight: '600', marginRight: 6 }}>{feat}</Text>
                                        <TouchableOpacity onPress={() => setSelectedFeatures(prev => prev.filter(f => f !== feat))}>
                                            <Ionicons name="close-circle" size={20} color="#0B729D" />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                        </View>
                    </View>
                )}

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

            {/* Modal para agregar caracter\u00edstica custom */}
            <Modal
                visible={showCustomModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowCustomModal(false)}
            >
                <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <View style={{ backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <Text style={{ fontSize: 18, fontWeight: '700', color: '#032B3C' }}>
                                Nueva Caracter\u00edstica
                            </Text>
                            <TouchableOpacity onPress={() => setShowCustomModal(false)}>
                                <Ionicons name="close" size={28} color="#6B7280" />
                            </TouchableOpacity>
                        </View>
                        <Text style={{ fontSize: 14, color: '#6B7280', marginBottom: 12 }}>
                            \u00bfTu auto tiene algo especial que no est\u00e1 en la lista?
                        </Text>
                        <TextInput
                            style={{
                                backgroundColor: '#F9FAFB',
                                borderRadius: 8,
                                padding: 12,
                                fontSize: 16,
                                marginBottom: 16,
                                borderWidth: 1,
                                borderColor: '#D1D5DB',
                            }}
                            placeholder="Ej: Techo panor\u00e1mico, Llantas nuevas..."
                            value={customFeature}
                            onChangeText={setCustomFeature}
                            autoFocus
                            placeholderTextColor="#9CA3AF"
                        />
                        <TouchableOpacity
                            style={{
                                backgroundColor: customFeature.trim() ? '#0B729D' : '#D1D5DB',
                                borderRadius: 12,
                                padding: 16,
                                alignItems: 'center',
                            }}
                            onPress={addCustomFeature}
                            disabled={!customFeature.trim()}
                        >
                            <Text style={{ fontSize: 16, fontWeight: '700', color: 'white' }}>
                                Agregar
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    counterBadge: {
        backgroundColor: '#EFF6FF',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#0B729D',
    },
    counterText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#0B729D',
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -6,
    },
    featureCard: {
        width: '50%',
        paddingHorizontal: 6,
        marginBottom: 12,
    },
    featureCardInner: {
        backgroundColor: '#fff',
        borderWidth: 1.5,
        borderColor: '#E5E7EB',
        borderRadius: 14,
        padding: 14,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 110,
        position: 'relative',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    featureCardInnerSelected: {
        borderColor: '#0B729D',
        backgroundColor: '#F0F9FF',
        borderWidth: 2.5,
        shadowColor: '#0B729D',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 3,
    },
    featureLabel: {
        fontSize: 12.5,
        fontWeight: '600',
        color: '#374151',
        textAlign: 'center',
        marginTop: 10,
        lineHeight: 16,
        paddingHorizontal: 4,
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
    popularBadge: {
        position: 'absolute',
        top: 8,
        left: 8,
        backgroundColor: '#F59E0B',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    popularText: {
        fontSize: 9,
        fontWeight: '700',
        color: '#FFFFFF',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
});
