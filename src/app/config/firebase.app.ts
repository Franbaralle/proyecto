import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from './firebase.config';

const firebaseApp = initializeApp(firebaseConfig);

export const firestoreDb = getFirestore(firebaseApp);
export const firebaseAuth = getAuth(firebaseApp);
