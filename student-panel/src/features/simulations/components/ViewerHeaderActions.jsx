import { useState } from 'react';
import { Download, Printer, Loader2, MessageCircle, Send, X } from 'lucide-react';
import { toast } from 'sonner';
import { useWhatsAppSender } from '../hooks/useWhatsAppSender';

export default function ViewerHeaderActions({
  onDownloadDocxClick,
  onDownloadClick,
  isGeneratingPDF,
  isGeneratingDOCX,
  simulation,
  generateStudyGuideData
}) {
  const [showPhoneInput, setShowPhoneInput] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  
  const { isSending, sendToWhatsApp } = useWhatsAppSender(simulation, generateStudyGuideData);

  const isBusy = isGeneratingPDF || isGeneratingDOCX || isSending;

  const handleWhatsAppSend = async () => {
    if (!phoneNumber.trim()) {
      toast.error('Please enter a WhatsApp number.');
      return;
    }
    
    const result = await sendToWhatsApp(phoneNumber);
    if (result.success) {
      toast.success('Notes sent to WhatsApp successfully!');
      setShowPhoneInput(false);
      setPhoneNumber('');
    } else {
      toast.error(result.error || 'Failed to send WhatsApp message.');
    }
  };

  return (
    <div className="flex flex-row shrink-0 gap-2 items-center relative">
      {/* WhatsApp Feature */}
      <div className="relative flex items-center">
        <button
          type="button"
          onClick={() => setShowPhoneInput(true)}
          disabled={isBusy}
          className={`flex items-center justify-center gap-1.5 sm:gap-2 w-10 sm:w-24 px-2 sm:px-4 py-2 bg-[#25D366] hover:bg-[#1ebd5b] text-white rounded-lg text-sm font-bold shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
            showPhoneInput ? 'invisible' : ''
          }`}
          title="Send to WhatsApp"
        >
          <svg 
            viewBox="0 0 24 24" 
            fill="currentColor" 
            className="w-4 h-4 shrink-0"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
          </svg>
          <span className="hidden sm:inline">Send</span>
        </button>

        {/* Input popup overlay (expands left) */}
        {showPhoneInput && (
          <div className="absolute right-0 top-1/2 -translate-y-1/2 z-50 flex items-center gap-1.5 bg-white border border-green-200 p-1.5 rounded-lg shadow-lg animate-in fade-in slide-in-from-right-4 duration-200 min-w-max">
            <div className="flex items-center px-2 bg-green-50 text-green-700 rounded-md">
              <MessageCircle className="w-4 h-4 mr-1.5" />
              <input
                type="tel"
                placeholder="Phone Number..."
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-32 bg-transparent text-sm outline-none placeholder:text-green-300 py-1"
                disabled={isSending}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleWhatsAppSend();
                  if (e.key === 'Escape') setShowPhoneInput(false);
                }}
              />
            </div>
            <button
              type="button"
              onClick={handleWhatsAppSend}
              disabled={isSending || !phoneNumber.trim()}
              className="p-1.5 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors disabled:opacity-50"
            >
              {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={() => setShowPhoneInput(false)}
              disabled={isSending}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onDownloadDocxClick}
        disabled={isBusy}
        className="flex items-center justify-center gap-1.5 sm:gap-2 w-10 sm:w-24 px-2 sm:px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        title="Download Notes (DOCX)"
      >
        {isGeneratingDOCX ? (
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
        ) : (
          <Download className="w-4 h-4 shrink-0" />
        )}
        <span className="hidden sm:inline">Notes</span>
      </button>
      
      <button
        type="button"
        onClick={onDownloadClick}
        disabled={isBusy}
        className="flex items-center justify-center gap-1.5 sm:gap-2 w-10 sm:w-24 px-2 sm:px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-bold shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        title="Print/Download PDF"
      >
        {isGeneratingPDF ? (
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
        ) : (
          <Printer className="w-4 h-4 shrink-0" />
        )}
        <span className="hidden sm:inline">PDF</span>
      </button>
    </div>
  );
}
