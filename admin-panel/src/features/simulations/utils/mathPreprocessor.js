import katex from 'katex';
import { HTML_ENTITIES } from './htmlEntities';

// Decodes HTML entities commonly appearing inside math content.
function decodeHtmlEntities(str) {
  return str.replace(/&[a-zA-Z0-9#]+;/g, (entity) => {
    if (HTML_ENTITIES[entity] !== undefined) return HTML_ENTITIES[entity];
    const decMatch = entity.match(/^&#(\d+);$/);
    if (decMatch) return String.fromCharCode(parseInt(decMatch[1], 10));
    const hexMatch = entity.match(/^&#x([0-9a-fA-F]+);$/);
    if (hexMatch) return String.fromCharCode(parseInt(hexMatch[1], 16));
    return entity;
  });
}

// Safely renders a LaTeX string to HTML using KaTeX.
function renderMath(latex, displayMode) {
  try {
    const decoded = decodeHtmlEntities(latex.trim());
    return katex.renderToString(decoded, {
      displayMode,
      throwOnError: false,
      strict: false,
      trust: true,
    });
  } catch {
    const escaped = latex.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return `<span class="katex-error" style="color:#cc0000" title="KaTeX parse error">${escaped}</span>`;
  }
}

// Pre-renders LaTeX math expressions in an HTML string using KaTeX.
export function preprocessLegacyMath(htmlString) {
  if (!htmlString) return htmlString;

  let processed = htmlString;

  const htmlTags = [];
  processed = processed.replace(/<[^>]+>/g, (tag) => {
    htmlTags.push(tag);
    return `\uFFFFHTML${htmlTags.length - 1}\uFFFF`;
  });

  processed = processed.replace(/\$\$([\s\S]*?)\$\$/g, (_, math) => renderMath(math, true));
  processed = processed.replace(/\\\[([\s\S]*?)\\\]/g, (_, math) => renderMath(math, true));
  processed = processed.replace(/\\\(([\s\S]*?)\\\)/g, (_, math) => renderMath(math, false));
  processed = processed.replace(/(?<!\$)\$(?!\$)(\S(?:[^$\n]*?\S)?)\$(?!\$)/g, (_, math) => renderMath(math, false));

  processed = processed.replace(/\uFFFFHTML(\d+)\uFFFF/g, (_, idx) => htmlTags[parseInt(idx, 10)]);

  return processed;
}
