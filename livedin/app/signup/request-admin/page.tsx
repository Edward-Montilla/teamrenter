import { PublicSiteHeader } from "@/components/auth/PublicSiteHeader";
import { RequestAdminAccessPage } from "@/components/auth/RequestAdminAccessPage";
import { pageContainerClass } from "@/lib/ui";

export default function RequestAdminPage() {
  return (
    <div className="min-h-screen bg-zinc-50 text-foreground dark:bg-zinc-950">
      <PublicSiteHeader />
      <main className={`${pageContainerClass} py-10 sm:py-12`}>
        <RequestAdminAccessPage />
      </main>
    </div>
  );
}
