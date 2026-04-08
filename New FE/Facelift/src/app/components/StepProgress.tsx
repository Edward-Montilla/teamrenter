interface StepProgressProps {
  currentStep: number;
  totalSteps: number;
  steps: string[];
}

export function StepProgress({ currentStep, totalSteps, steps }: StepProgressProps) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-8">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isActive = stepNumber === currentStep;
          const isCompleted = stepNumber < currentStep;
          
          return (
            <div key={index} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                  isActive 
                    ? 'bg-[#E8913A] text-white' 
                    : isCompleted 
                    ? 'bg-[#0F1F38] text-white'
                    : 'bg-[#E2DDD6] text-[#717182]'
                }`}>
                  {stepNumber}
                </div>
                <span className={`text-sm mt-2 ${isActive ? 'text-[#E8913A] font-semibold' : 'text-[#717182]'}`}>
                  {step}
                </span>
              </div>
              {index < totalSteps - 1 && (
                <div className="flex-1 h-1 mx-4 bg-[#E2DDD6] rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ${
                      isCompleted ? 'bg-[#0F1F38] w-full' : 'bg-[#E2DDD6] w-0'
                    }`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
