"use client";

import React, { useId } from "react";
import { motion } from "framer-motion";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  shake?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, shake, className = "", id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id || generatedId;

    // Framer motion shake variant
    const shakeVariants = {
      shake: {
        x: [0, -8, 8, -6, 6, -4, 4, 0],
        transition: { duration: 0.4 },
      },
      idle: { x: 0 },
    };

    return (
      <motion.div
        animate={error || shake ? "shake" : "idle"}
        variants={shakeVariants}
        className="w-full flex flex-col gap-1.5"
      >
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-semibold text-primary-dark select-none dark:text-gray-200"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`w-full px-4 py-3 rounded-xl border bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none transition-all duration-200 text-sm dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-500
            ${
              error
                ? "border-red-500 focus:ring-1 focus:ring-red-500"
                : "border-input-border hover:border-primary-green focus:ring-2 focus:ring-primary-green focus:border-primary-green shadow-[0_2px_4px_rgba(0,100,0,0.02)] dark:border-gray-700 dark:hover:border-primary-green"
            }
            ${className}`}
          {...props}
        />
        {error && (
          <span className="text-xs text-red-600 font-medium" role="alert" aria-live="assertive">
            {error}
          </span>
        )}
      </motion.div>
    );
  }
);

Input.displayName = "Input";
