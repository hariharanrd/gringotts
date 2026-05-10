/**
 * Formats a Date object to a string compatible with <input type="datetime-local">
 * which expects 'YYYY-MM-DDTHH:mm' in local time.
 */
export const toLocalISOString = (date: Date): string => {
  const tzo = -date.getTimezoneOffset();
  const pad = (num: number) => (num < 10 ? '0' : '') + num;

  return date.getFullYear() +
    '-' + pad(date.getMonth() + 1) +
    '-' + pad(date.getDate()) +
    'T' + pad(date.getHours()) +
    ':' + pad(date.getMinutes());
};

/**
 * Formats a Date object to a string compatible with <input type="date">
 * which expects 'YYYY-MM-DD' in local time.
 */
export const toLocalDateString = (date: Date): string => {
  const pad = (num: number) => (num < 10 ? '0' : '') + num;
  return date.getFullYear() +
    '-' + pad(date.getMonth() + 1) +
    '-' + pad(date.getDate());
};

/**
 * Parses a Date from a local ISO string (YYYY-MM-DDTHH:mm) 
 * treating it as local time.
 */
export const fromLocalISOString = (localString: string): Date => {
  return new Date(localString);
};

/**
 * Detects the user's current browser timezone.
 */
export const getUserTimeZone = (): string => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
};

/**
 * Returns a formatted UTC offset string (e.g. "+05:30", "-05:00") for a given IANA timezone.
 */
export const getTimezoneOffset = (tz: string): string => {
  try {
    const date = new Date();
    const formatter = new Intl.DateTimeFormat('en', {
      timeZone: tz,
      timeZoneName: 'shortOffset',
    });
    const parts = formatter.formatToParts(date);
    const offsetPart = parts.find(p => p.type === 'timeZoneName')?.value ?? 'UTC';
    // offsetPart is like "GMT+5:30" or "GMT-5" — strip the "GMT" prefix
    return offsetPart.replace('GMT', '') || '+00:00';
  } catch {
    return '+00:00';
  }
};
