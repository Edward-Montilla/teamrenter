import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Neighbourhoods — LivedIn",
};

export default function NeighbourhoodsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
