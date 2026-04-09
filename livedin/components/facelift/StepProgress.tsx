type StepProgressProps = {
  currentStep: number;
  totalSteps: number;
  steps: string[];
};

export function StepProgress({
  currentStep,
  totalSteps,
  steps,
}: StepProgressProps) {
  return (
    <div className="w-full">
      <div className="mb-8 flex items-center justify-between">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isActive = stepNumber === currentStep;
          const isCompleted = stepNumber < currentStep;

          return (
            <div key={step} className="flex flex-1 items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full font-semibold transition-colors ${
                    isActive
                      ? "bg-[#E8913A] text-white"
                      : isCompleted
                        ? "bg-[#0F1F38] text-white"
                        : "bg-[#E2DDD6] text-[#717182]"
                  }`}
                >
                  {stepNumber}
                </div>
                <span
                  className={`mt-2 text-sm ${
                    isActive
                      ? "font-semibold text-[#E8913A]"
                      : "text-[#717182]"
                  }`}
                >
                  {step}
                </span>
              </div>
              {index < totalSteps - 1 && (
                <div className="mx-4 h-1 flex-1 overflow-hidden rounded-full bg-[#E2DDD6]">
                  <div
                    className={`h-full transition-all duration-300 ${
                      isCompleted ? "w-full bg-[#0F1F38]" : "w-0 bg-[#E2DDD6]"
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
