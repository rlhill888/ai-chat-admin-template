export function formatUSPhoneNumber(phoneNumber: string): string | null {
  // Remove everything except digits
  const digits = phoneNumber.replace(/\D/g, "");

  // Handle cases where number already includes country code
  let normalized = digits;

  if (normalized.length === 11 && normalized.startsWith("1")) {
    normalized = normalized.slice(1);
  }

  if (normalized.length !== 10) {
    return null;
  }

  const areaCode = normalized.slice(0, 3);
  const centralOfficeCode = normalized.slice(3, 6);
  const lineNumber = normalized.slice(6);

  return `+1 ${areaCode}-${centralOfficeCode}-${lineNumber}`;
}

export function formatIsoTimeToAmPm(isoTime: string): string {
  const date = new Date(isoTime);

  return date
    .toLocaleTimeString("en-US", {
      hour: "numeric", // removes leading 0
      minute: "2-digit",
      hour12: true,
    })
    .toLowerCase();
}