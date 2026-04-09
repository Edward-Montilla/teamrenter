import type { Metadata } from "next";
import { DashboardGate } from "./DashboardGate";

export const metadata: Metadata = {
  title: "Dashboard — LivedIn",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardGate>{children}</DashboardGate>;
}
