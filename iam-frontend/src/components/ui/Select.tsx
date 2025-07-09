import React, { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { ChevronDown, Check } from 'lucide-react'

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label?: string
  error?: string
  optional?: boolean
  options?: string[] | { value: string, label: string }[]
  onChange?: (e: { target: { value: string } }) => void
  placeholder?: string
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, optional, options = [], children, className, placeholder = "Seleccionar...", value, onChange, ...props }, ref) => {
    const [isOpen, setIsOpen] = useState(false)
    const [selectedValue, setSelectedValue] = useState(value || '')
    const dropdownRef = useRef<HTMLDivElement>(null)

    // Normaliza las opciones
    const opts = Array.isArray(options)
      ? options.map(opt => typeof opt === 'string' ? { value: opt, label: opt } : opt)
      : []

    // Obtener el label del valor seleccionado
    const getSelectedLabel = () => {
      if (!selectedValue && selectedValue !== '') return placeholder
      const selected = opts.find(opt => opt.value === selectedValue)
      return selected ? selected.label : placeholder
    }

    // Manejar selección
    const handleSelect = (value: string) => {
      setSelectedValue(value)
      setIsOpen(false)
      if (onChange) {
        onChange({ target: { value } })
      }
    }

    // Cerrar dropdown al hacer clic fuera
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
          setIsOpen(false)
        }
      }

      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Actualizar valor cuando cambie la prop value
    useEffect(() => {
      setSelectedValue(value || '')
    }, [value])

    return (
      <div className={cn("mb-4", className)}>
        {/* Label */}
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {label} {optional && <span className="text-gray-400 text-xs">(opcional)</span>}
          </label>
        )}
        
        {/* Dropdown personalizado */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className={cn(
              'w-full px-4 py-3 text-sm border rounded-lg transition-all duration-200',
              'shadow-sm hover:shadow-md focus:shadow-md',
              'focus:outline-none focus:ring-2 focus:ring-offset-0',
              'bg-white text-left flex items-center justify-between',
              'cursor-pointer',
              error 
                ? 'border-red-300 focus:ring-red-300 focus:border-red-400' 
                : 'border-gray-300 focus:ring-[#8E94F2] focus:border-[#8E94F2] hover:border-gray-400',
              (!selectedValue && selectedValue !== '') && 'text-gray-400'
            )}
            disabled={props.disabled}
          >
            <span className="truncate">{getSelectedLabel()}</span>
            <ChevronDown 
              className={cn(
                'w-4 h-4 text-gray-400 transition-transform duration-200',
                isOpen && 'rotate-180'
              )} 
            />
          </button>

          {/* Dropdown menu */}
          {isOpen && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
              {opts.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSelect(opt.value)}
                  className={cn(
                    'w-full px-4 py-3 text-sm text-left hover:bg-gray-50 transition-colors',
                    'flex items-center justify-between',
                    selectedValue === opt.value && 'bg-[#8E94F2] text-white hover:bg-[#7278e0]'
                  )}
                >
                  <span className="truncate">{opt.label}</span>
                  {selectedValue === opt.value && (
                    <Check className="w-4 h-4" />
                  )}
                </button>
              ))}
              {opts.length === 0 && (
                <div className="px-4 py-3 text-sm text-gray-500">
                  No hay opciones disponibles
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input oculto para formularios */}
        <select
          ref={ref}
          value={selectedValue}
          onChange={onChange}
          tabIndex={-1}
          aria-hidden="true"
          style={{
            position: 'absolute',
            width: 1,
            height: 1,
            padding: 0,
            margin: '-1px',
            overflow: 'hidden',
            clip: 'rect(0,0,0,0)',
            whiteSpace: 'nowrap',
            border: 0,
            left: 0,
            top: 0,
            pointerEvents: 'none',
          }}
          {...props}
        >
          {children}
          {opts.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Mensaje de error */}
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      </div>
    )
  }
)
Select.displayName = 'Select'

export default Select
