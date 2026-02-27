/**
 * Cloud Functions entry point for Rentik
 *
 * Initialize Firebase Admin SDK and export all functions
 */

import * as admin from "firebase-admin";

// Initialize Firebase Admin
admin.initializeApp();

// Export Stripe functions
export {
    createAccountLink,
    createConnectedAccount,
    getAccountRequirements,
    getAccountStatus,
    stripeWebhook
} from "./stripe";

// Export Google Places functions
export { placesAutocomplete, placesDetails } from "./places";

// Export VIN OCR function
export { detectVin } from "./vinOcr";

// Export License OCR function
export { detectLicense } from "./licenseOcr";

// Export Push Notification triggers
export {
    onNewChatMessage,
    onReservationCreated,
    onReservationUpdated
} from "./notifications";

