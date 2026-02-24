// Utilitários de segurança para sanitização de inputs

export const sanitize = (text: string): string => {
  if (!text || typeof text !== 'string') return '';
  
  return text
    .replace(/[<>]/g, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+=/gi, "")
    .trim();
};

export const sanitizeObject = (obj: any): any => {
  if (!obj || typeof obj !== 'object') return obj;
  
  const sanitized = { ...obj };
  
  for (const key in sanitized) {
    if (typeof sanitized[key] === 'string') {
      sanitized[key] = sanitize(sanitized[key]);
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeObject(sanitized[key]);
    }
  }
  
  return sanitized;
};

export const validateInput = (value: string, maxLength: number = 255): boolean => {
  if (!value || typeof value !== 'string') return false;
  if (value.length > maxLength) return false;
  if (/<script|javascript:|on\w+=/i.test(value)) return false;
  return true;
};