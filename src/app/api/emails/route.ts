import { NextRequest, NextResponse } from 'next/server';
import { getAccountByEmail, updateAccountStatus, saveOrUpdateAccount } from '@/lib/storage';
import { fetchRecentEmails, resolveImapHost } from '@/lib/imap-service';
import { refreshAccessToken } from '@/lib/microsoft-oauth';

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await req.json();
    const { email, password: directPassword, host, port, limit = 20 } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Email address is required' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim();
    let password = directPassword;
    const savedAccount = getAccountByEmail(cleanEmail);
    let accessToken: string | undefined;

    // Check if account has OAuth2 tokens
    if (savedAccount?.refreshToken && savedAccount?.accessToken) {
      const expiresAt = savedAccount.tokenExpiresAt ? new Date(savedAccount.tokenExpiresAt).getTime() : 0;
      const now = Date.now();

      if (expiresAt > now + 5 * 60 * 1000) {
        // Token still valid
        accessToken = savedAccount.accessToken;
      } else {
        // Token expired — refresh it
        try {
          const newTokens = await refreshAccessToken(savedAccount.refreshToken);
          accessToken = newTokens.access_token;
          const newExpiresAt = new Date(Date.now() + newTokens.expires_in * 1000).toISOString();

          saveOrUpdateAccount({
            ...savedAccount,
            accessToken: newTokens.access_token,
            refreshToken: newTokens.refresh_token || savedAccount.refreshToken,
            tokenExpiresAt: newExpiresAt,
          });
        } catch (refreshErr: any) {
          console.error('Token refresh failed:', refreshErr);
          return NextResponse.json(
            {
              success: false,
              email: cleanEmail,
              error: 'Microsoft OAuth token expired. Please reconnect via "Sign in with Microsoft".',
              requiresOAuth: true,
              timeTakenMs: Date.now() - startTime,
            },
            { status: 401 }
          );
        }
      }
    }

    // If no OAuth token, fall back to password
    if (!accessToken) {
      if (!password) {
        if (savedAccount && savedAccount.password && savedAccount.password !== 'oauth2') {
          password = savedAccount.password;
        } else if (savedAccount?.refreshToken) {
          return NextResponse.json(
            {
              success: false,
              error: 'Microsoft OAuth token expired. Please reconnect via "Sign in with Microsoft".',
              requiresOAuth: true,
            },
            { status: 401 }
          );
        } else {
          return NextResponse.json(
            {
              success: false,
              error: `No saved credentials found for "${cleanEmail}". Please enter the password or sign in with Microsoft.`,
              requiresPassword: true,
            },
            { status: 404 }
          );
        }
      }
    }

    const imapHost = resolveImapHost(cleanEmail, host || savedAccount?.imapHost);
    const imapPort = port || savedAccount?.imapPort || 993;

    const result = await fetchRecentEmails({
      email: cleanEmail,
      password: password || '',
      accessToken,
      host: imapHost,
      port: imapPort,
      limit: Number(limit) || 20,
    });

    const timeTakenMs = Date.now() - startTime;

    if (result.success) {
      if (savedAccount) {
        updateAccountStatus(savedAccount.id, 'healthy');
      }
      return NextResponse.json({
        success: true,
        email: cleanEmail,
        count: result.emails.length,
        emails: result.emails,
        household: result.household,
        verification: result.verification,
        latestOtp: result.latestOtp,
        timeTakenMs,
      });
    } else {
      if (savedAccount) {
        updateAccountStatus(savedAccount.id, 'error', result.error);
      }
      return NextResponse.json(
        {
          success: false,
          email: cleanEmail,
          error: result.error || 'Failed to fetch emails from Outlook/IMAP',
          timeTakenMs,
        },
        { status: 400 }
      );
    }
  } catch (err: any) {
    const timeTakenMs = Date.now() - startTime;
    console.error('API Error in /api/emails:', err);
    return NextResponse.json(
      {
        success: false,
        error: err?.message || 'Internal server error while fetching emails',
        timeTakenMs,
      },
      { status: 500 }
    );
  }
}
