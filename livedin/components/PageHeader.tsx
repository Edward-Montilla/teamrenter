import { cn, h1Class } from "@/lib/ui";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  badge?: string;
  className?: string;
};

export function PageHeader({ title, subtitle, badge, className }: PageHeaderProps) {
  return (
    <header className={cn("space-y-2", className)}>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className={h1Class}>{title}</h1>
        {badge ? (
          <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
            {badge}
          </span>
        ) : null}
      </div>
      {subtitle ? (
        <p className="max-w-2xl text-base leading-7 text-zinc-600 dark:text-zinc-400">
          {subtitle}
        </p>
      ) : null}
    </header>
  );
}
