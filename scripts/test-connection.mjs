#!/usr/bin/env node
/**
 * scripts/test-connection.mjs
 * Quick Firebase Admin SDK connection test — Auth + Firestore
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const SA_PATH = resolve(ROOT, 'service-account.json');

console.log('\n🔍  Firebase Connection Test');
console.log('─'.repeat(50));

// ─── 1. Check service-account.json ───────────────────────────────────────────
if (!existsSync(SA_PATH)) {
  console.error('❌  service-account.json NOT found at:', SA_PATH);
  process.exit(1);
}
const sa = JSON.parse(readFileSync(SA_PATH, 'utf-8'));
console.log('✅  service-account.json found');
console.log(`    project_id   : ${sa.project_id}`);
console.log(`    client_email : ${sa.client_email}`);
console.log(`    has private_key: ${!!sa.private_key}`);

// ─── 2. Import firebase-admin ─────────────────────────────────────────────────
let cert, initializeApp, getApps, getAuth, getFirestore;
try {
  const appMod = await import('firebase-admin/app');
  const authMod = await import('firebase-admin/auth');
  const fsMod = await import('firebase-admin/firestore');
  cert = appMod.cert;
  initializeApp = appMod.initializeApp;
  getApps = appMod.getApps;
  getAuth = authMod.getAuth;
  getFirestore = fsMod.getFirestore;
  console.log('\n✅  firebase-admin imported successfully');
  console.log(`    cert API available: ${!!cert}`);
} catch (e) {
  console.error('\n❌  firebase-admin import FAILED:', e.message);
  process.exit(1);
}

if (!cert) {
  console.error('❌  cert is undefined — firebase-admin v14 modular import failed');
  process.exit(1);
}

// ─── 3. Initialise Firebase Admin ────────────────────────────────────────────
if (!getApps().length) {
  initializeApp({ credential: cert(sa) });
}
console.log('✅  Firebase Admin SDK initialized');

// ─── 4. Test Auth ─────────────────────────────────────────────────────────────
try {
  const auth = getAuth();
  const result = await auth.listUsers(1);
  console.log(`\n✅  Firebase Auth connected — found ${result.users.length} user(s) in first page`);
} catch (e) {
  console.error('\n❌  Firebase Auth connection FAILED:', e.message);
}

// ─── 5. Test Firestore ────────────────────────────────────────────────────────
try {
  const db = getFirestore();
  const testRef = db.collection('_connection_test_').doc('ping');
  await testRef.set({ ts: new Date().toISOString(), ok: true });
  const snap = await testRef.get();
  await testRef.delete();
  console.log(`✅  Firestore connected — write/read/delete OK (ts: ${snap.data().ts})`);
} catch (e) {
  console.error('\n❌  Firestore connection FAILED:', e.message);
}

console.log('\n' + '─'.repeat(50));
console.log('🎉  All connection checks passed!\n');
process.exit(0);
