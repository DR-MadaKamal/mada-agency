import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, collection, doc, getDoc, setDoc, onSnapshot, query, orderBy, limit, addDoc, serverTimestamp, getDocFromServer } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

export async function signIn() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result;
  } catch (error: any) {
    console.error("Auth Error:", error);
    if (error.code === 'auth/popup-closed-by-user') {
      alert("The login popup was closed before completion. If this keeps happening, please try opening the application in a new tab using the 'Open in new tab' button in the AI Studio header.");
    } else if (error.code === 'auth/cancelled-popup-request') {
      // Ignore this, it's usually secondary
    } else {
      alert("Login failed: " + error.message);
    }
    throw error;
  }
}

export function signOut() {
  return auth.signOut();
}

// Test connection as required
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
testConnection();

// Error handler helper
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Sanitizes an object by removing undefined fields recursively.
 */
export const sanitizeData = (data: any): any => {
    if (data === null || typeof data !== 'object') {
        return data === undefined ? null : data;
    }

    if (Array.isArray(data)) {
        return data.map(v => sanitizeData(v));
    }

    const clean: any = {};
    Object.keys(data).forEach(key => {
        const val = data[key];
        if (val !== undefined) {
            clean[key] = sanitizeData(val);
        }
    });
    return clean;
};
