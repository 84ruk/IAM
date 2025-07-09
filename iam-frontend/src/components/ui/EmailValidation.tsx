import React from 'react';
import { CheckCircle, XCircle, Mail } from 'lucide-react';

interface EmailValidationProps {
  email: string;
  isValid?: boolean;
}

export const EmailValidation: React.FC<EmailValidationProps> = ({
  email,
  isValid,
}) => {
  if (!email) return null;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isEmailValid = emailRegex.test(email);

  // Solo mostrar si hay un email y no es válido, o si es válido y hay un estado específico
  if (!isEmailValid || (isValid !== undefined && isValid !== isEmailValid)) {
    return (
      <div className="mt-2 flex items-center gap-2 text-xs">
        {isEmailValid ? (
          <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
        ) : (
          <XCircle className="h-3 w-3 text-red-500 flex-shrink-0" />
        )}
        <span className={isEmailValid ? 'text-green-700' : 'text-red-700'}>
          {isEmailValid ? 'Formato de email válido' : 'Formato de email inválido'}
        </span>
      </div>
    );
  }

  return null;
}; 