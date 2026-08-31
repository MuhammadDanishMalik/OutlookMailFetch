import { NextResponse } from 'next/server';
import { EmailMessage, FetchEmailsResponse } from '@/types';
import { extractOtp, extractActionLinks } from '@/lib/otp-extractor';

export async function GET() {
  const now = new Date();

  const mockRawEmails = [
    {
      from: { name: 'Netflix', address: 'info@account.netflix.com' },
      subject: 'Important: How to update your Netflix Household',
      date: new Date(now.getTime() - 20 * 1000).toISOString(), // 20 seconds ago
      bodyText: 'Hi there,\n\nA Netflix Household is a collection of your devices connected to the internet at the main place you watch.\n\nTo confirm or update your Netflix Household, click the link below or enter this code:\n\nTemporary Code: 4920\n\nLink: https://www.netflix.com/youraccount/set-primary-location?nftoken=mock_token_12345',
      bodyHtml: '<div style="font-family:sans-serif;padding:20px;background:#141414;color:#fff;border-radius:12px;"><h2 style="color:#e50914;">Netflix Household Update</h2><p>A Netflix Household is a collection of your devices connected to the internet at the main place you watch.</p><p>Temporary Access Code: <strong style="font-size:24px;color:#fff;background:#333;padding:4px 10px;border-radius:6px;letter-spacing:3px;">4920</strong></p><p style="margin-top:20px;"><a href="https://www.netflix.com/youraccount/set-primary-location?nftoken=mock_token_12345" style="background:#e50914;color:#fff;padding:10px 20px;text-decoration:none;border-radius:6px;font-weight:bold;display:inline-block;">Update Netflix Household</a></p></div>',
    },
    {
      from: { name: 'Netflix Security', address: 'account@netflix.com' },
      subject: 'Your Netflix temporary access code is: 8291',
      date: new Date(now.getTime() - 4 * 60 * 1000).toISOString(), // 4 mins ago
      bodyText: 'Your Netflix temporary access code is 8291. It will expire in 15 minutes.\n\nUse this to confirm your device or update your household.',
      bodyHtml: '<div style="font-family:sans-serif;padding:20px;"><p>Your Netflix code is: <b style="font-size:22px;color:#e50914;">8291</b></p><p><a href="https://www.netflix.com/account/travel/verify" style="color:#e50914;">Confirm Household Device</a></p></div>',
    },
    {
      from: { name: 'Microsoft account team', address: 'account-security-noreply@accountprotection.microsoft.com' },
      subject: 'Microsoft account security code: 739104',
      date: new Date(now.getTime() - 15 * 60 * 1000).toISOString(), // 15 mins ago
      bodyText: 'Microsoft account\nSecurity code\n\nPlease use security code 739104 to verify your identity.\n\nThanks,\nThe Microsoft account team',
      bodyHtml: '<div style="font-family:sans-serif;"><p>Please use security code <strong>739104</strong></p></div>',
    },
    {
      from: { name: 'Google', address: 'noreply@google.com' },
      subject: 'Google Verification Code: G-849201',
      date: new Date(now.getTime() - 35 * 60 * 1000).toISOString(),
      bodyText: 'Hi,\n\nUse 849201 to verify your Google Account sign-in on a new device.\n\nThis code will expire in 10 minutes.',
      bodyHtml: '<div style="font-family:sans-serif;padding:20px;"><h2>Google Account Security</h2><p>Your verification code is: <strong style="font-size:24px;color:#1a73e8;letter-spacing:2px;">G-849201</strong></p></div>',
    },
    {
      from: { name: 'Discord', address: 'notifications@discord.com' },
      subject: 'Your Discord security code is: 489201',
      date: new Date(now.getTime() - 55 * 60 * 1000).toISOString(),
      bodyText: 'Hey there!\n\nYour Discord verification code is 489201. Please enter this in Discord to complete login.',
      bodyHtml: '<div style="font-family:sans-serif;padding:20px;"><p>Your verification code is: <b>489201</b></p></div>',
    },
  ];

  const emails: EmailMessage[] = mockRawEmails.map((item, index) => {
    const otpData = extractOtp(item.subject, item.bodyText, item.from.address || item.from.name);
    const actionLinks = extractActionLinks(item.bodyHtml, item.bodyText);
    const isHousehold =
      item.subject.toLowerCase().includes('household') ||
      item.subject.toLowerCase().includes('primary location') ||
      actionLinks.some((l) => l.type === 'household');

    const primaryLink = actionLinks[0]?.url;

    return {
      id: `mock_${index}_${Date.now()}`,
      uid: 9999 - index,
      seq: index + 1,
      from: item.from,
      to: ['user@outlook.com'],
      subject: item.subject,
      date: item.date,
      snippet: item.bodyText.slice(0, 140),
      bodyText: item.bodyText,
      bodyHtml: item.bodyHtml,
      hasAttachments: false,
      otpData,
      householdData: isHousehold
        ? {
            code: otpData?.code,
            link: primaryLink,
            subject: item.subject,
          }
        : null,
      actionLinks,
    };
  });

  const householdRecords = emails
    .filter((e) => e.householdData)
    .map((e) => ({
      id: e.id,
      code: e.householdData?.code,
      link: e.householdData?.link,
      subject: e.subject,
      created_at: e.date,
      from: e.from.name,
    }));

  const verificationRecords = emails
    .filter((e) => e.otpData)
    .map((e) => ({
      id: e.id,
      code: e.otpData!.code,
      serviceName: e.otpData!.serviceName,
      subject: e.subject,
      created_at: e.date,
      from: e.from.name,
      link: e.actionLinks?.[0]?.url,
    }));

  const firstOtp = emails.find((e) => e.otpData);

  const response: FetchEmailsResponse = {
    success: true,
    email: 'user-demo@outlook.com',
    count: emails.length,
    emails,
    household: householdRecords,
    verification: verificationRecords,
    latestOtp: firstOtp && firstOtp.otpData ? {
      otp: firstOtp.otpData,
      emailSubject: firstOtp.subject,
      emailFrom: firstOtp.from.name,
      emailDate: firstOtp.date,
      emailId: firstOtp.id,
    } : null,
    timeTakenMs: 95,
  };

  return NextResponse.json(response);
}
