import { requireAuth } from '@/lib/ssrAuth'
import { redirect } from 'next/navigation'
import RegisterForm from '@/components/auth/RegisterForm'

export default async function RegisterPage() {
  try {
    const user = await requireAuth();
    if (user) {
      redirect('/dashboard');
    }
  } catch {
    // Si hay error de conexión, continuar sin autenticación
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <RegisterForm />
    </div>
  );
} 