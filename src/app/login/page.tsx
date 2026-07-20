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
import { signInWithRole, signInAsAdmin, resendVerificationEmail, sendPasswordReset } from "@/lib/firebaseAuth";
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

  // Forgot password
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSending, setForgotSending] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotError, setForgotError] = useState("");

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

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = forgotEmail.trim();
    if (!trimmed) {
      setForgotError("Please enter your email address.");
      return;
    }
    setForgotSending(true);
    setForgotError("");
    try {
      await sendPasswordReset(trimmed);
      setForgotSent(true);
    } catch (err: unknown) {
      const msg = (err as { userFriendly?: string })?.userFriendly ?? "Failed to send reset email. Please try again.";
      setForgotError(msg);
    } finally {
      setForgotSending(false);
    }
  };

  const closeForgotModal = () => {
    setForgotOpen(false);
    setForgotEmail("");
    setForgotSent(false);
    setForgotError("");
    setForgotSending(false);
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
              placeholder="e.g. name@srishakthi.ac.in"
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
                onClick={() => { setForgotEmail(email); setForgotOpen(true); }}
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

      {/* ── Forgot Password Modal ─────────────────────────── */}
      {forgotOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.55)" }}
          onClick={(e) => { if (e.target === e.currentTarget) closeForgotModal(); }}
        >
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-gray-900 border border-input-border/30 dark:border-gray-700 shadow-2xl p-7 flex flex-col gap-5 relative animate-fade-in">
            {/* Close button */}
            <button
              type="button"
              onClick={closeForgotModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>

            {!forgotSent ? (
              <>
                <div className="flex flex-col gap-1">
                  <h3 className="text-lg font-bold text-primary-dark dark:text-gray-100">Reset Password</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                    Enter the email address linked to your account. We&apos;ll send you a link to reset your password.
                  </p>
                </div>
                <form onSubmit={handleForgotPassword} className="flex flex-col gap-4">
                  <Input
                    label="Email Address"
                    placeholder="e.g. name@srishakthi.ac.in"
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => { setForgotEmail(e.target.value); setForgotError(""); }}
                    error={forgotError || undefined}
                  />
                  {forgotError && (
                    <p className="text-xs text-red-600 font-semibold -mt-2">{forgotError}</p>
                  )}
                  <Button type="submit" isLoading={forgotSending} className="w-full py-3">
                    Send Reset Link
                  </Button>
                </form>
              </>
            ) : (
              <div className="flex flex-col items-center gap-4 py-4 text-center">
                <div className="flex items-center justify-center w-14 h-14 rounded-full bg-primary-green/10">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-primary-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-bold text-primary-dark dark:text-gray-100">Check your inbox!</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                    A password reset link has been sent to <span className="font-semibold text-gray-700 dark:text-gray-300">{forgotEmail}</span>. Follow the link to set a new password.
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">Didn&apos;t receive it? Check spam or try again.</p>
                </div>
                <Button type="button" onClick={closeForgotModal} className="w-full py-2.5">
                  Back to Login
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </PageWrapper>
  );
}
