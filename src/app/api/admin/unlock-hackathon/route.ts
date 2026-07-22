import { NextResponse } from 'next/server';
import { db as adminDb } from '@/lib/firebaseAdmin';

export async function GET() {
  try {
    // List all hackathons
    const snapshot = await adminDb.collection('hackathons').get();
    const hackathons = snapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name,
      teamsLocked: doc.data().teamsLocked,
      status: doc.data().status,
    }));

    // Find HACKSPRINT'26
    const target = snapshot.docs.find(doc =>
      (doc.data().name || '').toUpperCase().includes('HACKSPRINT')
    );

    if (!target) {
      return NextResponse.json({ error: 'HACKSPRINT hackathon not found', hackathons });
    }

    // Unlock it
    await adminDb.collection('hackathons').doc(target.id).update({ teamsLocked: false });

    return NextResponse.json({
      success: true,
      unlocked: { id: target.id, name: target.data().name },
      allHackathons: hackathons,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
