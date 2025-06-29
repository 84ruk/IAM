'use client';

import { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import { useRouter, usePathname } from 'next/navigation';
import { Input } from '../ui/Input';
import { Loader2 } from 'lucide-react';
import { useUserContext } from '@/context/UserProvider';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { mutate, user, isLoading: userLoading } = useUserContext();
  const pathname = usePathname();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const url = `${process.env.NEXT_PUBLIC_API_URL}/auth/login`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Credenciales incorrectas');
      }

      await mutate(); // SWR revalida el usuario automáticamente
      // No necesitas while ni fetch manual aquí

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user && !userLoading && pathname === '/login') {
      router.push('/dashboard');
    }
  }, [user, userLoading, router, pathname]);

  if (userLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-[#8E94F2]" />
          <p className="text-gray-600">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-[#8E94F2]" />
          <p className="text-gray-600">Iniciando sesión...</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="form-container">
      <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">Iniciar sesión</h1>
      
      <Input
        label="Correo electrónico"
        name="email"
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        required
        disabled={isLoading}
      />

      <Input
        label="Contraseña"
        name="password"
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        required
        disabled={isLoading}
      />

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}
      
      <Button 
        type="submit" 
        disabled={isLoading}
        className="w-full"
      >
        {isLoading ? (
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Iniciando sesión...</span>
          </div>
        ) : (
          'Iniciar sesión'
        )}
      </Button>

      <div className="my-4 flex items-center justify-center">
        <span className="text-gray-400 text-sm">o</span>
      </div>
      <Button
        type="button"
        className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 text-gray-700 hover:shadow-md hover:bg-gray-100 transition-all font-semibold py-2 rounded-lg mt-2"
        onClick={() => {
          window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google`;
        }}
        style={{ boxShadow: '0 1px 2px rgba(60,64,67,.08)' }}
      >
        <span className="flex items-center justify-center bg-white rounded-full p-1 border border-gray-200">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5">
            <g clipPath="url(#clip0_760_7151)">
              <path d="M19.6 10.2273C19.6 9.5182 19.5364 8.8364 19.4182 8.1818H10V12.05H15.3818C15.15 13.3 14.4455 14.3591 13.3864 15.0682V17.5773H16.6182C18.5091 15.8364 19.6 13.2727 19.6 10.2273Z" fill="#4285F4"/>
              <path d="M10 20C12.7 20 14.9636 19.1045 16.6181 17.5773L13.3863 15.0682C12.4909 15.6682 11.3454 16.0227 10 16.0227C7.3954 16.0227 5.1909 14.2636 4.4045 11.9H1.0636V14.4909C2.7091 17.7591 6.0909 20 10 20Z" fill="#34A853"/>
              <path d="M4.4045 11.9C4.2045 11.3 4.0909 10.6591 4.0909 10C4.0909 9.3409 4.2045 8.7 4.4045 8.1V5.5091H1.0636C0.3864 6.8591 0 8.3864 0 10C0 11.6136 0.3864 13.1409 1.0636 14.4909L4.4045 11.9Z" fill="#FBBC04"/>
              <path d="M10 3.9773C11.4681 3.9773 12.7863 4.4818 13.8227 5.4727L16.6909 2.6045C14.9591 0.9909 12.6954 0 10 0C6.0909 0 2.7091 2.2409 1.0636 5.5091L4.4045 8.1C5.1909 5.7364 7.3954 3.9773 10 3.9773Z" fill="#E94235"/>
            </g>
            <defs>
              <clipPath id="clip0_760_7151">
                <rect width="20" height="20" fill="white"/>
              </clipPath>
            </defs>
          </svg>
        </span>
        <span>Iniciar sesión con Google</span>
      </Button>
      
      <div className="mt-4 text-center">
        <a 
          href="/recuperar" 
          className="text-sm text-[#8E94F2] hover:text-[#7278e0] transition-colors"
        >
          ¿Olvidaste tu contraseña?
        </a>
      </div>
    </form>
  );
}

