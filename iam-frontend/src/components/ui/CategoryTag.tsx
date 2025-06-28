interface EtiquetaTagProps {
  etiqueta: string
  onClick?: (etiqueta: string) => void
  isActive?: boolean
  size?: 'sm' | 'md'
}

export default function EtiquetaTag({ 
  etiqueta, 
  onClick, 
  isActive = false, 
  size = 'sm' 
}: EtiquetaTagProps) {
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm'
  }

  const baseClasses = `
    inline-flex items-center rounded-full font-medium
    transition-all duration-200 cursor-pointer
    ${sizeClasses[size]}
  `

  const activeClasses = isActive
    ? 'bg-[#8E94F2] text-white shadow-md'
    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'

  return (
    <span
      className={`${baseClasses} ${activeClasses}`}
      onClick={() => onClick?.(etiqueta)}
    >
      #{etiqueta}
    </span>
  )
} 