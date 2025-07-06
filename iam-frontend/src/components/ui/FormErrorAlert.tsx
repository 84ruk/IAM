'use client';

import { AlertCircle, X, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AppError, ValidationAppError } from '@/lib/errorHandler';

interface FormErrorAlertProps {
  errors?: string[] | AppError | null; // lista de errores tipo DTO o AppError
  className?: string;
  onClose?: () => void;
  showCloseButton?: boolean;
}

export function FormErrorAlert({ 
  errors, 
  className = '', 
  onClose,
  showCloseButton = true 
}: FormErrorAlertProps) {
  if (!errors) return null;

  let errorMessages: string[] = [];
  let errorType: 'validation' | 'server' | 'general' = 'general';

  // Procesar diferentes tipos de errores
  if (Array.isArray(errors)) {
    errorMessages = errors;
    errorType = 'server';
  } else if (errors instanceof ValidationAppError) {
    errorMessages = errors.errors?.map(err => err.message) || [errors.message];
    errorType = 'validation';
  } else if (errors instanceof AppError) {
    errorMessages = [errors.message];
    errorType = errors.statusCode === 400 ? 'validation' : 'server';
  } else if (typeof errors === 'string') {
    errorMessages = [errors];
    errorType = 'general';
  }

  if (errorMessages.length === 0) return null;

  const getIcon = () => {
    switch (errorType) {
      case 'validation':
        return <AlertTriangle className="w-4 h-4" />;
      case 'server':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  const getBgColor = () => {
    switch (errorType) {
      case 'validation':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'server':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  const getIconColor = () => {
    switch (errorType) {
      case 'validation':
        return 'text-yellow-600';
      case 'server':
        return 'text-red-600';
      default:
        return 'text-blue-600';
    }
  };

  return (
    <div className={cn(
      'rounded-lg border p-4 mb-6',
      getBgColor(),
        className
    )}>
      <div className="flex items-start gap-3">
        <div className={cn('flex-shrink-0 mt-0.5', getIconColor())}>
          {getIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-medium">
                {errorType === 'validation' && 'Errores de validación'}
                {errorType === 'server' && 'Error del servidor'}
                {errorType === 'general' && 'Error'}
              </h3>
              
              <div className="mt-2 space-y-1">
                {errorMessages.map((message, index) => (
                  <p key={index} className="text-sm">
                    {message}
                  </p>
                ))}
              </div>
            </div>
            
            {showCloseButton && onClose && (
              <button
                onClick={onClose}
                className="flex-shrink-0 ml-2 hover:opacity-70 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
