import { useState } from 'react';
import { toast } from 'sonner';
import { Check, Copy } from 'lucide-react';
import { formatCode } from '../utils/codes';

// A code shown in large type with a copy button.
export default function CodeBadge({ code, note }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(formatCode(code));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error('Could not copy. Select the code and copy it by hand.');
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl bg-primary-50 border border-primary-100">
      <code className="font-mono text-lg font-extrabold tracking-wider text-primary-700">{formatCode(code)}</code>
      {note && <span className="text-xs text-slate-600">{note}</span>}
      <button
        type="button"
        onClick={copy}
        className="cursor-pointer ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors"
      >
        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  );
}
