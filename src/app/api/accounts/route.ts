import { NextRequest, NextResponse } from 'next/server';
import {
  getAllAccounts,
  saveOrUpdateAccount,
  deleteAccountById,
  parseBulkAccounts,
  saveAllAccounts,
} from '@/lib/storage';

export async function GET() {
  try {
    const accounts = getAllAccounts();
    // Return sanitized accounts list
    const sanitized = accounts.map((acc) => ({
      id: acc.id,
      email: acc.email,
      password: acc.password, // Keep available for user editing/exporting
      maskedPassword: acc.password ? '•'.repeat(Math.min(acc.password.length, 12)) : '',
      label: acc.label || '',
      provider: acc.provider || 'yahoo',
      status: acc.status || 'untested',
      lastCheckedAt: acc.lastCheckedAt,
      lastError: acc.lastError,
      createdAt: acc.createdAt,
    }));

    return NextResponse.json({
      success: true,
      total: accounts.length,
      accounts: sanitized,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to list accounts' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action = 'save', account, raw, accounts: batchList } = body;

    // 1. Bulk import from raw text (e.g. email:password per line)
    if (action === 'bulk' && typeof raw === 'string') {
      const parsed = parseBulkAccounts(raw);
      if (parsed.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'No valid account lines found. Format: email:password or email:app_password (one per line).',
          },
          { status: 400 }
        );
      }

      let addedCount = 0;
      let updatedCount = 0;
      const allAccounts = getAllAccounts();

      for (const item of parsed) {
        const normEmail = item.email.toLowerCase().trim();
        const existingIdx = allAccounts.findIndex((a) => a.email.toLowerCase().trim() === normEmail);

        if (existingIdx >= 0) {
          allAccounts[existingIdx].password = item.password;
          if (item.label) allAccounts[existingIdx].label = item.label;
          updatedCount++;
        } else {
          allAccounts.unshift({
            id: `acc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            email: normEmail,
            password: item.password,
            label: item.label || '',
            provider: 'yahoo',
            createdAt: new Date().toISOString(),
            status: 'untested',
          });
          addedCount++;
        }
      }

      saveAllAccounts(allAccounts);

      return NextResponse.json({
        success: true,
        message: `Successfully processed ${parsed.length} accounts (${addedCount} added, ${updatedCount} updated).`,
        addedCount,
        updatedCount,
        total: allAccounts.length,
      });
    }

    // 2. Direct batch replace / sync
    if (action === 'batch_save' && Array.isArray(batchList)) {
      saveAllAccounts(batchList);
      return NextResponse.json({
        success: true,
        total: batchList.length,
      });
    }

    // 3. Single account save or update
    if (account && account.email && account.password) {
      const saved = saveOrUpdateAccount({
        id: account.id,
        email: account.email.trim(),
        password: account.password.trim(),
        label: account.label?.trim() || '',
        provider: account.provider || 'yahoo',
        imapHost: account.imapHost,
        imapPort: account.imapPort ? Number(account.imapPort) : undefined,
      });

      return NextResponse.json({
        success: true,
        account: saved,
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid payload. Email and password are required.' },
      { status: 400 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to save account' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Account ID or Email is required' },
        { status: 400 }
      );
    }

    const removed = deleteAccountById(id);
    if (removed) {
      return NextResponse.json({ success: true, message: 'Account removed' });
    } else {
      return NextResponse.json({ success: false, error: 'Account not found' }, { status: 404 });
    }
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to delete account' },
      { status: 500 }
    );
  }
}
