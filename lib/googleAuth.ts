const TOKEN_KEY = 'mada_google_token';
const EXPIRY_KEY = 'mada_google_token_expiry';
const EMAIL_KEY = 'mada_google_email';
const SCOPES = 'https://www.googleapis.com/auth/generative-language';

let tokenClient: any = null;
let gisLoaded = false;

export type GoogleAuthStatus = 'loading' | 'signed-in' | 'signed-out' | 'unavailable';

type Listener = (status: GoogleAuthStatus) => void;
const listeners: Set<Listener> = new Set();

function notify() {
  const status = getStatus();
  listeners.forEach(fn => fn(status));
}

export function subscribe(fn: Listener) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getStatus(): GoogleAuthStatus {
  if (!gisLoaded && !(window as any).google?.accounts?.oauth2) return 'unavailable';
  const token = localStorage.getItem(TOKEN_KEY);
  const expiry = localStorage.getItem(EXPIRY_KEY);
  if (token && expiry && Date.now() < parseInt(expiry) - 60000) return 'signed-in';
  if (token && expiry && Date.now() < parseInt(expiry)) return 'signed-in';
  return 'signed-out';
}

export function getUserEmail(): string | null {
  return localStorage.getItem(EMAIL_KEY);
}

export function getAccessToken(): string | null {
  const token = localStorage.getItem(TOKEN_KEY);
  const expiry = localStorage.getItem(EXPIRY_KEY);
  if (token && expiry && Date.now() < parseInt(expiry)) return token;
  return null;
}

export function initGoogleAuth(clientId: string) {
  if (typeof window === 'undefined') return;
  const checkGoogle = () => {
    if ((window as any).google?.accounts?.oauth2) {
      gisLoaded = true;
      tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: SCOPES,
        callback: (response: any) => {
          if (response.access_token) {
            localStorage.setItem(TOKEN_KEY, response.access_token);
            if (response.expires_in) {
              localStorage.setItem(EXPIRY_KEY, String(Date.now() + response.expires_in * 1000));
            }
          }
          if (response.error) {
            signOut();
          }
          notify();
        },
      });
      notify();
    } else {
      setTimeout(checkGoogle, 200);
    }
  };
  checkGoogle();
}

export function signInWithGoogle(): Promise<string | null> {
  return new Promise((resolve) => {
    if (!tokenClient) {
      resolve(null);
      return;
    }
    notify();
    tokenClient.callback = (response: any) => {
      if (response.access_token) {
        localStorage.setItem(TOKEN_KEY, response.access_token);
        if (response.expires_in) {
          localStorage.setItem(EXPIRY_KEY, String(Date.now() + response.expires_in * 1000));
        }
        notify();
        resolve(response.access_token);
      } else {
        resolve(null);
      }
    };
    tokenClient.requestAccessToken({ prompt: 'consent' });
  });
}

export function signOut() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(EXPIRY_KEY);
  localStorage.removeItem(EMAIL_KEY);
  notify();
}
