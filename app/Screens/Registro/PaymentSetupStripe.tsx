import {
    createAccountLink,
    createConnectedAccount,
    getAccountStatus,
    type StripeAccountData,
} from '@/app/services/stripe';
import { Ionicons } from '@expo/vector-icons';
import { doc, setDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Linking,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useAuth } from '../../../context/Auth';
import { db } from '../../../FirebaseConfig';
import { colors } from '../../constants/colors';

type OnboardingState = 'initial' | 'creating' | 'onboarding' | 'verifying' | 'complete';

export default function PaymentSetup({ navigation }: any) {
  const { user, userData } = useAuth();
  const [state, setState] = useState<OnboardingState>('initial');
  const [onboardingUrl, setOnboardingUrl] = useState<string | null>(null);
  const [stripeAccountId, setStripeAccountId] = useState<string | null>(null);
  const [accountStatus, setAccountStatus] = useState<StripeAccountData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Guard: si no es arrendador, redirigir
  useEffect(() => {
    if (!user) return;
    if (userData?.role !== 'arrendador') {
      navigation.navigate('HomeArrendatario');
      return;
    }
    // Si ya completó Stripe onboarding y está verificado, ir al home
    if (userData?.stripe?.chargesEnabled) {
      navigation.navigate('ArrendadorStack');
    }
  }, [user, userData?.role, userData?.stripe?.chargesEnabled, navigation]);

  // Cargar estado de Stripe si ya existe
  useEffect(() => {
    const loadStripeStatus = async () => {
      if (!user || !userData?.stripe?.accountId) return;
      
      try {
        setState('verifying');
        const accountId = userData.stripe.accountId;
        setStripeAccountId(accountId);
        
        const status = await getAccountStatus(accountId);
        setAccountStatus({
          accountId,
          ...status,
          onboardingComplete: status.detailsSubmitted,
        });

        // Si ya está completo y puede cobrar, marcar como listo
        if (status.chargesEnabled) {
          await setDoc(
            doc(db, 'users', user.uid),
            {
              stripe: {
                accountId,
                onboardingComplete: true,
                chargesEnabled: true,
                payoutsEnabled: status.payoutsEnabled,
                detailsSubmitted: status.detailsSubmitted,
              },
              paymentComplete: true,
              updatedAt: new Date().toISOString(),
            },
            { merge: true }
          );
          setState('complete');
        } else if (status.detailsSubmitted) {
          // Onboarding completo pero aún en revisión
          setState('verifying');
        } else {
          // Onboarding incompleto, permitir reanudar
          setState('initial');
        }
      } catch (e) {
        console.error('[STRIPE_LOAD] error', e);
        setState('initial');
      }
    };

    if (userData?.stripe?.accountId) {
      void loadStripeStatus();
    }
  }, [user, userData?.stripe?.accountId]);

  const handleConnectStripe = async () => {
    if (!user) return;

    try {
      setState('creating');
      setError(null);

      let accountId = stripeAccountId;

      // Si no existe cuenta, crear una nueva
      if (!accountId) {
        const email = user.email || userData?.email || '';
        accountId = await createConnectedAccount(email, 'US'); // Cambiar a 'SV' cuando esté disponible
        setStripeAccountId(accountId);

        // Guardar accountId en Firestore
        await setDoc(
          doc(db, 'users', user.uid),
          {
            stripe: {
              accountId,
              onboardingComplete: false,
              chargesEnabled: false,
              payoutsEnabled: false,
            },
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      }

      // Crear Account Link para onboarding
  const url = await createAccountLink(accountId);
      
      setOnboardingUrl(url);
      setState('onboarding');
    } catch (e: any) {
      console.error('[STRIPE_CONNECT] error', e);
      setError(e.message || 'No se pudo conectar con Stripe. Intenta nuevamente.');
      setState('initial');
      Alert.alert('Error', 'No se pudo iniciar el proceso de verificación con Stripe.');
    }
  };

  const handleWebViewNavigationStateChange = async (navState: any) => {
    const url = navState.url;

    // Detectar return de Stripe onboarding
    if (url.includes('payment-setup/return')) {
      setOnboardingUrl(null);
      setState('verifying');

      if (!stripeAccountId || !user) return;

      try {
        // Verificar estado de la cuenta
        const status = await getAccountStatus(stripeAccountId);
        setAccountStatus({
          accountId: stripeAccountId,
          ...status,
          onboardingComplete: status.detailsSubmitted,
        });

        // Actualizar Firestore
        await setDoc(
          doc(db, 'users', user.uid),
          {
            stripe: {
              accountId: stripeAccountId,
              onboardingComplete: status.detailsSubmitted,
              chargesEnabled: status.chargesEnabled,
              payoutsEnabled: status.payoutsEnabled,
              detailsSubmitted: status.detailsSubmitted,
            },
            paymentComplete: status.chargesEnabled, // Solo true si puede cobrar
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );

        if (status.chargesEnabled) {
          setState('complete');
          // Navegación automática será manejada por el guard
        } else if (status.detailsSubmitted) {
          setState('verifying');
        } else {
          setState('initial');
          Alert.alert(
            'Onboarding incompleto',
            'No completaste todos los pasos. Intenta nuevamente.'
          );
        }
      } catch (e) {
        console.error('[STRIPE_VERIFY] error', e);
        setState('initial');
        Alert.alert('Error', 'No pudimos verificar tu cuenta. Intenta nuevamente.');
      }
    }

    // Detectar refresh (link expirado)
    if (url.includes('payment-setup/refresh')) {
      setOnboardingUrl(null);
      setState('initial');
      Alert.alert('Link expirado', 'El enlace de verificación expiró. Inicia el proceso nuevamente.');
    }
  };

  // Detectar cierre del WebView y verificar automáticamente
  const handleWebViewClose = async () => {
    setOnboardingUrl(null);

    if (!stripeAccountId || !user) return;

    // Si el WebView se cierra mientras está en onboarding, verificar estado
    if (state === 'onboarding') {
      setState('verifying');

      try {
        // Dar tiempo para que Stripe procese (1 segundo)
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Verificar estado de la cuenta
        const status = await getAccountStatus(stripeAccountId);
        setAccountStatus({
          accountId: stripeAccountId,
          ...status,
          onboardingComplete: status.detailsSubmitted,
        });

        // Actualizar Firestore
        await setDoc(
          doc(db, 'users', user.uid),
          {
            stripe: {
              accountId: stripeAccountId,
              onboardingComplete: status.detailsSubmitted,
              chargesEnabled: status.chargesEnabled,
              payoutsEnabled: status.payoutsEnabled,
              detailsSubmitted: status.detailsSubmitted,
            },
            paymentComplete: status.chargesEnabled,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );

        if (status.chargesEnabled) {
          setState('complete');
          Alert.alert(
            '¡Verificación completa!',
            'Tu cuenta de Stripe está lista para recibir pagos.'
          );
        } else if (status.detailsSubmitted) {
          setState('verifying');
        } else {
          setState('initial');
          Alert.alert(
            'Onboarding incompleto',
            'Parece que cerraste el proceso antes de completarlo. Puedes intentar nuevamente.'
          );
        }
      } catch (e) {
        console.error('[STRIPE_VERIFY_CLOSE] error', e);
        setState('initial');
      }
    }
  };

  // Reabrir onboarding para completar requisitos pendientes en Stripe
  const handleResumeOnboarding = async () => {
    try {
      const accountId = stripeAccountId || userData?.stripe?.accountId;
      if (!accountId) {
        Alert.alert('Cuenta no encontrada', 'No encontramos tu cuenta de Stripe. Intenta iniciar nuevamente.');
        return;
      }
      setState('creating');
      const url = await createAccountLink(accountId);
      setOnboardingUrl(url);
      setState('onboarding');
    } catch (e: any) {
      console.error('[STRIPE_RESUME_ONBOARDING] error', e);
      setState('verifying');
      Alert.alert('Error', 'No pudimos abrir Stripe. Intenta nuevamente.');
    }
  };

  const renderInitialState = () => (
    <>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Ionicons name="card-outline" size={48} color={colors.primary} style={{ marginBottom: 8 }} />
        <Text style={styles.title}>Configura tu cuenta de pagos</Text>
        <Text style={styles.subtitle}>Necesario para recibir tus ganancias</Text>
      </View>

      {/* What to expect card */}
      <View style={styles.card}>
        <View style={styles.expectHeader}>
          <Ionicons name="information-circle-outline" size={24} color={colors.primary} />
          <Text style={styles.expectTitle}>¿Qué vas a hacer?</Text>
        </View>
        <Text style={[styles.infoText, { marginBottom: 16 }]}>
          Usamos Stripe, la plataforma de pagos más segura del mundo. El proceso toma 
          <Text style={{ fontWeight: '700' }}> 3-5 minutos</Text> y solo lo haces una vez.
        </Text>
        
        <View style={styles.stepsList}>
          <View style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Información personal</Text>
              <Text style={styles.stepSubtitle}>Nombre completo, fecha de nacimiento, dirección</Text>
            </View>
          </View>

          <View style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Cuenta bancaria</Text>
              <Text style={styles.stepSubtitle}>Para recibir tus ganancias directamente</Text>
            </View>
          </View>

          <View style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Verificación</Text>
              <Text style={styles.stepSubtitle}>Stripe revisará tu información (24-48 horas)</Text>
            </View>
          </View>
        </View>
      </View>

      {/* What you get card */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>¿Qué obtienes?</Text>
        <View style={styles.featuresList}>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={24} color="#10B981" />
            <Text style={styles.featureText}>Pagos seguros y encriptados</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={24} color="#10B981" />
            <Text style={styles.featureText}>Cobros automáticos a tus clientes</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={24} color="#10B981" />
            <Text style={styles.featureText}>Retiros directos a tu banco</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={24} color="#10B981" />
            <Text style={styles.featureText}>Protección contra fraudes</Text>
          </View>
        </View>
      </View>

      {error && (
        <View style={styles.errorCard}>
          <Ionicons name="alert-circle" size={20} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.card}>
        <View style={styles.readyBadge}>
          <Ionicons name="time-outline" size={18} color="#059669" />
          <Text style={styles.readyBadgeText}>3-5 minutos</Text>
        </View>
        <Text style={[styles.infoText, { marginTop: 12, textAlign: 'center' }]}>
          Ten a mano tu DUI y los datos de tu cuenta bancaria
        </Text>
      </View>

      {/* CTA Button */}
      <TouchableOpacity
        style={[styles.connectButton, state !== 'initial' && styles.connectButtonDisabled]}
        onPress={handleConnectStripe}
        disabled={state !== 'initial'}
        activeOpacity={0.7}
      >
        {state === 'creating' ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Ionicons name="arrow-forward" size={24} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.connectButtonText}>Comenzar configuración</Text>
          </>
        )}
      </TouchableOpacity>

      <Text style={styles.disclaimer}>
        Al continuar, serás redirigido a Stripe para completar tu verificación. Stripe procesará tu información de acuerdo a su{' '}
        <Text style={styles.link} onPress={() => Linking.openURL('https://stripe.com/privacy')}>
          Política de Privacidad
        </Text>.
      </Text>
    </>
  );

  const renderVerifyingState = () => (
    <>
      <View style={styles.header}>
        <Ionicons name="time-outline" size={48} color="#FBBF24" style={{ marginBottom: 8 }} />
        <Text style={styles.title}>Verificación en proceso ⏳</Text>
        <Text style={styles.subtitle}>Estamos revisando tu información</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.statusBadge}>
          <Ionicons name="time" size={20} color="#F59E0B" />
          <Text style={styles.statusBadgeText}>En revisión</Text>
        </View>
        
        <Text style={[styles.infoText, { marginTop: 16, marginBottom: 16 }]}>
          ¡Ya casi! Enviaste tu información correctamente. La verificación puede tomar de unas horas 
          hasta 1-2 días hábiles. Te avisaremos cuando esté lista.
        </Text>

        {accountStatus && (
          <View style={styles.statusSimple}>
            {accountStatus.chargesEnabled ? (
              <View style={styles.statusItemSuccess}>
                <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                <Text style={styles.statusTextSuccess}>¡Tu cuenta ya puede recibir pagos!</Text>
              </View>
            ) : accountStatus.detailsSubmitted ? (
              <View style={styles.statusItemPending}>
                <Ionicons name="hourglass-outline" size={24} color="#F59E0B" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.statusTextPending}>Verificando tu información</Text>
                  <Text style={styles.statusSubtext}>Esto puede tomar 24-48 horas</Text>
                </View>
              </View>
            ) : (
              <View style={styles.statusItemWarning}>
                <Ionicons name="alert-circle-outline" size={24} color="#EF4444" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.statusTextWarning}>Información incompleta</Text>
                  <Text style={styles.statusSubtext}>Completa todos los datos requeridos</Text>
                </View>
              </View>
            )}
          </View>
        )}
      </View>

      <View style={styles.card}>
        <View style={styles.whileWaitingHeader}>
          <Ionicons name="leaf-outline" size={24} color={colors.primary} />
          <Text style={styles.whileWaitingTitle}>Mientras esperas</Text>
        </View>
        
        <View style={styles.actionsList}>
          <View style={styles.actionItem}>
            <View style={styles.actionIconContainer}>
              <Ionicons name="car-sport-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Prepara tu vehículo</Text>
              <Text style={styles.actionSubtitle}>Toma fotos de calidad y verifica documentos</Text>
            </View>
          </View>

          <View style={styles.actionItem}>
            <View style={styles.actionIconContainer}>
              <Ionicons name="person-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Completa tu perfil</Text>
              <Text style={styles.actionSubtitle}>Agrega foto y descripción para generar confianza</Text>
            </View>
          </View>

          <View style={styles.actionItem}>
            <View style={styles.actionIconContainer}>
              <Ionicons name="document-text-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Revisa las políticas</Text>
              <Text style={styles.actionSubtitle}>Conoce los términos de renta y cancelación</Text>
            </View>
          </View>
        </View>
      </View>

      {!accountStatus?.chargesEnabled && (
        <TouchableOpacity style={styles.connectButton} onPress={() => void handleResumeOnboarding()}>
          <Ionicons name="open-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.connectButtonText}>Revisar información en Stripe</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={[styles.connectButton, { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', marginTop: 8 }]}
        onPress={() => {
          if (userData?.role === 'arrendador') {
            navigation.navigate('ArrendadorStack');
          } else {
            navigation.navigate('HomeArrendatario');
          }
        }}
      >
        <Text style={[styles.connectButtonText, { color: colors.primary }]}>Ir al inicio</Text>
      </TouchableOpacity>

      <Text style={styles.disclaimer}>
        Te avisaremos cuando tu cuenta esté verificada y puedas publicar vehículos.
      </Text>
    </>
  );

  const renderCompleteState = () => (
    <>
      <View style={styles.header}>
        <Ionicons name="checkmark-circle" size={64} color="#10B981" style={{ marginBottom: 8 }} />
        <Text style={styles.title}>¡Felicidades! 🎉</Text>
        <Text style={styles.subtitle}>Tu cuenta de pagos está lista</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.successBadge}>
          <Ionicons name="shield-checkmark" size={20} color="#059669" />
          <Text style={styles.successBadgeText}>Verificación completa</Text>
        </View>
        
        <Text style={[styles.infoText, { marginTop: 16, marginBottom: 16 }]}>
          Tu cuenta de Stripe está activa y verificada. Ahora puedes:
        </Text>

        <View style={styles.nextStepsList}>
          <View style={styles.nextStepItem}>
            <Ionicons name="add-circle" size={22} color={colors.primary} />
            <Text style={styles.nextStepText}>Publicar tus vehículos</Text>
          </View>
          <View style={styles.nextStepItem}>
            <Ionicons name="calendar" size={22} color={colors.primary} />
            <Text style={styles.nextStepText}>Recibir reservas</Text>
          </View>
          <View style={styles.nextStepItem}>
            <Ionicons name="cash" size={22} color={colors.primary} />
            <Text style={styles.nextStepText}>Cobrar automáticamente</Text>
          </View>
          <View style={styles.nextStepItem}>
            <Ionicons name="card" size={22} color={colors.primary} />
            <Text style={styles.nextStepText}>Recibir pagos en tu banco</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={styles.connectButton}
        onPress={() => navigation.navigate('ArrendadorStack')}
      >
        <Ionicons name="home" size={24} color="#fff" style={{ marginRight: 8 }} />
        <Text style={styles.connectButtonText}>Ir al inicio</Text>
      </TouchableOpacity>

      <Text style={[styles.disclaimer, { textAlign: 'center' }]}>
        ¿Tienes dudas? Revisa nuestra guía de ayuda o contáctanos
      </Text>
    </>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {onboardingUrl ? (
        <View style={{ flex: 1 }}>
          <View style={styles.webViewHeader}>
            <TouchableOpacity 
              onPress={handleWebViewClose}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.webViewTitle}>Verificación de Stripe</Text>
          </View>
          <WebView
            source={{ uri: onboardingUrl }}
            style={{ flex: 1 }}
            onShouldStartLoadWithRequest={(request) => {
              const url = request.url || '';
              // Intercept Stripe return/refresh to handle in-app and prevent load errors
              if (url.includes('payment-setup/return') || url.includes('payment-setup/refresh')) {
                // Reuse existing handler logic
                void handleWebViewNavigationStateChange({ url });
                return false; // Prevent WebView from navigating (avoids ERR_NAME_NOT_RESOLVED)
              }
              return true;
            }}
            onError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              const url = nativeEvent.url || '';
              // Ignore known DNS errors for our synthetic return/refresh URLs
              if (url.includes('payment-setup/return') || url.includes('payment-setup/refresh')) {
                return;
              }
              console.warn('[WEBVIEW] load error', nativeEvent);
            }}
            onNavigationStateChange={handleWebViewNavigationStateChange}
          />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {state === 'initial' || state === 'creating' ? renderInitialState() : null}
          {state === 'verifying' ? renderVerifyingState() : null}
          {state === 'complete' ? renderCompleteState() : null}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scroll: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  backButton: {
    position: 'absolute',
    top: 0,
    left: 0,
    padding: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  infoIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#032B3C',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#032B3C',
    marginBottom: 16,
  },
  featuresList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    fontSize: 15,
    color: '#032B3C',
    fontWeight: '500',
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: '#DC2626',
    fontWeight: '500',
  },
  connectButton: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  connectButtonDisabled: {
    backgroundColor: '#9CA3AF',
    opacity: 0.6,
    shadowOpacity: 0,
    elevation: 0,
  },
  connectButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  secondaryButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  disclaimer: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 18,
  },
  link: {
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF3C7',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  statusBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#D97706',
  },
  statusDetails: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 10,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  webViewHeader: {
    backgroundColor: colors.primary,
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  webViewTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  statusLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  statusValue: {
    fontSize: 14,
    color: '#032B3C',
    fontWeight: '600',
  },
  statusSimple: {
    marginTop: 8,
    gap: 12,
  },
  statusItemSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#ECFDF5',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  statusTextSuccess: {
    fontSize: 15,
    color: '#047857',
    fontWeight: '600',
    flex: 1,
  },
  statusItemPending: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FEF3C7',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  statusTextPending: {
    fontSize: 15,
    color: '#D97706',
    fontWeight: '600',
  },
  statusItemWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FEE2E2',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  statusTextWarning: {
    fontSize: 15,
    color: '#DC2626',
    fontWeight: '600',
  },
  statusSubtext: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  whileWaitingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  whileWaitingTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#032B3C',
  },
  actionsList: {
    gap: 12,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  actionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#032B3C',
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  expectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  expectTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#032B3C',
  },
  stepsList: {
    gap: 16,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  stepContent: {
    flex: 1,
    paddingTop: 2,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#032B3C',
    marginBottom: 2,
  },
  stepSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  readyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#D1FAE5',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    alignSelf: 'center',
  },
  readyBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#059669',
  },
  successBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#D1FAE5',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  successBadgeText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#059669',
  },
  nextStepsList: {
    gap: 12,
  },
  nextStepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  nextStepText: {
    fontSize: 15,
    color: '#032B3C',
    fontWeight: '500',
  },
});
