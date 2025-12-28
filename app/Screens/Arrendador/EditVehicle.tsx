import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { normalizeVehicleData, updateVehicle, VehicleData } from '../../services/vehicles';

export default function EditVehicle() {
    const navigation = useNavigation();
    const route = useRoute<any>();
    const { vehicle: rawVehicle } = route.params;

    // Normalizar datos al cargar
    const vehicle = React.useMemo(() => 
        normalizeVehicleData(rawVehicle.id, rawVehicle), 
        [rawVehicle]
    );

    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<Partial<VehicleData>>({
        marca: vehicle.marca,
        modelo: vehicle.modelo,
        anio: vehicle.anio,
        placa: vehicle.placa,
        precio: vehicle.precio,
        descripcion: vehicle.descripcion,
        status: vehicle.status,
        // Preservar otros datos importantes
        photos: vehicle.photos,
        imagenes: vehicle.imagenes,
        imagen: vehicle.imagen
    });

    const handleSave = async () => {
        try {
            setLoading(true);
            await updateVehicle(vehicle.id, formData);
            Alert.alert('Éxito', 'Vehículo actualizado correctamente', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (error) {
            Alert.alert('Error', 'No se pudo actualizar el vehículo');
        } finally {
            setLoading(false);
        }
    };

    const toggleStatus = () => {
        setFormData(prev => ({
            ...prev,
            status: prev.status === 'active' ? 'inactive' : 'active'
        }));
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#0B729D" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Editar Vehículo</Text>
                <TouchableOpacity onPress={handleSave} disabled={loading}>
                    {loading ? (
                        <ActivityIndicator color="#0B729D" />
                    ) : (
                        <Text style={styles.saveButton}>Guardar</Text>
                    )}
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    {/* Status Toggle */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Estado</Text>
                        <TouchableOpacity 
                            style={[
                                styles.statusToggle, 
                                formData.status === 'active' ? styles.statusActive : styles.statusInactive
                            ]}
                            onPress={toggleStatus}
                        >
                            <Ionicons 
                                name={formData.status === 'active' ? 'checkmark-circle' : 'close-circle'} 
                                size={24} 
                                color={formData.status === 'active' ? '#065F46' : '#991B1B'} 
                            />
                            <Text style={[
                                styles.statusText,
                                formData.status === 'active' ? { color: '#065F46' } : { color: '#991B1B' }
                            ]}>
                                {formData.status === 'active' ? 'Vehículo Visible (Activo)' : 'Vehículo Oculto (Inactivo)'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Basic Info */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Información Básica</Text>
                        
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Marca</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.marca}
                                onChangeText={(text) => setFormData({...formData, marca: text})}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Modelo</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.modelo}
                                onChangeText={(text) => setFormData({...formData, modelo: text})}
                            />
                        </View>

                        <View style={styles.row}>
                            <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                                <Text style={styles.label}>Año</Text>
                                <TextInput
                                    style={styles.input}
                                    value={String(formData.anio)}
                                    keyboardType="numeric"
                                    onChangeText={(text) => setFormData({...formData, anio: parseInt(text) || 0})}
                                />
                            </View>
                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                <Text style={styles.label}>Placa</Text>
                                <TextInput
                                    style={styles.input}
                                    value={formData.placa}
                                    onChangeText={(text) => setFormData({...formData, placa: text})}
                                />
                            </View>
                        </View>
                    </View>

                    {/* Price & Description */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Detalles del Alquiler</Text>
                        
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Precio por día (USD)</Text>
                            <TextInput
                                style={styles.input}
                                value={String(formData.precio)}
                                keyboardType="numeric"
                                onChangeText={(text) => setFormData({...formData, precio: parseInt(text) || 0})}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Descripción</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                value={formData.descripcion}
                                multiline
                                numberOfLines={4}
                                onChangeText={(text) => setFormData({...formData, descripcion: text})}
                            />
                        </View>
                    </View>

                    {/* Photos Preview (Read Only for now) */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Fotos Actuales</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photosScroll}>
                            {Object.values(vehicle.photos || {}).map((uri: any, index) => (
                                <Image key={index} source={{ uri }} style={styles.photoPreview} />
                            ))}
                        </ScrollView>
                        <Text style={styles.helperText}>Para cambiar las fotos, elimina el vehículo y créalo de nuevo (próximamente edición de fotos).</Text>
                    </View>

                    <View style={{ height: 40 }} />
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 20,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
    },
    saveButton: {
        fontSize: 16,
        fontWeight: '600',
        color: '#0B729D',
        padding: 8,
    },
    content: {
        flex: 1,
        padding: 20,
    },
    section: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 16,
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: '#374151',
        marginBottom: 6,
    },
    input: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: '#111827',
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    row: {
        flexDirection: 'row',
    },
    statusToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 8,
        gap: 10,
    },
    statusActive: {
        backgroundColor: '#D1FAE5',
        borderWidth: 1,
        borderColor: '#34D399',
    },
    statusInactive: {
        backgroundColor: '#FEE2E2',
        borderWidth: 1,
        borderColor: '#F87171',
    },
    statusText: {
        fontWeight: '600',
        fontSize: 14,
    },
    photosScroll: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    photoPreview: {
        width: 100,
        height: 100,
        borderRadius: 8,
        marginRight: 10,
        backgroundColor: '#E5E7EB',
    },
    helperText: {
        fontSize: 12,
        color: '#6B7280',
        fontStyle: 'italic',
    },
});
