import fs from 'fs';
import path from 'path';
import { Account } from '@/types';

const DATA_DIR = path.join(process.cwd(), 'data');
const ACCOUNTS_FILE = path.join(DATA_DIR, 'accounts.json');

function ensureDataDirectory() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(ACCOUNTS_FILE)) {
    fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify([], null, 2), 'utf-8');
  }
}

export function getAllAccounts(): Account[] {
  ensureDataDirectory();
  try {
    const raw = fs.readFileSync(ACCOUNTS_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed to read accounts.json:', err);
    return [];
  }
}

export function saveAllAccounts(accounts: Account[]): void {
  ensureDataDirectory();
  fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(accounts, null, 2), 'utf-8');
}

export function getAccountByEmail(email: string): Account | undefined {
  const normalized = email.trim().toLowerCase();
  const accounts = getAllAccounts();
  return accounts.find(
    (acc) => acc.email.trim().toLowerCase() === normalized
  );
}

export function saveOrUpdateAccount(accountData: Omit<Account, 'id' | 'createdAt'> & { id?: string }): Account {
  const accounts = getAllAccounts();
  const normalizedEmail = accountData.email.trim().toLowerCase();
  const existingIndex = accounts.findIndex(
    (acc) => (accountData.id && acc.id === accountData.id) || acc.email.trim().toLowerCase() === normalizedEmail
  );

  const now = new Date().toISOString();

  if (existingIndex >= 0) {
    const updated: Account = {
      ...accounts[existingIndex],
      ...accountData,
      email: normalizedEmail,
      id: accounts[existingIndex].id,
    };
    accounts[existingIndex] = updated;
    saveAllAccounts(accounts);
    return updated;
  } else {
    const newAccount: Account = {
      ...accountData,
      id: accountData.id || `acc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      email: normalizedEmail,
      createdAt: now,
      status: 'untested',
    };
    accounts.unshift(newAccount);
    saveAllAccounts(accounts);
    return newAccount;
  }
}

export function deleteAccountById(id: string): boolean {
  const accounts = getAllAccounts();
  const filtered = accounts.filter((acc) => acc.id !== id && acc.email !== id);
  if (filtered.length !== accounts.length) {
    saveAllAccounts(filtered);
    return true;
  }
  return false;
}

export function updateAccountStatus(idOrEmail: string, status: 'healthy' | 'error', error?: string): void {
  const accounts = getAllAccounts();
  const target = accounts.find((acc) => acc.id === idOrEmail || acc.email.toLowerCase() === idOrEmail.toLowerCase());
  if (target) {
    target.status = status;
    target.lastCheckedAt = new Date().toISOString();
    target.lastError = error || undefined;
    saveAllAccounts(accounts);
  }
}

/**
 * Parses raw text containing accounts in multiple formats:
 * - email:password
 * - email:app_password
 * - email,password
 * - email<tab>password
 * - email|password
 * - email:password:label
 */
export function parseBulkAccounts(rawText: string): Array<{ email: string; password: string; label?: string }> {
  const lines = rawText.split(/\r?\n/);
  const results: Array<{ email: string; password: string; label?: string }> = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#') || line.startsWith('//')) {
      continue;
    }

    // Split on common delimiters: :, ,, tab, |, ;
    // We prioritize colon ':' as standard combo format
    let parts: string[] = [];
    if (line.includes(':')) {
      parts = line.split(':');
    } else if (line.includes(',')) {
      parts = line.split(',');
    } else if (line.includes('\t')) {
      parts = line.split('\t');
    } else if (line.includes('|')) {
      parts = line.split('|');
    } else if (line.includes(';')) {
      parts = line.split(';');
    }

    if (parts.length >= 2) {
      const email = parts[0].trim();
      const password = parts[1].trim();
      const label = parts[2]?.trim();

      if (email.includes('@') && password) {
        results.push({ email, password, label });
      }
    }
  }

  return results;
}
