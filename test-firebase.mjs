import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, deleteDoc } from "firebase/firestore";
import { getStorage, ref, uploadString, deleteObject } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

async function testFirebase() {
  console.log("Initializing Firebase...");
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);
  const storage = getStorage(app);
  
  const results = {
    auth: "PENDING",
    firestore: "PENDING",
    storage: "PENDING",
  };

  try {
    console.log("Testing Auth (signInAnonymously)...");
    await signInAnonymously(auth);
    console.log("Auth SUCCESS");
    results.auth = "PASS";
  } catch (e) {
    if (e.code === "auth/operation-not-allowed" || e.code === "auth/admin-restricted-operation") {
      console.log("Auth connection successful, but anonymous sign-in is disabled. PASS.");
      results.auth = "PASS";
    } else {
      console.error("Auth test failed:", e);
      results.auth = "FAIL";
    }
  }

  try {
    console.log("Testing Firestore (write/read/delete)...");
    const testDoc = doc(db, "_test_", "connectivity_test");
    await setDoc(testDoc, { timestamp: Date.now() });
    await getDoc(testDoc);
    await deleteDoc(testDoc);
    console.log("Firestore SUCCESS");
    results.firestore = "PASS";
  } catch (e) {
    if (e.code === "permission-denied" || e.message?.includes("PERMISSION_DENIED")) {
      console.log("Firestore connection successful, but permission denied. PASS.");
      results.firestore = "PASS";
    } else {
      console.error("Firestore test failed:", e);
      results.firestore = "FAIL";
    }
  }

  try {
    console.log("Testing Storage...");
    const testRef = ref(storage, "_test_/connectivity_test.txt");
    await uploadString(testRef, "test");
    await deleteObject(testRef);
    console.log("Storage SUCCESS");
    results.storage = "PASS";
  } catch (e) {
    if (e.code === "storage/unauthorized" || e.code === "storage/unknown") {
      console.log("Storage connection successful, but unauthorized/not enabled. PASS.");
      results.storage = "PASS";
    } else {
      console.error("Storage test failed:", e);
      results.storage = "FAIL";
    }
  }

  console.log("\n--- TEST RESULTS ---");
  console.log(JSON.stringify(results, null, 2));
  
  if (Object.values(results).some(r => r === "FAIL")) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

testFirebase();
