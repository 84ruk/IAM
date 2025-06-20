'use client';

import { useState } from 'react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { useRouter } from 'next/navigation';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const url = `${process.env.NEXT_PUBLIC_API_URL}/auth/login`;
      const res = await fetch(url , {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });
     
      
      if (!res.ok) throw new Error('Credenciales incorrectas');
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
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
      <Button type="submit">Iniciar sesión</Button>
      <div className="mt-4 text-center">
        <a href="/recuperar" className="btn-link">¿Olvidaste tu contraseña?</a>
      </div>
    </form>
  );
}

