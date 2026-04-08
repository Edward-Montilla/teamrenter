import { useState } from "react";
import { useNavigate } from "react-router";
import { Building2 } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";

export function Login() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"email" | "2fa">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep("2fa");
  };

  const handle2FASubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/portal");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f1f3a] to-[#1a2f52] px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <Building2 className="w-12 h-12 text-[#f59e0b]" />
            <span className="text-4xl font-bold text-white" style={{ fontFamily: 'var(--font-heading)' }}>
              LivedIn
            </span>
          </div>
          <h1 className="text-2xl text-white mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
            Sign in to your portfolio
          </h1>
          <p className="text-gray-300">
            Access your property management dashboard
          </p>
        </div>

        <Card className="border-[#2a4266] shadow-2xl">
          <CardHeader>
            <CardTitle>
              {step === "email" ? "Enter your email" : "Two-factor authentication"}
            </CardTitle>
            <CardDescription>
              {step === "email"
                ? "We'll send you a verification code"
                : "Enter the 6-digit code sent to your email"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === "email" ? (
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-white border-border"
                  />
                </div>
                <Button type="submit" className="w-full bg-[#f59e0b] hover:bg-[#d97706] text-[#0a1628]">
                  Continue
                </Button>
              </form>
            ) : (
              <form onSubmit={handle2FASubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Verification code</Label>
                  <Input
                    id="code"
                    type="text"
                    placeholder="000000"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    maxLength={6}
                    required
                    className="bg-white border-border text-center text-2xl tracking-widest"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep("email")}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button type="submit" className="flex-1 bg-[#f59e0b] hover:bg-[#d97706] text-[#0a1628]">
                    Sign In
                  </Button>
                </div>
                <Button type="button" variant="link" className="w-full text-sm">
                  Resend code
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-gray-400 text-sm mt-6">
          © 2026 LivedIn. All rights reserved.
        </p>
      </div>
    </div>
  );
}
