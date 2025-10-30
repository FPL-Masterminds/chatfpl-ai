/**
 * Normalize email to prevent abuse via Gmail + addressing and dots
 * 
 * Examples:
 * - john+test@gmail.com → john@gmail.com
 * - jo.hn@gmail.com → john@gmail.com (Gmail only)
 * - john+spam@googlemail.com → john@googlemail.com
 */
export function normalizeEmail(email: string): string {
  const emailLower = email.toLowerCase().trim();
  
  // Split into local part (before @) and domain (after @)
  const [localPart, domain] = emailLower.split('@');
  
  if (!localPart || !domain) {
    return emailLower; // Invalid email format, return as-is
  }

  let normalizedLocal = localPart;

  // For Gmail and Googlemail: remove dots and plus addressing
  const isGmail = domain === 'gmail.com' || domain === 'googlemail.com';
  
  if (isGmail) {
    // Remove all dots (Gmail ignores them)
    normalizedLocal = normalizedLocal.replace(/\./g, '');
  }

  // Remove plus addressing (works for all email providers)
  // john+test@example.com → john@example.com
  const plusIndex = normalizedLocal.indexOf('+');
  if (plusIndex !== -1) {
    normalizedLocal = normalizedLocal.substring(0, plusIndex);
  }

  return `${normalizedLocal}@${domain}`;
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

