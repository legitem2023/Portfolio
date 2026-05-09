import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup,
  getIdToken as firebaseGetIdToken
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

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Export getIdToken function
const getIdToken = async (user: any): Promise<string> => {
  if (!user) throw new Error('No user provided');
  return await firebaseGetIdToken(user);
};

export { auth, googleProvider, signInWithPopup, getIdToken };
