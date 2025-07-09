import React from 'react';
import { CheckCircle, XCircle, Info } from 'lucide-react';

interface CharacterValidationProps {
  field: 'nombre' | 'email' | 'password';
  value: string;
  showRules?: boolean;
}

const fieldRules = {
  nombre: {
    title: 'Reglas para el nombre:',
    rules: [
      'Solo letras (a-z, A-Z)',
      'Espacios simples',
      'Acentos (á, é, í, ó, ú, ñ, ü)',
      'Mínimo 2 caracteres',
      'Máximo 100 caracteres'
    ],
    allowedChars: /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]*$/
  },
  email: {
    title: 'Reglas para el email:',
    rules: [
      'Formato válido de email',
      'Sin espacios',
      'Sin caracteres especiales peligrosos',
      'Letras, números, puntos, guiones y @'
    ],
    allowedChars: /^[a-zA-Z0-9@._-]*$/
  },
  password: {
    title: 'Reglas para la contraseña:',
    rules: [
      'Mínimo 6 caracteres',
      'Al menos una letra minúscula',
      'Al menos una letra mayúscula',
      'Al menos un número',
      'Sin espacios',
      'Caracteres especiales permitidos: !@#$%^&*()_+-=[]{}|;:,.<>?'
    ],
    allowedChars: /^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]*$/
  }
};

export const CharacterValidation: React.FC<CharacterValidationProps> = ({
  field,
  value,
  showRules = false
}) => {
  if (!value || !showRules) return null;

  const rules = fieldRules[field];
  const isValid = rules.allowedChars.test(value);

  return (
    <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
      <div className="flex items-start gap-2 mb-2">
        <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h4 className="text-sm font-medium text-gray-700 mb-1">
            {rules.title}
          </h4>
          
          <div className="space-y-1">
            {rules.rules.map((rule, index) => (
              <div key={index} className="flex items-center gap-2 text-xs">
                <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                <span className="text-gray-600">{rule}</span>
              </div>
            ))}
          </div>
          
          {!isValid && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
              <div className="flex items-center gap-2 text-xs text-red-700">
                <XCircle className="w-3 h-3 flex-shrink-0" />
                <span>El valor contiene caracteres no permitidos</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 