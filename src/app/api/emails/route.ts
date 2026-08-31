import { NextRequest, NextResponse } from 'next/server';
import { getAccountByEmail, updateAccountStatus } from '@/lib/storage';
import { fetchRecentEmails, resolveImapHost } from '@/lib/imap-service';

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

    if (!password) {
      if (savedAccount && savedAccount.password) {
        password = savedAccount.password;
      } else {
        return NextResponse.json(
          {
            success: false,
            error: `No saved credentials found for "${cleanEmail}". Please enter the password.`,
            requiresPassword: true,
          },
          { status: 404 }
        );
      }
    }

    const imapHost = resolveImapHost(cleanEmail, host || savedAccount?.imapHost);
    const imapPort = port || savedAccount?.imapPort || 993;

    const result = await fetchRecentEmails({
      email: cleanEmail,
      password,
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
