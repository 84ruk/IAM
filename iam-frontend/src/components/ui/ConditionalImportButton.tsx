'use client'

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