import { SignInForm } from "@/components/auth/SignInForm";
import { PublicSiteHeader } from "@/components/auth/PublicSiteHeader";

type Props = {
  searchParams: Promise<{
    redirect?: string;
    verified?: string;
  }>;
};

export default async function SignInPage({ searchParams }: Props) {
  const { redirect, verified } = await searchParams;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PublicSiteHeader />
      <div className="px-4 py-12">
        <SignInForm
          redirectTo={redirect ?? "/"}
          verified={verified === "1"}
        />
      </div>
    </div>
  );
}
