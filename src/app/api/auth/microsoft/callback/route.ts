import { NextRequest, NextResponse } from 'next/server';
import {
  exchangeCodeForTokens,
  extractEmailFromIdToken,
} from '@/lib/microsoft-oauth';
import { saveOrUpdateAccount, getAccountByEmail } from '@/lib/storage';

/**
 * GET /api/auth/microsoft/callback?code=...&state=...
 * Handles the redirect back from Microsoft after user consent.
 * Exchanges the code for tokens, saves them to the account vault,
 * then redirects the user back to the main app.
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');
  const errorDescription = url.searchParams.get('error_description');

  if (error) {
    const baseUrl = url.origin;
    return NextResponse.redirect(
      `${baseUrl}/?oauth_error=${encodeURIComponent(errorDescription || error)}`
    );
  }

  if (!code) {
    return NextResponse.json(
      { success: false, error: 'No authorization code received' },
      { status: 400 }
    );
  }

  try {
    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code);

    // Extract email from id_token
    let email = '';
    if (tokens.id_token) {
      email = extractEmailFromIdToken(tokens.id_token) || '';
    }

    if (!email) {
      // Fallback: try to get email from Microsoft Graph
      try {
        const meRes = await fetch('https://graph.microsoft.com/v1.0/me', {
          headers: { Authorization: `Bearer ${tokens.access_token}` },
        });
        if (meRes.ok) {
          const meData = await meRes.json();
          email = meData.mail || meData.userPrincipalName || '';
        }
      } catch {
        // ignore
      }
    }

    if (!email) {
      const baseUrl = url.origin;
      return NextResponse.redirect(
        `${baseUrl}/?oauth_error=${encodeURIComponent('Could not determine email address from Microsoft account')}`
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    // Save or update account with OAuth tokens
    const existing = getAccountByEmail(normalizedEmail);

    saveOrUpdateAccount({
      ...(existing || {}),
      id: existing?.id,
      email: normalizedEmail,
      password: existing?.password || 'oauth2',
      provider: 'outlook',
      label: existing?.label || '',
      status: 'healthy',
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || existing?.refreshToken || '',
      tokenExpiresAt: expiresAt,
    });

    const baseUrl = url.origin;
    return NextResponse.redirect(
      `${baseUrl}/?oauth_success=${encodeURIComponent(normalizedEmail)}`
    );
  } catch (err: any) {
    console.error('OAuth callback error:', err);
    const baseUrl = url.origin;
    return NextResponse.redirect(
      `${baseUrl}/?oauth_error=${encodeURIComponent(err?.message || 'OAuth token exchange failed')}`
    );
  }
}
