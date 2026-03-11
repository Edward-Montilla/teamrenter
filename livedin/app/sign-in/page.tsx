import { SignInForm } from "@/components/auth/SignInForm";
import { PublicSiteHeader } from "@/components/auth/PublicSiteHeader";
import { pageContainerClass } from "@/lib/ui";

type Props = {
  searchParams: Promise<{
    redirect?: string;
    verified?: string;
  }>;
};

export default async function SignInPage({ searchParams }: Props) {
  const { redirect, verified } = await searchParams;

  return (
    <div className="min-h-screen bg-zinc-50 text-foreground dark:bg-zinc-950">
      <PublicSiteHeader />
      <div className={`${pageContainerClass} py-10 sm:py-12`}>
        <SignInForm
          redirectTo={redirect ?? "/"}
          verified={verified === "1"}
        />
      </div>
    </div>
  );
}
