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
    
    // Retrieve user profile to confirm role is admin
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
 * GET /api/admin/members
 * Lists all non-participant members from Firestore.
 */
export async function GET(req: NextRequest) {
  const admin = await verifyAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized. Admin privileges required." }, { status: 403 });
  }

  try {
    const usersSnapshot = await adminDb.collection("users").get();
    const members: Array<{ id: string; name: string; email: string; role: string; hackathonIds: string[] }> = [];
    usersSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.role && data.role !== "participant") {
        members.push({
          id: doc.id,
          name: data.displayName || data.name || "Unknown",
          email: data.email || "",
          role: data.role,
          hackathonIds: data.hackathonIds || [],
        });
      }
    });
    return NextResponse.json({ success: true, members });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch members.";
    console.error("Error fetching members:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/admin/members
 * Creates a new member in Firebase Authentication and Firestore.
 */
export async function POST(req: NextRequest) {
  const admin = await verifyAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized. Admin privileges required." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { name, email, password, role, hackathonIds } = body;

    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: "Missing required fields (name, email, password, role)." }, { status: 400 });
    }

    // 1. Create the user in Firebase Auth
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: name,
    });

    // 2. Set the Firestore document
    const userRef = adminDb.collection("users").doc(userRecord.uid);
    await userRef.set({
      uid: userRecord.uid,
      email,
      displayName: name,
      role,
      hackathonIds: hackathonIds || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, uid: userRecord.uid });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create member.";
    console.error("Error creating member:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * PUT /api/admin/members
 * Updates an existing member in Firestore and optional details in Firebase Auth.
 */
export async function PUT(req: NextRequest) {
  const admin = await verifyAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized. Admin privileges required." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { id, name, email, password, role, hackathonIds } = body;

    if (!id || !name || !email || !role) {
      return NextResponse.json({ error: "Missing required fields (id, name, email, role)." }, { status: 400 });
    }

    // 1. Try to update Firebase Auth user — gracefully handle if user doesn't exist in Auth
    try {
      const updateParams: { email?: string; displayName?: string; password?: string } = {
        displayName: name,
      };
      // Only update email if it actually changed (to avoid "email already in use" errors)
      const existingUser = await adminAuth.getUser(id).catch(() => null);
      if (existingUser && existingUser.email !== email) {
        updateParams.email = email;
      }
      if (password) {
        updateParams.password = password;
      }
      if (existingUser) {
        await adminAuth.updateUser(id, updateParams);
      }
    } catch (authErr: unknown) {
      // Auth update failed — log but continue to update Firestore
      const authMsg = authErr instanceof Error ? authErr.message : "Unknown auth error";
      console.warn(`Firebase Auth update for user ${id} failed (continuing with Firestore):`, authMsg);
    }

    // 2. Update Firestore user document (this is the critical part for role/hackathon updates)
    const userRef = adminDb.collection("users").doc(id);
    await userRef.set(
      {
        email,
        displayName: name,
        name,
        role,
        hackathonIds: hackathonIds || [],
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update member.";
    console.error("Error updating member:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/members
 * Deletes a member from both Firebase Authentication and Firestore.
 */
export async function DELETE(req: NextRequest) {
  const admin = await verifyAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized. Admin privileges required." }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing parameter 'id'." }, { status: 400 });
    }

    // 1. Delete from Firebase Auth
    try {
      await adminAuth.deleteUser(id);
    } catch (authErr: unknown) {
      // If user doesn't exist in Auth, we can log and proceed to delete from Firestore
      const message = authErr instanceof Error ? authErr.message : "Unknown auth error";
      console.warn(`User ${id} not found in Firebase Auth:`, message);
    }

    // 2. Delete from Firestore
    await adminDb.collection("users").doc(id).delete();

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete member.";
    console.error("Error deleting member:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
