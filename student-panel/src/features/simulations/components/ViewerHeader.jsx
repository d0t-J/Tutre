import { useState, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, PlayCircle } from 'lucide-react';
import { useSimulationViewer } from '../context/SimulationViewerContext';
import { useReactToPrint } from 'react-to-print';
import StudyGuidePrintView from './StudyGuidePrintView';
import ViewerHeaderActions from './ViewerHeaderActions';

export default function ViewerHeader() {
  const { simulation, isGeneratingPDF, isGeneratingDOCX, generateStudyGuideData, generateStudyGuideDOCX } = useSimulationViewer();
  const { classSlug, subjectSlug, chapterSlug } = useParams();
  const [printData, setPrintData] = useState({ htmlContent: '', snapshotDataUrl: '' });
  const printComponentRef = useRef(null);

  const reactToPrintFn = useReactToPrint({
    contentRef: printComponentRef,
    documentTitle: simulation ? `${simulation.topic.replace(/\s+/g, '_')}_Study_Guide` : 'Study_Guide',
  });

  const onDownloadClick = async () => {
    const data = await generateStudyGuideData();
    if (data) {
      setPrintData(data);
      setTimeout(() => {
        reactToPrintFn();
      }, 100);
    }
  };

  const onDownloadDocxClick = async () => {
    if (generateStudyGuideDOCX) {
      await generateStudyGuideDOCX();
    }
  };

  let backLink = '/dashboard';
  if (classSlug && subjectSlug && chapterSlug) {
    backLink = `/class/${classSlug}/subject/${subjectSlug}/chapter/${chapterSlug}`;
  } else if (classSlug && subjectSlug) {
    backLink = `/class/${classSlug}/subject/${subjectSlug}`;
  }

  return (
    <>
      <header className="bg-white border border-slate-200 py-2.5 px-4 sm:px-6 shadow-sm flex items-center justify-between gap-2 shrink-0 z-20 relative mt-4 mx-4 mb-4 rounded-xl">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Link 
            to={backLink} 
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-900 transition-colors shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 truncate">
              <PlayCircle className="w-3.5 h-3.5 text-primary-500 shrink-0" />
              <span className="truncate">{simulation.subject} Simulation</span>
            </div>
            <h1 className="text-base sm:text-lg font-extrabold text-slate-900 leading-none truncate">{simulation.topic}</h1>
          </div>
        </div>

        <ViewerHeaderActions
          onDownloadDocxClick={onDownloadDocxClick}
          onDownloadClick={onDownloadClick}
          isGeneratingPDF={isGeneratingPDF}
          isGeneratingDOCX={isGeneratingDOCX}
          simulation={simulation}
          generateStudyGuideData={generateStudyGuideData}
        />
      </header>

      {/* Hidden Printable Component */}
      <div className="hidden">
        <StudyGuidePrintView 
          ref={printComponentRef} 
          simulation={simulation} 
          htmlContent={printData.htmlContent} 
          snapshotDataUrl={printData.snapshotDataUrl} 
        />
      </div>
    </>
  );
}
