import { ExtractedOtp, ExtractedLink } from '@/types';

// Known service patterns for automatic brand detection
const SERVICE_PATTERNS: Array<{ name: string; pattern: RegExp }> = [
  { name: 'Netflix', pattern: /netflix/i },
  { name: 'Microsoft', pattern: /microsoft|live\.com|outlook|office365|azure|msn/i },
  { name: 'Google', pattern: /google|gmail/i },
  { name: 'Apple', pattern: /apple|icloud|appleid/i },
  { name: 'Amazon', pattern: /amazon|aws/i },
  { name: 'Discord', pattern: /discord/i },
  { name: 'Steam', pattern: /steam|valvesoftware/i },
  { name: 'Telegram', pattern: /telegram/i },
  { name: 'WhatsApp', pattern: /whatsapp/i },
  { name: 'Instagram', pattern: /instagram/i },
  { name: 'Facebook / Meta', pattern: /facebook|meta/i },
  { name: 'Twitter / X', pattern: /twitter|x\.com/i },
  { name: 'TikTok', pattern: /tiktok/i },
  { name: 'Spotify', pattern: /spotify/i },
  { name: 'OpenAI / ChatGPT', pattern: /openai|chatgpt/i },
  { name: 'GitHub', pattern: /github/i },
  { name: 'PayPal', pattern: /paypal/i },
  { name: 'Binance', pattern: /binance/i },
  { name: 'Coinbase', pattern: /coinbase/i },
  { name: 'Epic Games', pattern: /epic\s*games/i },
  { name: 'Roblox', pattern: /roblox/i },
  { name: 'Uber', pattern: /uber/i },
  { name: 'Airbnb', pattern: /airbnb/i },
  { name: 'LinkedIn', pattern: /linkedin/i },
];

/**
 * Detects the service name from sender info and subject line.
 */
export function detectService(fromStr: string, subjectStr: string): string | undefined {
  const combined = `${fromStr} ${subjectStr}`;
  for (const { name, pattern } of SERVICE_PATTERNS) {
    if (pattern.test(combined)) {
      return name;
    }
  }
  return undefined;
}

/**
 * Extracts action links (e.g. Netflix household update, verification links) from HTML or text.
 */
export function extractActionLinks(bodyHtml: string, bodyText: string): ExtractedLink[] {
  const links: ExtractedLink[] = [];
  const html = bodyHtml || '';

  // 1. Netflix Household / Update Primary Location Links
  const netflixHouseholdRegex = /href=["'](https?:\/\/(?:www\.)?netflix\.com\/(?:youraccount\/set-primary-location|account\/travel\/verify|account\/update-primary-location|browse\?nftoken=[^"'\s]+|verify[^"'\s]*))["']/gi;
  let match: RegExpExecArray | null;
  while ((match = netflixHouseholdRegex.exec(html)) !== null) {
    if (match[1]) {
      links.push({
        url: match[1],
        label: 'Update Netflix Household / Confirm Location',
        type: 'household',
      });
    }
  }

  // 2. Generic button / link matches inside HTML (e.g. "Yes, It was me", "Update Household", "Verify Email", "Sign in")
  const buttonRegex = /<a\s+[^>]*href=["'](https?:\/\/[^"']+)["'][^>]*>(.*?)<\/a>/gi;
  while ((match = buttonRegex.exec(html)) !== null) {
    const url = match[1];
    const rawAnchorText = match[2].replace(/<[^>]+>/g, '').trim();
    const anchorLower = rawAnchorText.toLowerCase();

    if (
      anchorLower.includes('household') ||
      anchorLower.includes('set primary') ||
      anchorLower.includes('update household')
    ) {
      if (!links.some((l) => l.url === url)) {
        links.push({
          url,
          label: rawAnchorText || 'Update Netflix Household',
          type: 'household',
        });
      }
    } else if (
      anchorLower.includes('verify') ||
      anchorLower.includes('confirm') ||
      anchorLower.includes('approve') ||
      anchorLower.includes('sign in') ||
      anchorLower.includes('log in') ||
      anchorLower.includes('reset password')
    ) {
      if (!links.some((l) => l.url === url)) {
        links.push({
          url,
          label: rawAnchorText || 'Confirm / Verify Action',
          type: 'verify',
        });
      }
    }
  }

  // 3. Fallback: Search in plaintext if no HTML link found
  if (links.length === 0 && bodyText) {
    const rawUrlMatch = bodyText.match(/(https?:\/\/(?:www\.)?netflix\.com\/[^\s]+)/i);
    if (rawUrlMatch && rawUrlMatch[1]) {
      links.push({
        url: rawUrlMatch[1],
        label: 'Open Netflix Link',
        type: 'household',
      });
    }
  }

  return links;
}

/**
 * Robustly extracts OTP / verification code from subject and body content.
 */
