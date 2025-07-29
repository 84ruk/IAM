'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Button from '@/components/ui/Button'
import { Upload, Plus, Sparkles, Brain } from 'lucide-react'
import ImportButton from './ImportButton'

interface ConditionalImportButtonProps {
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  showIcon?: boolean
  children?: React.ReactNode
  mode?: 'unified' | 'auto' | 'both'
}

export default function ConditionalImportButton({ 
  variant = 'default', 
  size = 'md', 
  className = '',
  showIcon = true,
  children,
  mode = 'both'
}: ConditionalImportButtonProps) {
  const pathname = usePathname()
  
  // Usar el ImportButton directamente ya que el contexto está disponible en DashboardShell
  return (
    <ImportButton
      variant={variant}
      size={size}
      className={className}
      showIcon={showIcon}
      mode={mode}
    >
      {children}
    </ImportButton>
  )
}

// Variante para el dashboard
export function DashboardConditionalImportButton() {
  return (
    <ConditionalImportButton
      variant="default"
      size="lg"
      className="px-6 py-3 text-base"
      mode="both"
    />
  )
} 