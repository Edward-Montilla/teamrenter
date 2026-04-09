import Link from "next/link";
import { User } from "lucide-react";

export function FaceliftHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-[#E2DDD6] bg-white">
      <div className="mx-auto max-w-7xl px-6 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E8913A]">
              <span
                className="text-lg font-bold text-white"
                style={{
                  fontFamily: "var(--font-lora), ui-serif, Georgia, serif",
                }}
              >
                L
              </span>
            </div>
            <span
              className="text-xl font-bold text-[#0F1F38]"
              style={{
                fontFamily: "var(--font-lora), ui-serif, Georgia, serif",
              }}
            >
              LivedIn
            </span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            <Link
              href="/search"
              className="text-[#0F1F38] transition-colors hover:text-[#E8913A]"
            >
              Search Properties
            </Link>
            <Link
              href="/neighbourhoods"
              className="text-[#0F1F38] transition-colors hover:text-[#E8913A]"
            >
              Neighbourhoods
            </Link>
            <Link
              href="/write-review/new"
              className="text-[#0F1F38] transition-colors hover:text-[#E8913A]"
            >
              Write a Review
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <Link
              href="/sign-in?mode=sign-up"
              className="hidden text-sm font-medium text-[#0F1F38] transition-colors hover:text-[#E8913A] sm:inline"
            >
              Sign up
            </Link>
            <Link
              href="/sign-in?redirect=%2Fdashboard"
              className="hidden text-sm font-medium text-[#717182] transition-colors hover:text-[#E8913A] sm:inline"
            >
              Sign in
            </Link>
            <Link
              href="/dashboard"
              className="rounded-full p-2 transition-colors hover:bg-[#F7F4EF]"
              aria-label="Dashboard"
            >
              <User className="h-5 w-5 text-[#0F1F38]" />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
