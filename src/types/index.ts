export interface Account {
  id: string;
  email: string;
  password: string;
  label?: string;
  provider?: 'outlook' | 'yahoo' | 'custom';
  imapHost?: string;
  imapPort?: number;
  createdAt: string;
  lastCheckedAt?: string;
  status?: 'healthy' | 'error' | 'untested';
  lastError?: string;
  // Microsoft OAuth2 tokens for XOAUTH2 IMAP
  accessToken?: string;
  refreshToken?: string;
  tokenExpiresAt?: string;
}

export interface ExtractedOtp {
  code: string;
  type: 'numeric' | 'alphanumeric' | 'pin';
  context: string;
  confidence: number;
  serviceName?: string;
}

export interface ExtractedLink {
  url: string;
  label: string;
  type: 'household' | 'verify' | 'login' | 'general';
}

export interface EmailMessage {
  id: string;
  uid: number;
  seq: number;
  from: {
    name: string;
    address: string;
  };
  to: string[];
  subject: string;
  date: string;
  snippet: string;
  bodyText?: string;
  bodyHtml?: string;
  hasAttachments: boolean;
  otpData?: ExtractedOtp | null;
  householdData?: {
    code?: string;
    link?: string;
    subject?: string;
  } | null;
  actionLinks?: ExtractedLink[];
}

export interface FetchEmailsResponse {
  success: boolean;
  email: string;
  count: number;
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
  timeTakenMs: number;
  error?: string;
}
