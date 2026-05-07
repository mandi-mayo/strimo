/**
 * Security Utilities for URL validation and sanitization
 */

// Whitelist of trusted domains for external links
const TRUSTED_DOMAINS = [
  'tmdb.org',
  'themoviedb.org',
  'imdb.com',
  'image.tmdb.org',
  'youtube.com',
  'vimeo.com',
  'vidlink.pro',
  'vidsrc.to',
  'vidsrc.me',
  'vidsrc.pm',
  'vidsrc.xyz',
  'embed.su',
  'github.com',
  'vercel.app',
  'localhost'
];

/**
 * Validates if a URL is safe to open/embed
 * @param {string} urlString 
 * @returns {boolean}
 */
export const isSafeUrl = (urlString) => {
  if (!urlString) return false;
  
  try {
    const url = new URL(urlString);
    
    // Only allow http/https
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
    
    // Check if domain or any parent domain is in whitelist
    const hostname = url.hostname.toLowerCase();
    return TRUSTED_DOMAINS.some(domain => 
      hostname === domain || hostname.endsWith('.' + domain)
    );
  } catch (e) {
    // If it's a relative URL, it's safe for our app
    if (urlString.startsWith('/') || urlString.startsWith('./')) return true;
    return false;
  }
};

/**
 * Sanitize URL to prevent common injection attacks
 */
export const sanitizeUrl = (url) => {
  if (!url) return '';
  return url.replace(/[^-A-Za-z0-9+&@#/%?=~_|!:,.;()]/g, '');
};
