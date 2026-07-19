import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import {
  getFirestore,
  initializeFirestore,
  Firestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;
let storage: FirebaseStorage | undefined;
let initError: string | null = null;

const isConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId &&
  firebaseConfig.storageBucket
);

export function isFirebaseReady(): boolean {
  return isConfigured && !initError;
}

if (isConfigured) {
  try {
    const isFirstInit = getApps().length === 0;
    app = isFirstInit ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);

    if (isFirstInit) {
      // Use long-polling instead of WebSocket (gRPC-Web) to avoid
      // "Could not reach Cloud Firestore backend" warnings in environments
      // where WebSocket connections are throttled or blocked (VPNs, proxies, etc.).
      // persistentLocalCache enables offline reads + multi-tab coordination.
      db = initializeFirestore(app, {
        experimentalForceLongPolling: true,
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager(),
        }),
      });
    } else {
      // App was already initialized elsewhere — get the existing Firestore instance.
      db = getFirestore(app);
    }

    storage = getStorage(app);
  } catch (error) {
    initError = error instanceof Error ? error.message : "Unknown initialization error";
    app = undefined;
    auth = undefined;
    db = undefined;
    storage = undefined;
  }
}

export { app, auth, db, storage, isConfigured, initError };
