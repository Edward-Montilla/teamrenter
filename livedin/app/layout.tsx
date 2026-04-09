import type { Metadata } from "next";
import { DM_Sans, Geist, Geist_Mono, Lora } from "next/font/google";
import "./globals.css";
import { ThemeSync } from "@/components/theme/ThemeSync";
import { DEFAULT_THEME_KEY, themeScript } from "@/lib/themes";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Livedin",
  description:
    "Verified renter reviews, structured trust scores, and property insights.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning data-theme={DEFAULT_THEME_KEY}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript() }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${lora.variable} ${dmSans.variable} antialiased`}
      >
        <ThemeSync />
        {children}
      </body>
    </html>
  );
}
