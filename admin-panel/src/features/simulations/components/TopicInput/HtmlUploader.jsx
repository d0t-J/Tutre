import { FileCode, FileUp, X } from 'lucide-react';
import { useSimulation } from '../../context/SimulationContext';

export default function HtmlUploader({ variant = 'classic' }) {
  const {
    isGenerating,
    isDragging,
    uploadedFileName,
    handleFileUpload,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleRemoveFile,
  } = useSimulation();

  if (uploadedFileName) {
    return (
      <div className="w-full flex items-center gap-2 border border-primary-200 bg-primary-50/50 rounded-lg px-3 py-2 shadow-sm">
        <FileCode className="w-4 h-4 text-primary-500 shrink-0" />
        <span className="flex-1 min-w-0 truncate text-xs font-semibold text-slate-700" title={uploadedFileName}>
          {uploadedFileName}
        </span>
        <button
          onClick={handleRemoveFile}
          aria-label="Remove uploaded file"
          title="Remove uploaded file"
          className="cursor-pointer shrink-0 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-all transform hover:scale-110 shadow-sm"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <label
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex flex-col items-center justify-center w-full border-2 border-dashed cursor-pointer transition-all ${
        isGenerating ? 'opacity-50 pointer-events-none' : ''
      } ${
        isDragging ? 'bg-primary-50 border-primary-500' : 'border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-primary-400'
      } ${variant === 'wizard' ? 'flex-1 min-h-30 rounded-3xl p-4' : 'min-h-12.5 rounded-lg p-2'}`}
    >
      <div className="flex flex-col items-center justify-center text-slate-500 text-center pointer-events-none">
        <FileUp className={`${variant === 'wizard' ? 'w-8 h-8 mb-2' : 'w-5 h-5 mb-1'} ${isDragging ? 'text-primary-500 animate-bounce' : 'text-primary-400 opacity-80'}`} />
        <p className={`${variant === 'wizard' ? 'text-sm' : 'text-[10px] 2xl:text-xs'} font-semibold leading-tight px-1`}>
          {isDragging ? 'Drop HTML file here' : 'Drag & drop an HTML file, or click to browse'}
        </p>
        <p className={`${variant === 'wizard' ? 'text-xs' : 'text-[9px] 2xl:text-[10px]'} text-slate-400 mt-0.5`}>
          .html or .htm — max 2 MB
        </p>
      </div>
      <input type="file" className="hidden" accept=".html,.htm" onChange={handleFileUpload} disabled={isGenerating} />
    </label>
  );
}
