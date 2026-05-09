// lib/firebase-client.ts (Updated)
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup,
  getIdToken as firebaseGetIdToken,
  setPersistence,
  browserLocalPersistence
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

// Initialize Firebase only once
let authInstance: any = null;
let googleProviderInstance: any = null;

// Singleton pattern to prevent double initialization
if (!getApps().length) {
  const app = initializeApp(firebaseConfig);
  authInstance = getAuth(app);
  googleProviderInstance = new GoogleAuthProvider();
  
  // Set persistence to LOCAL to stay logged in
  setPersistence(authInstance, browserLocalPersistence);
  
  // Add scopes for better user data
  googleProviderInstance.addScope('email');
  googleProviderInstance.addScope('profile');
} else {
  const app = getApp();
  authInstance = getAuth(app);
  googleProviderInstance = new GoogleAuthProvider();
}

// Export getIdToken function
const getIdToken = async (user: any): Promise<string> => {
  if (!user) throw new Error('No user provided');
  return await firebaseGetIdToken(user);
};

export { 
  authInstance as auth, 
  googleProviderInstance as googleProvider, 
  signInWithPopup, 
  getIdToken 
};
