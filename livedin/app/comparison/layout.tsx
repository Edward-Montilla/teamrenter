import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Comparison — LivedIn",
};

export default function ComparisonLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
