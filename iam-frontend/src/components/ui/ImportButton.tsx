'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'
import { Upload, Plus, Sparkles, Brain } from 'lucide-react'
import UnifiedImportModal from '@/components/importacion/UnifiedImportModal'
import SafeAutoImportModal from '@/components/importacion/SafeAutoImportModal'

interface ImportButtonProps {
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  showIcon?: boolean
  children?: React.ReactNode
  mode?: 'unified' | 'auto' | 'both'
}

export default function ImportButton({ 
  variant = 'default', 
  size = 'md', 
  className = '',
  showIcon = true,
  children,
  mode = 'both'
}: ImportButtonProps) {
  const [isUnifiedModalOpen, setIsUnifiedModalOpen] = useState(false)
  const [isAutoModalOpen, setIsAutoModalOpen] = useState(false)
  const [showModeSelector, setShowModeSelector] = useState(false)

  const handleOpenModal = () => {
    if (mode === 'both') {
      setShowModeSelector(true)
    } else if (mode === 'auto') {
      setIsAutoModalOpen(true)
    } else {
      setIsUnifiedModalOpen(true)
    }
  }

  const handleCloseUnifiedModal = () => {
    setIsUnifiedModalOpen(false)
  }

  const handleCloseAutoModal = () => {
    setIsAutoModalOpen(false)
  }

  const handleCloseModeSelector = () => {
    setShowModeSelector(false)
  }

  const getButtonContent = () => {
    if (children) {
      return (
        <>
          {showIcon && <Upload className="w-4 h-4 mr-2" />}
          {children}
        </>
      )
    }

    return (
      <>
        {showIcon && <Upload className="w-4 h-4 mr-2" />}
        Importar Datos
      </>
    )
  }

  const getButtonClasses = () => {
    const baseClasses = 'transition-all duration-300 transform hover:scale-105 font-medium'
    
    if (variant === 'default') {
      return `bg-gradient-to-r from-[#8E94F2] to-[#7278e0] hover:from-[#7278e0] hover:to-[#8E94F2] text-white shadow-lg hover:shadow-xl ${baseClasses} ${className}`
    }
    
    if (variant === 'outline') {
      return `border-2 border-[#8E94F2] text-[#8E94F2] hover:bg-[#8E94F2] hover:text-white ${baseClasses} ${className}`
    }
    
    return `${baseClasses} ${className}`
  }

  return (
    <>
      <Button
        onClick={handleOpenModal}
        variant={variant}
        size={size}
        className={getButtonClasses()}
      >
        {getButtonContent()}
      </Button>

      {/* Modal de selección de modo */}
      {showModeSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-[#8E94F2] to-[#7278e0] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Upload className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Elige el modo de importación</h3>
              <p className="text-gray-600">Selecciona cómo quieres importar tus datos</p>
            </div>

            <div className="grid grid-cols-1 gap-4 mb-8">
              <button
                onClick={() => {
                  setShowModeSelector(false)
                  setIsAutoModalOpen(true)
                }}
                className="group relative overflow-hidden bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] hover:-translate-y-1 p-5 text-left border-0"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex items-center gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-blue-700 transition-colors duration-300">
                      Importación Inteligente
                    </h4>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      Detecta automáticamente el tipo de datos y optimiza el proceso
                    </p>
                  </div>
                  <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => {
                  setShowModeSelector(false)
                  setIsUnifiedModalOpen(true)
                }}
                className="group relative overflow-hidden bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] hover:-translate-y-1 p-5 text-left border-0"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-slate-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex items-center gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-gray-500 to-slate-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                    <Upload className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-gray-700 transition-colors duration-300">
                      Importación Manual
                    </h4>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      Selecciona manualmente el tipo de datos y controla cada paso
                    </p>
                  </div>
                  <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </button>
            </div>

            <div className="text-center">
              <button
                onClick={handleCloseModeSelector}
                className="px-6 py-3 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-all duration-300 font-medium"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <UnifiedImportModal 
        isOpen={isUnifiedModalOpen} 
        onClose={handleCloseUnifiedModal} 
      />

      <SafeAutoImportModal 
        isOpen={isAutoModalOpen} 
        onClose={handleCloseAutoModal} 
      />
    </>
  )
}

// Variante para el dashboard principal
export function DashboardImportButton() {
  return (
    <ImportButton
      variant="default"
      size="lg"
      className="px-6 py-3 text-base"
      mode="both"
    />
  )
}

// Variante compacta
export function CompactImportButton() {
  return (
    <ImportButton
      variant="outline"
      size="sm"
      className="px-4 py-2"
      mode="both"
    />
  )
}

// Variante con icono de plus
export function AddImportButton() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [showModeSelector, setShowModeSelector] = useState(false)

  return (
    <>
      <Button
        onClick={() => setShowModeSelector(true)}
        variant="outline"
        size="sm"
        className="border-2 border-[#8E94F2] text-[#8E94F2] hover:bg-[#8E94F2] hover:text-white transition-all duration-300"
      >
        <Plus className="w-4 h-4 mr-2" />
        Importar
      </Button>

      {/* Modal de selección de modo */}
      {showModeSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-[#8E94F2] to-[#7278e0] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Upload className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Elige el modo de importación</h3>
              <p className="text-gray-600">Selecciona cómo quieres importar tus datos</p>
            </div>

            <div className="grid grid-cols-1 gap-4 mb-8">
              <button
                onClick={() => {
                  setShowModeSelector(false)
                  setIsModalOpen(true)
                }}
                className="group relative overflow-hidden bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] hover:-translate-y-1 p-5 text-left border-0"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex items-center gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-blue-700 transition-colors duration-300">
                      Importación Inteligente
                    </h4>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      Detecta automáticamente el tipo de datos y optimiza el proceso
                    </p>
                  </div>
                  <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => {
                  setShowModeSelector(false)
                  setIsModalOpen(true)
                }}
                className="group relative overflow-hidden bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] hover:-translate-y-1 p-5 text-left border-0"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-slate-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex items-center gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-gray-500 to-slate-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                    <Upload className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-gray-700 transition-colors duration-300">
                      Importación Manual
                    </h4>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      Selecciona manualmente el tipo de datos y controla cada paso
                    </p>
                  </div>
                  <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </button>
            </div>

            <div className="text-center">
              <button
                onClick={() => setShowModeSelector(false)}
                className="px-6 py-3 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-all duration-300 font-medium"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <SafeAutoImportModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  )
}

// Variante solo para importación automática
export function AutoImportButton() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <Button
        onClick={() => setIsModalOpen(true)}
        variant="default"
        size="md"
        className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 font-medium"
      >
        <Sparkles className="w-4 h-4 mr-2" />
        Importación Inteligente
      </Button>

      <SafeAutoImportModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  )
} 