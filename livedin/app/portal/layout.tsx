import type { Metadata } from "next";
import { PortalShell } from "./PortalShell";

export const metadata: Metadata = {
  title: "Business portal — LivedIn",
};

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PortalShell>{children}</PortalShell>;
}
