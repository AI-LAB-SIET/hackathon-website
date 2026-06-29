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
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

function getServiceAccount() {
  // Priority 1: env var pointing to file path
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    const filePath = resolve(process.env.GOOGLE_APPLICATION_CREDENTIALS);
    if (existsSync(filePath)) {
      try {
        return JSON.parse(readFileSync(filePath, 'utf-8'));
      } catch (err) {
        console.error("Error reading GOOGLE_APPLICATION_CREDENTIALS file:", err);
      }
    }
  }

  // Priority 2: base64-encoded JSON in env var
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      const decoded = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT, 'base64').toString('utf-8');
      return JSON.parse(decoded);
    } catch (err) {
      console.error("Error parsing FIREBASE_SERVICE_ACCOUNT env var:", err);
    }
  }

  // Priority 3: service-account.json in project root
  const localFile = resolve(process.cwd(), 'service-account.json');
  if (existsSync(localFile)) {
    try {
      return JSON.parse(readFileSync(localFile, 'utf-8'));
    } catch (err) {
      console.error("Error reading local service-account.json file:", err);
    }
  }

  // Fallback: dummy credentials to allow build compilation/bootstrapping
  return {
    type: "service_account",
    project_id: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "dummy-project",
    private_key_id: "dummy-key-id",
    private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC3\n-----END PRIVATE KEY-----\n",
    client_email: "dummy@dummy-project.iam.gserviceaccount.com",
    client_id: "dummy-client-id",
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: "https://www.googleapis.com/metadata/x09/dummy"
  };
}

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
