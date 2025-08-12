import React from 'react'

interface DialogProps {
  children: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

interface DialogContentProps {
  children: React.ReactNode
  className?: string
}

interface DialogHeaderProps {
  children: React.ReactNode
  className?: string
}

interface DialogTitleProps {
  children: React.ReactNode
  className?: string
}

export function Dialog({ children, open = true, onOpenChange }: DialogProps) {
  if (!open) return null
  
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={() => onOpenChange?.(false)}
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{ position: 'relative' }}
      >
        {children}
      </div>
    </div>
  )
}

export function DialogContent({ children, className = '' }: DialogContentProps) {
  return (
    <div 
      className={`bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4 ${className}`}
      style={{ 
        position: 'relative',
        transform: 'none',
        top: 'auto',
        left: 'auto'
      }}
    >
      {children}
    </div>
  )
}

export function DialogHeader({ children, className = '' }: DialogHeaderProps) {
  return (
    <div className={`mb-4 ${className}`}>
      {children}
    </div>
  )
}

export function DialogTitle({ children, className = '' }: DialogTitleProps) {
  return (
    <h2 className={`text-lg font-semibold text-gray-900 ${className}`}>
      {children}
    </h2>
  )
} 