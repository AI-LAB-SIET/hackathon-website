"use client";

import React from "react";
import { motion, HTMLMotionProps } from "framer-motion";

interface ButtonProps extends HTMLMotionProps<"button"> {
  children?: React.ReactNode;
  variant?: "primary" | "secondary" | "accent-yellow" | "outline" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  isLoading,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles =
    "relative inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer";

  const variants = {
    primary:
      "bg-primary-green hover:bg-primary-dark text-white shadow-[0_4px_14px_0_rgba(0,100,0,0.3)] hover:shadow-[0_6px_20px_0_rgba(0,77,0,0.4)] focus:ring-primary-green",
    secondary:
      "bg-card-bg hover:bg-emerald-100 text-primary-dark border border-input-border/30 shadow-sm focus:ring-primary-green",
    "accent-yellow":
      "bg-accent-yellow hover:bg-[#ebd322] text-primary-dark shadow-[0_4px_14px_0_rgba(247,224,53,0.3)] focus:ring-accent-yellow",
    outline:
      "bg-transparent border border-primary-green text-primary-green hover:bg-card-bg focus:ring-primary-green",
    danger:
      "bg-red-600 hover:bg-red-700 text-white shadow-[0_4px_14px_0_rgba(220,38,38,0.3)] focus:ring-red-500",
    ghost:
      "bg-transparent hover:bg-gray-100 text-gray-700 focus:ring-gray-400",
  };

  const sizes = {
    sm: "px-4 py-2 text-xs",
    md: "px-6 py-3 text-sm",
    lg: "px-8 py-4 text-base",
  };

  return (
    <motion.button
      whileHover={{ y: -2, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg
          className="animate-spin -ml-1 mr-3 h-4 w-4 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </motion.button>
  );
}
