/**
 * Stripe Backend Helpers
 * 
 * Production-ready Stripe integration using Firebase Cloud Functions
 * All Stripe API calls are made server-side for security
 */

import Constants from 'expo-constants';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { Firebaseapp } from '../FirebaseConfig';

export const STRIPE_PUBLISHABLE_KEY = 
  (Constants.expoConfig?.extra as any)?.stripePublishableKey || 
  'pk_test_YOUR_STRIPE_PUBLISHABLE_KEY';

// Initialize Firebase Functions
const functions = getFunctions(Firebaseapp);

/**
 * Create a Stripe Connected Account (Express)
 * 
 * Calls Cloud Function: createConnectedAccount
 *
 * @param email - User email
 * @param country - ISO country code (default: US)
 * @returns accountId
 */
export async function createConnectedAccount(email: string, country: string = 'US'): Promise<string> {
  try {
    if (!email || email.trim() === '') {
      throw new Error('Email es requerido');
    }

    const createAccount = httpsCallable(functions, 'createConnectedAccount');
    const result = await createAccount({ email, country });
    const data = result.data as { accountId: string };
    
    if (!data.accountId) {
      throw new Error('No se pudo crear la cuenta de Stripe');
    }
    
    return data.accountId;
  } catch (error: any) {
    console.error('[STRIPE] Create account error:', error);
    
    if (error.code === 'unavailable') {
      throw new Error('Servicio no disponible. Verifica tu conexión');
    } else if (error.message?.includes('already')) {
      throw new Error('Ya tienes una cuenta de Stripe configurada');
    } else if (error.message) {
      throw error;
    } else {
      throw new Error('No se pudo crear la cuenta. Intenta de nuevo');
    }
  }
}

/**
 * Create an Account Link for onboarding
 * 
 * Calls Cloud Function: createAccountLink
 *
 * @param accountId - Stripe Connected Account ID
 * @returns url
 */
export async function createAccountLink(accountId: string): Promise<string> {
  try {
    const createLink = httpsCallable(functions, 'createAccountLink');
    const result = await createLink({ accountId });
    const data = result.data as { url: string };
    return data.url;
  } catch (error) {
    console.error('[STRIPE] Create account link error:', error);
    throw error;
  }
}

/**
 * Retrieve account details to check onboarding status
 * 
 * Calls Cloud Function: getAccountStatus
 *
 * @param accountId - Stripe Connected Account ID
 * @returns Account status
 */
export async function getAccountStatus(accountId: string): Promise<{
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
}> {
  try {
    const getStatus = httpsCallable(functions, 'getAccountStatus');
    const result = await getStatus({ accountId });
    return result.data as {
      chargesEnabled: boolean;
      payoutsEnabled: boolean;
      detailsSubmitted: boolean;
    };
  } catch (error) {
    console.error('[STRIPE] Get account status error:', error);
    throw error;
  }
}

export interface StripeAccountData {
  accountId: string;
  onboardingComplete: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
}

/**
 * Get pending requirements for a Connected Account
 */
export async function getAccountRequirements(accountId: string): Promise<{
  currentlyDue: string[];
  pastDue: string[];
  eventuallyDue: string[];
  disabledReason: string | null;
}> {
  try {
    const callable = httpsCallable(functions, 'getAccountRequirements');
    const result = await callable({ accountId });
    return result.data as {
      currentlyDue: string[];
      pastDue: string[];
      eventuallyDue: string[];
      disabledReason: string | null;
    };
  } catch (error) {
    console.error('[STRIPE] Get account requirements error:', error);
    throw error;
  }
}
