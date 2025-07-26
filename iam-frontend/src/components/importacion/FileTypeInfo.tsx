'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { 
  FileText, 
  FileSpreadsheet, 
  FileCode,
  Info,
  CheckCircle
} from 'lucide-react'
import { FILE_TYPE_CONFIG, type FileTypeInfo as FileTypeInfoType } from '@/types/fileTypes'

interface FileTypeInfoProps {
  className?: string
  showTip?: boolean
  title?: string
}

const getFileTypeIcon = (extension: string) => {
  switch (extension) {
    case '.xlsx':
    case '.xls':
      return FileSpreadsheet
    case '.numbers':
      return FileText
    case '.csv':
      return FileCode
    default:
      return FileText
  }
}

const FileTypeItem: React.FC<{ fileType: FileTypeInfoType }> = ({ fileType }) => {
  const IconComponent = getFileTypeIcon(fileType.extension)
  
  return (
    <div className="flex items-center gap-2 p-2 bg-white rounded border hover:bg-gray-50 transition-colors">
      <IconComponent className="w-4 h-4 text-gray-600 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-900 truncate">
            {fileType.name}
          </span>
          {fileType.new && (
            <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
              Nuevo
            </Badge>
          )}
        </div>
        <p className="text-xs text-gray-600 truncate">
          {fileType.description}
        </p>
      </div>
      {fileType.supported && (
        <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
      )}
    </div>
  )
}

export const FileTypeInfo: React.FC<FileTypeInfoProps> = ({ 
  className = '',
  showTip = true,
  title = 'Formatos de archivo soportados'
}) => {
  return (
    <Card className={`bg-gray-50 border-gray-200 ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Info className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-medium text-gray-900">
            {title}
          </h3>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {FILE_TYPE_CONFIG.map((fileType, index) => (
            <FileTypeItem key={`${fileType.extension}-${index}`} fileType={fileType} />
          ))}
        </div>
        
        {showTip && (
          <div className="mt-3 p-2 bg-blue-50 rounded border border-blue-200">
            <p className="text-xs text-blue-800">
              <strong>💡 Tip:</strong> Los archivos .numbers de Mac se procesan automáticamente como archivos Excel.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default FileTypeInfo 