import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';

dayjs.extend(utc);
dayjs.extend(timezone);

const DEFAULT_TIMEZONE = 'Asia/Bangkok';

export const formatDateToLocal = (date) => {
  if (!date) return null;
  return dayjs(date).tz(DEFAULT_TIMEZONE).format('YYYY-MM-DD');
};

export const formatDateTimeToLocal = (date) => {
  if (!date) return null;
  return dayjs(date).tz(DEFAULT_TIMEZONE).format('YYYY-MM-DD HH:mm:ss');
};

export const formatObjectDates = (obj, dateFields) => {
  if (!obj || typeof obj !== 'object') return obj;

  const result = { ...obj };

  dateFields.forEach((field) => {
    if (result[field]) {
      result[field] = formatDateToLocal(result[field]);
    }
  });

  return result;
};
