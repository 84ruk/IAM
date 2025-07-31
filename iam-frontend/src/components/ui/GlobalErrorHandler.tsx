'use client';

import { useEffect } from 'react';
import { useGlobalError } from '@/hooks/useGlobalError';

interface GlobalErrorHandlerProps {
  children: React.ReactNode
  onError?: (error: Error) => void
  onRedirect?: () => void
}

export function GlobalErrorHandler({ children, onError }: GlobalErrorHandlerProps) {
  const { handleError } = useGlobalError()

  useEffect(() => {
    const handleGlobalError = (event: ErrorEvent) => {
      const error = new Error(event.message)
      handleError(error)
      onError?.(error)
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason))
      handleError(error)
      onError?.(error)
    }

    window.addEventListener('error', handleGlobalError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    return () => {
      window.removeEventListener('error', handleGlobalError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [handleError, onError])

  return <>{children}</>
} 