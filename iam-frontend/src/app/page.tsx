import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/ssrAuth';
import LandingPage from '@/components/landing/LandingPage';

export const metadata: Metadata = {
  title: 'IAM - ERP Inteligente para Gestión de Inventario | PYMEs',
  description: 'IAM es el ERP inteligente que revoluciona la gestión de inventario para PYMEs. Automatización, IA, análisis predictivo y control total en una plataforma moderna.',
  keywords: 'ERP, inventario, PYMEs, gestión empresarial, automatización, inteligencia artificial, análisis predictivo',
  authors: [{ name: 'Equipo IAM' }],
  creator: 'IAM',
  publisher: 'IAM',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://iaminventario.com.mx'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'IAM - ERP Inteligente para Gestión de Inventario',
    description: 'Revoluciona tu negocio con IAM. El ERP inteligente que automatiza tu inventario y potencia tus ventas con IA.',
    url: 'https://iaminventario.com.mx',
    siteName: 'IAM',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'IAM - ERP Inteligente',
      },
    ],
    locale: 'es_MX',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'IAM - ERP Inteligente para Gestión de Inventario',
    description: 'Revoluciona tu negocio con IAM. El ERP inteligente que automatiza tu inventario y potencia tus ventas con IA.',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'tu-google-verification-code',
  },
};

export default async function Home() {
  try {
    // Verificar autenticación en el servidor solo si el backend está disponible
    const user = await requireAuth();
    
    // Si el usuario está autenticado, redirigir al dashboard
    if (user) {
      redirect('/dashboard');
    }
  } catch (error) {
    // Si hay error de conexión, continuar sin autenticación
    console.warn('Backend no disponible, mostrando landing page sin verificación de autenticación');
  }

  // Mostrar la landing page
  return <LandingPage />;
}
