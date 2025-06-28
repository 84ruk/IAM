'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import { useRouter } from 'next/navigation';
import { Input } from '../ui/Input';
import { Loader2 } from 'lucide-react';
import { useUserContext } from '@/context/UserProvider';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { mutate } = useUserContext();

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

      // Forzar revalidación del usuario tras login
      await mutate();
      // Esperar a que el usuario esté autenticado
      let intentos = 0;
      let autenticado = false;
      while (intentos < 10) {
        const meRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, { credentials: 'include' });
        if (meRes.ok) {
          autenticado = true;
          break;
        }
        await new Promise(resolve => setTimeout(resolve, 100));
        intentos++;
      }
      if (autenticado) {
        router.push('/dashboard');
      } else {
        setError('No se pudo autenticar. Intenta nuevamente.');
      }
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

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

