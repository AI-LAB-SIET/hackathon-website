/**
 * lib/firebaseAuth.ts
 *
 * Client-side Firebase Authentication helper layer.
 *
 * Architecture decisions:
 * - This is the ONLY file that calls Firebase Auth client SDK methods.
 *   UI components import from here, never directly from 'firebase/auth'.
 * - Role resolution always reads from Firestore `users/{uid}` — the source
 *   of truth for roles. Firebase Auth custom claims are a backup.
 * - The ADMIN_USERNAME constant maps the human-facing login ID to the
 *   internal Firebase Auth email — this mapping lives only here.
 * - Designed to support all roles (Admin, Organizer, Judge, Volunteer,
 *   Participant) from day one. Additional role sign-in paths are added
 *   without modifying the calling UI code.
 *
 * Phase 3 note: Participant self-registration uses `registerParticipant()`.
 * Admin-created users (Organizer, Judge) use Firebase Admin SDK server-side
 * and the created users log in through `signInWithRole()`.
 */

import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithPopup,
  GoogleAuthProvider,
  type User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, isConfigured } from './firebase';

// ── Constants ─────────────────────────────────────────────────────────────────

/** The only username → email mapping in the system */
const ADMIN_USERNAME = 'Admin2727';
const ADMIN_INTERNAL_EMAIL = 'admin@hacklab.internal';

// ── Types ─────────────────────────────────────────────────────────────────────

export type AppRole = 'admin' | 'organizer' | 'judge' | 'volunteer' | 'participant';

export interface FirebaseAuthResult {
  uid: string;
  email: string;
  displayName: string | null;
  role: AppRole;
  username?: string;
  mustChangePassword?: boolean;
}

export interface FirebaseAuthError {
  code: string;
  message: string;
  userFriendly: string;
}

// ── Admin login ───────────────────────────────────────────────────────────────

/**
 * Sign in as Admin using the admin username + password.
 * Internally maps Admin2727 → admin@hacklab.internal.
 * Throws a structured FirebaseAuthError on failure.
 */
export async function signInAsAdmin(
  username: string,
  password: string
): Promise<FirebaseAuthResult> {
  if (!isConfigured || !auth || !db) {
    throw buildError('auth/service-unavailable', 'Firebase is not configured.');
  }

  if (username.trim() !== ADMIN_USERNAME) {
    throw buildError('auth/invalid-username', 'Invalid admin username.');
  }

  try {
    const credential = await signInWithEmailAndPassword(
      auth,
      ADMIN_INTERNAL_EMAIL,
      password
    );
    return await resolveUserProfile(credential.user);
  } catch (err: unknown) {
    throw mapFirebaseError(err);
  }
}

/**
 * Generic sign-in for all non-admin roles (Organizer, Judge, Volunteer, Participant).
 * Uses email + password. Role is verified against Firestore profile.
 */
export async function signInWithRole(
  email: string,
  password: string,
  expectedRole?: AppRole
): Promise<FirebaseAuthResult> {
  if (!isConfigured || !auth || !db) {
    throw buildError('auth/service-unavailable', 'Firebase is not configured.');
  }

  try {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    const result = await resolveUserProfile(credential.user);

    if (expectedRole && result.role !== expectedRole) {
      await signOut(auth);
      throw buildError(
        'auth/wrong-role',
        `This account is registered as ${result.role}, not ${expectedRole}.`
      );
    }

    return result;
  } catch (err: unknown) {
    if ((err as FirebaseAuthError).code) throw err; // already structured
    throw mapFirebaseError(err);
  }
}

/**
 * Sign in / Sign up with Google OAuth.
 * Performs role resolution and first-time participant profile initialization (immutable role lock).
 */
export async function signInWithGoogle(): Promise<FirebaseAuthResult> {
  if (!isConfigured || !auth || !db) {
    throw buildError('auth/service-unavailable', 'Firebase is not configured.');
  }

  const provider = new GoogleAuthProvider();
  try {
    const credential = await signInWithPopup(auth, provider);
    const firebaseUser = credential.user;

    const profileRef = doc(db, 'users', firebaseUser.uid);
    const snap = await getDoc(profileRef);

    let role: AppRole = 'participant';
    if (!snap.exists()) {
      // First-time login: role assignment on first login, immutable role lock
      const newProfile = {
        uid: firebaseUser.uid,
        email: firebaseUser.email ?? '',
        displayName: firebaseUser.displayName ?? 'New Participant',
        role: 'participant' as AppRole,
        verified: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await setDoc(profileRef, newProfile);
    } else {
      role = snap.data().role as AppRole;
    }

    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email ?? '',
      displayName: firebaseUser.displayName ?? 'New Participant',
      role,
    };
  } catch (err: unknown) {
    throw mapFirebaseError(err);
  }
}

