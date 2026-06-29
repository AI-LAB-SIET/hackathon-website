#!/usr/bin/env node
/**
 * scripts/seed-admin.mjs
 *
 * Idempotent bootstrap script — creates the ONE Admin account in Firebase
 * Authentication and writes the admin profile document to Firestore.
 *
 * Usage:
 *   node scripts/seed-admin.mjs
 *
 * The script reads credentials via one of these methods (in priority order):
 *   1. GOOGLE_APPLICATION_CREDENTIALS env var → path to a service-account.json file
 *   2. FIREBASE_SERVICE_ACCOUNT env var → base64-encoded service-account JSON
 *   3. ./service-account.json file in the project root (fallback)
 *
 * Rules enforced:
 *   - Only ONE admin may exist. If admin already exists → skip, no error.
 *   - Admin role can NEVER be created a second time through this script.
 *   - Username Admin2727 maps to the internal email admin@hacklab.internal
 *
 * Run this once after cloning the project (or on first deploy).
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// ── Resolve Firebase Admin SDK credentials ────────────────────────────────────

function resolveServiceAccount() {
  // Priority 1: env var pointing to file path
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    const filePath = resolve(process.env.GOOGLE_APPLICATION_CREDENTIALS);
    if (!existsSync(filePath)) {
      throw new Error(`GOOGLE_APPLICATION_CREDENTIALS points to non-existent file: ${filePath}`);
    }
    return JSON.parse(readFileSync(filePath, 'utf-8'));
  }

  // Priority 2: base64-encoded JSON in env var
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const decoded = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT, 'base64').toString('utf-8');
    return JSON.parse(decoded);
  }

  // Priority 3: service-account.json in project root
  const localFile = resolve(ROOT, 'service-account.json');
  if (existsSync(localFile)) {
    return JSON.parse(readFileSync(localFile, 'utf-8'));
  }

  // If in Next.js build phase, return dummy credentials to allow compilation
  if (process.env.NEXT_PHASE === 'phase-production-build' || process.env.NODE_ENV === 'production') {
    return {
      type: "service_account",
      project_id: "dummy-project",
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

  throw new Error(
    '❌  No Firebase service account credentials found.\n\n' +
    'Please do ONE of the following:\n' +
    '  1. Set GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json\n' +
    '  2. Set FIREBASE_SERVICE_ACCOUNT=<base64-encoded JSON>\n' +
    '  3. Place service-account.json in the project root\n\n' +
    'Download your service account key from:\n' +
    '  https://console.firebase.google.com/project/hackathon-website-6f5b9/settings/serviceaccounts/adminsdk'
  );
}
export const getServiceAccount = resolveServiceAccount;

// ── Admin account configuration ───────────────────────────────────────────────

const ADMIN_CONFIG = {
  /** Internal Firebase Auth email — never shown to users */
  email: 'admin@hacklab.internal',
  /** The login username shown on the UI */
  username: 'Admin2727',
  /** Initial password — should be changed after first login */
  password: '9629371790',
  displayName: 'System Administrator',
  role: 'admin',
};

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🔧  Hack Lab Admin Bootstrap');
  console.log('─'.repeat(50));

  // Dynamically import firebase-admin (ESM-compatible, v14 modular API)
  const { getApps, initializeApp, cert } = await import('firebase-admin/app');
  const { getAuth } = await import('firebase-admin/auth');
  const { getFirestore } = await import('firebase-admin/firestore');

  // Resolve credentials
  let serviceAccount;
  try {
    serviceAccount = resolveServiceAccount();
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }

  // Initialise Firebase Admin SDK (singleton-safe)
  if (!getApps().length) {
    initializeApp({
      credential: cert(serviceAccount),
    });
  }

  const auth = getAuth();
  const db = getFirestore();

  // ── Step 1: Check if admin already exists in Firebase Auth ─────────────────
  console.log(`\n🔍  Checking for existing admin account (${ADMIN_CONFIG.email})...`);

  let existingUser = null;
  try {
    existingUser = await auth.getUserByEmail(ADMIN_CONFIG.email);
  } catch (err) {
    if (err.code !== 'auth/user-not-found') throw err;
    // Expected: user does not exist yet → proceed
  }

  if (existingUser) {
    console.log(`\n✅  Admin account already exists — skipping creation.`);
    console.log(`    UID   : ${existingUser.uid}`);
    console.log(`    Email : ${existingUser.email}`);

    // Ensure Firestore profile is also present (idempotent write)
    const profileRef = db.collection('users').doc(existingUser.uid);
    const snap = await profileRef.get();
    if (!snap.exists) {
      console.log('\n📝  Firestore profile missing — writing now...');
      await profileRef.set(buildProfile(existingUser.uid), { merge: true });
      console.log('    ✅  Firestore profile created.');
    } else {
      console.log('    ✅  Firestore profile already present.');
    }

    console.log('\n🏁  Seed complete (no changes made).\n');
    process.exit(0);
  }

  // ── Step 2: Check no admin exists in Firestore (extra guard) ───────────────
  console.log('🛡️  Verifying no admin role exists in Firestore...');
  const existingAdmins = await db.collection('users').where('role', '==', 'admin').limit(1).get();
  if (!existingAdmins.empty) {
    console.error('\n❌  An admin document already exists in Firestore but no matching Auth user was found.');
    console.error('    Manual investigation required. Aborting to prevent duplicate admin.');
    process.exit(1);
  }

  // ── Step 3: Create Firebase Auth user ──────────────────────────────────────
  console.log('\n🔐  Creating Firebase Authentication account...');
  const newUser = await auth.createUser({
    email: ADMIN_CONFIG.email,
    password: ADMIN_CONFIG.password,
    displayName: ADMIN_CONFIG.displayName,
    emailVerified: true, // Admin account is pre-verified
    disabled: false,
  });
  console.log(`    ✅  Auth user created — UID: ${newUser.uid}`);

  // ── Step 4: Set custom claim for role (used in security rules) ─────────────
  await auth.setCustomUserClaims(newUser.uid, { role: 'admin' });
  console.log('    ✅  Custom claim set: role=admin');

  // ── Step 5: Write Firestore profile ───────────────────────────────────────
  console.log('\n📝  Writing Firestore user profile...');
  const profileRef = db.collection('users').doc(newUser.uid);
  await profileRef.set(buildProfile(newUser.uid));
  console.log('    ✅  Firestore profile written to users/' + newUser.uid);

  // ── Done ───────────────────────────────────────────────────────────────────
  console.log('\n' + '─'.repeat(50));
  console.log('🎉  Admin account seeded successfully!\n');
  console.log('    Username : Admin2727');
  console.log('    Password : 9629371790  (change after first login)');
  console.log('    UID      : ' + newUser.uid);
  console.log('    Role     : admin');
  console.log('\n⚠️   Remember to update ADMIN_CONFIG.password once you have');
  console.log('    logged in and changed it through the Admin Dashboard.\n');

  process.exit(0);
}

function buildProfile(uid) {
  return {
    uid,
    username: ADMIN_CONFIG.username,
    email: ADMIN_CONFIG.email,
    role: ADMIN_CONFIG.role,
    displayName: ADMIN_CONFIG.displayName,
    photoURL: null,
    phone: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    mustChangePassword: true,
    disabled: false,
    // Hierarchy metadata
    createdBy: 'system:bootstrap',
    canCreateRoles: ['organizer', 'judge'],
    cannotCreateRoles: ['admin'],
  };
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);
if (isMain) {
  main().catch((err) => {
    console.error('\n❌  Seed script failed:', err.message || err);
    process.exit(1);
  });
}
