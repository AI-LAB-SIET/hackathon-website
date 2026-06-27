import type { Metadata } from "next";
import { Nunito, Instrument_Serif } from "next/font/google";
import "./globals.css";
import { StateProvider } from "@/components/layout/StateProvider";
import { ToastProvider } from "@/components/ui/toast";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "AI Hack Lab | College Hackathon Management Platform",
  description: "Join the premier College AI Lab Hackathon. Register your team, manage submissions, track milestones, and showcase your AI innovations.",
  keywords: ["hackathon", "AI Lab", "artificial intelligence", "college coding", "Next.js", "team management"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${nunito.variable} ${instrumentSerif.variable} antialiased font-sans bg-white text-[#4B4B4B] selection:bg-primary-green selection:text-white`}
      >
        <StateProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </StateProvider>
      </body>
    </html>
  );
}
