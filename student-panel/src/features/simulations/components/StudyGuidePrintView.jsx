import React from 'react';
import 'katex/dist/katex.min.css';
import { printStyles } from './StudyGuidePrintStyles';
import { sanitizeHTML } from '../../../utils/sanitizeHTML';
import Logo from '../../../assets/tutre_logo.png';
import i18n from '../../../i18n';

const StudyGuidePrintView = React.forwardRef(({ simulation, htmlContent, snapshotDataUrl }, ref) => {
  // The document follows the language of the study guide, not of the interface.
  const language = simulation?.study_guide_language === 'ur' ? 'ur' : 'en';
  const urdu = language === 'ur';
  const t = (key, options) => i18n.t(`simulations:export.${key}`, { lng: language, interpolation: { escapeValue: false }, ...options });
  const date = new Intl.DateTimeFormat(urdu ? 'ur-PK-u-nu-latn' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date());

  // Strip redundant leading <h1> tags matching the document title
  const cleanHtml = React.useMemo(() => {
    if (!htmlContent) return '';
    return htmlContent.replace(/^\s*<h1\b[^>]*>[\s\S]*?<\/h1>/i, '');
  }, [htmlContent]);

  return (
    <div
      ref={ref}
      className="print-container"
        dir={urdu ? 'rtl' : 'ltr'}
        lang={language}
        style={{
          fontFamily: urdu ? "'Inter', 'Noto Nastaliq Urdu', serif" : "'Inter', system-ui, -apple-system, sans-serif",
          lineHeight: urdu ? 1.9 : undefined,
          color: '#1e293b',
          backgroundColor: '#ffffff'
        }}
      >
        <style type="text/css">{printStyles}</style>

        {/* Academic Document Header */}
        <div style={{ borderBottom: '2px solid #0095b6', paddingBottom: '14px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <img src={Logo} alt="Tutre" style={{ height: '28px', width: 'auto' }} />
              <div>
                <span style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>Tutre</span>
                <span style={{ fontSize: '10px', color: '#007695', fontWeight: 700, marginInlineStart: '6px', textTransform: 'uppercase' }}>{t('guideBadge')}</span>
              </div>
            </div>
            <div style={{ backgroundColor: '#e0f8fc', color: '#007695', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {simulation?.subject || 'Science'}
            </div>
          </div>

          <h1 style={{ margin: '0 0 6px 0', color: '#0f172a', fontSize: '24px', fontWeight: 800, fontFamily: urdu ? "'Outfit', 'Noto Nastaliq Urdu', serif" : "'Outfit', sans-serif", lineHeight: urdu ? 1.8 : 1.2 }}>
            {simulation?.topic}
          </h1>
          <p style={{ margin: 0, color: '#64748b', fontSize: '11px', fontWeight: 500 }}>
            {t('generatedOn', { date })}
          </p>

          {snapshotDataUrl && (
            <div style={{ marginTop: '14px', textAlign: 'center' }}>
              <img
                src={snapshotDataUrl}
                alt="Simulation Visual Snapshot"
                style={{ maxHeight: '200px', maxWidth: '100%', borderRadius: '8px', border: '1px solid #e2e8f0', objectFit: 'contain' }}
              />
            </div>
          )}
        </div>

        {/* AI Content with Pre-processed KaTeX and Styled Tables */}
        {cleanHtml && (
          <div
            className="pdf-content"
            dangerouslySetInnerHTML={{ __html: sanitizeHTML(cleanHtml) }}
          />
        )}

        {/* Footer */}
        <div style={{ marginTop: '30px', borderTop: '1px solid #e2e8f0', paddingTop: '12px', textAlign: 'center', breakInside: 'avoid', pageBreakInside: 'avoid' }}>
          <p style={{ color: '#94a3b8', fontSize: '10px', fontWeight: 500, margin: 0 }}>
            {t('footer')}
          </p>
        </div>
    </div>
  );
});

export default StudyGuidePrintView;
