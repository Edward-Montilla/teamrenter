import { PublicSiteHeader } from "@/components/auth/PublicSiteHeader";
import { ThemeSettingsPanel } from "@/components/theme/ThemeSettingsPanel";
import { pageContainerClass } from "@/lib/ui";

export default function ThemesPage() {
  return (
    <div className="min-h-screen bg-zinc-50 text-foreground dark:bg-zinc-950">
      <PublicSiteHeader />
      <main className={`${pageContainerClass} py-8 sm:py-10`}>
        <ThemeSettingsPanel />
      </main>
    </div>
  );
}
