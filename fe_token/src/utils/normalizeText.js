 

export const toTitleCase = (str) => {
  if (!str || typeof str !== 'string') return str;
  return str
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

// Normalize only letters — numbers/special chars untouched
// Used for names, city, place of birth etc.
export const normalizeName = (str) => {
  if (!str || typeof str !== 'string') return str;
  return toTitleCase(str);
};