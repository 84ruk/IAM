import React from 'react';
import { CheckCircle, XCircle } from 'lucide-react';

interface PasswordRequirement {
  label: string;
  test: (password: string) => boolean;
}

interface PasswordStrengthProps {
  password: string;
  showRequirements?: boolean;
}

const requirements: PasswordRequirement[] = [
  {
    label: 'Al menos 6 caracteres',
    test: (password: string) => password.length >= 6,
  },
  {
    label: 'Al menos una letra minúscula',
    test: (password: string) => /(?=.*[a-z])/.test(password),
  },
  {
    label: 'Al menos una letra mayúscula',
    test: (password: string) => /(?=.*[A-Z])/.test(password),
  },
  {
    label: 'Al menos un número',
    test: (password: string) => /(?=.*\d)/.test(password),
  },
];

export const PasswordStrength: React.FC<PasswordStrengthProps> = ({
  password,
  showRequirements = true,
}) => {
  if (!password) return null;

  const metRequirements = requirements.filter(req => req.test(password));
  const strengthPercentage = (metRequirements.length / requirements.length) * 100;

  const getStrengthColor = () => {
    if (strengthPercentage <= 25) return 'bg-red-500';
    if (strengthPercentage <= 50) return 'bg-orange-500';
    if (strengthPercentage <= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStrengthText = () => {
    if (strengthPercentage <= 25) return 'Débil';
    if (strengthPercentage <= 50) return 'Regular';
    if (strengthPercentage <= 75) return 'Buena';
    return 'Fuerte';
  };

  return (
    <div className="mt-2 space-y-2">
      {/* Barra de fortaleza */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-gray-600">
          <span>Fortaleza de la contraseña</span>
          <span className="font-medium">{getStrengthText()}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${getStrengthColor()}`}
            style={{ width: `${strengthPercentage}%` }}
          />
        </div>
      </div>

      {/* Requisitos */}
      {showRequirements && (
        <div className="space-y-1">
          <p className="text-xs text-gray-600 font-medium">Requisitos:</p>
          <div className="space-y-1">
            {requirements.map((requirement, index) => {
              const isMet = requirement.test(password);
              return (
                <div key={index} className="flex items-center gap-2 text-xs">
                  {isMet ? (
                    <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                  ) : (
                    <XCircle className="h-3 w-3 text-red-500 flex-shrink-0" />
                  )}
                  <span className={isMet ? 'text-green-700' : 'text-red-700'}>
                    {requirement.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}; 