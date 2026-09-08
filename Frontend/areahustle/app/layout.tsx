import type { Metadata } from "next";
import { Bricolage_Grotesque, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import ClientLayout from "@/components/ClientLayout";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "AreaHustle - Your Financial Passport Assistant",
  description: "AreaHustle provides a smart Financial Passport Assistant to help you manage your hustles and finances effectively.",
  keywords: "finance, hustle, financial passport, assistant, areahustle, wealth management",
  authors: [{ name: "AreaHustle Team" }],
  robots: "index, follow",
  icons: {
    icon: "/favicon.png",
  },
  openGraph: {
    type: "website",
    url: "https://areahustle.com/",
    title: "AreaHustle - Your Financial Passport Assistant",
    description: "AreaHustle provides a smart Financial Passport Assistant to help you manage your hustles and finances effectively.",
    images: ["https://areahustle.com/banner-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "AreaHustle - Your Financial Passport Assistant",
    description: "AreaHustle provides a smart Financial Passport Assistant to help you manage your hustles and finances effectively.",
    images: ["https://areahustle.com/banner-image.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${bricolage.variable} ${jakarta.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>
          <ClientLayout>{children}</ClientLayout>
        </Providers>
      </body>
    </html>
  );
}