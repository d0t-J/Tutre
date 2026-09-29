import katex from 'katex';
import { decodeHtmlEntities } from './htmlEntities';

// Safely renders a LaTeX string to HTML using KaTeX.
function renderMath(latex, displayMode, isDocx = false) {
  try {
    const decoded = decodeHtmlEntities(latex.trim());
    return katex.renderToString(decoded, {
      displayMode,
      throwOnError: false,
      strict: false,
      trust: true,
      output: isDocx ? 'mathml' : 'htmlAndMathml'
    });
  } catch {
    const escaped = latex.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return `<span class="katex-error" style="color:#cc0000" title="KaTeX parse error">${escaped}</span>`;
  }
}

function processMathInString(htmlString, isDocx = false) {
  if (!htmlString) return htmlString;

  let processed = htmlString;

  const htmlTags = [];
  processed = processed.replace(/<[^>]+>/g, (tag) => {
    htmlTags.push(tag);
    return `\uFFFFHTML${htmlTags.length - 1}\uFFFF`;
  });

  processed = processed.replace(/\$\$([\s\S]*?)\$\$/g, (_, math) => renderMath(math, true, isDocx));
  processed = processed.replace(/\\\[([\s\S]*?)\\\]/g, (_, math) => renderMath(math, true, isDocx));
  processed = processed.replace(/\\\(([\s\S]*?)\\\)/g, (_, math) => renderMath(math, false, isDocx));
  processed = processed.replace(/(?<!\$)\$(?!\$)(\S(?:[^$\n]*?\S)?)\$(?!\$)/g, (_, math) => renderMath(math, false, isDocx));

  processed = processed.replace(/\uFFFFHTML(\d+)\uFFFF/g, (_, idx) => htmlTags[parseInt(idx, 10)]);

  return processed;
}

// Pre-renders LaTeX math expressions in an HTML string using KaTeX.
export function preprocessLegacyMath(htmlString) {
  return processMathInString(htmlString, false);
}

// Pre-renders LaTeX math strictly as MathML for MS Word compatibility
export function preprocessMathForDocx(htmlString) {
  return processMathInString(htmlString, true);
}
