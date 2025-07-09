'use client'

import { CheckCircle } from 'lucide-react'
import { motion } from 'framer-motion'

interface Step {
  id: number
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
}

interface ProgressStepsProps {
  steps: Step[]
  currentStep: number
}

export default function ProgressSteps({ steps, currentStep }: ProgressStepsProps) {
  return (
    <div className="max-w-4xl mx-auto mb-8">
      {/* Progress Bar */}
      <div className="flex items-center justify-between mb-8">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center flex-1">
            <motion.div
              className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300 ${
                currentStep >= step.id
                  ? 'bg-blue-500 border-blue-500 text-white shadow-lg'
                  : 'bg-white border-gray-300 text-gray-500'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {currentStep > step.id ? (
                <CheckCircle className="w-6 h-6" />
              ) : (
                <step.icon className="w-6 h-6" />
              )}
            </motion.div>
            
            {index < steps.length - 1 && (
              <div className="flex-1 mx-4 relative">
                <div className="h-1 bg-gray-200 rounded-full">
                  <motion.div
                    className="h-1 bg-blue-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ 
                      width: currentStep > step.id ? '100%' : '0%' 
                    }}
                    transition={{ duration: 0.5, ease: 'easeInOut' }}
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Step Labels */}
      <div className="flex justify-between">
        {steps.map((step) => (
          <div key={step.id} className="text-center flex-1">
            <motion.p
              className={`text-sm font-medium transition-colors duration-300 ${
                currentStep >= step.id ? 'text-blue-600' : 'text-gray-500'
              }`}
              animate={{ 
                color: currentStep >= step.id ? '#2563eb' : '#6b7280' 
              }}
            >
              {step.title}
            </motion.p>
            <p className="text-xs text-gray-400 mt-1">
              {step.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
} 