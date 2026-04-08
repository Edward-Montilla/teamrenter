import { useState } from 'react';
import { Link, useNavigate } from 'react-router';

export function SignInPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock sign in
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12">
      <div className="w-full max-w-md px-6">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-[#E8913A] rounded-full flex items-center justify-center">
              <span className="text-white font-['Lora'] font-bold text-xl">L</span>
            </div>
            <span className="text-2xl font-['Lora'] font-bold text-[#0F1F38]">LivedIn</span>
          </Link>
          <h1 className="text-3xl font-['Lora'] font-bold text-[#0F1F38] mb-2">
            Welcome Back
          </h1>
          <p className="text-[#717182]">Sign in to your account</p>
        </div>

        <div className="bg-white border border-[#E2DDD6] rounded-[16px] p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-[#0F1F38] mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 border border-[#E2DDD6] rounded-[12px] focus:outline-none focus:ring-2 focus:ring-[#E8913A]"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#0F1F38] mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 border border-[#E2DDD6] rounded-[12px] focus:outline-none focus:ring-2 focus:ring-[#E8913A]"
                required
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded text-[#E8913A]" />
                <span className="text-[#717182]">Remember me</span>
              </label>
              <button type="button" className="text-[#E8913A] hover:text-[#d17f2f]">
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              className="w-full bg-[#E8913A] hover:bg-[#d17f2f] text-white py-3 rounded-[12px] font-semibold transition-colors"
            >
              Sign In
            </button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-[#717182]">Don't have an account? </span>
            <Link to="/signup" className="text-[#E8913A] hover:text-[#d17f2f] font-semibold">
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
