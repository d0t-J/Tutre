import { useState, useEffect } from 'react';
import { useSimulation } from '../../../context/SimulationContext';
import { BookOpen, Maximize2 } from 'lucide-react';
import { markdownToHtml } from '../../../utils/markdownToHtml';
import { useStudyGuideStream } from '../../../hooks/useStudyGuideStream';
import StudyGuideHeader from './components/StudyGuideHeader';
import StudyGuideEmptyState from './components/StudyGuideEmptyState';
import StudyGuideDocument from './components/StudyGuideDocument';

export default function StudyGuideEditor() {
  const { topic, details, studyGuide, setStudyGuide } = useSimulation();
  const [isEditing, setIsEditing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { isGeneratingGuide, generateNotes } = useStudyGuideStream(topic, details, setStudyGuide);

  // Auto-convert legacy markdown study guides to HTML
  useEffect(() => {
    if (studyGuide && !studyGuide.trim().startsWith('<') && (studyGuide.includes('# ') || studyGuide.includes('**') || studyGuide.includes('\n- '))) {
      const html = markdownToHtml(studyGuide);
      setStudyGuide(html);
    }
  }, [studyGuide, setStudyGuide]);

  const hasContent = Boolean(studyGuide && studyGuide.trim());

  if (!isModalOpen) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center gap-4 bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 shadow-sm border border-slate-200">
          <BookOpen className="w-8 h-8 text-primary-500" />
        </div>
        <div>
          <h3 className="font-semibold text-slate-700">A4 Document Editor</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-70 leading-relaxed">
            The study guide is formatted as a full A4 document. Open the editor in fullscreen to view or generate it without scrolling.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium text-sm rounded-lg shadow-sm flex items-center gap-2 transition-all mt-2 cursor-pointer"
        >
          <Maximize2 className="w-4 h-4" />
          Open Document Editor
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl h-[95vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200">
        <StudyGuideHeader
          hasContent={hasContent}
          isEditing={isEditing}
          setIsEditing={setIsEditing}
          generateNotes={generateNotes}
          isGeneratingGuide={isGeneratingGuide}
          onClose={() => setIsModalOpen(false)}
        />

        <div className="flex-1 overflow-hidden bg-slate-100 flex flex-col">
          {hasContent || isEditing ? (
            <StudyGuideDocument
              isEditing={isEditing}
              studyGuide={studyGuide}
              setStudyGuide={setStudyGuide}
            />
          ) : (
            <StudyGuideEmptyState
              generateNotes={generateNotes}
              isGeneratingGuide={isGeneratingGuide}
              onWriteManually={() => setIsEditing(true)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
