import { SignInForm } from "@/components/auth/SignInForm";

type Props = {
  searchParams: Promise<{
    redirect?: string;
    verified?: string;
  }>;
};

export default async function SignInPage({ searchParams }: Props) {
  const { redirect, verified } = await searchParams;

  return (
    <div className="min-h-screen bg-background px-4 py-12 text-foreground">
      <SignInForm
        redirectTo={redirect ?? "/"}
        verified={verified === "1"}
      />
    </div>
  );
}
