import { FaceliftHeader } from "@/components/facelift/FaceliftHeader";
import { FaceliftToaster } from "@/components/facelift/FaceliftToaster";

export default function FaceliftLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div data-ui="facelift" className="min-h-screen">
      <FaceliftHeader />
      {children}
      <FaceliftToaster />
    </div>
  );
}
