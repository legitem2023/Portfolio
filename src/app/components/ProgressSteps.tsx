// components/ProgressSteps.tsx
import React from 'react';
import { CheckCircle } from 'lucide-react';

interface ProgressStepsProps {
  currentStep: number;
}

const ProgressSteps: React.FC<ProgressStepsProps> = ({ currentStep }) => {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        {[1, 2, 3, 4].map(step => (
          <div key={step} className="flex flex-col items-center flex-1">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
              currentStep >= step 
                ? 'bg-gradient-to-r from-purple-600 to-indigo-700 text-white' 
                : 'bg-gray-200 text-gray-500'
            }`}>
              {currentStep > step ? <CheckCircle size={20} /> : step}
            </div>
            <span className="text-xs font-medium text-gray-700">
              {step === 1 && 'Cart'}
              {step === 2 && 'Shipping'}
              {step === 3 && 'Payment'}
              {step === 4 && 'Confirmation'}
            </span>
          </div>
        ))}
      </div>

      <div className="relative mb-6">
        <div className="absolute top-1/2 transform -translate-y-1/2 w-full h-1 bg-gray-200"></div>
        <div 
          className="absolute top-1/2 transform -translate-y-1/2 h-1 bg-gradient-to-r from-purple-600 to-indigo-700 transition-all duration-500"
          style={{ width: `${(currentStep - 1) * 33.33}%` }}
        ></div>
      </div>
    </div>
  );
};

export default ProgressSteps;
