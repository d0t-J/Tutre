import { marked } from 'marked';
import { sanitizeHTML } from './sanitizeHTML';

/**
 * Converts Markdown to HTML while preserving LaTeX math blocks ($...$ and $$...$$).
 * This prevents marked from interpreting Markdown syntax (like underscores for italics) inside LaTeX equations.
 */
export function markdownToHtml(markdown) {
  if (!markdown) return '';

  const mathBlocks = [];
  
  // Replace $$...$$ with placeholders
  let processed = markdown.replace(/\$\$([\s\S]*?)\$\$/g, (match) => {
    mathBlocks.push(match);
    return `@@MATHBLOCK${mathBlocks.length - 1}@@`;
  });

  // Replace $...$ with placeholders. Note: using regex that avoids matching across newlines if possible, but allowing it to be safe.
  processed = processed.replace(/(?<!\$)\$(?!\$)(\S(?:[^$]*?\S)?)\$(?!\$)/g, (match) => {
    mathBlocks.push(match);
    return `@@MATHBLOCK${mathBlocks.length - 1}@@`;
  });

  // Convert the remaining markdown to HTML
  let html = marked.parse(processed);

  // Restore the math blocks
  mathBlocks.forEach((block, index) => {
    // The placeholder might be wrapped in <p> tags by marked, so we just replace the exact placeholder text
    html = html.replace(`@@MATHBLOCK${index}@@`, block);
  });

  // Run through DOMPurify to ensure safe HTML
  return sanitizeHTML(html);
}
