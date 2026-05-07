export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function normalizePhone(phone?: string) {
  if (!phone) {
    return undefined;
  }

  const digits = phone.replace(/\D/g, "");

  if (digits.startsWith("90") && digits.length === 12) {
    return digits.slice(2);
  }

  if (digits.startsWith("0") && digits.length === 11) {
    return digits.slice(1);
  }

  return digits;
}
