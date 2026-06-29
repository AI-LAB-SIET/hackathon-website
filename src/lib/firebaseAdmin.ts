// lib/firebaseAdmin.ts
/**
 * Provides initialized Firebase Admin SDK instances for server‑side code.
 * This is separate from the client‑side `lib/firebase.ts` to avoid importing
 * the client SDK where only privileged admin operations are required.
 *
 * Utilizes a Proxy pattern to initialize Firebase Admin lazily.
 * This avoids build-time validation errors when environment variables/credentials
 * are not available during Next.js static build phase.
 */
import { getApps, initializeApp, getApp, cert, App } from 'firebase-admin/app';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';
import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore';
import { getStorage as getAdminStorage } from 'firebase-admin/storage';
import { getServiceAccount } from '../../scripts/seed-admin.mjs'; // reuse resolver

let appInstance: App | null = null;

function getAdminApp(): App {
  if (!appInstance) {
    appInstance = getApps().length === 0
      ? initializeApp({ credential: cert(getServiceAccount()) })
      : getApp();
  }
  return appInstance;
}

// Lazy loader proxy helper
function createLazyProxy<T extends object>(initFn: () => T): T {
  let instance: T | null = null;
  return new Proxy({} as T, {
    get(target, prop) {
      if (!instance) {
        instance = initFn();
      }
      const value = Reflect.get(instance, prop);
      if (typeof value === 'function') {
        return value.bind(instance);
      }
      return value;
    },
    set(target, prop, value) {
      if (!instance) {
        instance = initFn();
      }
      return Reflect.set(instance, prop, value);
    }
  });
}

export const adminApp = createLazyProxy(() => getAdminApp());
export const auth = createLazyProxy(() => getAdminAuth(getAdminApp()));
export const db = createLazyProxy(() => getAdminFirestore(getAdminApp()));
export const storage = createLazyProxy(() => getAdminStorage(getAdminApp()).bucket());
