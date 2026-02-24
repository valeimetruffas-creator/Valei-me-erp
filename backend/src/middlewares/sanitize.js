function sanitizeString(value) {
  return value.replace(/[<>]/g, "").trim();
}

function sanitizeRecursive(value) {
  if (Array.isArray(value)) {
    return value.map(sanitizeRecursive);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, val]) => [key, sanitizeRecursive(val)]),
    );
  }

  if (typeof value === "string") {
    return sanitizeString(value);
  }

  return value;
}

export function sanitizeBody(req, _res, next) {
  if (req.body && typeof req.body === "object") {
    req.body = sanitizeRecursive(req.body);
  }

  next();
}
