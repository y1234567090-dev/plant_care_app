/**
 * Browser-only demo authentication.
 *
 * Accounts and the signed-in session live in this browser's localStorage, so
 * this is a convenience gate for the demo, not real security. Passwords are
 * stored as salted SHA-256 hashes, never as plain text. For real sign-in on
 * Azure Static Web Apps, use its built-in authentication (/.auth/login/...).
 */

export interface AuthUser {
  name: string;
  email: string;
}

interface StoredAccount {
  name: string;
  email: string;
  salt: string;
  hash: string;
}

const SESSION_KEY = 'plant_care_session_v1';
const ACCOUNTS_KEY = 'plant_care_accounts_v1';

export const DEMO_USER: AuthUser = { name: 'Demo Gardener', email: 'demo@plantcare.app' };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function readAccounts(): StoredAccount[] {
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // Treat unreadable storage as "no accounts yet"
  }
  return [];
}

function writeAccounts(accounts: StoredAccount[]): void {
  try {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
  } catch {
    throw new Error('This browser blocked saving your account. Allow site storage and try again.');
  }
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function hashPassword(password: string, salt: string): Promise<string> {
  if (!globalThis.crypto?.subtle) {
    throw new Error('Sign-in needs a secure (https) connection.');
  }
  const data = new TextEncoder().encode(`${salt}:${password}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return toHex(new Uint8Array(digest));
}

function newSalt(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return toHex(bytes);
}

export function validateEmail(email: string): string | null {
  return EMAIL_PATTERN.test(email.trim()) ? null : 'Enter a valid email address.';
}

export function validatePassword(password: string): string | null {
  return password.length >= 6 ? null : 'Use at least 6 characters.';
}

export async function createAccount(
  name: string,
  email: string,
  password: string
): Promise<AuthUser> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanName = name.trim();
  const accounts = readAccounts();
  if (accounts.some((a) => a.email === cleanEmail)) {
    throw new Error('An account with this email already exists. Try signing in instead.');
  }
  const salt = newSalt();
  const hash = await hashPassword(password, salt);
  writeAccounts([...accounts, { name: cleanName, email: cleanEmail, salt, hash }]);
  return { name: cleanName, email: cleanEmail };
}

export async function signIn(email: string, password: string): Promise<AuthUser> {
  const cleanEmail = email.trim().toLowerCase();
  const account = readAccounts().find((a) => a.email === cleanEmail);
  const failure = new Error('Email or password is incorrect.');
  if (!account) throw failure;
  const hash = await hashPassword(password, account.salt);
  if (hash !== account.hash) throw failure;
  return { name: account.name, email: account.email };
}

export function loadSession(): AuthUser | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.name === 'string' && typeof parsed.email === 'string') {
        return { name: parsed.name, email: parsed.email };
      }
    }
  } catch {
    // No saved session
  }
  return null;
}

export function saveSession(user: AuthUser): void {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  } catch {
    // The session just won't survive a reload
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    // Nothing to clear
  }
}
