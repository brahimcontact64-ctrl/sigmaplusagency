/**
 * Deliberately conservative deduplication: match on normalized email
 * (always) or normalized phone (only when both sides have one). We
 * never merge two people just because a name is similar — false
 * positives are worse than an occasional duplicate lead.
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Strips everything but digits and a leading +, so "+213 550 47 52 48"
 * and "213 550 47 52 48" style variants of the SAME already-E.164-ish
 * input compare consistently. The literal "00" international-dialing
 * prefix (an ITU convention, not a country guess) is normalized to "+"
 * for the same reason.
 *
 * Deliberately does NOT attempt to reconcile a local-format number
 * (e.g. "0550475248") with its international form ("+213550475248") —
 * doing that correctly requires knowing the country, which this
 * function is never given and must not guess (never from locale/UI
 * language — a French-speaking visitor may be in Algeria, France,
 * Belgium, etc., same reasoning as Phase 11's currency resolution).
 * Two differently-formatted numbers that are the same real phone
 * number may therefore normalize differently and not dedup — a false
 * negative (an occasional duplicate lead) is the conservative failure
 * mode here, not a false positive (incorrectly merging two different
 * people), which is explicitly the worse outcome.
 */
export function normalizePhone(phone: string): string {
  const trimmed = phone.trim();
  const hasPlus = trimmed.startsWith("+");
  let digits = trimmed.replace(/[^\d]/g, "");
  if (!hasPlus && digits.startsWith("00")) {
    digits = digits.slice(2);
    return `+${digits}`;
  }
  return hasPlus ? `+${digits}` : digits;
}
