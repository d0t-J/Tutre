import { useSimulation } from '../../context/SimulationContext';
import { useWizard } from '../../context/WizardContext';
import ClassSelector from '../ClassSelector';
import SubjectSelector from '../SubjectSelector';
import ChapterSelector from '../ChapterSelector';
import { LayoutTemplate, Lightbulb, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import ImageUploader from '../TopicInput/ImageUploader';
import HtmlUploader from '../TopicInput/HtmlUploader';
import TopicDetailsForm from './TopicDetailsForm';

export default function Step1Requirements() {
  const { topic, selectedChapter } = useSimulation();
  const { setWizardStep } = useWizard();

  const handleNext = () => {
    if (!selectedChapter) {
      toast.warning("Please select a chapter before proceeding.");
      return;
    }
    if (!topic.trim()) {
      toast.warning("Please enter a topic name before proceeding.");
      return;
    }
    setWizardStep(2);
  };

  return (
    <div className="w-full h-full p-4 flex flex-col">
      <div className="w-full h-full bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col overflow-y-auto overflow-x-hidden">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 flex-1">
          
          <div className="flex flex-col space-y-8">
            <div>
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
                <LayoutTemplate className="w-5 h-5 text-primary-500" />
                1. Class, Subject & Chapter
              </h3>
              <div className="grid sm:grid-cols-3 gap-4 lg:gap-6">
                <ClassSelector />
                <SubjectSelector />
                <ChapterSelector />
              </div>
            </div>

            <div className="h-px bg-slate-100" />

            <div>
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
                <Lightbulb className="w-5 h-5 text-amber-500" />
                2. Topic & Description
              </h3>
              <TopicDetailsForm />
            </div>
          </div>

          <div className="flex flex-col h-full lg:pl-8 lg:border-l border-slate-100 gap-6">
            <div className="flex flex-col flex-1">
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Reference Image (Optional)</label>
              <div className="w-full flex-1 min-h-[220px] flex flex-col">
                <ImageUploader variant="wizard" />
              </div>
            </div>

            <div className="h-px bg-slate-100" />

            <div className="flex flex-col">
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Or Upload Pre-built HTML (Optional)</label>
              <div className="w-full min-h-[120px] flex flex-col">
                <HtmlUploader variant="wizard" />
              </div>
            </div>
          </div>

        </div>

        <div className="flex justify-end items-center mt-auto shrink-0 pt-4 border-t border-slate-100 w-full">
          <button
            onClick={handleNext}
            className="flex items-center justify-center gap-2 px-4 sm:px-8 py-2.5 sm:py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-all whitespace-nowrap"
          >
            <span className="sm:hidden">Continue</span>
            <span className="hidden sm:inline">Continue to Prompt Engine</span>
            <ArrowRight className="w-4 h-4 shrink-0" />
          </button>
        </div>
      </div>
    </div>
  );
}
