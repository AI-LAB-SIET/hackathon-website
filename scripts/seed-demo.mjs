#!/usr/bin/env node
/**
 * scripts/seed-demo.mjs
 *
 * Generates a full development dataset: users (organizers, judges, volunteers, participants),
 * teams, projects, announcements, resources, and sample documents. All created records are
 * marked with `demo: true` for easy cleanup.
 *
 * Usage: `node scripts/seed-demo.mjs`
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { faker } from '@faker-js/faker';
import admin from 'firebase-admin';
import { PDFDocument } from 'pdf-lib';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// Resolve service account (same logic as seed-admin.mjs)
function getServiceAccount() {
  const envPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (envPath && envPath.trim()) {
    return JSON.parse(readFileSync(envPath, 'utf-8'));
  }
  const localPath = resolve(ROOT, 'service-account.json');
  return JSON.parse(readFileSync(localPath, 'utf-8'));
}

admin.initializeApp({ credential: admin.credential.cert(getServiceAccount()) });
const auth = admin.auth();
const db = admin.firestore();
const storage = admin.storage().bucket();

// Helper to create a user in Auth and Firestore
async function createUser({ email, password, displayName, role, extra = {} }) {
  // Check if exists
  let userRecord;
  try {
    userRecord = await auth.getUserByEmail(email);
    console.log(`User ${email} already exists, skipping creation.`);
  } catch (e) {
    if (e.code === 'auth/user-not-found') {
      userRecord = await auth.createUser({ email, password, displayName, emailVerified: true });
      console.log(`Created Auth user ${email}`);
    } else {
      throw e;
    }
  }
  // Set custom claim
  await auth.setCustomUserClaims(userRecord.uid, { role });
  // Firestore profile
  const profileRef = db.collection('users').doc(userRecord.uid);
  const snap = await profileRef.get();
  if (!snap.exists) {
    await profileRef.set({
      uid: userRecord.uid,
      username: email.split('@')[0],
      email,
      role,
      displayName,
      phone: faker.phone.number('+1-###-###-####'),
      college: faker.company.name() + ' University',
      department: faker.commerce.department(),
      year: faker.datatype.number({ min: 1, max: 5 }),
      photoURL: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      demo: true,
      ...extra,
    });
    console.log(`Created Firestore profile for ${email}`);
  } else {
    console.log(`Firestore profile for ${email} already exists.`);
  }
  return userRecord.uid;
}

async function main() {
  console.log('--- Seeding Demo Data ---');

  // 1. Users
  const roles = {
    organizer: 3,
    judge: 5,
    volunteer: 10,
    participant: 50,
  };
  const uidMap = {};
  for (const [role, count] of Object.entries(roles)) {
    for (let i = 0; i < count; i++) {
      const name = faker.person.fullName();
      const email = `${name.toLowerCase().replace(/\s+/g, '.')}.${role}@demo.com`;
      const password = 'DemoPass123!'; // simple password for all demo users
      const uid = await createUser({ email, password, displayName: name, role });
      uidMap[`${role}-${i}`] = uid;
    }
  }

  // 2. Teams
  const teamIds = [];
  for (let i = 0; i < 20; i++) {
    const teamName = `${faker.company.adjective()} ${faker.company.bsBuzz()} Team`;
    // pick a random organizer as leader
    const leaderKey = `organizer-${faker.datatype.number({ min: 0, max: 2 })}`;
    const leaderUid = uidMap[leaderKey];
    const memberUids = [];
    // pick 3-5 participants as members
    const memberCount = faker.datatype.number({ min: 3, max: 5 });
    for (let m = 0; m < memberCount; m++) {
      const pKey = `participant-${faker.datatype.number({ min: 0, max: 49 })}`;
      memberUids.push(uidMap[pKey]);
    }
    const teamRef = db.collection('teams').doc();
    await teamRef.set({
      name: teamName,
      leaderUid,
      memberUids,
      projectTitle: faker.company.catchPhrase(),
      domain: faker.hacker.noun(),
      status: faker.helpers.arrayElement(['pending', 'active', 'completed']),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      demo: true,
    });
    teamIds.push(teamRef.id);
    console.log(`Created team ${teamName}`);
  }

  // 3. Projects (linked to teams)
  for (let i = 0; i < 20; i++) {
    const projRef = db.collection('projects').doc();
    const teamId = teamIds[i];
    const title = faker.company.catchPhrase();
    await projRef.set({
      title,
      description: faker.lorem.paragraphs(2),
      technologies: faker.helpers.arrayElements(['React', 'Node.js', 'Python', 'TensorFlow', 'Docker', 'Kubernetes'], faker.datatype.number({ min: 2, max: 4 })),
      teamId,
      repoLink: `https://github.com/demo/${title.replace(/\s+/g, '-').toLowerCase()}`,
      demoLink: `https://demo.com/${title.replace(/\s+/g, '-').toLowerCase()}`,
      createdAt: new Date().toISOString(),
      demo: true,
    });
    console.log(`Created project ${title}`);
  }

  // 4. Announcements
  const announcementTemplates = [
    'Registration Open for Hackathon 2026',
    'Registration Closed – thank you for your interest',
    'Mentor session scheduled for {date}',
    'Venue updated: {venue}',
    'Final round begins at {time}',
    'Lunch break at {time}',
    'Certificates available for download',
    'Hackathon schedule released',
    'New sponsor announced: {sponsor}',
    'Judging criteria released',
  ];
  for (let i = 0; i < 20; i++) {
    const template = faker.helpers.arrayElement(announcementTemplates);
    const content = template
      .replace('{date}', faker.date.future().toDateString())
      .replace('{venue}', faker.location.city())
      .replace('{time}', faker.date.future().toTimeString().split(' ')[0])
      .replace('{sponsor}', faker.company.name());
    const annRef = db.collection('announcements').doc();
    await annRef.set({
      title: content.split(' – ')[0] || content,
      body: content,
      createdAt: new Date().toISOString(),
      demo: true,
    });
    console.log(`Created announcement ${i + 1}`);
  }

  // 5. Resources
  const resourceTypes = ['API', 'Dataset', 'Template', 'Learning', 'Cloud Credit', 'Tool'];
  for (let i = 0; i < 30; i++) {
    const type = faker.helpers.arrayElement(resourceTypes);
    const resRef = db.collection('resources').doc();
    await resRef.set({
      name: `${type} - ${faker.company.bsBuzz()}`,
      type,
      description: faker.lorem.sentence(),
      link: faker.internet.url(),
      createdAt: new Date().toISOString(),
      demo: true,
    });
    console.log(`Created resource ${i + 1}`);
  }

  // 6. Sample Documents (PDF & TXT) uploaded to Storage
  const docs = [
    { name: 'Hackathon_Rulebook.pdf', content: 'Hackathon Rulebook\n\nAll participants must follow the code of conduct...' },
    { name: 'FAQ.pdf', content: 'Frequently Asked Questions\n\nQ: What is the prize pool? A: $10,000 total.' },
    { name: 'Schedule.txt', content: 'Day 1: Opening Ceremony\nDay 2: Workshops\nDay 3: Hackathon\nDay 4: Presentations\nDay 5: Awards' },
    { name: 'Submission_Guidelines.pdf', content: 'Submission Guidelines\n\n- Max 5 MB\n- Include README...' },
    { name: 'Code_of_Conduct.pdf', content: 'Code of Conduct\n\nBe respectful...' },
    { name: 'Venue_Guide.txt', content: 'Venue Guide\n\nAddress: 123 Hack St, Tech City' },
  ];

  for (const docInfo of docs) {
    const storagePath = `demo/documents/${docInfo.name}`;
    // check if already exists
    const file = storage.file(storagePath);
    const [exists] = await file.exists();
    if (exists) {
      console.log(`${docInfo.name} already uploaded, skipping.`);
      continue;
    }
    // create simple PDF for .pdf files else plain text
    let buffer;
    if (docInfo.name.endsWith('.pdf')) {
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage();
      const { width, height } = page.getSize();
      const font = await pdfDoc.embedFont(PDFDocument.StandardFonts.Helvetica);
      page.drawText(docInfo.content, { x: 50, y: height - 50, size: 12, font });
      buffer = await pdfDoc.save();
    } else {
      buffer = Buffer.from(docInfo.content, 'utf-8');
    }
    await file.save(buffer, { metadata: { contentType: docInfo.name.endsWith('.pdf') ? 'application/pdf' : 'text/plain' } });
    // Firestore metadata
    const metaRef = db.collection('documents').doc();
    await metaRef.set({
      name: docInfo.name,
      path: storagePath,
      type: docInfo.name.endsWith('.pdf') ? 'pdf' : 'txt',
      uploadedAt: new Date().toISOString(),
      demo: true,
    });
    console.log(`Uploaded and indexed ${docInfo.name}`);
  }

  console.log('--- Demo data seeding complete ---');
  process.exit(0);
}

main().catch((e) => {
  console.error('Seeding failed:', e);
  process.exit(1);
});
