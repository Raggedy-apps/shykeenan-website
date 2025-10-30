import DOMPurify from 'dompurify';

/**
 * Sanitizes HTML content for client-side rendering
 * @param {string} content - The content to sanitize
 * @returns {string} - Sanitized content
 */
export function sanitizeHtml(content) {
  if (typeof content !== 'string') {
    return '';
  }

  return DOMPurify.sanitize(content, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a'],
    ALLOWED_ATTR: ['href', 'target'],
    FORBID_SCRIPT: true,
  });
}

/**
 * Enhanced sanitization for plain text content
 * SECURITY: Implements defense-in-depth approach
 * @param {string} content - The content to sanitize
 * @returns {string} - Sanitized content
 */
export function sanitizeText(content) {
  if (typeof content !== 'string') {
    return '';
  }

  // Multi-layer sanitization approach
  let sanitized = content
    .trim()
    // Layer 1: Remove HTML brackets and dangerous characters
    .replace(/[<>]/g, '')
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
    // Layer 2: Remove dangerous protocols
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
    .replace(/vbscript:/gi, '')
    // Layer 3: Remove event handlers
    .replace(/on\w+=/gi, '')
    // Layer 4: Remove potentially dangerous functions
    .replace(/eval\s*\(/gi, '')
    .replace(/alert\s*\(/gi, '')
    .replace(/confirm\s*\(/gi, '')
    // Layer 5: Length limits
    .slice(0, 10000); // Reasonable content length limit

  // Layer 6: Pattern-based validation
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /eval\s*\(/i,
    /alert\s*\(/i,
    /confirm\s*\(/i,
    /document\.cookie/i,
    /document\.location/i,
    /window\.open/i
  ];

  // If content matches any dangerous pattern, return empty string
  if (dangerousPatterns.some(pattern => pattern.test(sanitized))) {
    return '';
  }

  return sanitized;
}

/**
 * Sanitizes array of tags for client-side use
 * @param {Array|string} tags - Tags to sanitize
 * @returns {Array} - Sanitized tags array
 */
export function sanitizeTags(tags) {
  if (!tags) return [];

  const tagArray = Array.isArray(tags) ? tags : tags.split(/[,;]+/).map(tag => tag.trim());

  return tagArray
    .filter(tag => tag && typeof tag === 'string')
    .map(tag => sanitizeText(tag))
    .filter(tag => {
      // Filter out tags with dangerous keywords even after sanitization
      if (tag.match(/script|javascript|alert|eval/i)) {
        return false;
      }
      return tag.length > 0 && tag.length <= 50;
    })
    .slice(0, 20); // Limit number of tags
}

/**
 * Sanitizes URL for client-side use
 * @param {string} url - The URL to sanitize
 * @returns {string} - Sanitized URL
 */
export function sanitizeUrl(url) {
  if (typeof url !== 'string') {
    return '';
  }

  try {
    const parsedUrl = new URL(url, window.location.origin);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return '';
    }
    return parsedUrl.toString();
  } catch {
    return '';
  }
}