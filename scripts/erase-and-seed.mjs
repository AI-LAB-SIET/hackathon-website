#!/usr/bin/env node
/**
 * scripts/erase-and-seed.mjs
 *
 * Wipe and Seed Script — Cleans all existing data (except admin) from Firebase
 * Authentication and Firestore, and seeds standard test roles and demo records.
 *
 * Usage:
 *   node scripts/erase-and-seed.mjs
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { faker } from '@faker-js/faker';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// ── Resolve Firebase Admin SDK credentials ────────────────────────────────────
function resolveServiceAccount() {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    const filePath = resolve(process.env.GOOGLE_APPLICATION_CREDENTIALS);
    if (!existsSync(filePath)) {
      throw new Error(`GOOGLE_APPLICATION_CREDENTIALS points to non-existent file: ${filePath}`);
    }
    return JSON.parse(readFileSync(filePath, 'utf-8'));
  }

  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const decoded = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT, 'base64').toString('utf-8');
    return JSON.parse(decoded);
  }

  const localFile = resolve(ROOT, 'service-account.json');
  if (existsSync(localFile)) {
    return JSON.parse(readFileSync(localFile, 'utf-8'));
  }

  throw new Error(
    '❌  No Firebase service account credentials found.\n' +
    'Please place service-account.json in the project root to run this script.'
  );
}

// ── Test Users Definition ─────────────────────────────────────────────────────
const ADMIN_EMAIL = 'admin@hacklab.internal';
const TEST_USERS = [
  {
    email: 'judge@college.edu',
    password: 'demo123',
    displayName: 'Demo Judge',
    role: 'judge',
  },
  {
    email: 'organizer@college.edu',
    password: 'demo123',
    displayName: 'Demo Organizer',
    role: 'organizer',
  },
  {
    email: 'riya@college.edu',
    password: 'demo123',
    displayName: 'Riya Volunteer',
    role: 'volunteer',
  },
  {
    email: 'abhishek@college.edu',
    password: 'demo123',
    displayName: 'Abhishek Participant',
    role: 'participant',
  }
];

// Helper to batch delete documents in a collection
async function wipeCollection(db, collectionName) {
  const collectionRef = db.collection(collectionName);
  const snapshot = await collectionRef.get();
  
  if (snapshot.empty) {
    console.log(`ℹ️  Collection [${collectionName}] is already empty.`);
    return;
  }

  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });
  
  await batch.commit();
  console.log(`🧹  Wiped ${snapshot.size} documents from collection [${collectionName}].`);
}

async function main() {
  console.log('🔥  Starting Database Wipe & Seeding Process...');
  console.log('─'.repeat(60));

  // ── firebase-admin v14 modular API ───────────────────────────────────────────
  const { getApps, initializeApp, cert } = await import('firebase-admin/app');
  const { getAuth } = await import('firebase-admin/auth');
  const { getFirestore } = await import('firebase-admin/firestore');

  let serviceAccount;
  try {
    serviceAccount = resolveServiceAccount();
    console.log('✅  Service account resolved for project:', serviceAccount.project_id);
  } catch (err) {
    console.error('🚨 resolveServiceAccount error:', err.message);
    process.exit(1);
  }

  if (!getApps().length) {
    initializeApp({
      credential: cert(serviceAccount),
    });
  }

  const auth = getAuth();
  const db = getFirestore();

  // ── Step 1: Wipe Auth Users except Admin ────────────────────────────────────
  console.log('\n🔐  Cleaning Firebase Authentication Users...');
  let listUsersResult = await auth.listUsers(1000);
  let deletedAuthCount = 0;

  while (listUsersResult.users.length > 0) {
    const deletePromises = [];
    for (const userRecord of listUsersResult.users) {
      if (userRecord.email !== ADMIN_EMAIL) {
        deletePromises.push(
          auth.deleteUser(userRecord.uid).then(() => {
            deletedAuthCount++;
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
  console.log(`✅  Deleted ${deletedAuthCount} non-admin Auth users.`);

  // ── Step 2: Ensure Admin Auth User Exists ───────────────────────────────────
  console.log('\n👑  Ensuring bootstrap Admin user account...');
  let adminUid;
  try {
    const adminUser = await auth.getUserByEmail(ADMIN_EMAIL);
    adminUid = adminUser.uid;
    console.log(`✅  Admin user account exists. UID: ${adminUid}`);
  } catch (e) {
    if (e.code === 'auth/user-not-found') {
      const adminUser = await auth.createUser({
        email: ADMIN_EMAIL,
        password: '9629371790',
        displayName: 'System Administrator',
        emailVerified: true,
      });
      adminUid = adminUser.uid;
      console.log(`✅  Bootstrap Admin user created. UID: ${adminUid}`);
    } else {
      throw e;
    }
  }

  // Set admin custom claim
  await auth.setCustomUserClaims(adminUid, { role: 'admin' });
  console.log('✅  Admin role claim successfully configured.');

  // ── Step 3: Wipe Firestore Collections ──────────────────────────────────────
  console.log('\n📚  Wiping Firestore Collections...');
  const collectionsToWipe = [
    'teams',
    'projects',
    'announcements',
    'resources',
    'documents',
    'tickets',
    'problemStatements',
    'notifications'
  ];

  for (const coll of collectionsToWipe) {
    await wipeCollection(db, coll);
  }

  // Wipe users collection except admin
  const usersSnapshot = await db.collection('users').get();
  const userBatch = db.batch();
  let deletedUserProfiles = 0;
  usersSnapshot.docs.forEach((doc) => {
    if (doc.id !== adminUid) {
      userBatch.delete(doc.ref);
      deletedUserProfiles++;
    }
  });
  if (deletedUserProfiles > 0) {
    await userBatch.commit();
    console.log(`🧹  Wiped ${deletedUserProfiles} user profiles from users collection.`);
  } else {
    console.log('ℹ️  No non-admin user profiles in Firestore users collection.');
  }

  // Ensure Admin user profile document is set
  await db.collection('users').doc(adminUid).set({
    uid: adminUid,
    username: 'Admin2727',
    email: ADMIN_EMAIL,
    role: 'admin',
    displayName: 'System Administrator',
    photoURL: null,
    phone: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    mustChangePassword: true,
    disabled: false,
    createdBy: 'system:bootstrap',
  });
  console.log('✅  Admin user profile successfully restored.');

  // ── Step 4: Seed Test Users ─────────────────────────────────────────────────
  console.log('\n👥  Creating test users and their profiles...');
  const uidMap = { admin: adminUid };

  for (const user of TEST_USERS) {
    const userRecord = await auth.createUser({
      email: user.email,
      password: user.password,
      displayName: user.displayName,
      emailVerified: true,
    });
    uidMap[user.role] = userRecord.uid;
    console.log(`✅  Created Auth account: ${user.email} (${user.role}) -> UID: ${userRecord.uid}`);

    // Set custom claim
    await auth.setCustomUserClaims(userRecord.uid, { role: user.role });

    // Set Firestore profile
    await db.collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      id: userRecord.uid,
      username: user.email.split('@')[0],
      email: user.email,
      role: user.role,
      displayName: user.displayName,
      name: user.displayName,
      phone: faker.phone.number('+1-###-###-####'),
      college: 'SIET College of Engineering',
      department: 'Computer Science and Engineering',
      year: '3',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      demo: true,
    });
    console.log(`    Seeded Firestore profile users/${userRecord.uid}`);
  }

  // ── Step 5: Seed Demo Content ───────────────────────────────────────────────
  console.log('\n🌱  Seeding Demo Data (Tracks, Problem Statements, Teams, Projects)...');

  // A. Tracks and Problem Statements
  const problemStatements = [
    {
      id: 'ps-health',
      title: 'Smart Health Monitoring',
      description: 'Develop a system to track real-time health metrics of patient telemetry using smart sensors.',
      trackId: 'Healthcare IoT',
      status: 'published'
    },
    {
      id: 'ps-energy',
      title: 'Decentralized Grid Management',
      description: 'Design a smart contract or protocol for matching decentralized microgrid electricity production.',
      trackId: 'CleanTech BlockChain',
      status: 'published'
    },
    {
      id: 'ps-education',
      title: 'AI Classroom Assistant',
      description: 'Build an AI tool that assists teachers with automated grading feedback on student essays.',
      trackId: 'EdTech AI',
      status: 'published'
    }
  ];

  for (const ps of problemStatements) {
    await db.collection('problemStatements').doc(ps.id).set({
      ...ps,
      createdAt: new Date().toISOString(),
      demo: true,
    });
    console.log(`    Seeded problem statement: ${ps.title}`);
  }

  // B. Teams (linking Abhishek Participant to one of them)
  const participantUid = uidMap['participant'];
  const volunteerUid = uidMap['volunteer'];

  // 1. Abhishek's team: Alpha Coders (APPROVED)
  const abhishekTeamId = 'team-alpha-coders';
  const abhishekTeam = {
    id: abhishekTeamId,
    name: 'Alpha Coders',
    size: 4,
    members: [
      {
        name: 'Abhishek Participant',
        registerNumber: 'CS2023001',
        email: 'abhishek@college.edu',
        phone: '+1-555-0199',
        department: 'CSE',
        year: '3',
        skills: ['Next.js', 'Firebase', 'TypeScript'],
        isLeader: true,
      },
      {
        name: 'Jane Doe',
        registerNumber: 'CS2023002',
        email: 'jane.doe@demo.com',
        phone: '+1-555-0123',
        department: 'CSE',
        year: '3',
        skills: ['React', 'CSS'],
        isLeader: false,
      },
      {
        name: 'John Smith',
        registerNumber: 'CS2023003',
        email: 'john.smith@demo.com',
        phone: '+1-555-0145',
        department: 'ECE',
        year: '3',
        skills: ['Python', 'NodeJS'],
        isLeader: false,
      }
    ],
    status: 'APPROVED',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    projectDescription: 'Next-generation AI Assistant matching essays with rubric points.',
    githubUrl: 'https://github.com/abhishek/alpha-coders',
    demoUrl: 'https://alpha-coders.vercel.app',
    problemStatementId: 'ps-education',
    submitted: true,
    submittedAt: new Date().toISOString(),
    evaluations: [
      {
        innovation: 9,
        feasibility: 8,
        presentation: 9,
        technicalDepth: 8,
        aiUsage: 9,
        feedback: 'Excellent integration of generative feedback models. The essays are evaluated in milliseconds.',
        judgeEmail: 'judge@college.edu',
      }
    ],
    demo: true,
  };

  await db.collection('teams').doc(abhishekTeamId).set(abhishekTeam);
  console.log(`    Seeded Team: Alpha Coders (Abhishek Participant)`);

  // Update Abhishek's profile with teamId
  await db.collection('users').doc(participantUid).update({
    teamId: abhishekTeamId,
  });
  console.log(`    Assigned Abhishek Participant to Team: Alpha Coders`);

  // 2. Additional Mock Teams for Judging and Leaderboard testing
  const otherTeams = [
    {
      id: 'team-iot-innovators',
      name: 'IoT Innovators',
      size: 3,
      members: [
        { name: 'Kavin Kumar', registerNumber: 'CS2023010', email: 'kavin@demo.com', phone: '+1-555-0210', department: 'CSE', year: '3', skills: ['Arduino', 'C++'], isLeader: true },
        { name: 'Manoj S', registerNumber: 'CS2023011', email: 'manoj@demo.com', phone: '+1-555-0211', department: 'ECE', year: '3', skills: ['Raspberry Pi'], isLeader: false }
      ],
      status: 'APPROVED',
      createdAt: new Date().toISOString(),
      projectDescription: 'Real-time telemedicine device logging blood oxygen levels and pulse rates.',
      problemStatementId: 'ps-health',
      submitted: true,
      evaluations: [
        {
          innovation: 7,
          feasibility: 9,
          presentation: 8,
          technicalDepth: 7,
          aiUsage: 6,
          feedback: 'Very practical and well executed telemetry demo. UI needs polish.',
          judgeEmail: 'judge@college.edu'
        }
      ],
      demo: true
    },
    {
      id: 'team-solar-grid',
      name: 'Solar Grid Dynamics',
      size: 3,
      members: [
        { name: 'Raju G', registerNumber: 'EE2023050', email: 'raju@demo.com', phone: '+1-555-0310', department: 'EEE', year: '3', skills: ['Blockchain', 'Solidity'], isLeader: true }
      ],
      status: 'APPROVED',
      createdAt: new Date().toISOString(),
      projectDescription: 'Decentralized ledger system for clean electricity distribution tokens.',
      problemStatementId: 'ps-energy',
      submitted: true,
      evaluations: [
        {
          innovation: 9,
          feasibility: 7,
          presentation: 7,
          technicalDepth: 9,
          aiUsage: 7,
          feedback: 'High innovation and smart contract design, though deployment is complicated.',
          judgeEmail: 'judge@college.edu'
        }
      ],
      demo: true
    }
  ];

  for (const team of otherTeams) {
    await db.collection('teams').doc(team.id).set(team);
    console.log(`    Seeded Team: ${team.name}`);
  }

  // C. Support Tickets
  const supportTickets = [
    {
      id: 'ticket-wifi-slow',
      teamId: abhishekTeamId,
      teamName: 'Alpha Coders',
      category: 'Internet',
      priority: 'High',
      status: 'Open',
      raisedBy: 'Abhishek Participant',
      description: 'The Wi-Fi in the main seminar hall is dropping connections frequently, delaying our npm installs.',
      createdAt: new Date().toISOString(),
      title: 'Weak Wi-Fi in Seminar Hall',
      demo: true,
    },
    {
      id: 'ticket-power-extension',
      teamId: 'team-iot-innovators',
      teamName: 'IoT Innovators',
      category: 'Power',
      priority: 'Critical',
      status: 'Assigned',
      raisedBy: 'Kavin Kumar',
      assignedTo: volunteerUid,
      description: 'We need an extra extension strip at table 14. We have 3 laptops and 2 microcontrollers but only 1 wall plug.',
      createdAt: new Date().toISOString(),
      title: 'Extra Extension Board Required',
      demo: true,
    }
  ];

  for (const ticket of supportTickets) {
    await db.collection('tickets').doc(ticket.id).set(ticket);
    console.log(`    Seeded Support Ticket: ${ticket.title}`);
  }

  // D. Announcements
  const announcements = [
    {
      id: 'ann-welcome',
      title: 'Welcome to Hack Lab 2026!',
      content: 'Welcome to the annual SIET Hackathon. Please review the rulebook and reach out to volunteers for any power or network issues.',
      type: 'success',
      date: new Date().toISOString(),
      demo: true,
    },
    {
      id: 'ann-judging',
      title: 'Judging Process Explanation',
      content: 'Judges will begin walking around table-by-table starting at 2:00 PM tomorrow. Please have your Github repos and slide decks ready.',
      type: 'info',
      date: new Date().toISOString(),
      demo: true,
    }
  ];

  for (const ann of announcements) {
    await db.collection('announcements').doc(ann.id).set(ann);
    console.log(`    Seeded Announcement: ${ann.title}`);
  }

  // E. Resources
  const resources = [
    {
      id: 'res-react-docs',
      name: 'Next.js 15 App Router Reference',
      type: 'Template',
      description: 'Official styling patterns and route layouts documentation.',
      link: 'https://nextjs.org/docs',
      createdAt: new Date().toISOString(),
      demo: true,
    },
    {
      id: 'res-firebase-rules',
      name: 'Firestore Security Rules Cheat Sheet',
      type: 'Learning',
      description: 'Guide to writing secure path-based queries.',
      link: 'https://firebase.google.com/docs/firestore/security/get-started',
      createdAt: new Date().toISOString(),
      demo: true,
    }
  ];

  for (const res of resources) {
    await db.collection('resources').doc(res.id).set(res);
    console.log(`    Seeded Resource: ${res.name}`);
  }

  console.log('\n' + '─'.repeat(60));
  console.log('🎉  WIPE AND SEED PROCESS COMPLETED SUCCESSFULLY!');
  console.log(`    All databases have been initialized and seeded.`);
  console.log('\n🔑  Standard Test Credentials:');
  console.log('    1. Admin: username=Admin2727, password=9629371790 (email: admin@hacklab.internal)');
  console.log('    2. Organizer: email=organizer@college.edu, password=demo123');
  console.log('    3. Judge: email=judge@college.edu, password=demo123');
  console.log('    4. Volunteer: email=riya@college.edu, password=demo123');
  console.log('    5. Participant: email=abhishek@college.edu, password=demo123');
  console.log('\n');

  process.exit(0);
}

main().catch((e) => {
  console.error('\n❌  Wipe and seed process failed:', e);
  process.exit(1);
});
