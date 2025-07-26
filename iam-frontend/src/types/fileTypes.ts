export const SUPPORTED_FILE_EXTENSIONS = [
  '.xlsx',
  '.xls', 
  '.numbers',
  '.csv'
] as const

export const SUPPORTED_FILE_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-excel', // .xls
  'application/x-iwork-numbers-sffnumbers', // .numbers (Mac Numbers)
  'text/csv', // .csv
  'application/csv' // .csv alternativo
] as const

export type SupportedFileExtension = typeof SUPPORTED_FILE_EXTENSIONS[number]
export type SupportedFileType = typeof SUPPORTED_FILE_TYPES[number]

export interface FileTypeInfo {
  name: string
  description: string
  extension: SupportedFileExtension
  mimeType: SupportedFileType
  supported: boolean
  new?: boolean
}

export const FILE_TYPE_CONFIG: FileTypeInfo[] = [
  {
    name: 'Excel (.xlsx)',
    description: 'Archivos Excel modernos',
    extension: '.xlsx',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    supported: true
  },
  {
    name: 'Excel (.xls)',
    description: 'Archivos Excel legacy',
    extension: '.xls',
    mimeType: 'application/vnd.ms-excel',
    supported: true
  },
  {
    name: 'Numbers (.numbers)',
    description: 'Archivos de Apple Numbers (Mac)',
    extension: '.numbers',
    mimeType: 'application/x-iwork-numbers-sffnumbers',
    supported: true,
    new: true
  },
  {
    name: 'CSV (.csv)',
    description: 'Archivos de texto separados por comas',
    extension: '.csv',
    mimeType: 'text/csv',
    supported: true
  }
]

export const validateFileType = (file: File): boolean => {
  const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.')) as SupportedFileExtension
  return SUPPORTED_FILE_EXTENSIONS.includes(extension)
}

export const getFileTypeInfo = (file: File): FileTypeInfo | undefined => {
  const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.')) as SupportedFileExtension
  return FILE_TYPE_CONFIG.find(config => config.extension === extension)
}

export const getAcceptedFileTypes = (): string => {
  return SUPPORTED_FILE_EXTENSIONS.join(',')
}

export const getAcceptedMimeTypes = (): string => {
  return SUPPORTED_FILE_TYPES.join(',')
} 