'use client';

import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FormErrorAlertProps {
  errors: string[]; // lista de errores tipo DTO
  className?: string;
}

export function FormErrorAlert({ errors, className }: FormErrorAlertProps) {
  if (!errors || errors.length === 0) return null;

  return (
    <div
      className={cn(
        'bg-red-100 text-red-800 border border-red-300 rounded-xl px-4 py-3 space-y-1 text-sm shadow-sm',
        className
      )}
    >
      <div className="flex items-center gap-2 font-medium">
        <AlertCircle className="w-4 h-4 text-red-600" />
        <span>Errores del formulario:</span>
      </div>
      <ul className="list-disc list-inside ml-4 mt-1">
        {errors.map((error, i) => (
          <li key={i}>{error}</li>
        ))}
      </ul>
    </div>
  );
}
