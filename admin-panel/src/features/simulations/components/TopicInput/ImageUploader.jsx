import { UploadCloud, X, ClipboardPaste, ImagePlus, Sparkles } from 'lucide-react';
import { useImageUpload } from './useImageUpload';
import { useSimulation } from '../../context/SimulationContext';

export default function ImageUploader({ variant = 'classic' }) {
  const { imageBase64, setImageBase64 } = useSimulation();
  const { 
    isDragging, 
    handleImageUpload, 
    handleDragOver, 
    handleDragLeave, 
    handleDrop, 
    handlePasteClick 
  } = useImageUpload(setImageBase64);

  return (
    <div className="w-full relative mt-0 flex-1 flex flex-col min-h-22.5">
      {!imageBase64 ? (
        <div className="flex flex-col h-full gap-2">
          {variant === 'wizard' ? (
            <label 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`flex flex-col items-center justify-center w-full flex-1 min-h-62.5 border-2 border-dashed rounded-3xl cursor-pointer transition-all overflow-hidden relative ${isDragging ? 'bg-primary-50 border-primary-500' : 'border-slate-200 bg-slate-50 hover:bg-slate-100/50 hover:border-primary-300'}`}
            >
              <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, black 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
              
              <div className="relative mb-6 pointer-events-none">
                <div className="absolute inset-0 bg-primary-100 rounded-full blur-xl opacity-40 animate-pulse"></div>
                <div className="relative bg-white p-4 sm:p-5 rounded-3xl shadow-sm border border-slate-200 flex items-center justify-center transition-transform duration-500">
                  <ImagePlus className={`w-10 h-10 sm:w-14 sm:h-14 ${isDragging ? 'text-primary-500 animate-bounce' : 'text-primary-400 opacity-80'}`} />
                </div>
                <Sparkles className="absolute -top-3 -right-3 w-5 h-5 text-primary-400 animate-pulse opacity-70" />
                <UploadCloud className="absolute -bottom-2 -left-3 w-5 h-5 text-primary-400 animate-pulse opacity-70" style={{ animationDelay: '1s' }} />
              </div>

              <h3 className="text-base sm:text-xl font-bold text-slate-800 mb-2 relative z-10 pointer-events-none">
                {isDragging ? 'Drop it here!' : 'Add a Reference Image'}
              </h3>
              <p className="text-xs sm:text-sm font-medium text-slate-500 max-w-70 text-center relative z-10 pointer-events-none">
                {isDragging ? 'Release to upload your image' : 'Drag & drop an image, paste from clipboard, or click to browse files.'}
              </p>
              
              <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
            </label>
          ) : (
            <label 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`flex flex-col items-center justify-center w-full flex-1 min-h-12.5 border-2 border-dashed rounded-lg cursor-pointer transition-all ${isDragging ? 'bg-primary-50 border-primary-500' : 'border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-primary-400'}`}
            >
              <div className="flex flex-col items-center justify-center text-slate-500 p-2 text-center pointer-events-none">
                <UploadCloud className={`w-5 h-5 mb-1 ${isDragging ? 'text-primary-500 animate-bounce' : ''}`} />
                <p className="text-[10px] 2xl:text-xs font-semibold leading-tight px-1">
                  {isDragging ? 'Drop image here' : 'Click, drag, or paste image here'}
                </p>
              </div>
              <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
            </label>
          )}
          
          <button 
            onClick={handlePasteClick}
            className={`font-bold text-slate-500 hover:text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 flex items-center justify-center gap-2 transition-colors cursor-pointer ${variant === 'wizard' ? 'text-sm p-2.5 rounded-xl mt-2' : 'text-[10px] sm:text-xs p-1.5 rounded-lg'}`}
          >
            <ClipboardPaste className={variant === 'wizard' ? 'w-4 h-4' : 'w-3.5 h-3.5'} /> Paste from Clipboard
          </button>
        </div>
      ) : (
        <div className="relative border border-primary-200 rounded-lg overflow-hidden shadow-sm h-full min-h-22.5">
          <img src={imageBase64} alt="Sample" className="w-full h-full object-cover absolute inset-0" />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
            <button
              onClick={() => setImageBase64(null)}
              aria-label="Remove image"
              className="cursor-pointer bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-all transform hover:scale-110 shadow-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
