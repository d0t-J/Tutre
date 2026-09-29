export const printStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@600;700;800&display=swap');

  @page {
    size: A4 portrait;
    margin: 15mm 18mm;
  }
  
  .print-container { 
    padding: 0 !important; 
    margin: 0;
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  
  /* Typography matching standard compact textbook flow */
  .pdf-content { font-size: 10pt; line-height: 1.45; color: #334155; }
  .pdf-content h1 { font-family: 'Outfit', sans-serif; color: #0f172a; font-weight: 800; font-size: 18pt; margin-top: 1.2em; margin-bottom: 0.4em; line-height: 1.2; page-break-after: avoid !important; break-after: avoid !important; }
  .pdf-content h2 { font-family: 'Outfit', sans-serif; color: #007695; font-weight: 700; font-size: 13pt; margin-top: 1.3em; margin-bottom: 0.4em; line-height: 1.25; page-break-after: avoid !important; break-after: avoid !important; border-bottom: 1.5pt solid #e0f8fc; padding-bottom: 0.2em; }
  .pdf-content h3 { font-family: 'Outfit', sans-serif; color: #0f172a; font-weight: 600; font-size: 11pt; margin-top: 1.1em; margin-bottom: 0.3em; line-height: 1.3; page-break-after: avoid !important; break-after: avoid !important; }
  .pdf-content p { margin-top: 0.4em; margin-bottom: 0.5em; page-break-inside: avoid; break-inside: avoid; }
  .pdf-content ul, .pdf-content ol { padding-left: 1.4em; margin-top: 0.3em; margin-bottom: 0.5em; }
  .pdf-content li { margin-top: 0.2em; margin-bottom: 0.2em; page-break-inside: avoid; break-inside: avoid; }
  .pdf-content blockquote { font-style: italic; border-left: 3.5px solid #0095b6; background-color: #f0fdfa; margin: 0.8em 0; padding: 0.6em 0.9em; page-break-inside: avoid !important; break-inside: avoid !important; border-radius: 0 4px 4px 0; color: #0f766e; }
  
  /* Table Styles - Strictly prevent page splitting across tables */
  .pdf-content table { width: 100%; border-collapse: collapse; margin: 1em 0; page-break-inside: avoid !important; break-inside: avoid !important; font-size: 9pt; font-family: 'Inter', sans-serif; border: 1px solid #cbd5e1; border-radius: 4px; }
  .pdf-content tr { page-break-inside: avoid !important; break-inside: avoid !important; border-bottom: 1px solid #e2e8f0; }
  .pdf-content th { background-color: #007695 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; color: #ffffff !important; padding: 7px 10px; text-align: left; font-weight: 700; border-right: 1px solid #005e77; vertical-align: middle; }
  .pdf-content th:last-child { border-right: none; }
  .pdf-content td { padding: 6px 10px; border-right: 1px solid #e2e8f0; color: #334155; vertical-align: middle; }
  .pdf-content td:last-child { border-right: none; }
  .pdf-content tbody tr:nth-child(even) td { background-color: #f8fafc !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  
  /* Math block handling */
  .katex-display { page-break-inside: avoid !important; break-inside: avoid !important; margin: 0.8em 0; overflow-x: visible; }
  .katex { font-size: 1.0em; }
`;
