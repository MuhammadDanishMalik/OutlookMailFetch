import { NextRequest, NextResponse } from 'next/server';
import { testImapConnection } from '@/lib/imap-service';
import { getAccountByEmail, updateAccountStatus } from '@/lib/storage';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password: directPassword, host = 'imap.mail.yahoo.com', port = 993 } = body;

    if (!email) {
      return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 });
    }

    let password = directPassword;
    const saved = getAccountByEmail(email);
    if (!password && saved) {
      password = saved.password;
    }

    if (!password) {
      return NextResponse.json(
        { success: false, error: 'Password or App Password is required' },
        { status: 400 }
      );
    }

    const result = await testImapConnection(email, password, host, port);

    if (saved) {
      updateAccountStatus(saved.id, result.success ? 'healthy' : 'error', result.error);
    }

    return NextResponse.json({
      success: result.success,
      email,
      error: result.error,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Connection test failed' },
      { status: 500 }
    );
  }
}
