import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const localPath = resolve('service-account.json');
const serviceAccount = JSON.parse(readFileSync(localPath, 'utf-8'));

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount)
  });
}

const db = getFirestore();

async function main() {
  const snapshot = await db.collection('problemStatements').get();
  console.log(`Found ${snapshot.size} problem statements.`);
  snapshot.forEach(doc => {
    console.log(doc.id, '=>', JSON.stringify(doc.data(), null, 2));
  });
}

main().catch(console.error);
