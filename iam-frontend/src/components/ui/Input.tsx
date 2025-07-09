// src/components/ui/Input.tsx
import React from 'react'
import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  name?: string;
  error?: string;
  optional?: boolean;
  placeholder?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, name, error, optional, placeholder, ...props }, ref) => {
    return (
      <div className="mb-4">
        {label && (
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-2">
          {label} {optional && <span className="text-gray-400 text-xs">(opcional)</span>}
        </label>
        )}
        <input
          id={name}
          name={name}
          ref={ref}
          className={cn(
            'w-full px-4 py-3 text-sm border rounded-lg transition-all duration-200',
            'shadow-sm hover:shadow-md focus:shadow-md',
            'focus:outline-none focus:ring-2 focus:ring-offset-0',
            'bg-white placeholder-gray-400',
            error
              ? 'border-red-300 focus:ring-red-300 focus:border-red-400'
              : 'border-gray-300 focus:ring-[#8E94F2] focus:border-[#8E94F2] hover:border-gray-400'
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
