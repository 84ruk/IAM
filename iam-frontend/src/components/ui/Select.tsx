import { SelectHTMLAttributes, forwardRef } from 'react'

interface Option {
  value: string
  label: string
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  error?: string
  options: (string | Option)[]
  optional?: boolean
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, name, options, error, optional, ...props }, ref) => {
    return (
      <div className="mb-4">
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
          {label} {optional && <span className="text-gray-400 text-xs">(opcional)</span>}
        </label>
        <select
          id={name}
          name={name}
          ref={ref}
          {...props}
          className={`w-full cursor-pointer shadow-sm rounded px-3 py-2 text-sm border ${
            error ? 'border-red-400' : 'border-gray-300'
          } focus:outline-none focus:ring-2 focus:ring-indigo-300`}
        >
          <option value="">Seleccione una opción</option>
          {options.map((opt, index) =>
            typeof opt === 'string' ? (
              <option key={opt} value={opt}>
                {opt.charAt(0).toUpperCase() + opt.slice(1).toLowerCase()}
              </option>
            ) : (
              <option key={opt.value + index} value={opt.value}>
                {opt.label}
              </option>
            )
          )}
        </select>
        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
      </div>
    )
  }
)

Select.displayName = 'Select'
export default Select
