"use client";

import React, { useState } from "react";
import { INITIAL_FAQS } from "@/lib/mockData";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus } from "lucide-react";

export function FAQSection() {
  const faqs = INITIAL_FAQS;
  const [activeCategory, setActiveCategory] = useState<string>("General");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const categories = ["General", "Registration", "Technical", "Prizes"];

  const filteredFaqs = faqs.filter((faq) => faq.category === activeCategory);

  const toggleExpand = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-8">
      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2 justify-center border-b border-gray-100 pb-4 dark:border-gray-700">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => {
              setActiveCategory(cat);
              setExpandedId(null);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              activeCategory === cat
                ? "bg-primary-green text-white border-primary-green shadow-md shadow-primary-green/10"
                : "bg-white text-gray-600 border-gray-200 hover:border-primary-green hover:text-primary-green dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700 dark:hover:text-primary-green"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Accordions */}
      <div className="flex flex-col gap-3">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col gap-3"
          >
            {filteredFaqs.map((faq) => {
              const isExpanded = expandedId === faq.id;
              return (
                <div
                  key={faq.id}
                  className="rounded-2xl border border-input-border/30 bg-white overflow-hidden shadow-sm dark:bg-gray-900 dark:border-gray-700"
                >
                  <button
                    onClick={() => toggleExpand(faq.id)}
                    aria-expanded={isExpanded}
                    aria-controls={`faq-answer-${faq.id}`}
                    className="w-full flex items-center justify-between px-6 py-5 text-left font-bold text-primary-dark text-sm sm:text-base hover:bg-card-bg/25 transition-colors cursor-pointer dark:text-gray-100 dark:hover:bg-gray-800"
                  >
                    <span>{faq.question}</span>
                    <span className="shrink-0 ml-4 h-6 w-6 rounded-lg bg-card-bg flex items-center justify-center text-primary-green dark:bg-gray-800">
                      {isExpanded ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                    </span>
                  </button>

                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
                      >
                        <div id={`faq-answer-${faq.id}`} className="px-6 pb-6 pt-1 text-xs sm:text-sm text-gray-500 leading-relaxed border-t border-gray-50 dark:text-gray-400 dark:border-gray-800">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
