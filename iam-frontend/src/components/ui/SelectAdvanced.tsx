'use client'

import React, { createContext, useContext, useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { ChevronDown, Check } from 'lucide-react'

interface SelectContextType {
  isOpen: boolean
  selectedValue: string
  onSelect: (value: string) => void
  onToggle: () => void
}

const SelectContext = createContext<SelectContextType | null>(null)

const useSelectContext = () => {
  const context = useContext(SelectContext)
  if (!context) {
    throw new Error('Select components must be used within a Select component')
  }
  return context
}

interface SelectProps {
  children: React.ReactNode
  value?: string
  onValueChange?: (value: string) => void
  disabled?: boolean
  className?: string
}

export function Select({ children, value, onValueChange, disabled, className }: SelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedValue, setSelectedValue] = useState(value || '')
  const dropdownRef = useRef<HTMLDivElement>(null)

  const onSelect = (value: string) => {
    setSelectedValue(value)
    setIsOpen(false)
    onValueChange?.(value)
  }

  const onToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen)
    }
  }

  useEffect(() => {
    setSelectedValue(value || '')
  }, [value])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <SelectContext.Provider value={{ isOpen, selectedValue, onSelect, onToggle }}>
      <div className={cn('relative', className)} ref={dropdownRef}>
        {children}
      </div>
    </SelectContext.Provider>
  )
}

interface SelectTriggerProps {
  children: React.ReactNode
  className?: string
}

export function SelectTrigger({ children, className }: SelectTriggerProps) {
  const { isOpen, onToggle } = useSelectContext()

  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        'w-full px-4 py-2 text-sm border rounded-lg transition-all duration-200',
        'shadow-sm hover:shadow-md focus:shadow-md',
        'focus:outline-none focus:ring-2 focus:ring-offset-0',
        'bg-white text-left flex items-center justify-between',
        'cursor-pointer',
        'border-gray-300 focus:ring-[#8E94F2] focus:border-[#8E94F2] hover:border-gray-400',
        className
      )}
    >
      {children}
      <ChevronDown 
        className={cn(
          'w-4 h-4 text-gray-400 transition-transform duration-200',
          isOpen && 'rotate-180'
        )} 
      />
    </button>
  )
}

interface SelectValueProps {
  placeholder?: string
}

export function SelectValue({ placeholder = "Seleccionar..." }: SelectValueProps) {
  const { selectedValue } = useSelectContext()
  
  return (
    <span className={cn(
      'truncate',
      (!selectedValue && selectedValue !== '') && 'text-gray-400'
    )}>
      {selectedValue || placeholder}
    </span>
  )
}

interface SelectContentProps {
  children: React.ReactNode
  className?: string
}

export function SelectContent({ children, className }: SelectContentProps) {
  const { isOpen } = useSelectContext()

  if (!isOpen) return null

  return (
    <div className={cn(
      'absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto',
      className
    )}>
      {children}
    </div>
  )
}

interface SelectItemProps {
  value: string
  children: React.ReactNode
  className?: string
}

export function SelectItem({ value, children, className }: SelectItemProps) {
  const { selectedValue, onSelect } = useSelectContext()

  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      className={cn(
        'w-full px-4 py-2 text-sm text-left hover:bg-gray-50 transition-colors',
        'flex items-center justify-between',
        selectedValue === value && 'bg-[#8E94F2] text-white hover:bg-[#7278e0]',
        className
      )}
    >
      <span className="truncate">{children}</span>
      {selectedValue === value && (
        <Check className="w-4 h-4" />
      )}
    </button>
  )
} 