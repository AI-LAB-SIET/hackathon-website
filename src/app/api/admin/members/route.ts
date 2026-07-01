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

    // 1. Update Firebase Auth user
    const updateParams: { email: string; displayName: string; password?: string } = {
      email,
      displayName: name,
    };
    if (password) {
      updateParams.password = password;
    }
    await adminAuth.updateUser(id, updateParams);

    // 2. Update Firestore user document
    const userRef = adminDb.collection("users").doc(id);
    await userRef.set(
      {
        email,
        displayName: name,
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
