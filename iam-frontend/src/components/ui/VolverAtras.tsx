import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface VolverAtrasProps {
  href: string
  label: string
  className?: string
}

export default function VolverAtras({ href, label, className }: VolverAtrasProps) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors ${className || ''}`}
    >
      <ArrowLeft className="w-5 h-5" />
      {label}
    </Link>
  )
} 