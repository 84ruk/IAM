'use client'

import React from 'react'
import AutoImportModal from './AutoImportModal'
import { ImportacionErrorBoundary } from './ErrorBoundary'

interface SafeAutoImportModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function SafeAutoImportModal({ isOpen, onClose }: SafeAutoImportModalProps) {
  return (
    <ImportacionErrorBoundary>
      <AutoImportModal isOpen={isOpen} onClose={onClose} />
    </ImportacionErrorBoundary>
  )
} 