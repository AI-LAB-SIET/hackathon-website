"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAppState } from "@/components/layout/StateProvider";
import { useToast } from "@/components/ui/toast";
import { signInWithRole, signInAsAdmin, resendVerificationEmail } from "@/lib/firebaseAuth";
import { isConfigured } from "@/lib/firebase";

type RoleType = "participant" | "admin" | "judge" | "organizer" | "volunteer";

export default function Login() {
  const router = useRouter();
  const { session, login, getProfile } = useAppState();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [firebaseError, setFirebaseError] = useState("");
  const [isUnverified, setIsUnverified] = useState(false);
  const [resending, setResending] = useState(false);

  const redirectByRole = useCallback((role: RoleType, onboarded?: boolean) => {
    switch (role) {
      case "admin":
        router.push("/admin");
        break;
      case "judge":
        router.push("/judge");
        break;
      case "organizer":
        router.push("/organizer");
        break;
      case "volunteer":
        router.push("/volunteer");
        break;
      case "participant":
      default:
        // If participant hasn't completed onboarding, send to onboarding
        if (onboarded === false) {
          router.push("/onboarding");
        } else {
          router.push("/dashboard");
        }
        break;
    }
  }, [router]);

  // If already logged in, redirect to the correct workspace
  useEffect(() => {
    if (session.isLoggedIn && session.role) {
      redirectByRole(session.role, session.onboarded);
    }
  }, [session, router, redirectByRole]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFirebaseError("");

    if (!email.trim() || !password.trim()) {
      setError("Please fill in all credentials.");
      toast("Invalid input parameters.", "error");
      return;
    }

    setSubmitting(true);

    const inputEmail = email.trim();
    const isInternalAdmin = inputEmail.toLowerCase() === "admin2727" || inputEmail.toLowerCase() === "admin@hacklab.internal";

    if (isInternalAdmin) {
      if (isConfigured) {
        try {
          const result = await signInAsAdmin(inputEmail, password);
          toast(`Welcome back! Logged in as ${result.role.toUpperCase()}.`, "success");
          // Wait for onAuthStateChanged to update session automatically
          return;
        } catch (err: unknown) {
          setSubmitting(false);
          const msg = (err as { userFriendly?: string })?.userFriendly ?? "Authentication failed.";
          setError(msg);
          toast(msg, "error");
          return;
        }
      } else {
        if (password !== "9629371790") {
          setError("Account not found. Please check your email/username and password.");
          setSubmitting(false);
          return;
        }
        // Bypass Firebase exclusively for admin in mock mode
        setTimeout(() => {
          const res = login(inputEmail, "admin");
          setSubmitting(false);
          if (res.success && res.role) {
            toast(`Welcome back! Logged in as ADMIN.`, "success");
            redirectByRole(res.role, true);
          }
        }, 500);
        return;
      }
    }

    if (isConfigured) {
      try {
        const result = await signInWithRole(inputEmail, password);

        toast(`Welcome back! Logged in as ${result.role.toUpperCase()}.`, "success");
        // Do not setSubmitting(false) or redirect here.
        // Wait for onAuthStateChanged in StateProvider to update the session.
        // The useEffect hook will automatically redirect once session.isLoggedIn is true.
        return;
      } catch (err: unknown) {
        setSubmitting(false);
        const code = (err as { code?: string })?.code;
        const msg = (err as { userFriendly?: string })?.userFriendly ?? "Authentication failed.";
        setError(msg);
        toast(msg, "error");
        if (code === "auth/email-not-verified") {
          setIsUnverified(true);
        }
        return; // Do not fall back to mock!
      }
    }

    // Mock authentication path (only used if Firebase is NOT configured)
    setTimeout(() => {
      const res = login(inputEmail);
      setSubmitting(false);

      if (res.success && res.role) {
        toast(`Welcome back! Logged in as ${res.role.toUpperCase()}.`, "success");
        const profile = getProfile(inputEmail);
        redirectByRole(res.role, profile?.onboarded ?? false);
      } else {
        toast("Invalid credentials or account not found.", "error");
        setError("Account not found. Please check your email/username and password.");
      }
    }, 1200);
  };

  const handleResendVerification = async () => {
    if (!email.trim() || !password.trim()) {
      toast("Please fill in email and password first.", "error");
      return;
    }
    setResending(true);
    try {
      await resendVerificationEmail(email.trim(), password);
      toast("Verification email resent. Please check your inbox.", "success");
      setIsUnverified(false);
    } catch (err: unknown) {
      const msg = (err as { userFriendly?: string })?.userFriendly ?? "Failed to resend verification email.";
      toast(msg, "error");
    } finally {
      setResending(false);
    }
  };

  return (
    <PageWrapper className="relative bg-white min-h-screen flex flex-col dark:bg-gray-950">
      <Navbar />

      <main className="flex-1 flex items-center justify-center py-12 px-6 gradient-mesh relative">
        <div className="absolute top-1/4 left-10 w-64 h-64 rounded-full bg-primary-green/5 blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-10 w-72 h-72 rounded-full bg-accent-yellow/5 blur-3xl pointer-events-none" />

        <div className="w-full max-w-md rounded-3xl border border-input-border/30 bg-white p-8 shadow-2xl relative z-10 dark:bg-gray-900 dark:border-gray-700">
          <div className="flex flex-col items-center gap-2 text-center mb-8">
            <div className="relative h-10 w-10 overflow-hidden">
              <Image
                src="/siet_logo.png"
                alt="AI Lab Logo"
                fill
                sizes="40px"
                className="object-contain"
              />
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-primary-dark dark:text-gray-100">
              Access Workspace
            </h2>
            <p className="text-xs text-gray-500 max-w-xs font-semibold leading-relaxed dark:text-gray-400">
              Login with your credentials. Your portal role will be auto-detected and you will be redirected automatically.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <Input
              label="Email"
              placeholder="e.g. name@college.edu"
              type="text"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setFirebaseError(""); setError(""); setIsUnverified(false); }}
              error={(error || firebaseError) ? " " : undefined}
            />

            <Input
              label="Password"
              placeholder="••••••••"
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setFirebaseError(""); setError(""); setIsUnverified(false); }}
              error={(error || firebaseError) ? " " : undefined}
            />

            {(error || firebaseError) && (
              <div className="flex flex-col gap-2">
                <span className="text-xs text-red-600 font-semibold leading-relaxed">
                  {firebaseError || error}
                </span>
                {isUnverified && (
                  <button
                    type="button"
                    disabled={resending}
                    onClick={handleResendVerification}
                    className="text-xs font-bold text-left text-primary-green hover:underline cursor-pointer disabled:opacity-50"
                  >
                    {resending ? "Sending link..." : "Resend Verification Email"}
                  </button>
                )}
              </div>
            )}

            {/* Remember Me / Forgot Password */}
            <div className="flex items-center justify-between text-xs font-bold select-none">
              <label className="flex items-center gap-1.5 text-gray-600 cursor-pointer dark:text-gray-400">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-input-border text-primary-green focus:ring-primary-green h-4 w-4"
                />
                Remember me
              </label>
              <button
                type="button"
                onClick={() => toast("Contact AI Lab coordinator to reset passwords.", "info")}
                className="text-primary-green hover:underline cursor-pointer"
              >
                Forgot Password?
              </button>
            </div>

            <Button type="submit" isLoading={submitting} className="w-full py-3.5 mt-2">
              Log In to Workspace
            </Button>
          </form>
        </div>
      </main>

      <Footer />
    </PageWrapper>
  );
}
