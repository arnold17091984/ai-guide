interface StepCardProps {
  stepNumber: number;
  title: string;
  description: string;
  children: React.ReactNode;
}

export default function StepCard({
  stepNumber,
  title,
  description,
  children,
}: StepCardProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-900">
      <div className="mb-4 flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-lg font-bold text-white">
          {stepNumber}
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {description}
          </p>
        </div>
      </div>
      <div className="ml-14">{children}</div>
    </div>
  );
}
