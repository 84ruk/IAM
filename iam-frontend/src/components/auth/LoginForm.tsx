'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import { useRouter } from 'next/navigation';
import { Input } from '../ui/Input';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      console.log('Iniciando login...');
      const url = `${process.env.NEXT_PUBLIC_API_URL}/auth/login`;
      console.log('URL del login:', url);
      
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });
     
      console.log('Respuesta del login:', res.status, res.statusText);
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Credenciales incorrectas');
      }

      // Verificar que la cookie se haya setado
      const cookies = document.cookie;
      console.log('Cookies después del login:', cookies);
      
      if (!cookies.includes('jwt')) {
        console.warn('No se detectó la cookie JWT después del login');
        // Intentar verificar si la cookie está en el servidor
        try {
          const meRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
            credentials: 'include',
          });
          console.log('Verificación /auth/me:', meRes.status);
          if (meRes.ok) {
            console.log('Cookie funciona correctamente en el servidor');
          }
        } catch (verifyError) {
          console.error('Error verificando cookie:', verifyError);
        }
      } else {
        console.log('Cookie JWT detectada correctamente');
      }

      // Esperar un momento para que la cookie se procese
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log('Redirigiendo al dashboard...');
      router.push('/dashboard');
      router.refresh(); // Forzar refresh para actualizar el estado
      
    } catch (err: any) {
      console.error('Error en login:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

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
      />

      <Input
        label="Contraseña"
        name="password"
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        required
      />

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
      <Button type="submit" disabled={isLoading}>
        {isLoading ? 'Iniciando sesión...' : 'Iniciar sesión'}
      </Button>
      <div className="mt-4 text-center">
        <a href="/recuperar" className="btn-link">¿Olvidaste tu contraseña?</a>
      </div>
    </form>
  );
}

