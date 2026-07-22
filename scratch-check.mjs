/**
 * Unlock HACKSPRINT'26 via Firebase REST API + JWT auth
 * Uses Firestore REST API directly to bypass gRPC quota limits
 */
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { createSign } from 'crypto';

const sa = JSON.parse(readFileSync(resolve('service-account.json'), 'utf-8'));
const PROJECT = sa.project_id; // hackathon-website-6f5b9

// ── Step 1: Create a JWT access token for the service account ────────────────
function makeJWT() {
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    iss: sa.client_email,
    sub: sa.client_email,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
    scope: 'https://www.googleapis.com/auth/datastore',
  })).toString('base64url');
  const sign = createSign('RSA-SHA256');
  sign.update(`${header}.${payload}`);
  const sig = sign.sign(sa.private_key, 'base64url');
  return `${header}.${payload}.${sig}`;
}

// ── Step 2: Exchange JWT for OAuth2 access token ─────────────────────────────
async function getAccessToken() {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: makeJWT(),
    }),
  });
  const data = await res.json();
  if (!data.access_token) throw new Error('Failed to get access token: ' + JSON.stringify(data));
  return data.access_token;
}

// ── Step 3: List hackathons via REST ─────────────────────────────────────────
async function listHackathons(token) {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/hackathons?pageSize=20`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const data = await res.json();
  return data.documents || [];
}

// ── Step 4: Patch teamsLocked = false ────────────────────────────────────────
async function unlockHackathon(token, docName) {
  const url = `https://firestore.googleapis.com/v1/${docName}?updateMask.fieldPaths=teamsLocked`;
  const body = {
    fields: {
      teamsLocked: { booleanValue: false },
    },
  };
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🔑 Getting access token...');
  const token = await getAccessToken();
  console.log('✅ Token obtained\n');

  console.log('📋 Listing hackathons...');
  const docs = await listHackathons(token);

  if (!docs.length) {
    console.log('❌ No hackathons found or quota still exceeded.');
    return;
  }

  console.log(`Found ${docs.length} hackathon(s):`);
  docs.forEach(doc => {
    const name = doc.fields?.name?.stringValue || '(no name)';
    const locked = doc.fields?.teamsLocked?.booleanValue;
    console.log(`  • ${name} | teamsLocked=${locked} | id: ${doc.name.split('/').pop()}`);
  });

  // Find HACKSPRINT
  const target = docs.find(d =>
    (d.fields?.name?.stringValue || '').toUpperCase().includes('HACKSPRINT')
  );

  if (!target) {
    console.log('\n❌ HACKSPRINT hackathon not found in results!');
    return;
  }

  const name = target.fields?.name?.stringValue;
  const docId = target.name.split('/').pop();
  console.log(`\n🎯 Target: "${name}" (ID: ${docId})`);
  console.log(`   Current teamsLocked = ${target.fields?.teamsLocked?.booleanValue}`);

  console.log('🔓 Unlocking...');
  const result = await unlockHackathon(token, target.name);

  if (result.error) {
    console.error('❌ Update failed:', JSON.stringify(result.error, null, 2));
  } else {
    const newLocked = result.fields?.teamsLocked?.booleanValue;
    console.log(`✅ Done! teamsLocked is now: ${newLocked}`);
    console.log(`🎉 HACKSPRINT'26 is fully UNLOCKED — participants can edit project details!`);
  }
}

main().catch(console.error);
