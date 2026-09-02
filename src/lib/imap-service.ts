import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import { EmailMessage, ExtractedOtp, FetchEmailsResponse } from '@/types';
import { extractOtp, extractActionLinks } from './otp-extractor';

export interface FetchOptions {
  email: string;
  password: string;
  accessToken?: string;
  host?: string;
  port?: number;
  limit?: number;
}

export interface FetchResult {
  success: boolean;
  emails: EmailMessage[];
  household: Array<{
    id: string;
    code?: string;
    link?: string;
    subject: string;
    created_at: string;
    from: string;
  }>;
  verification: Array<{
    id: string;
    code: string;
    serviceName?: string;
    subject: string;
    created_at: string;
    from: string;
    link?: string;
  }>;
  latestOtp?: {
    otp: ExtractedOtp;
    emailSubject: string;
    emailFrom: string;
    emailDate: string;
    emailId: string;
  } | null;
  error?: string;
}

/**
 * Resolves the appropriate IMAP host for an email address.
 */
export function resolveImapHost(email: string, customHost?: string): string {
  if (customHost) return customHost;
  const domain = email.split('@')[1]?.toLowerCase() || '';

  if (domain.includes('outlook') || domain.includes('hotmail') || domain.includes('live') || domain.includes('msn') || domain.includes('office365')) {
    return 'outlook.office365.com';
  }
  if (domain.includes('yahoo') || domain.includes('ymail') || domain.includes('rocketmail')) {
    return 'imap.mail.yahoo.com';
  }
  if (domain.includes('gmail')) {
    return 'imap.gmail.com';
  }

  // Default to Outlook IMAP
  return 'outlook.office365.com';
}

/**
 * Creates and connects an ImapFlow client.
 * When accessToken is provided, uses XOAUTH2 instead of password auth.
 */
export async function createImapClient(
  email: string,
  pass: string,
  host?: string,
  port = 993,
  accessToken?: string
) {
  const resolvedHost = resolveImapHost(email, host);

  const authConfig: any = accessToken
    ? {
        user: email.trim(),
        accessToken: accessToken,
      }
    : {
        user: email.trim(),
        pass: pass.trim(),
      };

  const client = new ImapFlow({
    host: resolvedHost,
    port,
    secure: true,
    auth: authConfig,
    logger: false,
    emitLogs: false,
    clientInfo: {
      name: 'OutlookCodePortal',
      version: '1.0.0',
    },
  });

  return client;
}

/**
 * Tests IMAP connectivity and credentials for an account.
 */
export async function testImapConnection(
  email: string,
  pass: string,
  host?: string,
  port = 993,
  accessToken?: string
): Promise<{ success: boolean; error?: string }> {
  const resolvedHost = resolveImapHost(email, host);
  const client = await createImapClient(email, pass, resolvedHost, port, accessToken);
  try {
    await client.connect();
    await client.logout();
    return { success: true };
  } catch (err: any) {
    const errorMsg = formatImapError(err, resolvedHost);
    return { success: false, error: errorMsg };
  }
}

/**
 * Fetches recent emails and detects OTP codes & household links.
 */
