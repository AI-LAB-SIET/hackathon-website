"use client";

import React, { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Send, MessageSquare, Compass } from "lucide-react";

export default function Contact() {
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [errors, setErrors] = useState({ name: "", email: "", message: "" });
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    let valid = true;
    const errs = { name: "", email: "", message: "" };

    if (!form.name.trim()) {
      errs.name = "Name is required";
      valid = false;
    }
    if (!form.email.trim()) {
      errs.email = "Email is required";
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      errs.email = "Enter a valid email address";
      valid = false;
    }
    if (!form.message.trim()) {
      errs.message = "Message is required";
      valid = false;
    }

    setErrors(errs);
    return valid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast("Please fill in the required fields.", "error");
      return;
    }

    setSubmitting(true);
    setTimeout(() => {
      toast("Your message has been sent successfully!", "success");
      setForm({ name: "", email: "", phone: "", message: "" });
      setSubmitting(false);
    }, 1500);
  };

  return (
    <PageWrapper className="relative bg-white min-h-screen">
      <Navbar />

      {/* Page Title Header */}
      <section className="relative py-12 md:py-20 bg-card-bg/25 border-b border-input-border/20 overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-primary-green/5 blur-[120px]" />
        <div className="max-w-[1440px] mx-auto px-6 relative z-10 text-center flex flex-col items-center gap-3">
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-primary-dark">
            Contact AI Lab
          </h1>
          <p className="max-w-2xl text-xs sm:text-sm text-gray-500 font-medium">
            Have questions regarding guidelines, student eligibility, or GPU credits? Send us a message or visit the Research Lab.
          </p>
        </div>
      </section>

      {/* Contact Content Grid */}
      <section className="py-16 max-w-[1440px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Info Column */}
        <div className="flex flex-col gap-6 justify-center">
          <div className="flex flex-col gap-3">
            <span className="text-xs font-bold text-primary-green uppercase tracking-widest">Connect with Us</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-primary-dark tracking-tight">
              Get in Touch Directly
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 leading-relaxed max-w-md">
              Our lab coordinator and student volunteers are available to assist you with registration updates and sandbox environment configurations.
            </p>
          </div>

          <div className="flex flex-col gap-4 mt-2">
            {[
              { icon: <MapPin className="h-5 w-5" />, title: "Physical Address", val: "SIET AI Research Lab, Main Block, Coimbatore, TN, India" },
              { icon: <Mail className="h-5 w-5" />, title: "Email Support", val: "ailab@siet.ac.in" },
              { icon: <Phone className="h-5 w-5" />, title: "Contact Number", val: "+91 98765 43210 (Lab Helpdesk)" },
            ].map((c, idx) => (
              <div key={idx} className="flex gap-4 p-4 rounded-2xl border border-gray-100 hover:border-input-border/30 transition-all duration-200 bg-white">
                <div className="h-10 w-10 rounded-xl bg-card-bg text-primary-green flex items-center justify-center border border-input-border/10 shrink-0">
                  {c.icon}
                </div>
                <div className="flex flex-col gap-0.5">
                  <h4 className="text-xs font-bold text-primary-dark">{c.title}</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">{c.val}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Form Column */}
        <div className="rounded-3xl border border-input-border/30 bg-white p-6 sm:p-8 shadow-sm flex flex-col gap-5">
          <div className="flex items-center gap-2.5 text-primary-dark">
            <MessageSquare className="h-5.5 w-5.5 text-primary-green" />
            <h3 className="text-base sm:text-lg font-bold tracking-tight">Send a Message</h3>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Full Name"
              placeholder="Enter your name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              error={errors.name}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="College Email ID"
                placeholder="email@college.edu"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                error={errors.email}
              />
              <Input
                label="Phone Number"
                placeholder="10-digit number"
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-primary-dark select-none">Your Query / Message</label>
              <textarea
                rows={4}
                placeholder="Explain your query here..."
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className={`w-full px-4 py-3 rounded-xl border bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none transition-all duration-200 text-sm
                  ${
                    errors.message
                      ? "border-red-500 focus:ring-1 focus:ring-red-500"
                      : "border-input-border hover:border-primary-green focus:ring-2 focus:ring-primary-green focus:border-primary-green shadow-inner"
                  }`}
              />
              {errors.message && <span className="text-xs text-red-600 font-medium">{errors.message}</span>}
            </div>

            <Button type="submit" isLoading={submitting} className="mt-2 w-full gap-2">
              <Send className="h-4 w-4" /> Send Message
            </Button>
          </form>
        </div>
      </section>

      {/* Map Placeholder */}
      <section className="py-8 max-w-[1440px] mx-auto px-6 mb-16">
        <h3 className="text-xs font-bold text-primary-green uppercase tracking-widest mb-4">AI Research Lab Location Map</h3>
        <div className="relative h-72 rounded-3xl overflow-hidden border border-input-border/30 bg-card-bg shadow-sm flex flex-col items-center justify-center p-8 text-center gap-3">
          {/* Grid effect background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(163,198,95,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(163,198,95,0.05)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full bg-accent-green/5 blur-2xl pointer-events-none" />

          <div className="h-12 w-12 rounded-2xl bg-white border border-input-border/30 text-primary-green flex items-center justify-center shadow-md animate-float relative z-10 shrink-0">
            <Compass className="h-6 w-6" />
          </div>
          <h4 className="text-base font-extrabold text-primary-dark relative z-10">Map View Placeholder</h4>
          <p className="text-xs text-gray-500 max-w-md relative z-10 leading-relaxed">
            Sri Shakthi Institute of Engineering and Technology, L&T Bypass Road, Chinniyampalayam, Coimbatore, Tamil Nadu 641062.
          </p>
        </div>
      </section>

      <Footer />
    </PageWrapper>
  );
}
