export function normalizeE164(input: string): string | null {
  if (!input) return null;
  const digits = input.replace(/[^\d+]/g, "");
  if (digits.startsWith("+") && digits.length >= 10 && digits.length <= 16) {
    return digits;
  }
  if (digits.startsWith("1") && digits.length === 11) {
    return `+${digits}`;
  }
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  return null;
}
