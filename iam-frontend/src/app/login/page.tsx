import { requireAuth } from '@/lib/ssrAuth'
import { redirect } from 'next/navigation'
import LoginForm from '@/components/auth/LoginForm'

export default async function LoginPage() {
  try {
    const user = await requireAuth();
    if (user) {
      redirect('/dashboard');
    }
  } catch (error) {
    // Si hay error de conexión, continuar sin autenticación
    console.warn('Backend no disponible, mostrando página de login sin verificación de autenticación');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <LoginForm />
    </div>
  );
}
