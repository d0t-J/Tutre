import React from 'react';
import { CheckCircle2, ChevronRight } from 'lucide-react';

const steps = [
  { id: 1, title: 'Context & Details' },
  { id: 2, title: 'Prompt Engine' },
  { id: 3, title: 'Live Workspace' }
];

export default function WizardStepper({ wizardStep, isStepClickable, handleStepClick }) {
  return (
    <div className="bg-transparent py-2.5 shrink-0 z-10 relative border-b border-slate-100">
      <div className="w-full flex items-center justify-between sm:justify-center px-2 sm:px-6 pb-1">
        <div className="flex items-center justify-between w-full sm:w-auto gap-1 sm:gap-2">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              <div 
                className={`flex items-center gap-1 sm:gap-2 px-1.5 sm:px-2.5 py-1 rounded-md transition-all flex-1 sm:flex-none justify-center ${
                  wizardStep === step.id 
                    ? 'bg-primary-600 text-white shadow-sm' 
                    : isStepClickable(step.id) 
                      ? 'bg-primary-50 text-primary-600 cursor-pointer hover:bg-primary-100'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-60'
                }`}
                onClick={() => handleStepClick(step.id)}
              >
                {wizardStep > step.id ? (
                  <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                ) : (
                  <div className={`w-4 h-4 sm:w-5 sm:h-5 shrink-0 rounded-full flex items-center justify-center text-[9px] sm:text-[10px] font-bold ${wizardStep === step.id ? 'bg-white/20' : 'bg-slate-200'}`}>
                    {step.id}
                  </div>
                )}
                <span className="text-[9px] sm:text-sm font-bold whitespace-nowrap truncate">{step.title}</span>
              </div>
              {index < steps.length - 1 && (
                <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-slate-300 shrink-0" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