export function extractOtp(subject: string, bodyText: string, fromAddress: string = ''): ExtractedOtp | null {
  const cleanSubject = subject || '';
  const cleanBody = bodyText || '';
  const serviceName = detectService(fromAddress, cleanSubject);

  // 1. Check Google G-XXXXXX format
  const googleMatch = cleanSubject.match(/\b(G-\d{6})\b/i) || cleanBody.match(/\b(G-\d{6})\b/i);
  if (googleMatch) {
    return {
      code: googleMatch[1].toUpperCase(),
      type: 'alphanumeric',
      context: 'Google Verification Code',
      confidence: 0.99,
      serviceName: serviceName || 'Google',
    };
  }

  // 2. Check Steam Guard 5-character alphanumeric format
  const steamMatch =
    cleanSubject.match(/steam\s*guard\s*(?:code)?\s*(?:is|:|\=)?\s*([A-Z0-9]{5})\b/i) ||
    cleanBody.match(/steam\s*guard\s*(?:code)?\s*(?:is|:|\=)?\s*([A-Z0-9]{5})\b/i);
  if (steamMatch && steamMatch[1]) {
    return {
      code: steamMatch[1].toUpperCase(),
      type: 'alphanumeric',
      context: 'Steam Guard Code',
      confidence: 0.98,
      serviceName: serviceName || 'Steam',
    };
  }

  // 3. Check Netflix 4-digit temporary access code or verification code
  const netflixCodeMatch =
    cleanSubject.match(/(?:temporary\s+access\s+code|netflix\s+code|verification\s+code|your\s+code)\s*(?:is|:|\=)?\s*([0-9]{4,6})\b/i) ||
    cleanBody.match(/(?:temporary\s+access\s+code|netflix\s+code|verification\s+code|your\s+code)\s*(?:is|:|\=)?\s*([0-9]{4,6})\b/i);
  if (netflixCodeMatch && (serviceName === 'Netflix' || /netflix/i.test(cleanSubject + cleanBody))) {
    return {
      code: netflixCodeMatch[1],
      type: 'numeric',
      context: 'Netflix Access Code',
      confidence: 0.96,
      serviceName: 'Netflix',
    };
  }

  // 4. High-confidence regex rules on subject line
  const subjectRules = [
    /(?:verification|security|confirm|confirmation|auth|login|access|otp|pin|passcode|two-factor|2fa)\s+(?:code|pin|password|number|key)?\s*(?:is|:|\=|\-)?\s*[\*\#\s]*([0-9]{4,8})\b/i,
    /\b([0-9]{4,8})\s+is\s+(?:your\s+)?(?:verification|security|confirmation|otp|login|passcode|pin|access)\s+code/i,
    /(?:code|otp|pin|passcode)\s*[:\-\=]\s*([0-9]{4,8})\b/i,
    /(?:use|enter)\s+([0-9]{4,8})\s+(?:to\s+(?:verify|confirm|log\s*in|authenticate|access|complete))/i,
    /(?:verification|security|code|confirm)\s*[:\-\s]+([0-9]{3}[-\s][0-9]{3})\b/i,
    /(?:verification|security|auth|access)\s+code\s*(?:is|:|\=)\s*([A-Z0-9]{5,8})\b/i,
  ];

  for (const rule of subjectRules) {
    const match = cleanSubject.match(rule);
    if (match && match[1]) {
      const code = match[1].replace(/\s+/g, '');
      return {
        code,
        type: /^\d+$/.test(code) ? 'numeric' : 'alphanumeric',
        context: cleanSubject.slice(0, 100),
        confidence: 0.95,
        serviceName,
      };
    }
  }

  // 5. Search in Body Text
  const bodyRules: Array<{ pattern: RegExp; getContext: (m: RegExpMatchArray) => string; confidence: number }> = [
    {
      pattern: /(?:your|the)\s+(?:verification|security|confirmation|authentication|login|one-time|otp|access)\s+(?:code|pin|passcode|password)\s+(?:is|:)\s*([0-9A-Z]{4,8})\b/i,
      getContext: (m) => m[0],
      confidence: 0.95,
    },
    {
      pattern: /(?:verification|security|confirmation|one-time\s+password|otp|login\s+code|auth\s+code)\s*[:\-\=]\s*([0-9A-Z]{4,8})\b/i,
      getContext: (m) => m[0],
      confidence: 0.92,
    },
    {
      pattern: /(?:enter|use|input)\s+([0-9]{4,8})\s+(?:to\s+(?:verify|confirm|sign\s*in|log\s*in|authenticate|access|continue|proceed))/i,
      getContext: (m) => m[0],
      confidence: 0.90,
    },
    {
      pattern: /\b([0-9]{4,8})\s+is\s+your\s+(?:verification|security|confirmation|login|otp|passcode)\s+code/i,
      getContext: (m) => m[0],
      confidence: 0.92,
    },
    {
      pattern: /(?:code|otp|pin|passcode)\s*(?:is|:|\=|\-)?\s*([0-9]{3}-[0-9]{3})\b/i,
      getContext: (m) => m[0],
      confidence: 0.90,
    },
    {
      pattern: /(?:verification|security|confirmation|steam\s*guard|access)\s+code\s*[:\s]+([A-Z0-9]{5,8})\b/i,
      getContext: (m) => m[0],
      confidence: 0.88,
    },
  ];

  for (const { pattern, getContext, confidence } of bodyRules) {
    const match = cleanBody.match(pattern);
    if (match && match[1]) {
      const code = match[1].trim();
      if (/^(2024|2025|2026|2027)$/.test(code) && !cleanSubject.toLowerCase().includes('code')) {
        continue;
      }
      return {
        code,
        type: /^\d+$/.test(code) ? 'numeric' : 'alphanumeric',
        context: getContext(match),
        confidence,
        serviceName,
      };
    }
  }

  // 6. Standalone bolded or isolated 4-8 digit numbers in short messages
  if (/verify|verification|security|confirm|login|otp|code|account|netflix/i.test(cleanSubject + ' ' + cleanBody)) {
    const isolatedNumberMatch = cleanBody.match(/(?:^|\n|\r|\s|>)([0-9]{4,8})(?:$|\n|\r|\s|<|\.)/);
    if (isolatedNumberMatch && isolatedNumberMatch[1]) {
      const code = isolatedNumberMatch[1];
      if (!/^(2024|2025|2026|2027|123456|000000)$/.test(code) || cleanSubject.toLowerCase().includes('code')) {
        return {
          code,
          type: 'numeric',
          context: `Detected security code`,
          confidence: 0.75,
          serviceName,
        };
      }
    }
  }

  return null;
}
