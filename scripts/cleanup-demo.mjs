#!/usr/bin/env node
/**
 * scripts/cleanup-demo.mjs
 *
 * Safe cleanup script — Removes all demo users (marked with demo: true or email @demo.com)
 * from Firebase Auth and Firestore, and deletes all firestore records marked with `demo: true`.
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

function getServiceAccount() {
  const envPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (envPath && envPath.trim()) {
    return JSON.parse(readFileSync(envPath, 'utf-8'));
  }
  const localPath = resolve(ROOT, 'service-account.json');
  return JSON.parse(readFileSync(localPath, 'utf-8'));
}

if (!getApps().length) {
  initializeApp({ 
    credential: cert(getServiceAccount())
  });
}
const auth = getAuth();
const db = getFirestore();

async function main() {
  console.log('🧹 Starting cleanup of demo data...');

  const collections = [
    'users',
    'teams',
    'projects',
    'announcements',
    'resources',
    'documents',
    'tickets',
    'problemStatements',
    'notifications'
  ];

  for (const collName of collections) {
    const collRef = db.collection(collName);
    
    // We fetch documents where `demo` is true
    const snap = await collRef.where('demo', '==', true).get();
    if (snap.empty) {
      console.log(`ℹ️ No demo docs found in collection [${collName}]`);
      continue;
    }

    const batch = db.batch();
    let authDeletesCount = 0;
    
    for (const doc of snap.docs) {
      batch.delete(doc.ref);
      
      // If it's the users collection, also delete from Firebase Auth
      if (collName === 'users') {
        const uid = doc.id;
        try {
          await auth.deleteUser(uid);
          authDeletesCount++;
        } catch (err) {
          // If already deleted or not found in Auth, ignore
          if (err.code !== 'auth/user-not-found') {
            console.warn(`⚠️ Warning: Failed to delete user ${uid} from Firebase Auth:`, err.message);
          }
        }
      }
    }

    await batch.commit();
    console.log(`✅ Cleaned up ${snap.size} documents from collection [${collName}]`);
    if (authDeletesCount > 0) {
      console.log(`✅ Deleted ${authDeletesCount} demo users from Firebase Auth.`);
    }
  }

  // Also catch any users with email domain "@demo.com" that might not have `demo: true` in Firestore but are in Auth
  console.log('\n🔍 Scanning Firebase Auth for remaining demo accounts...');
  let listUsersResult = await auth.listUsers(1000);
  let extraDeletedAuthCount = 0;

  while (listUsersResult.users.length > 0) {
    const deletePromises = [];
    for (const userRecord of listUsersResult.users) {
      if (userRecord.email && (userRecord.email.endsWith('@demo.com') || userRecord.email.startsWith('demo.'))) {
        deletePromises.push(
          auth.deleteUser(userRecord.uid).then(async () => {
            extraDeletedAuthCount++;
            // Also ensure firestore user record is removed if any
            try {
              await db.collection('users').doc(userRecord.uid).delete();
            } catch (e) {}
          })
        );
      }
    }
    await Promise.all(deletePromises);

    if (listUsersResult.pageToken) {
      listUsersResult = await auth.listUsers(1000, listUsersResult.pageToken);
    } else {
      break;
    }
  }

  if (extraDeletedAuthCount > 0) {
    console.log(`✅ Deleted additional ${extraDeletedAuthCount} demo users based on email filter from Firebase Auth.`);
  }

  console.log('\n🎉 Cleanup process finished successfully.');
}

main().catch(err => {
  console.error('🚨 Error running cleanup script:', err);
  process.exit(1);
});
