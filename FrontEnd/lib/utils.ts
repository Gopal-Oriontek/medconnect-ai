
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

export function formatDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(dateObj)
}

export function formatDateTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(dateObj)
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'PENDING_REVIEW':
      return 'text-yellow-600 bg-yellow-100'
    case 'ASSIGNED':
      return 'text-blue-600 bg-blue-100'
    case 'IN_PROGRESS':
      return 'text-purple-600 bg-purple-100'
    case 'UNDER_REVIEW':
      return 'text-orange-600 bg-orange-100'
    case 'COMPLETED':
      return 'text-green-600 bg-green-100'
    case 'CANCELLED':
      return 'text-red-600 bg-red-100'
    case 'REFUNDED':
      return 'text-gray-600 bg-gray-100'
    default:
      return 'text-gray-600 bg-gray-100'
  }
}

export function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'LOW':
      return 'text-green-600 bg-green-100'
    case 'MEDIUM':
      return 'text-yellow-600 bg-yellow-100'
    case 'HIGH':
      return 'text-orange-600 bg-orange-100'
    case 'URGENT':
      return 'text-red-600 bg-red-100'
    default:
      return 'text-gray-600 bg-gray-100'
  }
}

export function generateOrderNumber(): string {
  const year = new Date().getFullYear()
  const randomNum = Math.floor(Math.random() * 9999) + 1
  return `MED-${year}-${randomNum.toString().padStart(3, '0')}`
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function getFileIcon(fileType: string): string {
  if (fileType.includes('pdf')) return '📄'
  if (fileType.includes('image')) return '🖼️'
  if (fileType.includes('zip')) return '📦'
  if (fileType.includes('doc')) return '📝'
  return '📋'
}

export function isValidFileType(fileType: string): boolean {
  const allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/zip',
    'application/x-zip-compressed',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
  return allowedTypes.includes(fileType)
}

export function truncateText(text: string, length: number): string {
  if (text.length <= length) return text
  return text.substring(0, length) + '...'
}
