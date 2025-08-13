
'use client'

import { useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Navigation } from '@/components/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { useDropzone } from 'react-dropzone'
import { 
  Upload,
  FileText,
  X,
  Loader2,
  AlertCircle,
  CheckCircle,
  Stethoscope,
  DollarSign
} from 'lucide-react'
import { formatFileSize, getFileIcon, isValidFileType, formatCurrency } from '@/lib/utils'

const PRODUCT_TYPES = [
  {
    value: 'SECOND_OPINION',
    label: 'Second Opinion',
    description: 'Expert review of diagnoses and treatment plans',
    price: 250
  },
  {
    value: 'CONSULTATION',
    label: 'Live Consultation',
    description: 'Video consultation with medical specialists',
    price: 300
  },
  {
    value: 'DOCUMENT_REVIEW',
    label: 'Document Review',
    description: 'Comprehensive analysis of medical reports',
    price: 180
  },
  {
    value: 'EXPERT_ANALYSIS',
    label: 'Expert Analysis',
    description: 'In-depth analysis with detailed recommendations',
    price: 350
  }
]

const PRIORITIES = [
  { value: 'LOW', label: 'Standard (5-7 days)', price: 0 },
  { value: 'MEDIUM', label: 'Priority (2-3 days)', price: 50 },
  { value: 'HIGH', label: 'Urgent (24-48 hours)', price: 100 },
  { value: 'URGENT', label: 'Emergency (Same day)', price: 200 }
]

type UploadedFile = {
  file: File
  id: string
  progress: number
  error?: string
}

