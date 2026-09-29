/**
 * Parses a simulation HTML payload, extracts the `<div id="visiolab-description">`
 * content (if present), removes that element, and returns the cleaned HTML.
 * Shared by AI generation, AI update, and manual HTML upload paths.
 */
export function extractDescription(htmlString) {
  const doc = new DOMParser().parseFromString(htmlString, 'text/html');
  const descElement = doc.getElementById('visiolab-description');
  let description = '';
  if (descElement) {
    description = descElement.innerHTML;
    descElement.remove();
  }
  return { cleanedHtml: doc.documentElement.outerHTML, description };
}
