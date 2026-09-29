import DOMPurify from 'dompurify';

// Add hook for tabnabbing protection on links opened in new tabs
DOMPurify.addHook('afterSanitizeAttributes', function (node) {
  if (node.tagName === 'A' && node.getAttribute('target') === '_blank') {
    node.setAttribute('rel', 'noopener noreferrer');
  }
});

/**
 * Centrally configured DOMPurify sanitizer.
 * Enforces safe URI patterns and protects against tabnabbing.
 */
export function sanitizeHTML(htmlContent) {
  if (!htmlContent) return '';

  return DOMPurify.sanitize(htmlContent, {
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.-]+(?:[^a-z+.:-]|$))/i,
    ADD_ATTR: ['target'] // explicitly allow target attr for links so our hook works
  });
}
