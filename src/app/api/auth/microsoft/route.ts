import { NextResponse } from 'next/server';
import { buildAuthorizationUrl, getMsClientId } from '@/lib/microsoft-oauth';

/**
 * GET /api/auth/microsoft
 * Redirects the user to Microsoft's OAuth2 consent screen.
 */
export async function GET() {
  const clientId = getMsClientId();

  if (!clientId) {
    return NextResponse.json(
      {
        success: false,
        error:
          'Microsoft OAuth is not configured. Please set MS_CLIENT_ID, MS_CLIENT_SECRET, and MS_REDIRECT_URI in your .env.local file.',
      },
      { status: 500 }
    );
  }

  const state = Math.random().toString(36).substring(2, 15);
  const authUrl = buildAuthorizationUrl(state);

  return NextResponse.redirect(authUrl);
}
