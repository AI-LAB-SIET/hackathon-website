import { NextRequest, NextResponse } from "next/server";
import { auth as adminAuth, db as adminDb } from "@/lib/firebaseAdmin";

/**
 * POST /api/auth/invite-member
 *
 * Creates a Firebase Auth account for a team member (no password),
 * saves their Firestore profile, and generates a Firebase password
 * setup link so they can access the platform.
 *
 * Called from the onboarding page after team registration.
 * Requires the team leader''s auth token.
 */
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const idToken = authHeader.split(" ")[1];
  let leaderUid: string;
  try {
    const decoded = await adminAuth.verifyIdToken(idToken);
    leaderUid = decoded.uid;
  } catch {
    return NextResponse.json({ error: "Invalid auth token." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, email, registerNumber, phone, department, year, teamId } = body;

    if (!name || !email || !teamId) {
      return NextResponse.json(
        { error: "Missing required fields: name, email, teamId." },
        { status: 400 }
      );
    }

    // 1. Create Firebase Auth account (no password - member sets it via email link)
    let userRecord;
    try {
      userRecord = await adminAuth.createUser({
        email,
        displayName: name,
        emailVerified: false,
      });
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code === "auth/email-already-exists") {
        userRecord = await adminAuth.getUserByEmail(email);
      } else {
        throw err;
      }
    }

    // 2. Create / update Firestore profile
    await adminDb.collection("users").doc(userRecord.uid).set(
      {
        uid: userRecord.uid,
        email,
        displayName: name,
        role: "participant",
        teamId,
        teamSetupDone: true,
        registerNumber: registerNumber ?? "",
        phone: phone ?? "",
        department: department ?? "",
        year: year ?? "",
        invitedBy: leaderUid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    // 3. Generate Firebase password reset link (acts as "Set your password" for new accounts)
    //    Firebase sends this email using the project email infrastructure automatically.
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const resetLink = await adminAuth.generatePasswordResetLink(email, {
      url: `${appUrl}/login`,
    });

    // Log link to console in development so it can be tested without an email service
    console.log(`[Member Invite] Password setup link for ${email}: ${resetLink}`);

    return NextResponse.json({ success: true, uid: userRecord.uid });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to invite member.";
    console.error("Error inviting member:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
