import React from 'react'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  optional?: boolean
  options?: string[] | { value: string, label: string }[]
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, optional, options = [], children, ...props }, ref) => {
    // Normaliza las opciones
    const opts = Array.isArray(options)
      ? options.map(opt => typeof opt === 'string' ? { value: opt, label: opt } : opt)
      : []
    return (
      <div>
        {/* Solo renderiza el label si existe */}
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label} {optional && <span className="text-gray-400">(opcional)</span>}
          </label>
        )}
        <select ref={ref} {...props} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8E94F2] focus:border-transparent transition-all duration-200">
          {children}
          {opts.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    )
  }
)
Select.displayName = 'Select'

export default Select
