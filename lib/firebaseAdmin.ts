// lib/firebaseAdmin.ts
/**
 * Provides initialized Firebase Admin SDK instances for server‑side code.
 * This is separate from the client‑side `lib/firebase.ts` to avoid importing
 * the client SDK where only privileged admin operations are required.
 */
import * as admin from 'firebase-admin';
import { getServiceAccount } from '@/scripts/seed-admin.mjs'; // reuse resolver

// Initialize only once with try-catch to support credential-free local builds
try {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!(admin as any).apps || !(admin as any).apps.length) {
    const serviceAccount = getServiceAccount();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (admin as any).initializeApp({ credential: (admin as any).credential.cert(serviceAccount) });
  }
} catch (err) {
  console.warn("⚠️ Firebase Admin initialization bypassed (credentials missing):", err);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const hasApps = (): boolean => !!((admin as any).apps && (admin as any).apps.length);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const adminApp = hasApps() ? (admin as any).app() : null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const auth = hasApps() ? (admin as any).auth() : null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const db = hasApps() ? (admin as any).firestore() : null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const storage = hasApps() ? (admin as any).storage().bucket() : null;
