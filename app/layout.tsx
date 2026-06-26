import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { StateProvider } from "@/components/layout/StateProvider";
import { ToastProvider } from "@/components/ui/toast";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
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
        className={`${inter.variable} antialiased font-sans bg-white text-gray-900 selection:bg-accent-green selection:text-white`}
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
