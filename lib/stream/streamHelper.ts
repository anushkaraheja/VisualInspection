import { format } from 'date-fns-tz';

export const convertToUserLocalDate = (dateString: string): Date => {
  // Ensure the input is treated as UTC
  const utcDate = new Date(dateString + 'Z');

  if (isNaN(utcDate.getTime())) {
    throw new Error('Invalid Date');
  }

  const userTZ = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const userLocale = Intl.DateTimeFormat().resolvedOptions().locale;

  return new Date(utcDate.toLocaleString(userLocale, { timeZone: userTZ }));
};

export function parsePythonJSON(jsonString: string): string {
  return jsonString
    .replace(/'/g, '"')
    .replace(/\bTrue\b/g, 'true')
    .replace(/\bFalse\b/g, 'false')
    .replace(/\bNone\b/g, 'null');
}

export const getFixedDate = (date: Date | null) => {
  if (date) {
    const userTZ: string = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return format(date, "yyyy-MM-dd'T'HH:mmXXX", { timeZone: userTZ });
  }
  return 'Invalid Date';
};

export const prepareFormData = (formData) => {
  const preparedData = { ...formData };
  for (const key in preparedData) {
    if (preparedData[key] instanceof Date) {
      preparedData[key] = getFixedDate(preparedData[key] as Date);
    }
  }
  return preparedData;
};
