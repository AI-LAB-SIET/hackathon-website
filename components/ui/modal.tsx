"use client";

import React from "react";
import { X } from "lucide-react";
import { Dialog } from "./dialog";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  return (
    <Dialog open={isOpen} onClose={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="flex flex-col max-h-[85vh]"
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 bg-card-bg dark:bg-gray-800 dark:border-gray-700">
          <h3 className="text-base font-bold text-primary-dark dark:text-gray-100">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-500 hover:bg-emerald-100 hover:text-primary-dark transition-colors cursor-pointer dark:hover:bg-emerald-900/30 dark:text-gray-400"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-6 py-6 overflow-y-auto flex-1">{children}</div>
      </div>
    </Dialog>
  );
}
