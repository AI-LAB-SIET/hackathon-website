import type { Metadata } from "next";
import { Nunito, Instrument_Serif, Inter } from "next/font/google";
import "./globals.css";
import { StateProvider } from "@/components/layout/StateProvider";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { ToastProvider } from "@/components/ui/toast";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import AIAssistant from "@/components/ui/AIAssistant";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-display",
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
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("siet_theme");if(t==="dark"){document.documentElement.classList.add("dark")}else{document.documentElement.classList.remove("dark")}}catch(e){}})();`,
          }}
        />
      </head>
      <body
        className={`${nunito.variable} ${inter.variable} ${instrumentSerif.variable} antialiased font-sans bg-white text-[#4B4B4B] selection:bg-primary-green selection:text-white dark:bg-primary-dark dark:text-gray-200`}
      >
        <ErrorBoundary>
          <StateProvider>
            <ThemeProvider>
              <ToastProvider>
                {children}
                <AIAssistant />
              </ToastProvider>
            </ThemeProvider>
          </StateProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
