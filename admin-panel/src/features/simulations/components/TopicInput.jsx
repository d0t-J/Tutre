import ImageUploader from './TopicInput/ImageUploader';
import HtmlUploader from './TopicInput/HtmlUploader';
import GenerateActions from './TopicInput/GenerateActions';
import TopicForm from './TopicInput/TopicForm';

export default function TopicInput() {
  return (
    <div className="bg-white p-2 sm:p-3 rounded-xl shadow-sm border border-slate-200 flex-1 flex flex-col gap-2">
      <h2 className="text-sm sm:text-base font-bold text-slate-800 flex items-center gap-2">
        <span className="bg-slate-100 text-slate-600 w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[10px]">3</span>
        Enter Details
      </h2>

      <div className="flex flex-col md:grid md:grid-cols-2 lg:flex lg:flex-col gap-2 flex-1 min-h-0">
        <TopicForm />

        {/* Right Column: Image, HTML Upload and Button */}
        <div className="flex flex-col gap-3 shrink-0">
          <ImageUploader />
          <details className="group">
            <summary className="text-[10px] sm:text-xs font-semibold text-slate-500 cursor-pointer hover:text-slate-700 transition-colors select-none">
              Or upload pre-built HTML
            </summary>
            <div className="mt-2">
              <HtmlUploader variant="classic" />
            </div>
          </details>
          <GenerateActions />
        </div>
      </div>
    </div>
  );
}
