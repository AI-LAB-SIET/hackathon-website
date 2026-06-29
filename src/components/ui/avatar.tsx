import React from "react";

interface AvatarProps {
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const Avatar = React.memo(function Avatar({ name, size = "md", className = "" }: AvatarProps) {
  const getInitials = (n: string) => {
    const parts = n.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return n.slice(0, 2).toUpperCase();
  };

  const sizes = {
    sm: "h-8 w-8 text-xs border",
    md: "h-10 w-10 text-sm border-2",
    lg: "h-14 w-14 text-base border-2",
  };

  return (
    <div
      className={`relative flex items-center justify-center rounded-full font-bold select-none overflow-hidden bg-gradient-to-tr from-primary-dark via-primary-green to-accent-green text-white border-white/80 shadow-sm ${sizes[size]} ${className}`}
    >
      {getInitials(name)}
    </div>
  );
});