export async function fetchRecentEmails({
  email,
  password,
  accessToken,
  host,
  port = 993,
  limit = 20,
}: FetchOptions): Promise<FetchResult> {
  const resolvedHost = resolveImapHost(email, host);
  const client = await createImapClient(email, password, resolvedHost, port, accessToken);

  try {
    await client.connect();
  } catch (err: any) {
    return {
      success: false,
      emails: [],
      household: [],
      verification: [],
      error: formatImapError(err, resolvedHost),
    };
  }

  const emails: EmailMessage[] = [];
  const householdRecords: FetchResult['household'] = [];
  const verificationRecords: FetchResult['verification'] = [];
  let latestOtp: FetchResult['latestOtp'] = null;

  try {
    const lock = await client.getMailboxLock('INBOX');
    try {
      const mailbox = client.mailbox;
      const totalMessages = typeof mailbox === 'object' && mailbox && 'exists' in mailbox ? (mailbox.exists as number) : 0;

      if (totalMessages > 0) {
        const startSeq = Math.max(1, totalMessages - limit + 1);
        const sequenceRange = `${startSeq}:*`;

        for await (const msg of client.fetch(sequenceRange, {
          source: true,
          uid: true,
          envelope: true,
          internalDate: true,
        })) {
          try {
            if (!msg.source) continue;

            const parsed = await simpleParser(msg.source);
            const fromObj = {
              name: parsed.from?.value?.[0]?.name || parsed.from?.text || 'Unknown Sender',
              address: parsed.from?.value?.[0]?.address || parsed.from?.text || '',
            };

            const toList = (parsed.to
              ? Array.isArray(parsed.to)
                ? parsed.to.map((t) => t.text)
                : [parsed.to.text]
              : []
            ).filter(Boolean);

            const subject = parsed.subject || '(No Subject)';
            const bodyText = parsed.text || '';
            const bodyHtml = (parsed.html as string) || '';
            const snippet = (bodyText || parsed.subject || '')
              .replace(/\s+/g, ' ')
              .trim()
              .slice(0, 160);

            const dateStr = parsed.date ? parsed.date.toISOString() : msg.internalDate ? new Date(msg.internalDate).toISOString() : new Date().toISOString();

            // Extract Action Links (Household updates, verification links)
            const actionLinks = extractActionLinks(bodyHtml, bodyText);

            // Extract OTP
            const otpData = extractOtp(subject, bodyText, fromObj.address || fromObj.name);

            // Categorize into Household / Update Records (Netflix, etc.)
            const isHousehold =
              subject.toLowerCase().includes('household') ||
              subject.toLowerCase().includes('primary location') ||
              bodyText.toLowerCase().includes('netflix household') ||
              actionLinks.some((l) => l.type === 'household');

            const primaryLink = actionLinks[0]?.url;

            const emailItem: EmailMessage = {
              id: `${msg.uid}_${Date.now()}`,
              uid: msg.uid,
              seq: msg.seq,
              from: fromObj,
              to: toList,
              subject,
              date: dateStr,
              snippet,
              bodyText,
              bodyHtml,
              hasAttachments: Boolean(parsed.attachments && parsed.attachments.length > 0),
              otpData,
              householdData: isHousehold
                ? {
                    code: otpData?.code,
                    link: primaryLink,
                    subject,
                  }
                : null,
              actionLinks,
            };

            emails.unshift(emailItem);

            // Populate dg-subs style tables
            if (isHousehold) {
              householdRecords.push({
                id: emailItem.id,
                code: otpData?.code,
                link: primaryLink,
                subject: emailItem.subject,
                created_at: dateStr,
                from: fromObj.name || fromObj.address,
              });
            }

            if (otpData) {
              verificationRecords.push({
                id: emailItem.id,
                code: otpData.code,
                serviceName: otpData.serviceName,
                subject: emailItem.subject,
                created_at: dateStr,
                from: fromObj.name || fromObj.address,
                link: primaryLink,
              });
            }
          } catch (parseErr) {
            console.error('Error parsing email message:', parseErr);
          }
        }
      }
    } finally {
      lock.release();
    }
  } catch (err: any) {
    console.error('IMAP mailbox error:', err);
    return {
      success: false,
      emails: [],
      household: [],
      verification: [],
      error: formatImapError(err, resolvedHost),
    };
  } finally {
    try {
      await client.logout();
    } catch {
      // Ignore
    }
  }

  // Sort newest first
  emails.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  householdRecords.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  verificationRecords.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // Find latest OTP
  const firstWithOtp = emails.find((e) => e.otpData);
  if (firstWithOtp && firstWithOtp.otpData) {
    latestOtp = {
      otp: firstWithOtp.otpData,
      emailSubject: firstWithOtp.subject,
      emailFrom: firstWithOtp.from.name || firstWithOtp.from.address,
      emailDate: firstWithOtp.date,
      emailId: firstWithOtp.id,
    };
  }

  return {
    success: true,
    emails,
    household: householdRecords.slice(0, 5),
    verification: verificationRecords.slice(0, 5),
    latestOtp,
  };
}

function formatImapError(err: any, host: string): string {
  const msg = (err?.message || String(err)).toLowerCase();
  const response = (err?.response || '').toLowerCase();
  const responseText = (err?.responseText || '').toLowerCase();
  const executed = (err?.executedCommand || '').toLowerCase();

  const isAuth =
    err?.authenticationFailed === true ||
    err?.name === 'AuthenticationFailure' ||
    msg.includes('authentication') ||
    msg.includes('login') ||
    msg.includes('invalid credentials') ||
    msg.includes('command failed') ||
    msg.includes('auth') ||
    msg.includes('user is locked') ||
    msg.includes('account is blocked') ||
    response.includes('authenticate failed') ||
    response.includes('authentication') ||
    response.includes('not supported') ||
    responseText.includes('authenticate failed') ||
    responseText.includes('authentication') ||
    responseText.includes('not supported') ||
    executed.includes('authenticate') ||
    executed.includes('login');

  if (isAuth) {
    if (
      host.includes('outlook') ||
      host.includes('office365') ||
      host.includes('hotmail') ||
      host.includes('live') ||
      host.includes('msn')
    ) {
      return 'Microsoft / Outlook Authentication Error: Microsoft requires an App Password instead of a regular password for IMAP connections. Please generate a 16-character App Password at account.microsoft.com/security (Advanced Security Options > App Passwords) and use it here.';
    }
    if (host.includes('yahoo') || host.includes('ymail') || host.includes('rocketmail')) {
      return 'Yahoo Authentication Error: Yahoo requires a generated 16-character Yahoo App Password. Please generate one at login.yahoo.com/account/security and use it instead of your standard password.';
    }
    if (host.includes('gmail')) {
      return 'Gmail Authentication Error: Google requires a 16-character Google App Password from myaccount.google.com/apppasswords.';
    }
    return 'Authentication Failed: Please check your credentials or generate an App Password in your email provider security settings.';
  }

  if (msg.includes('enotfound') || msg.includes('timeout') || msg.includes('econnrefused')) {
    return `Connection Error: Unable to reach IMAP server (${host}:993). Please check your internet connection or IMAP host settings.`;
  }

  return `IMAP Error: ${err?.responseText || err?.message || 'Unknown error occurred while accessing mailbox'}`;
}
