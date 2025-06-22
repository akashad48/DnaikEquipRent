
import { initializeApp, getApp, getApps, type FirebaseOptions } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';

let db: Firestore | null = null;
let firebaseInitialized = false;

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// We only initialize Firebase if the essential config is available.
// This prevents the app from crashing on the server if env vars are missing.
if (firebaseConfig.projectId && firebaseConfig.apiKey) {
  try {
    let app;
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApp();
    }
    db = getFirestore(app);
    firebaseInitialized = true;
  } catch (error) {
    console.error("!!! Firebase initialization failed:", error);
    // Keep db as null and firebaseInitialized as false to be caught by the UI.
  }
} else {
    // This block runs on the server during startup if env vars are missing
    if (typeof window === 'undefined') {
        console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
        console.log('!!! FIREBASE WARNING: CONFIGURATION IS MISSING OR INCOMPLETE !!!');
        console.log('!!! Missing NEXT_PUBLIC_FIREBASE_PROJECT_ID or other variables.');
        console.log('!!! Check your .env.local file and apphosting.yaml settings.');
        console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
    }
}

export { db, firebaseInitialized };
