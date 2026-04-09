import { SignInForm } from "@/components/auth/SignInForm";

type Props = {
  searchParams: Promise<{
    redirect?: string;
    verified?: string;
    mode?: string;
  }>;
};

export default async function SignInPage({ searchParams }: Props) {
  const { redirect, verified, mode } = await searchParams;

  return (
    <div className="min-h-screen bg-[#F7F4EF] py-12">
      <SignInForm
        redirectTo={redirect ?? "/"}
        verified={verified === "1"}
        variant="facelift"
        initialMode={mode === "sign-up" ? "sign-up" : "sign-in"}
      />
    </div>
  );
}
