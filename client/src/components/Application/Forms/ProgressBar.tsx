import React from 'react';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  onStepClick: (step: number) => void;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ currentStep, totalSteps, onStepClick }) => {
  // Ensure currentStep is valid
  const validCurrentStep = Math.min(Math.max(1, currentStep), totalSteps);
  
  const steps = [
    { number: 1, label: 'ข้อมูลส่วนตัว' },
    { number: 2, label: 'ยืนยันตัวตน' },
    { number: 3, label: 'ที่อยู่' },
    { number: 4, label: 'การเงิน' },
    { number: 5, label: 'ผู้ติดต่อ' },
    { number: 6, label: 'ตรวจสอบ' }
  ];

  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {steps.map((step) => {
          const isActive = validCurrentStep >= step.number;
          const isCurrent = validCurrentStep === step.number;
          
          return (
            <div key={step.number} className="flex flex-col items-center">
              <button
                onClick={() => onStepClick(step.number)}
                disabled={step.number > validCurrentStep}
                className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-semibold transition-all duration-200 ${isCurrent 
                  ? 'bg-blue-600 text-white ring-4 ring-blue-100' 
                  : isActive 
                    ? 'bg-blue-600 text-white cursor-pointer'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
              >
                {step.number}
              </button>
              <span className={`mt-2 text-xs sm:text-sm ${isActive ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Progress line - visible on all screen sizes */}
      <div className="relative mt-4">
        <div className="absolute top-0 left-0 h-2 bg-gray-200 w-full rounded-full overflow-hidden">
          <div 
            className="absolute top-0 left-0 h-full bg-blue-600 transition-all duration-300"
            style={{ 
              width: `${Math.max(((currentStep - 1) / (totalSteps - 1)) * 100, 0)}%`,
              boxShadow: '0 0 8px rgba(37, 99, 235, 0.5)'
            }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default ProgressBar;
