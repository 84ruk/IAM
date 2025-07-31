import { AlertCircle, CheckCircle } from 'lucide-react'

interface PasswordConfirmationProps {
  password: string;
  confirmPassword: string;
}

export const PasswordConfirmation: React.FC<PasswordConfirmationProps> = ({
  password,
  confirmPassword,
}) => {
  if (!password || !confirmPassword) return null;

  const passwordsMatch = password === confirmPassword;

  return (
    <div className="mt-2 flex items-center gap-2 text-xs">
      {passwordsMatch ? (
        <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
      ) : (
        <AlertCircle className="h-3 w-3 text-red-500 flex-shrink-0" />
      )}
      <span className={passwordsMatch ? 'text-green-700' : 'text-red-700'}>
        {passwordsMatch ? 'Las contraseñas coinciden' : 'Las contraseñas no coinciden'}
      </span>
    </div>
  );
}; 