/**
 * Sign up with Email + Password, creating a participant user profile in Firestore.
 * Sends email verification for secure validation.
 */
export async function signUpWithEmail(
  email: string,
  password: string,
  name: string
): Promise<FirebaseAuthResult> {
  if (!isConfigured || !auth || !db) {
    throw buildError('auth/service-unavailable', 'Firebase is not configured.');
  }

  try {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = credential.user;

    // Send email verification
    try {
      await sendEmailVerification(firebaseUser);
    } catch (verifErr) {
      console.warn('Verification email could not be sent:', verifErr);
    }

    // Create user profile (participant role)
    const profileRef = doc(db, 'users', firebaseUser.uid);
    const newProfile = {
      uid: firebaseUser.uid,
      email,
      displayName: name,
      role: 'participant' as AppRole,
      verified: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await setDoc(profileRef, newProfile);

    return {
      uid: firebaseUser.uid,
      email,
      displayName: name,
      role: 'participant',
    };
  } catch (err: unknown) {
    throw mapFirebaseError(err);
  }
}

// ── Sign out ──────────────────────────────────────────────────────────────────

export async function signOutFirebase(): Promise<void> {
  if (!auth) return;
  await signOut(auth);
}

// ── Auth state observer ───────────────────────────────────────────────────────

/**
 * Subscribe to Firebase auth state changes.
 * Returns an unsubscribe function.
 */
export function onFirebaseAuthStateChanged(
  callback: (user: FirebaseUser | null) => void
): () => void {
  if (!auth) return () => {};
  return onAuthStateChanged(auth, callback);
}

// ── Firestore profile helpers ─────────────────────────────────────────────────

/**
 * Fetch a user's Firestore profile and merge with their Firebase Auth data.
 * This is the canonical way to get the full user record after any sign-in.
 */
export async function resolveUserProfile(
  firebaseUser: FirebaseUser
): Promise<FirebaseAuthResult> {
  if (!db) throw buildError('auth/service-unavailable', 'Firestore is not configured.');

  const profileRef = doc(db, 'users', firebaseUser.uid);
  const snap = await getDoc(profileRef);

  if (!snap.exists()) {
    throw buildError(
      'auth/profile-not-found',
      'User account exists in Authentication but has no Firestore profile. Contact the admin.'
    );
  }

  const data = snap.data();
  return {
    uid: firebaseUser.uid,
    email: data.email ?? firebaseUser.email ?? '',
    displayName: data.displayName ?? firebaseUser.displayName ?? null,
    role: data.role as AppRole,
    username: data.username,
    mustChangePassword: data.mustChangePassword ?? false,
  };
}

/**
 * Write or update a user's Firestore profile.
 * Used during participant self-registration (Phase 3).
 */
export async function writeUserProfile(
  uid: string,
  profile: Partial<{
    email: string;
    displayName: string;
    role: AppRole;
    username: string;
    phone: string;
    college: string;
    department: string;
    year: number;
    createdBy: string;
    mustChangePassword: boolean;
    disabled: boolean;
  }>
): Promise<void> {
  if (!db) throw buildError('auth/service-unavailable', 'Firestore is not configured.');
  const ref = doc(db, 'users', uid);
  await setDoc(
    ref,
    { ...profile, updatedAt: new Date().toISOString() },
    { merge: true }
  );
}

// ── Error helpers ─────────────────────────────────────────────────────────────

function buildError(code: string, userFriendly: string): FirebaseAuthError {
  return { code, message: userFriendly, userFriendly };
}

function mapFirebaseError(err: unknown): FirebaseAuthError {
  const code = (err as { code?: string })?.code ?? 'auth/unknown';
  const userFriendlyMessages: Record<string, string> = {
    'auth/invalid-credential': 'Incorrect username or password.',
    'auth/invalid-email': 'The email address is invalid.',
    'auth/user-disabled': 'This account has been disabled. Contact the admin.',
    'auth/user-not-found': 'No account found with these credentials.',
    'auth/wrong-password': 'Incorrect password.',
    'auth/too-many-requests': 'Too many failed attempts. Please wait and try again.',
    'auth/network-request-failed': 'Network error. Please check your connection.',
    'auth/service-unavailable': 'Authentication service is unavailable.',
    'auth/profile-not-found': 'User profile not found. Contact the admin.',
    'auth/wrong-role': 'Account role mismatch.',
    'auth/email-already-in-use': 'This email address is already in use.',
    'auth/weak-password': 'The password is too weak.',
  };
  return buildError(
    code,
    userFriendlyMessages[code] ??
      `Authentication failed. (${code})`
  );
}
