"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PageLoader } from "@/components/PageLoader";
// import { VoiceTerminal } from "@/components/VoiceTerminal";
import { Toaster } from "@/components/ui/sonner";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPitch = pathname?.startsWith("/pitch");

  if (isPitch) {
    // Pitch deck: full-screen immersive, no app chrome
    return <>{children}</>;
  }

  return (
    <>
      <PageLoader />
      <Navbar />
      <main className="min-h-[calc(100vh-4rem)]">
        {children}
      </main>
      <Footer />
      {/* <VoiceTerminal /> */}
      <Toaster position="top-right" richColors />
    </>
  );
}