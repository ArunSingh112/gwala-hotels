/**
 * Normalise an Indian mobile number to E.164 digits without the plus,
 * e.g. "91XXXXXXXXXX" — the shape wa.me links and our data model use.
 * Returns null when the input is not a plausible Indian mobile.
 */
export function normalisePhone(input: string): string | null {
  const digits = input.replace(/[^\d]/g, "");

  let national: string;
  if (digits.length === 10) {
    national = digits;
  } else if (digits.length === 12 && digits.startsWith("91")) {
    national = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith("0")) {
    // Trunk prefix: 0XXXXXXXXXX
    national = digits.slice(1);
  } else {
    return null;
  }

  // Indian mobiles are 10 digits starting 6-9.
  if (!/^[6-9]\d{9}$/.test(national)) return null;

  return `91${national}`;
}

/** "+91 98765 43210" — the human-readable form for display. */
export function formatPhoneForDisplay(e164Digits: string): string {
  if (/^91\d{10}$/.test(e164Digits)) {
    const n = e164Digits.slice(2);
    return `+91 ${n.slice(0, 5)} ${n.slice(5)}`;
  }
  return `+${e164Digits}`;
}
