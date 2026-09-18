/**
 * Normalize email to prevent abuse via Gmail + addressing and dots
 * 
 * Examples:
 * - john+test@gmail.com → john@gmail.com
 * - jo.hn@gmail.com → john@gmail.com (Gmail only)
 * - john+spam@googlemail.com → john@gmail.com
 */
export function normalizeEmail(email: string): string {
  const emailLower = email.toLowerCase().trim();
  
  // Split into local part (before @) and domain (after @)
  const at = emailLower.lastIndexOf('@');
  if (at <= 0) {
    return emailLower;
  }

  let localPart = emailLower.slice(0, at);
  let domain = emailLower.slice(at + 1);

  if (domain === 'googlemail.com') {
    domain = 'gmail.com';
  }

  // For Gmail and Googlemail: remove dots and plus addressing
  const isGmail = domain === 'gmail.com';
  
  if (isGmail) {
    localPart = localPart.replace(/\./g, '');
  }

  const plusIndex = localPart.indexOf('+');
  if (plusIndex !== -1) {
    localPart = localPart.substring(0, plusIndex);
  }

  return `${localPart}@${domain}`;
}

/** Alias for FPLEI-style trial-abuse checks (canonical Gmail/plus handling). */
export function normalizeEmailForAbuseCheck(rawEmail: string): string {
  return normalizeEmail(rawEmail);
}

/** Heuristics that often indicate alias farming. */
export function emailLooksAliasHeavy(rawEmail: string): boolean {
  const trimmed = rawEmail.trim().toLowerCase();
  const at = trimmed.lastIndexOf('@');
  if (at <= 0) return false;

  const local = trimmed.slice(0, at);
  const domain = trimmed.slice(at + 1);

  if (local.includes('+')) return true;
  if ((domain === 'gmail.com' || domain === 'googlemail.com') && local.includes('.')) {
    return true;
  }

  return false;
}

/**
 * Check if email is from a disposable/temporary email provider
 */
const DISPOSABLE_DOMAINS = [
  'tempmail.com',
  'guerrillamail.com',
  'mailinator.com',
  '10minutemail.com',
  'throwaway.email',
  'temp-mail.org',
  'fakeinbox.com',
  'trashmail.com',
  'yopmail.com',
  'maildrop.cc',
];

export function isDisposableEmail(email: string): boolean {
  const domain = email.toLowerCase().split('@')[1];
  return DISPOSABLE_DOMAINS.includes(domain);
}

