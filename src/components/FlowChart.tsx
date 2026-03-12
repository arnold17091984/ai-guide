interface FlowStep {
  label: string;
  color: string;
}

interface FlowChartProps {
  steps: FlowStep[];
}

export default function FlowChart({ steps }: FlowChartProps) {
  return (
    <div className="my-6 flex flex-wrap items-center justify-center gap-2">
      {steps.map((step, index) => (
        <div key={index} className="flex items-center gap-2">
          <div
            className={`rounded-lg px-4 py-2 text-sm font-medium text-white ${step.color}`}
          >
            {step.label}
          </div>
          {index < steps.length - 1 && (
            <svg
              className="h-5 w-5 shrink-0 text-gray-400 dark:text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5l7 7-7 7"
              />
            </svg>
          )}
        </div>
      ))}
    </div>
  );
}
