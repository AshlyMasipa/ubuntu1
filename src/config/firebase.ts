import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { getMessaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyDtJjx3hjXc9kIwMm9TAWkazFeqTbquV-Y",
  authDomain: "ubuntu-4098f.firebaseapp.com",
  projectId: "ubuntu-4098f",
  storageBucket: "ubuntu-4098f.firebasestorage.app",
  messagingSenderId: "934346932914",
  appId: "1:934346932914:web:7f2b46f5bd832537dfffab"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);
export const messaging = getMessaging(app);

export default app;