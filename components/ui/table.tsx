import React from "react";

export function Table({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-input-border/30 bg-white">
      <table className={`w-full text-left border-collapse ${className}`}>{children}</table>
    </div>
  );
}

export function TableHeader({ children }: { children: React.ReactNode }) {
  return <thead className="bg-card-bg text-primary-dark border-b border-input-border/40 font-semibold">{children}</thead>;
}

export function TableBody({ children }: { children: React.ReactNode }) {
  return <tbody className="divide-y divide-gray-100">{children}</tbody>;
}

export function TableRow({ children, className = "", ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={`hover:bg-emerald-50/20 transition-colors duration-150 ${className}`} {...props}>{children}</tr>;
}

export function TableHead({ children, className = "", ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return <th className={`px-6 py-4 text-xs font-bold uppercase tracking-wider ${className}`} {...props}>{children}</th>;
}

export function TableCell({ children, className = "", ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={`px-6 py-4 text-sm font-medium text-gray-700 ${className}`} {...props}>{children}</td>;
}

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-6 py-4 bg-white border-t border-gray-100">
      <div className="text-xs text-gray-500 font-medium">
        Page <span className="font-semibold text-primary-dark">{currentPage}</span> of{" "}
        <span className="font-semibold text-primary-dark">{totalPages}</span>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-input-border/40 text-primary-green hover:bg-card-bg disabled:opacity-40 disabled:pointer-events-none cursor-pointer transition-colors"
        >
          Previous
        </button>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-input-border/40 text-primary-green hover:bg-card-bg disabled:opacity-40 disabled:pointer-events-none cursor-pointer transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
}