export default function NewOrderPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  
  const [formData, setFormData] = useState({
    productType: '',
    title: '',
    description: '',
    priority: 'MEDIUM'
  })
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const calculateTotal = () => {
    const productType = PRODUCT_TYPES.find(p => p.value === formData.productType)
    const priority = PRIORITIES.find(p => p.value === formData.priority)
    return (productType?.price || 0) + (priority?.price || 0)
  }

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const validFiles = acceptedFiles.filter(file => {
      if (!isValidFileType(file.type)) {
        toast({
          title: 'Invalid File Type',
          description: `${file.name} is not a supported file type.`,
          variant: 'destructive'
        })
        return false
      }
      if (file.size > 50 * 1024 * 1024) { // 50MB limit
        toast({
          title: 'File Too Large',
          description: `${file.name} exceeds the 50MB limit.`,
          variant: 'destructive'
        })
        return false
      }
      return true
    })

    const newFiles: UploadedFile[] = validFiles.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      progress: 0
    }))

    setFiles(prev => [...prev, ...newFiles])
  }, [toast])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.jpeg', '.jpg', '.png', '.gif'],
      'application/zip': ['.zip'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    multiple: true
  })

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id))
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!session?.user) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to create an order.',
        variant: 'destructive'
      })
      return
    }

    if (!formData.productType || !formData.title) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields.',
        variant: 'destructive'
      })
      return
    }

    if (files.length === 0) {
      toast({
        title: 'No Documents',
        description: 'Please upload at least one document.',
        variant: 'destructive'
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Create order first
      const orderResponse = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          totalAmount: calculateTotal()
        })
      })

      if (!orderResponse.ok) {
        const errorData = await orderResponse.json()
        throw new Error(errorData.error || 'Failed to create order')
      }

      const { order } = await orderResponse.json()

      // Upload files
      for (const uploadFile of files) {
        const formData = new FormData()
        formData.append('file', uploadFile.file)
        formData.append('orderId', order.id)

        const uploadResponse = await fetch('/api/documents/upload', {
          method: 'POST',
          body: formData
        })

        if (!uploadResponse.ok) {
          console.error(`Failed to upload ${uploadFile.file.name}`)
        }
      }

      toast({
        title: 'Order Created Successfully',
        description: `Order ${order.orderNumber} has been created and documents uploaded.`
      })

      router.push(`/orders/${order.id}`)
    } catch (error) {
      console.error('Order creation error:', error)
      toast({
        title: 'Order Creation Failed',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!session?.user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto max-w-4xl px-4 py-8">
          <Card>
            <CardContent className="text-center py-12">
              <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
              <h3 className="mt-2 text-lg font-medium">Authentication Required</h3>
              <p className="mt-1 text-sm text-gray-500">
                Please sign in to create a new order.
              </p>
              <Button className="mt-4" onClick={() => router.push('/auth/signin')}>
                Sign In
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const selectedProduct = PRODUCT_TYPES.find(p => p.value === formData.productType)
  const selectedPriority = PRIORITIES.find(p => p.value === formData.priority)
  const total = calculateTotal()

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create New Order</h1>
          <p className="text-gray-600 mt-1">
            Submit your medical documents for professional review
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Service Selection */}
              <Card>
                <CardHeader>
                  <CardTitle>Select Service</CardTitle>
                  <CardDescription>
                    Choose the type of medical review you need
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4">
                    {PRODUCT_TYPES.map((product) => (
                      <div
                        key={product.value}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          formData.productType === product.value
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => handleInputChange('productType', product.value)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{product.label}</h4>
                            <p className="text-sm text-gray-500">{product.description}</p>
                          </div>
                          <div className="text-lg font-semibold text-blue-600">
                            {formatCurrency(product.price)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Order Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Order Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="title">Order Title *</Label>
                    <Input
                      id="title"
                      placeholder="Brief description of what you need reviewed"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Detailed Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Provide more details about your case, symptoms, concerns, or specific questions"
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      rows={4}
                    />
                  </div>

                  <div>
                    <Label htmlFor="priority">Priority Level</Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value) => handleInputChange('priority', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PRIORITIES.map((priority) => (
                          <SelectItem key={priority.value} value={priority.value}>
                            <div className="flex items-center justify-between w-full">
                              <span>{priority.label}</span>
                              {priority.price > 0 && (
                                <span className="ml-2 text-green-600">
                                  +{formatCurrency(priority.price)}
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Document Upload */}
              <Card>
                <CardHeader>
                  <CardTitle>Upload Documents</CardTitle>
                  <CardDescription>
                    Upload medical reports, lab results, imaging files, etc. (PDF, Images, DOC, ZIP)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                      isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <input {...getInputProps()} />
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-600">
                      {isDragActive
                        ? 'Drop files here...'
                        : 'Drag & drop files here, or click to select'}
                    </p>
                    <p className="text-xs text-gray-500">
                      Supported: PDF, JPG, PNG, DOC, ZIP (Max 50MB each)
                    </p>
                  </div>

                  {/* Uploaded Files */}
                  {files.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <h4 className="font-medium">Uploaded Files ({files.length})</h4>
                      {files.map((uploadFile) => (
                        <div
                          key={uploadFile.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center space-x-3">
                            <span className="text-lg">
                              {getFileIcon(uploadFile.file.type)}
                            </span>
                            <div>
                              <p className="text-sm font-medium">{uploadFile.file.name}</p>
                              <p className="text-xs text-gray-500">
                                {formatFileSize(uploadFile.file.size)}
                              </p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(uploadFile.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <DollarSign className="h-5 w-5" />
                    <span>Order Summary</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedProduct && (
                    <div className="flex justify-between">
                      <span className="text-sm">{selectedProduct.label}</span>
                      <span className="text-sm font-medium">
                        {formatCurrency(selectedProduct.price)}
                      </span>
                    </div>
                  )}

                  {selectedPriority && selectedPriority.price > 0 && (
                    <div className="flex justify-between">
                      <span className="text-sm">{selectedPriority.label}</span>
                      <span className="text-sm font-medium">
                        {formatCurrency(selectedPriority.price)}
                      </span>
                    </div>
                  )}

                  <div className="border-t pt-4">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span>{formatCurrency(total)}</span>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isSubmitting || !formData.productType || !formData.title || files.length === 0}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Order...
                      </>
                    ) : (
                      <>
                        <Stethoscope className="mr-2 h-4 w-4" />
                        Create Order
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-gray-500 text-center">
                    Payment will be processed after order confirmation
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
