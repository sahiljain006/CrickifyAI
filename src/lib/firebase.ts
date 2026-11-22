import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  browserLocalPersistence,
  getAuth,
  GoogleAuthProvider,
  setPersistence,
  signInWithPopup,
  signOut,
  User,
} from 'firebase/auth';
import { doc, getDocFromServer, getFirestore } from 'firebase/firestore';
import { getDownloadURL, getStorage, ref, uploadBytesResumable } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';

const hasValidConfig =
  Boolean(firebaseConfig?.projectId) &&
  firebaseConfig.projectId !== 'remixed-project-id' &&
  Boolean(firebaseConfig?.apiKey);

export const isFirebaseConfigured: boolean = hasValidConfig;

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
// CRITICAL: Pass the named firestoreDatabaseId provisioned for this applet
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);
export const storage = firebaseConfig.storageBucket ? getStorage(app) : null;

// Persist Google sign-in across refreshes and browser tabs
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.warn('[Firebase Auth] Failed to set local persistence:', err);
});

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration. Firestore client is offline.');
      return false;
    }
    return true;
  }
}

export interface AuthUserSummary {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  provider: string;
  emailVerified: boolean;
}

export function extractAuthUserSummary(user: User | null): AuthUserSummary | null {
  if (!user) return null;
  const displayName =
    (user.displayName && user.displayName.trim()) ||
    (user.email ? user.email.split('@')[0] : 'Cricketer');
  const provider = user.providerData?.[0]?.providerId || 'google.com';

  return {
    id: user.uid,
    email: user.email || '',
    displayName,
    avatarUrl: user.photoURL || undefined,
    provider,
    emailVerified: Boolean(user.emailVerified),
  };
}

export interface GoogleSignInResult {
  user: AuthUserSummary | null;
  error: string | null;
  errorCode?: string;
  unauthorizedHostname?: string;
}

export function getCurrentBrowserHostname(): string {
  if (typeof window === 'undefined' || !window.location?.hostname) {
    return '';
  }
  return window.location.hostname;
}

export async function signInWithGoogle(): Promise<GoogleSignInResult> {
  if (!isFirebaseConfigured) {
    return {
      user: null,
      error: 'Firebase is not configured yet for this workspace. Please complete Firebase setup first.',
    };
  }
  try {
    const cred = await signInWithPopup(auth, googleProvider);
    return {
      user: extractAuthUserSummary(cred.user),
      error: null,
    };
  } catch (err) {
    const code = (err as { code?: string })?.code || '';
    if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
      return {
        user: null,
        errorCode: code,
        error: 'Google sign-in was cancelled. You can try again or continue as Guest.',
      };
    }
    if (code === 'auth/popup-blocked') {
      return {
        user: null,
        errorCode: code,
        error: 'Your browser blocked the Google sign-in popup. Please allow popups for this site and retry.',
      };
    }
    if (code === 'auth/unauthorized-domain') {
      const hostname = getCurrentBrowserHostname();
      return {
        user: null,
        errorCode: code,
        unauthorizedHostname: hostname || undefined,
        error: hostname
          ? `This preview domain (${hostname}) is not yet authorized in Firebase Authentication > Settings > Authorized domains. Add "${hostname}" manually in Firebase Console (${firebaseConfig.projectId}) or continue as Guest.`
          : 'This domain is not yet authorized in Firebase Authentication > Settings > Authorized domains. Add this preview domain manually in Firebase Console or continue as Guest.',
      };
    }
    return {
      user: null,
      errorCode: code || undefined,
      error: err instanceof Error ? err.message : 'Unable to complete Google sign-in.',
    };
  }
}

export async function signOutAccount(): Promise<void> {
  await signOut(auth);
}

export async function getAuthIdToken(): Promise<string | null> {
  if (!auth.currentUser) return null;
  try {
    return await auth.currentUser.getIdToken();
  } catch {
    return null;
  }
}

export async function authFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const token = await getAuthIdToken();
  const headers = new Headers(init.headers || {});
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return fetch(input, {
    ...init,
    headers,
  });
}

export interface ProfilePhotoUploadResult {
  downloadUrl: string | null;
  storageAvailable: boolean;
  error: string | null;
}

export async function uploadProfilePhotoToStorage(
  uid: string,
  blob: Blob,
  onProgress?: (pct: number) => void
): Promise<ProfilePhotoUploadResult> {
  if (!isFirebaseConfigured || !storage) {
    return {
      downloadUrl: null,
      storageAvailable: false,
      error: 'Firebase Storage is not configured in this workspace.',
    };
  }

  const objectRef = ref(storage, `users/${uid}/profile/avatar_${Date.now()}.jpg`);

  return await new Promise<ProfilePhotoUploadResult>((resolve) => {
    const task = uploadBytesResumable(objectRef, blob, {
      contentType: 'image/jpeg',
      cacheControl: 'public,max-age=3600',
    });

    const timeoutHandle = window.setTimeout(() => {
      try {
        task.cancel();
      } catch {
        // ignore cancel error
      }
      resolve({
        downloadUrl: null,
        storageAvailable: false,
        error:
          'Firebase Storage upload timed out or the storage bucket is not yet enabled on this Starter project.',
      });
    }, 15000);

    task.on(
      'state_changed',
      (snapshot) => {
        if (snapshot.totalBytes > 0 && onProgress) {
          onProgress(Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100));
        }
      },
      (err) => {
        window.clearTimeout(timeoutHandle);
        const code = (err as { code?: string })?.code || '';
        const msg = err instanceof Error ? err.message : String(err);
        const isBucketMissing =
          code.includes('bucket-not-found') ||
          code.includes('object-not-found') ||
          code.includes('unauthorized') ||
          msg.includes('404') ||
          msg.toLowerCase().includes('not found');

        resolve({
          downloadUrl: null,
          storageAvailable: !isBucketMissing,
          error: isBucketMissing
            ? 'Cloud photo upload could not complete because Firebase Storage is not enabled on this Starter project yet. Your cropped preview is kept locally on this device, and your Google photo remains synced.'
            : msg || 'Unable to upload profile photo right now.',
        });
      },
      async () => {
        window.clearTimeout(timeoutHandle);
        try {
          const url = await getDownloadURL(task.snapshot.ref);
          resolve({
            downloadUrl: url,
            storageAvailable: true,
            error: null,
          });
        } catch (err) {
          resolve({
            downloadUrl: null,
            storageAvailable: false,
            error: err instanceof Error ? err.message : 'Uploaded file URL could not be retrieved.',
          });
        }
      }
    );
  });
}
