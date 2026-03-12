import ScrollFadeIn from "@/components/ScrollFadeIn";

interface StepCardProps {
  stepNumber: number;
  title: string;
  description: string;
  children: React.ReactNode;
  isLast?: boolean;
}

export default function StepCard({
  stepNumber,
  title,
  description,
  children,
  isLast = false,
}: StepCardProps) {
  return (
    <ScrollFadeIn>
      <div className="relative flex gap-6 pb-8">
        {/* Timeline line */}
        {!isLast && (
          <div className="absolute left-5 top-12 bottom-0 w-px bg-linear-to-b from-(--border) to-transparent" />
        )}
        {/* Step number */}
        <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-blue-500 to-cyan-500 text-sm font-bold text-white shadow-lg shadow-blue-500/20">
          {stepNumber}
        </div>
        {/* Content */}
        <div className="flex-1 rounded-xl border border-(--border) bg-(--surface) p-6 shadow-sm transition-shadow hover:shadow-md">
          <h3 className="text-lg font-semibold text-(--text-1)">
            {title}
          </h3>
          <p className="mt-1 text-sm text-(--text-2)">
            {description}
          </p>
          <div className="mt-4">{children}</div>
        </div>
      </div>
    </ScrollFadeIn>
  );
}
