// lib/firebase-client.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup,
  getIdToken as firebaseGetIdToken,
  setPersistence,
  browserLocalPersistence,
  connectAuthEmulator
} from 'firebase/auth';

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyB0NdjufGB1TOg7bEfVRA1rLTj-2QAAy0I",
  authDomain: "vendorcity-83cb8.firebaseapp.com",
  projectId: "vendorcity-83cb8",
  storageBucket: "vendorcity-83cb8.firebasestorage.app",
  messagingSenderId: "771013737949",
  appId: "1:771013737949:web:7f47550098810c7e2a4a34",
  measurementId: "G-RCRTG9EQM9"
};

// Initialize Firebase ONLY ONCE
let app;
let auth;
let googleProvider;

// Check if we're in browser environment
const isBrowser = typeof window !== 'undefined';

if (isBrowser && !getApps().length) {
  try {
    console.log('🔥 Initializing Firebase...');
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    
    // Set persistence to LOCAL
    setPersistence(auth, browserLocalPersistence)
      .then(() => console.log('✅ Firebase persistence set to LOCAL'))
      .catch((error) => console.error('❌ Persistence error:', error));
    
    googleProvider = new GoogleAuthProvider();
    googleProvider.addScope('email');
    googleProvider.addScope('profile');
    
    // Set custom parameters for better popup handling
    googleProvider.setCustomParameters({
      prompt: 'select_account'
    });
    
    console.log('✅ Firebase initialized successfully');
  } catch (error) {
    console.error('❌ Firebase initialization error:', error);
  }
} else if (isBrowser && getApps().length) {
  // Use existing app
  app = getApp();
  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();
  console.log('✅ Using existing Firebase instance');
}

// Export getIdToken function with error handling
const getIdToken = async (user: any): Promise<string> => {
  if (!user) throw new Error('No user provided');
  try {
    const token = await firebaseGetIdToken(user);
    return token;
  } catch (error) {
    console.error('Error getting ID token:', error);
    throw error;
  }
};

export { 
  auth, 
  googleProvider, 
  signInWithPopup, 
  getIdToken 
};
