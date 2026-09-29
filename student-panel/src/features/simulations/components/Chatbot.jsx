import { Send, Bot, Brain } from 'lucide-react';
import ChatMessage from './ChatMessage';
import { useSimulationViewer } from '../context/SimulationViewerContext';
import { useChatbotStream } from '../hooks/useChatbotStream';

export default function Chatbot({ className = "" }) {
  const { simulation, messages, setMessages } = useSimulationViewer();
  const { topic, description: details } = simulation;

  const { input, setInput, isLoading, messagesEndRef, handleSubmit } = useChatbotStream(
    topic,
    details,
    messages,
    setMessages
  );

  return (
    <div className={`flex-1 flex flex-col h-full w-full bg-slate-50 ${className}`}>
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <ChatMessage key={idx} msg={msg} />
        ))}
        
        {isLoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm flex items-center gap-2">
              <Brain className="w-4 h-4 text-primary-400 animate-pulse" />
              <span className="text-xs text-slate-500 font-medium animate-pulse">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white p-4 border-t border-slate-200 shrink-0">
        <form onSubmit={handleSubmit} className="flex gap-2 relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about this simulation..."
            className="flex-1 bg-slate-100 border-transparent focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-200 rounded-xl px-4 py-3 text-sm transition-all"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl p-3 flex items-center justify-center transition-colors shadow-sm cursor-pointer"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
