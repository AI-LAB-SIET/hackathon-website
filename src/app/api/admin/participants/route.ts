import { NextRequest, NextResponse } from "next/server";
import { auth as adminAuth, db as adminDb } from "@/lib/firebaseAdmin";

/**
 * Helper to verify that the request comes from a logged-in Admin.
 */
async function verifyAdmin(req: NextRequest): Promise<{ uid: string } | null> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const idToken = authHeader.split(" ")[1];
  if (!idToken || idToken === "undefined" || idToken === "null") {
    return null;
  }
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;
    const userDoc = await adminDb.collection("users").doc(uid).get();
    if (!userDoc.exists || userDoc.data()?.role !== "admin") {
      return null;
    }
    return { uid };
  } catch (error) {
    console.error("Token verification failed:", error);
    return null;
  }
}

/**
 * DELETE /api/admin/participants?uid=<uid>&email=<email>
 *
 * Cascading deletion of a participant:
 *   1. Delete from Firebase Authentication
 *   2. Delete from Firestore `users` collection
 *   3. Remove the participant from any `teams` they belong to
 *   4. Delete all `foodTokens` belonging to the participant
 *   5. Delete `teamRequests` sent or received by this participant
 */
export async function DELETE(req: NextRequest) {
  const admin = await verifyAdmin(req);
  if (!admin) {
    return NextResponse.json(
      { error: "Unauthorized. Admin privileges required." },
      { status: 403 }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const uid = searchParams.get("uid");
    const email = searchParams.get("email");

    if (!uid && !email) {
      return NextResponse.json(
        { error: "Missing parameter: 'uid' or 'email' is required." },
        { status: 400 }
      );
    }

    // Resolve email from Firestore if not provided
    let userEmail = email;
    if (uid && !userEmail) {
      const userDoc = await adminDb.collection("users").doc(uid).get();
      if (userDoc.exists) {
        userEmail = userDoc.data()?.email ?? null;
      }
    }

    // Resolve uid from Firestore if not provided
    let resolvedUid = uid;
    if (!resolvedUid && userEmail) {
      const snap = await adminDb.collection("users").where("email", "==", userEmail).limit(1).get();
      if (!snap.empty) {
        resolvedUid = snap.docs[0].id;
      }
    }

    const batch = adminDb.batch();

    // Step 1: Delete from Firebase Authentication
    if (resolvedUid) {
      try {
        await adminAuth.deleteUser(resolvedUid);
      } catch (authErr: unknown) {
        const msg = authErr instanceof Error ? authErr.message : "Unknown";
        console.warn(`[participant-delete] Auth delete for uid ${resolvedUid} skipped:`, msg);
      }
    }

    // Step 2: Delete from Firestore `users` collection
    if (resolvedUid) {
      batch.delete(adminDb.collection("users").doc(resolvedUid));
    }

    // Step 3: Remove participant from any team's members array
    if (userEmail) {
      const normalizedEmail = userEmail.toLowerCase();
      const teamsSnap = await adminDb.collection("teams").get();
      teamsSnap.forEach((teamDoc) => {
        const data = teamDoc.data();
        const members: Array<{ email: string }> = data.members ?? [];
        const isMember = members.some(
          (m) => (m.email ?? "").toLowerCase() === normalizedEmail
        );
        if (isMember) {
          const updatedMembers = members.filter(
            (m) => (m.email ?? "").toLowerCase() !== normalizedEmail
          );
          batch.update(teamDoc.ref, {
            members: updatedMembers,
            size: updatedMembers.length,
          });
        }
      });
    }

    // Step 4: Delete food tokens belonging to this participant (by email)
    if (userEmail) {
      const tokensSnap = await adminDb
        .collection("foodTokens")
        .where("participantEmail", "==", userEmail)
        .get();
      tokensSnap.forEach((d) => batch.delete(d.ref));
    }
    // Also try by uid (for older records)
    if (resolvedUid) {
      const tokensByUidSnap = await adminDb
        .collection("foodTokens")
        .where("participantId", "==", resolvedUid)
        .get();
      tokensByUidSnap.forEach((d) => batch.delete(d.ref));
    }

    // Step 5: Delete teamRequests involving this participant
    if (resolvedUid) {
      const sentSnap = await adminDb
        .collection("teamRequests")
        .where("fromUserId", "==", resolvedUid)
        .get();
      sentSnap.forEach((d) => batch.delete(d.ref));
    }
    if (userEmail) {
      const inviteSnap = await adminDb
        .collection("teamRequests")
        .where("toEmail", "==", userEmail)
        .get();
      inviteSnap.forEach((d) => batch.delete(d.ref));
    }

    // Commit all Firestore deletions atomically
    await batch.commit();

    return NextResponse.json({
      success: true,
      message: "Participant and all related data deleted successfully.",
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to delete participant.";
    console.error("[participant-delete] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
