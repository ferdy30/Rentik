/**
 * Stripe Cloud Functions for Rentik
 * 
 * Handles Stripe Connect account management for arrendadores:
 * - Account creation
 * - Onboarding link generation
 * - Account status verification
 * - Webhook event processing
 */

import 'dotenv/config';
import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import Stripe from 'stripe';
// (No explicit express types needed; using any in webhook handler for rawBody access)

// Lazily initialize Stripe to avoid deploy-time failures when env vars are missing
function getStripeClient() {
  const secret = process.env.STRIPE_SECRET as string | undefined;
  if (!secret) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      'Missing STRIPE_SECRET environment variable. Define it in functions/.env or Secret Manager.'
    );
  }
  return new Stripe(secret, { apiVersion: '2023-10-16' });
}

/**
 * Create a Stripe Connected Account (Express type)
 * 
 * Called when an arrendador wants to set up payment receiving
 * Creates an Express account and saves the accountId to Firestore
 */
export const createConnectedAccount = functions.https.onCall(async (request: any) => {
  const { data, auth } = request;
  // Verify authentication
  if (!auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Usuario debe estar autenticado'
    );
  }

  const { email, country = 'US' } = data as { email: string; country?: string };
  const uid = auth.uid as string;

  try {
  // Create Stripe Express account
  const stripe = getStripeClient();
  const account = await stripe.accounts.create({
      type: 'express',
      country,
      email,
      // Minimiza los requisitos solicitando solo 'transfers'.
      // Para cobrar con cargos de destino (destination charges) en la cuenta de la plataforma,
      // el conectado solo necesita 'transfers'. Si habilitas 'card_payments' aquí, Stripe
      // pedirá más "public details" y datos personales del representante.
      capabilities: {
        transfers: { requested: true },
      },
      business_type: 'individual',
      default_currency: 'usd',
      business_profile: {
        product_description: 'Rentas de vehículo a través de Rentik',
        support_email: email,
        url: 'https://rentik.app',
      },
    });

    // Save account ID to Firestore
    await admin.firestore().collection('users').doc(uid).update({
      'stripe.accountId': account.id,
      'stripe.onboardingComplete': false,
      'stripe.chargesEnabled': false,
      'stripe.payoutsEnabled': false,
      'stripe.detailsSubmitted': false,
    });

    console.log(`Created Stripe account ${account.id} for user ${uid}`);
    return { accountId: account.id };
  } catch (error: any) {
    console.error('Error creating connected account:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Create an Account Link for Stripe onboarding
 * 
 * Generates a secure URL for the user to complete their Stripe onboarding
 * Uses deep links (rentik://) to return to the app
 */
export const createAccountLink = functions.https.onCall(async (request: any) => {
  const { data, auth } = request;
  if (!auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Usuario debe estar autenticado'
    );
  }

  const { accountId } = data as { accountId: string };

  if (!accountId) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'accountId es requerido'
    );
  }

  try {
    // Create account link for onboarding
    const stripe = getStripeClient();
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: 'https://rentik.app/payment-setup/refresh',
      return_url: 'https://rentik.app/payment-setup/return',
      type: 'account_onboarding',
      // Solo solicitar lo actualmente debido para habilitar pagos/pagos (reduce prompts innecesarios)
      collect: 'currently_due',
    });

    console.log(`Created account link for ${accountId}`);
    return { url: accountLink.url };
  } catch (error: any) {
    console.error('Error creating account link:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Get Account Status
 * 
 * Retrieves the current status of a Stripe account and updates Firestore
 * Checks if charges and payouts are enabled
 */
export const getAccountStatus = functions.https.onCall(async (request: any) => {
  const { data, auth } = request;
  if (!auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Usuario debe estar autenticado'
    );
  }

  const { accountId } = data as { accountId: string };
  const uid = auth.uid as string;

  if (!accountId) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'accountId es requerido'
    );
  }

  try {
  // Retrieve account from Stripe
  const stripe = getStripeClient();
  const account = await stripe.accounts.retrieve(accountId);

    const accountData = {
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
    };

    // Update Firestore with current status
    await admin.firestore().collection('users').doc(uid).update({
      'stripe.chargesEnabled': accountData.chargesEnabled,
      'stripe.payoutsEnabled': accountData.payoutsEnabled,
      'stripe.detailsSubmitted': accountData.detailsSubmitted,
      'stripe.onboardingComplete': accountData.detailsSubmitted,
    });

    console.log(`Updated account status for user ${uid}:`, accountData);
    return accountData;
  } catch (error: any) {
    console.error('Error getting account status:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Get Account Requirements
 *
 * Returns lists of pending requirements for a Stripe Connected Account
 */
export const getAccountRequirements = functions.https.onCall(async (request: any) => {
  const { data, auth } = request;
  if (!auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Usuario debe estar autenticado');
  }

  const { accountId } = data as { accountId: string };
  if (!accountId) {
    throw new functions.https.HttpsError('invalid-argument', 'accountId es requerido');
  }

  try {
    const stripe = getStripeClient();
    const account = await stripe.accounts.retrieve(accountId);
    const req = account.requirements;
    return {
      currentlyDue: req?.currently_due || [],
      pastDue: req?.past_due || [],
      eventuallyDue: req?.eventually_due || [],
      disabledReason: req?.disabled_reason || null,
    };
  } catch (error: any) {
    console.error('Error getting account requirements:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Stripe Webhook Handler
 * 
 * Processes webhook events from Stripe, particularly account.updated
 * Automatically syncs account status with Firestore when changes occur
 * 
 * Configure this endpoint in Stripe Dashboard:
 * https://YOUR-PROJECT.cloudfunctions.net/stripeWebhook
 */
export const stripeWebhook = functions.https.onRequest(async (req: any, res: any) => {
  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

  if (!webhookSecret) {
    console.error('Webhook secret not configured');
    res.status(500).send('Webhook secret not configured');
    return;
  }

  let event: Stripe.Event;

  try {
  // Verify webhook signature
  const stripe = getStripeClient();
  event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  console.log(`Received webhook event: ${event.type}`);

  // Handle account.updated event
  if (event.type === 'account.updated') {
    const account = event.data.object as Stripe.Account;
    
    try {
      // Find user by Stripe account ID
      const usersSnapshot = await admin.firestore()
        .collection('users')
        .where('stripe.accountId', '==', account.id)
        .limit(1)
        .get();

      if (!usersSnapshot.empty) {
        const userDoc = usersSnapshot.docs[0];
        
        // Update Firestore with latest account status
        await userDoc.ref.update({
          'stripe.chargesEnabled': account.charges_enabled,
          'stripe.payoutsEnabled': account.payouts_enabled,
          'stripe.detailsSubmitted': account.details_submitted,
          'stripe.onboardingComplete': account.details_submitted,
        });

        console.log(`Updated Firestore for account ${account.id} via webhook`);
      } else {
        console.warn(`No user found for Stripe account ${account.id}`);
      }
    } catch (error) {
      console.error('Error processing webhook:', error);
      res.status(500).send('Error processing webhook');
      return;
    }
  }

  res.json({ received: true });
});
