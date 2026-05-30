import moment from 'moment';

export const utcToLocal = (dateString: string) => {
  var offset = moment().utcOffset();
  var localTime = moment
    .utc(dateString)
    .utcOffset(offset)
    .format('YYYY-MMM-DD h:mm A');
  return localTime;
};

export const localToUtc = (localTime: string) => {
  var utcTime = moment.utc(moment(localTime)).format();
  return utcTime;
};

export const formats = [
  // 🔁 Common 12-hour formats
  'DD MMM YYYY h:mm:ss a',
  'D MMM YYYY h:mm:ss a',
  'DD MMM YYYY h:mm a',
  'D MMM YYYY h:mm a',
  'DD-MMM-YYYY h:mm:ss a',
  'DD/MM/YYYY h:mm:ss a',
  'DD/MM/YYYY, h:mm a',
  'MM/DD/YYYY h:mm:ss a',
  'MM/DD/YYYY, h:mm a',
  'YYYY/MM/DD h:mm:ss a',
  'DD-MM-YYYY h:mm a',
  'DD-MM-YYYY, h:mm a',
  'YYYY-MM-DD h:mm a',

  // iOS-native + verbose English
  'MMMM D, YYYY at h:mm a',
  'MMMM D, YYYY h:mm a',
  'MMM D, YYYY at h:mm a',
  'MMM D, YYYY h:mm a',
  'dddd, MMMM D, YYYY h:mm a',
  'dddd, MMMM D YYYY h:mm a',

  // 🔁 Common 24-hour formats
  'DD MMM YYYY HH:mm:ss',
  'D MMM YYYY HH:mm:ss',
  'DD MMM YYYY HH:mm',
  'D MMM YYYY HH:mm',
  'DD-MM-YYYY HH:mm:ss',
  'DD/MM/YYYY HH:mm:ss',
  'MM/DD/YYYY HH:mm:ss',
  'YYYY-MM-DD HH:mm:ss',
  'YYYY/MM/DD HH:mm:ss',
  'YYYY/MM/DD HH:mm',
  'DD-MM-YYYY HH:mm',
  'DD.MM.YYYY HH:mm',
  'DD.MM.YYYY HH:mm:ss',

  // ISO / Compact
  'YYYY-MM-DDTHH:mm:ss',
  'YYYY-MM-DDTHH:mm:ssZ',
  'YYYY-MM-DDTHH:mm:ss.SSSZ',
  'YYYY-MM-DDTHH:mm:ss[Z]',
  'YYYYMMDDTHHmmssZ',
  'YYYY-MM-DDTHH:mm:ss.SSSXXX',
  'YYYYMMDD HHmmss',
  'YYYYMMDD HHmm',
  'YYYYMMDD',

  // ⌛ Unix timestamps
  'X', // seconds
  'x', // milliseconds

  // 🧾 System / Locale-based formats
  'ddd MMM DD YYYY HH:mm:ss z',
  'ddd MMM DD HH:mm:ss z YYYY',
  'ddd MMM D YYYY HH:mm:ss',
  'ddd MMM D HH:mm:ss YYYY',
  'ddd, DD MMM YYYY HH:mm:ss Z',
  'ddd, D MMM YYYY HH:mm:ss Z',
  'MMM DD, YYYY HH:mm:ss',
  'MMM D, YYYY HH:mm:ss',
  'ddd, D MMM YYYY HH:mm:ss',
  'dddd, MMMM D YYYY HH:mm:ss',

  // 🌏 International / Regional formats
  'DD.MM.YYYY',
  'D.M.YYYY',
  'YYYY.MM.DD',
  'YYYY/MM/DD',
  'YYYY年MM月DD日 HH時mm分ss秒',
  'YYYY.MM.DD G [at] HH:mm:ss z',

  // ⌚️ Minimal time formats
  'HH:mm:ss',
  'HH:mm',
  'h:mm a',
  'hh:mm A',
  'h:mm:ss A',
  'hh:mm:ss A',

  // 🧩 Rare edge-cases
  'DD MMM YY HH:mm',
  'DD MMM YY h:mm a',
  'DD/MM/YY HH:mm',
  'DD/MM/YY h:mm a',
  'D-M-YYYY H:m:s',
];


export const calculateEndTime = (duration: number, startTime: string): string => {
  const startDate = moment(startTime, formats);
  startDate.add(duration, 'seconds');
  return startDate.format('YYYY-MM-DD HH:mm:ss');
}

export const isToday = (dateStr: string) => {
  return moment(dateStr, 'YYYY-MM-DD').isSame(moment(), 'day');
}

export const isYesterday = (dateStr: string) => {
  return moment(dateStr, 'YYYY-MM-DD').isSame(moment().subtract(1, 'days'), 'day');
}

export const getDateLabel = (dateStr: string) => {
  if (isToday(dateStr)) return 'Today';
  if (isYesterday(dateStr)) return 'Yesterday';
  return moment(dateStr, 'YYYY-MM-DD').format('DD MMM YYYY')
}
