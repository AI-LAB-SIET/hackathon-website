"use client";

import React, { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { Mail, Phone, MapPin, Send, MessageSquare, Compass, ShieldAlert, Clock } from "lucide-react";

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
    <PageWrapper className="relative bg-white min-h-screen dark:bg-gray-950">
      <Navbar />

      {/* Page Title Header */}
      <section className="relative py-12 md:py-20 bg-card-bg/25 border-b border-input-border/20 overflow-hidden dark:bg-gray-800/25 dark:border-gray-700">
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-primary-green/5 blur-[120px]" />
        <div className="max-w-[1440px] mx-auto px-6 relative z-10 text-center flex flex-col items-center gap-3">
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-primary-dark dark:text-gray-100">
            Support & Contact Desk
          </h1>
          <p className="max-w-2xl text-xs sm:text-sm text-gray-500 font-semibold leading-relaxed dark:text-gray-400">
            Need urgent assistance during code submission, team registration approvals, or Claiming GPU credits? Speak to our coordinators directly.
          </p>
        </div>
      </section>

      {/* Main Grid */}
      <section className="py-16 max-w-[1440px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* Info Column (Left & Middle Span) */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          <div className="flex flex-col gap-3">
            <span className="text-xs font-bold text-primary-green uppercase tracking-widest">Connect with Us</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-primary-dark tracking-tight dark:text-gray-100">
              Office Hours & Direct Contacts
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 leading-relaxed max-w-xl dark:text-gray-400">
              We operate physically inside the AI Lab. Our student committee, IT volunteers, and mentor board are online on WhatsApp during coding checkpoints.
            </p>
          </div>

          {/* Contact Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[
              { icon: <MapPin className="h-5 w-5" />, title: "AI Research Lab", val: "Main Block, L&T Bypass Road, Coimbatore, Tamil Nadu, 641062" },
              { icon: <Clock className="h-5 w-5" />, title: "Working Hours", val: "Monday - Saturday: 9:00 AM - 5:00 PM IST" },
              { icon: <Mail className="h-5 w-5" />, title: "Email Support Desk", val: "ailab@siet.ac.in (Queries resolved within 4 hours)" },
              { icon: <Phone className="h-5 w-5" />, title: "Lab Desk Phone", val: "+91 98765 43210 (Direct extension to lab floor)" },
              { icon: <ShieldAlert className="h-5 w-5 text-red-600" />, title: "Emergency Helpline", val: "+91 98765 99999 (Urgent submission troubles)" },
            ].map((c, idx) => (
              <div key={idx} className="flex gap-4 p-4 rounded-2xl border border-gray-100 hover:border-input-border/30 transition-all duration-200 bg-white dark:bg-gray-900 dark:border-gray-700">
                <div className="h-10 w-10 rounded-xl bg-card-bg text-primary-green flex items-center justify-center border border-input-border/10 shrink-0">
                  {c.icon}
                </div>
                <div className="flex flex-col gap-0.5">
                  <h4 className="text-xs font-bold text-primary-dark dark:text-gray-200">{c.title}</h4>
                  <p className="text-xs text-gray-500 leading-relaxed dark:text-gray-400">{c.val}</p>
                </div>
              </div>
            ))}
          </div>

          {/* WhatsApp and Live Support Desks */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
            {/* WhatsApp Invite Card */}
            <div className="p-6 rounded-3xl border border-primary-green/20 bg-emerald-50/15 flex flex-col justify-between gap-4 dark:bg-emerald-900/10">
              <div className="flex flex-col gap-1.5">
                <div className="h-8 w-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 text-sm font-bold">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </div>
                <h4 className="text-sm font-extrabold text-primary-dark mt-1 dark:text-gray-100">Official WhatsApp Group</h4>
                <p className="text-xs text-gray-500 leading-relaxed dark:text-gray-400">
                  Join our WhatsApp group to check-in with mentors, interact with team members, and get instant support during the hackathon.
                </p>
              </div>
              <a
                href="https://chat.whatsapp.com/siet-ailab-hackathon"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center px-4 py-2.5 text-xs font-bold text-white bg-[#25D366] hover:bg-[#128C7E] rounded-xl transition-all text-center"
              >
                Join WhatsApp Group
              </a>
            </div>

            {/* Live Support desks */}
            <div className="p-6 rounded-3xl border border-input-border/30 bg-white flex flex-col gap-4 dark:bg-gray-900 dark:border-gray-700">
              <h4 className="text-sm font-extrabold text-primary-dark flex items-center gap-2 dark:text-gray-100">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> Live Support Volunteers
              </h4>
              <div className="flex flex-col gap-3">
                {[
                  { role: "IT & Sandbox Support", name: "Rahul Sharma", status: "Online" },
                  { role: "Lab Coordinator", name: "Dr. A. Rajesh", status: "Offline (Email only)" },
                  { role: "Registrations Desk", name: "Sneha Nair", status: "Online" },
                ].map((vol, index) => (
                  <div key={index} className="flex justify-between items-center text-xs border-b border-gray-100 pb-2 last:border-0 last:pb-0 dark:border-gray-700">
                    <div>
                      <p className="font-bold text-gray-800 dark:text-gray-200">{vol.name}</p>
                      <p className="text-[10px] text-gray-400 font-semibold dark:text-gray-500">{vol.role}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                      vol.status.includes("Online") 
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-100" 
                        : "bg-gray-50 text-gray-500 border border-gray-200"
                    }`}>
                      {vol.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Form Column (Right Span) */}
        <div className="rounded-3xl border border-input-border/30 bg-white p-6 sm:p-8 shadow-sm flex flex-col gap-5 h-fit dark:bg-gray-900 dark:border-gray-700">
          <div className="flex items-center gap-2.5 text-primary-dark dark:text-gray-100">
            <MessageSquare className="h-5.5 w-5.5 text-primary-green" />
            <h3 className="text-base sm:text-lg font-bold tracking-tight">Drop a Query</h3>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed font-semibold dark:text-gray-400">
            Can&apos;t find what you need in the FAQs? Send a direct query to the organizing committee.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Full Name"
              placeholder="Enter your name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              error={errors.name}
            />

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

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-primary-dark select-none dark:text-gray-200">Your Query / Message</label>
              <textarea
                rows={4}
                placeholder="Explain your query here..."
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className={`w-full px-4 py-3 rounded-xl border bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none transition-all duration-200 text-sm dark:bg-gray-800 dark:text-gray-200 dark:placeholder:text-gray-500
                  ${
                    errors.message
                      ? "border-red-500 focus:ring-1 focus:ring-red-500"
                      : "border-input-border hover:border-primary-green focus:ring-2 focus:ring-primary-green focus:border-primary-green shadow-inner dark:border-gray-700"
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

      {/* Map Section */}
      <section className="py-8 max-w-[1440px] mx-auto px-6 mb-16">
        <h3 className="text-xs font-bold text-primary-green uppercase tracking-widest mb-4">Campus Location Map</h3>
        <div className="relative h-72 rounded-3xl overflow-hidden border border-input-border/30 bg-card-bg shadow-sm flex flex-col items-center justify-center p-8 text-center gap-3 dark:bg-gray-800 dark:border-gray-700">
          {/* Grid effect background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(163,198,95,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(163,198,95,0.05)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full bg-accent-green/5 blur-2xl pointer-events-none" />

          <div className="h-12 w-12 rounded-2xl bg-white border border-input-border/30 text-primary-green flex items-center justify-center shadow-md animate-float relative z-10 shrink-0">
            <Compass className="h-6 w-6" />
          </div>
          <h4 className="text-base font-extrabold text-primary-dark relative z-10 dark:text-gray-100">Map View Placeholder</h4>
          <p className="text-xs text-gray-500 max-w-md relative z-10 leading-relaxed font-semibold dark:text-gray-400">
            Sri Shakthi Institute of Engineering and Technology, L&T Bypass Road, Chinniyampalayam, Coimbatore, Tamil Nadu 641062.
          </p>
        </div>
      </section>

      <Footer />
    </PageWrapper>
  );
}
