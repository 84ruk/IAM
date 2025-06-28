import React from 'react'

interface PaginationProps {
  pagina: number
  totalPaginas: number
  onPageChange: (page: number) => void
}

export default function Pagination({
  pagina,
  totalPaginas,
  onPageChange
}: PaginationProps) {
  if (totalPaginas <= 1) return null

  return (
    <div className="flex items-center justify-center gap-2">
      <button
        onClick={() => onPageChange(Math.max(1, pagina - 1))}
        disabled={pagina === 1}
        className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-white rounded-lg border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Anterior
      </button>
      
      <span className="px-4 py-2 text-sm text-gray-600">
        Página {pagina} de {totalPaginas}
      </span>
      
      <button
        onClick={() => onPageChange(Math.min(totalPaginas, pagina + 1))}
        disabled={pagina === totalPaginas}
        className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-white rounded-lg border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Siguiente
      </button>
    </div>
  )
} 