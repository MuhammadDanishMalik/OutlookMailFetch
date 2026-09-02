/**
 * Microsoft OAuth2 helper for IMAP XOAUTH2 authentication.
 *
 * Required env vars (set in .env.local):
 *   MS_CLIENT_ID     – Azure App Registration client ID
 *   MS_CLIENT_SECRET – Azure App Registration client secret
 *   MS_REDIRECT_URI  – e.g. http://localhost:3005/api/auth/microsoft/callback
 */

const MS_AUTHORITY = 'https://login.microsoftonline.com/consumers'; // consumer accounts
const MS_TOKEN_URL = `${MS_AUTHORITY}/oauth2/v2.0/token`;
const MS_AUTH_URL = `${MS_AUTHORITY}/oauth2/v2.0/authorize`;

// Scopes needed for IMAP access
const SCOPES = [
  'https://outlook.office365.com/IMAP.AccessAsUser.All',
  'offline_access',           // gives us a refresh_token
  'openid',
  'email',
];

export function getMsClientId(): string {
  return process.env.MS_CLIENT_ID || '';
}

function getMsClientSecret(): string {
  return process.env.MS_CLIENT_SECRET || '';
}

export function getMsRedirectUri(): string {
  return process.env.MS_REDIRECT_URI || 'http://localhost:3005/api/auth/microsoft/callback';
}

/**
 * Build the Microsoft OAuth2 authorization URL that the user opens in their browser.
 */
export function buildAuthorizationUrl(state?: string): string {
  const params = new URLSearchParams({
    client_id: getMsClientId(),
    response_type: 'code',
    redirect_uri: getMsRedirectUri(),
    response_mode: 'query',
    scope: SCOPES.join(' '),
    prompt: 'select_account',
    ...(state ? { state } : {}),
  });
  return `${MS_AUTH_URL}?${params.toString()}`;
}

export interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;       // seconds
  token_type: string;
  scope: string;
  id_token?: string;
}

/**
 * Exchange an authorization code for tokens.
 */
export async function exchangeCodeForTokens(code: string): Promise<TokenResponse> {
  const body = new URLSearchParams({
    client_id: getMsClientId(),
    client_secret: getMsClientSecret(),
    code,
    redirect_uri: getMsRedirectUri(),
    grant_type: 'authorization_code',
    scope: SCOPES.join(' '),
  });

  const res = await fetch(MS_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Token exchange failed (${res.status}): ${errText}`);
  }

  return res.json();
}

/**
 * Refresh an expired access token using a refresh_token.
 */
export async function refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
  const body = new URLSearchParams({
    client_id: getMsClientId(),
    client_secret: getMsClientSecret(),
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
    scope: SCOPES.join(' '),
  });

  const res = await fetch(MS_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Token refresh failed (${res.status}): ${errText}`);
  }

  return res.json();
}

/**
 * Decode the email address from a JWT id_token (basic decode, no verification).
 */
export function extractEmailFromIdToken(idToken: string): string | null {
  try {
    const payload = JSON.parse(
      Buffer.from(idToken.split('.')[1], 'base64').toString('utf-8')
    );
    return payload.email || payload.preferred_username || payload.upn || null;
  } catch {
    return null;
  }
}
