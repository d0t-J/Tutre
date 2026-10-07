import { useEffect, useState } from 'react';
import CurriculumTranslations from '../../features/translations/components/CurriculumTranslations';
import GlossaryTerms from '../../features/translations/components/GlossaryTerms';

const TABS = [
  { id: 'curriculum', label: 'Curriculum', Component: CurriculumTranslations },
  { id: 'glossary', label: 'Glossary', Component: GlossaryTerms },
];

// Urdu needs a Nastaliq font to be checked properly; load it for this page only.
function useUrduFont() {
  useEffect(() => {
    if (document.getElementById('urdu-font')) return;
    const link = document.createElement('link');
    link.id = 'urdu-font';
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;600&display=swap';
    document.head.appendChild(link);
  }, []);
}

export default function TranslationsPage() {
  const [tab, setTab] = useState('curriculum');
  const { Component } = TABS.find(t => t.id === tab);
  useUrduFont();

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto bg-white rounded-none sm:rounded-2xl shadow-sm border-0 sm:border border-slate-100">
        <div className="p-5 sm:p-6 pb-0">
          <h2 className="text-lg font-extrabold text-slate-800">Urdu translations</h2>
          <p className="text-sm text-slate-500 mt-1">
            Students see a translation only after a reviewer verifies it; until then they see the English.
          </p>
          <div role="tablist" className="flex gap-1 mt-4 border-b border-slate-100">
            {TABS.map(t => (
              <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}
                className={`cursor-pointer px-3 py-2 text-sm font-bold border-b-2 -mb-px transition-colors ${
                  tab === t.id ? 'border-primary-600 text-primary-700' : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <div className="p-5 sm:p-6">
          <Component />
        </div>
      </div>
    </div>
  );
}
