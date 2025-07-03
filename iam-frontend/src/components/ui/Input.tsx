// src/components/ui/Input.tsx
import React from 'react'
import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  name: string;
  error?: string;
  optional?: boolean;
  placeholder?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, name, error, optional, placeholder, ...props }, ref) => {
    return (
      <div className="mb-4">
        {label && (
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
          {label} {optional && <span className="text-gray-400 text-xs">(opcional)</span>}
        </label>
        )}
        <input
          id={name}
          name={name}
          ref={ref}
          className={cn(
            'w-full shadow-sm rounded px-3 py-2 text-sm border focus:outline-none focus:ring-2 cursor-pointer',
            error
              ? 'border-red-500 focus:ring-red-300'
              : 'border-gray-300 focus:ring-indigo-300'
          )}
          placeholder={placeholder || `${label}${optional ? ' (opcional)' : ''}`}
          {...props}
        />
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
