import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Use import.meta.glob to optionally import the config file without failing the build if it's missing
const configModules = import.meta.glob('../../firebase-applet-config.json', { eager: true });
const localConfig = Object.values(configModules)[0] as any;

const firebaseConfig = localConfig?.default || {
  // @ts-ignore
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  // @ts-ignore
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  // @ts-ignore
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  // @ts-ignore
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  // @ts-ignore
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  // @ts-ignore
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  // @ts-ignore
  firestoreDatabaseId: import.meta.env.VITE_FIRESTORE_DATABASE_ID || '(default)'
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');
