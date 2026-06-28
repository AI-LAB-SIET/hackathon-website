// lib/firebaseAdmin.ts
/**
 * Provides initialized Firebase Admin SDK instances for server‑side code.
 * This is separate from the client‑side `lib/firebase.ts` to avoid importing
 * the client SDK where only privileged admin operations are required.
 */
import admin from 'firebase-admin';
import { getServiceAccount } from '@/scripts/seed-admin.mjs'; // reuse resolver

// Initialize only once
if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(getServiceAccount()) });
}

export const adminApp = admin.app();
export const auth = admin.auth();
export const db = admin.firestore();
export const storage = admin.storage().bucket();
