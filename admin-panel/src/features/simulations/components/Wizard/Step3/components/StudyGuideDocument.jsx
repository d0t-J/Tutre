import JoditEditor from 'jodit-react';
import { sanitizeHTML } from '../../../../../../utils/sanitizeHTML';
import { preprocessLegacyMath } from '../../../../utils/mathPreprocessor';

export default function StudyGuideDocument({
  isEditing,
  studyGuide,
  setStudyGuide
}) {
  return (
    <div className="h-full flex-1 w-full overflow-auto custom-scrollbar p-6 sm:p-10">
      <div className="mx-auto bg-white shadow-lg border border-slate-200 w-[210mm] min-w-[210mm] shrink-0 min-h-[297mm]">
        {isEditing ? (
          <div className="w-full h-full">
            <JoditEditor
              value={preprocessLegacyMath(studyGuide || '')}
              config={{
                readonly: false,
                placeholder: 'Start typing the study guide here or click "Generate with AI" above...',
                style: { height: 'auto', minHeight: '100%', background: 'transparent' },
                toolbarSticky: false,
                showCharsCounter: false,
                showWordsCounter: false,
                showXPathInStatusbar: false,
                iframe: false,
                className: 'jodit-document-mode'
              }}
              onBlur={newContent => setStudyGuide(newContent)}
            />
          </div>
        ) : (
          <div className="w-full h-full p-[20mm]">
            <div
              className="prose prose-slate max-w-none text-slate-800"
              dangerouslySetInnerHTML={{ __html: sanitizeHTML(preprocessLegacyMath(studyGuide || '')) }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
