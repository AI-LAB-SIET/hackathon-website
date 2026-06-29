"use client";

import React from "react";
import Link from "next/link";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft, Search, AlertTriangle } from "lucide-react";

export default function NotFound() {
  return (
    <PageWrapper className="relative bg-white min-h-screen flex flex-col dark:bg-gray-950">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-6 gradient-mesh">
        <div className="text-center max-w-md">
          <div className="relative mb-8">
            <div className="absolute inset-0 flex items-center justify-center">
              <AlertTriangle className="h-24 w-24 text-primary-green/20 dark:text-primary-green/30" />
            </div>
            <div className="relative z-10">
              <div className="text-8xl font-black text-primary-green/30 dark:text-primary-green/40">404</div>
            </div>
          </div>
          <h1 className="text-2xl font-extrabold text-primary-dark dark:text-gray-100 mb-3">
            Page Not Found
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
            The page you&apos;re looking for doesn&apos;t exist or has been moved. Let&apos;s get you back on track.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/">
              <Button className="flex items-center gap-2">
                <Home className="h-4 w-4" /> Go Home
              </Button>
            </Link>
            <Button variant="secondary" onClick={() => window.history.back()} className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" /> Go Back
            </Button>
          </div>
          <div className="mt-10 pt-8 border-t border-gray-100 dark:border-gray-800">
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">Or try searching:</p>
            <form className="flex gap-2 max-w-xs mx-auto" onSubmit={(e) => { e.preventDefault(); const formData = new FormData(e.target as HTMLFormElement); const query = formData.get('q') as string; if (query) window.location.href = `/hackathon?search=${encodeURIComponent(query)}`; }}>
              <input 
                name="q" 
                type="search" 
                placeholder="Search hackathon..." 
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-green/30"
                autoComplete="off"
              />
              <Button type="submit" className="px-4 py-2.5 rounded-xl bg-primary-green text-white text-sm font-semibold hover:bg-primary-green/90 transition-colors">
                <Search className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </PageWrapper>
  );
}