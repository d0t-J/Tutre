import { Bot, User } from 'lucide-react';
import { useMemo } from 'react';
import { preprocessLegacyMath } from '../../../utils/mathPreprocessor';
import { markdownToHtml } from '../../../utils/markdownToHtml';

export default function ChatMessage({ msg }) {
  // For assistant messages, render markdown and math correctly.
  // We first use markdownToHtml (which protects math blocks),
  // then we render the math blocks using KaTeX (preprocessLegacyMath).
  const renderedContent = useMemo(() => {
    if (msg.role !== 'assistant') return null;

    let htmlResult = markdownToHtml(msg.content);
    htmlResult = preprocessLegacyMath(htmlResult);
    return htmlResult;
  }, [msg.content, msg.role]);

  return (
    <div className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
        msg.role === 'user' ? 'bg-primary-200 text-primary-700' : 'bg-primary-100 text-primary-600'
      }`}>
        {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>
      <div className={`max-w-[80%] rounded-2xl p-4 shadow-sm text-sm ${
        msg.role === 'user' 
          ? 'bg-primary-600 text-white rounded-tr-none' 
          : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none'
      }`}>
        {msg.role === 'user' ? (
          <p className="whitespace-pre-wrap">{msg.content}</p>
        ) : (
          <div 
            className="prose prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-slate-800 prose-pre:text-slate-50"
            dangerouslySetInnerHTML={{ __html: renderedContent }}
          />
        )}
      </div>
    </div>
  );
}
