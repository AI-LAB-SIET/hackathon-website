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
    "relative inline-flex items-center justify-center font-extrabold uppercase tracking-wide rounded-xl transition-all duration-150 active:translate-y-[2px] focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-green/30 disabled:opacity-45 disabled:pointer-events-none disabled:active:translate-y-0 cursor-pointer";

  const variants = {
    primary:
      "bg-primary-green hover:bg-[#61CC0A] text-white shadow-[0_4px_0_0_#61B800] active:shadow-none",
    secondary:
      "bg-transparent text-blue border-2 border-input-border shadow-[0_4px_0_0_#E5E5E5] hover:bg-[#F7F7F7] active:shadow-none dark:border-gray-700 dark:hover:bg-gray-800",
    "accent-yellow":
      "bg-golden hover:bg-[#FFD119] text-primary-dark shadow-[0_4px_0_0_#E0AB00] active:shadow-none",
    outline:
      "bg-transparent text-primary-green border-2 border-primary-green shadow-[0_4px_0_0_#58CC02] hover:bg-primary-green/5 active:shadow-none",
    danger:
      "bg-red hover:bg-[#FF6A6A] text-white shadow-[0_4px_0_0_#CC3C3C] active:shadow-none",
    ghost:
      "bg-transparent text-primary-green hover:bg-primary-green/10 shadow-none active:translate-y-0 dark:hover:bg-primary-green/20",
  };

  const sizes = {
    sm: "h-9 px-4 text-[13px] rounded-[10px]",
    md: "h-12 px-6 text-[15px]",
    lg: "h-14 px-8 text-base",
  };

  return (
    <motion.button
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
