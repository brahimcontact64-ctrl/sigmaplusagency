/**
 * Deliberately conservative deduplication: match on normalized email
 * (always) or normalized phone (only when both sides have one). We
 * never merge two people just because a name is similar — false
 * positives are worse than an occasional duplicate lead.
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Strips everything but digits and a leading +, so "+213 550 47 52 48" and "0550475248" style variants can still be compared consistently once callers pass the same convention in. */
export function normalizePhone(phone: string): string {
  const trimmed = phone.trim();
  const hasPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/[^\d]/g, "");
  return hasPlus ? `+${digits}` : digits;
}
