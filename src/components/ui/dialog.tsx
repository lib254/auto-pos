import React, { ReactNode } from 'react';
import { X } from 'lucide-react';
import { Button } from '../ui/button';

type DialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
  className?: string;
};

type DialogContentProps = {
  children: ReactNode;
  className?: string;
  onInteractOutside?: () => void;
};

type DialogHeaderProps = {
  children: ReactNode;
  className?: string;
};

type DialogTitleProps = {
  children: ReactNode;
  className?: string;
};

type DialogDescriptionProps = {
  children: ReactNode;
  className?: string;
};

type DialogFooterProps = {
  children: ReactNode;
  className?: string;
};

const Dialog = ({ open, onOpenChange, children, className = '' }: DialogProps) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div 
        className={`bg-white rounded-lg shadow-xl max-w-[95vw] sm:max-w-md w-full mx-4 ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};

const DialogContent = ({ children, className = '', onInteractOutside }: DialogContentProps) => {
  return (
    <div className={`relative p-6 ${className}`}>
      {children}
    </div>
  );
};

const DialogHeader = ({ children, className = '' }: DialogHeaderProps) => {
  return (
    <div className={`mb-4 ${className}`}>
      {children}
    </div>
  );
};

const DialogTitle = ({ children, className = '' }: DialogTitleProps) => {
  return (
    <h3 className={`text-lg font-semibold ${className}`}>
      {children}
    </h3>
  );
};

const DialogDescription = ({ children, className = '' }: DialogDescriptionProps) => {
  return (
    <p className={`text-sm text-gray-600 mt-2 ${className}`}>
      {children}
    </p>
  );
};

const DialogFooter = ({ children, className = '' }: DialogFooterProps) => {
  return (
    <div className={`mt-6 flex justify-end space-x-3 ${className}`}>
      {children}
    </div>
  );
};

const DialogClose = ({ onOpenChange }: { onOpenChange: (open: boolean) => void }) => {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="absolute top-4 right-4 p-1 rounded-full"
      onClick={() => onOpenChange(false)}
    >
      <X className="w-5 h-5" />
      <span className="sr-only">Close</span>
    </Button>
  );
};

export {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
};