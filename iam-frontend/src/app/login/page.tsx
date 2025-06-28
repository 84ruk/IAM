<<<<<<< HEAD
'use client'

import LoginGuard from '@/components/auth/LoginGuard'
import LoginForm from '@/components/auth/LoginForm'
=======
'use client';

import LoginForm from '@/components/auth/LoginForm';
import { useEffect, useState } from 'react';
>>>>>>> 91cac1422cc10be3d341f5e2d8acbdd61d12fd81

export default function LoginPage() {
  const [cookieStatus, setCookieStatus] = useState<string>('');

  useEffect(() => {
    // Verificar el estado de las cookies al cargar la página
    const cookies = document.cookie;
    const hasJwt = cookies.includes('jwt');
    setCookieStatus(hasJwt ? 'JWT cookie presente' : 'Sin JWT cookie');
    
    console.log('Estado de cookies en login page:', cookies);
  }, []);

  return (
<<<<<<< HEAD
    <LoginGuard>
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoginForm />
      </div>
    </LoginGuard>
  )
=======
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sistema IAM
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Inicia sesión en tu cuenta
          </p>
          {cookieStatus && (
            <p className="mt-2 text-center text-xs text-gray-500">
              Estado: {cookieStatus}
            </p>
          )}
        </div>
        <LoginForm />
      </div>
    </div>
  );
>>>>>>> 91cac1422cc10be3d341f5e2d8acbdd61d12fd81
}
