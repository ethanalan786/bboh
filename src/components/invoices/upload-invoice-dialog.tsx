"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useDropzone } from "react-dropzone"
import { Upload, X, FileText, Calendar as CalendarIcon, Loader2, Sparkles, AlertCircle, Building } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface UploadInvoiceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  purchaseOrderId: string
  onInvoiceUploaded: (invoiceData?: any) => void
}

export function UploadInvoiceDialog({
  open,
  onOpenChange,
  purchaseOrderId,
  onInvoiceUploaded
}: UploadInvoiceDialogProps) {
  const [invoiceNumber, setInvoiceNumber] = useState("")
  const [invoiceDate, setInvoiceDate] = useState<Date>()
  const [dueDate, setDueDate] = useState<Date>()
  const [totalAmount, setTotalAmount] = useState("")
  const [taxAmount, setTaxAmount] = useState("0")
  const [discountAmount, setDiscountAmount] = useState("0")
  const [notes, setNotes] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [fileUrl, setFileUrl] = useState<string>("")
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const [extracting, setExtracting] = useState(false)
  const [extractedData, setExtractedData] = useState<any>(null)
  const [useExtractedData, setUseExtractedData] = useState(true)
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [matchedSupplier, setMatchedSupplier] = useState<any>(null)

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png']
    },
    maxFiles: 1,
    onDrop: async (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        const selectedFile = acceptedFiles[0]
        setFile(selectedFile)
        setError("")
        setExtractedData(null)
        
        // Upload file
        try {
          setUploading(true)
          const formData = new FormData()
          formData.append('file', selectedFile)
          
          const response = await fetch('/api/invoices/upload', {
            method: 'POST',
            body: formData
          })
          
          const data = await response.json()
          
          if (response.ok) {
            setFileUrl(data.fileUrl)
            
            // Automatically extract data from the uploaded file
            await extractInvoiceDataFromUrl(data.fileUrl, data.fileType)
          } else {
            setError(data.error || 'Failed to upload file')
            setFile(null)
          }
        } catch (err) {
          setError('Failed to upload file')
          setFile(null)
        } finally {
          setUploading(false)
        }
      }
    }
  })

  const extractInvoiceDataFromUrl = async (url: string, type: string) => {
    try {
      setExtracting(true)
      const response = await fetch('/api/invoices/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileUrl: url,
          fileType: type
        })
      })
      
      const data = await response.json()
      
      if (response.ok && data.extractedData) {
        setExtractedData(data.extractedData)
        
        // Display error/warning if present
        if (data.extractedData.error) {
          setError(data.extractedData.error)
        }
        
        // Auto-fill form fields with extracted data if available
        if (useExtractedData) {
          if (data.extractedData.invoiceNumber) {
            setInvoiceNumber(data.extractedData.invoiceNumber)
          }
          if (data.extractedData.invoiceDate) {
            setInvoiceDate(new Date(data.extractedData.invoiceDate))
          }
          if (data.extractedData.dueDate) {
            setDueDate(new Date(data.extractedData.dueDate))
          }
          if (data.extractedData.totalAmount) {
            setTotalAmount(data.extractedData.totalAmount.toString())
          }
          if (data.extractedData.taxAmount) {
            setTaxAmount(data.extractedData.taxAmount.toString())
          }
          
          // Match supplier if extracted
          if (data.extractedData.supplier && suppliers.length > 0) {
            const matched = matchSupplierWithDatabase(data.extractedData.supplier, suppliers)
            if (matched) {
              setMatchedSupplier(matched)
            }
          }
        }
      } else {
        setError(data.error || 'Failed to extract invoice data')
      }
    } catch (err) {
      console.error('Failed to extract invoice data:', err)
      setError('Failed to extract invoice data')
    } finally {
      setExtracting(false)
    }
  }

  useEffect(() => {
    // Reset form when dialog opens/closes
    if (!open) {
      setInvoiceNumber("")
      setInvoiceDate(undefined)
      setDueDate(undefined)
      setTotalAmount("")
      setTaxAmount("0")
      setDiscountAmount("0")
      setNotes("")
      setFile(null)
      setFileUrl("")
      setExtractedData(null)
      setError("")
      setMatchedSupplier(null)
    } else {
      // Fetch suppliers when dialog opens
      fetchSuppliers()
    }
  }, [open])

  const fetchSuppliers = async () => {
    try {
      const response = await fetch('/api/suppliers')
      const data = await response.json()
      if (response.ok) {
        setSuppliers(data.suppliers || [])
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!fileUrl) {
      setError("Please upload an invoice file")
      return
    }

    // If no purchaseOrderId, just return the extracted data for form population
    if (!purchaseOrderId) {
      try {
        setUploading(true)
        
        const invoiceData = {
          fileUrl,
          fileName: file?.name,
          fileType: file?.type,
          fileSize: file?.size,
          extractedData: extractedData || null,
          // Form fields
          invoiceNumber: invoiceNumber || extractedData?.invoiceNumber || '',
          invoiceDate: invoiceDate || (extractedData?.invoiceDate ? new Date(extractedData.invoiceDate) : new Date()),
          dueDate: dueDate || (extractedData?.dueDate ? new Date(extractedData.dueDate) : undefined),
          totalAmount: totalAmount || extractedData?.totalAmount || 0,
          taxAmount: taxAmount || extractedData?.taxAmount || 0,
          discountAmount: discountAmount || 0,
          notes: notes || null
        }
        
        onOpenChange(false)
        onInvoiceUploaded(invoiceData)
      } catch (err) {
        setError('Failed to process invoice data')
      } finally {
        setUploading(false)
      }
      return
    }

    // Normal invoice creation with purchaseOrderId
    if (!invoiceNumber || !invoiceDate || !totalAmount) {
      setError("Please fill in all required fields")
      return
    }

    try {
      setUploading(true)
      
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          purchaseOrderId,
          invoiceNumber,
          invoiceDate: invoiceDate.toISOString(),
          dueDate: dueDate?.toISOString(),
          totalAmount: parseFloat(totalAmount),
          taxAmount: parseFloat(taxAmount) || 0,
          discountAmount: parseFloat(discountAmount) || 0,
          fileUrl,
          fileName: file?.name,
          fileType: file?.type,
          fileSize: file?.size,
          notes: notes || null,
          extractedData: extractedData || null
        })
      })

      const data = await response.json()

      if (response.ok) {
        onOpenChange(false)
        onInvoiceUploaded()
      } else {
        setError(data.error || 'Failed to create invoice')
      }
    } catch (err) {
      setError('Failed to create invoice')
    } finally {
      setUploading(false)
    }
  }

  const removeFile = () => {
    setFile(null)
    setFileUrl("")
    setExtractedData(null)
  }

  const handleRetypeExtractedData = () => {
    setUseExtractedData(false)
    // Clear the fields to allow manual entry
    setInvoiceNumber("")
    setInvoiceDate(undefined)
    setDueDate(undefined)
    setTotalAmount("")
    setTaxAmount("0")
    setMatchedSupplier(null)
  }

  const matchSupplierWithDatabase = (extractedSupplier: string, suppliersList: any[]) => {
    if (!extractedSupplier || suppliersList.length === 0) return null

    const normalizedExtracted = extractedSupplier.toLowerCase().trim()

    // Try exact match first
    const exactMatch = suppliersList.find(s =>
      s.name?.toLowerCase() === normalizedExtracted
    )
    if (exactMatch) return exactMatch

    // Try partial match
    const partialMatch = suppliersList.find(s =>
      (s.name?.toLowerCase() || "").includes(normalizedExtracted) ||
      normalizedExtracted.includes(s.name?.toLowerCase() || "")
    )
    if (partialMatch) return partialMatch

    // Try email match if available
    const emailMatch = suppliersList.find(s =>
      s.email?.toLowerCase().includes(normalizedExtracted)
    )
    if (emailMatch) return emailMatch

    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{purchaseOrderId ? 'Upload Invoice' : 'Upload Invoice for Purchase Order'}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {!purchaseOrderId && extractedData && (
            <div className="text-sm text-muted-foreground">
              Invoice data extracted successfully. Click "Use Extracted Data" to populate the purchase order form.
            </div>
          )}
          {/* File Upload */}
          <div className="space-y-2">
            <Label>Invoice File *</Label>
            {!file ? (
              <div
                {...getRootProps()}
                className={cn(
                  "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                  isDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                )}
              >
                <input {...getInputProps()} />
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {isDragActive
                    ? "Drop the invoice file here"
                    : "Drag & drop invoice file here, or click to select"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  PDF, JPEG, PNG (max 10MB)
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/50">
                <FileText className="h-8 w-8 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                {extracting && (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={removeFile}
                  disabled={uploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Extracted Data Verification */}
          {extractedData && (
            <Card className="p-4 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                      Invoice Data Extracted
                    </h4>
                    <Badge variant="outline" className="text-xs">
                      {Math.round((extractedData.confidence || 0) * 100)}% confidence
                    </Badge>
                  </div>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mb-3">
                    {purchaseOrderId 
                      ? "Please review the extracted information below. You can edit any field before submitting."
                      : "Invoice data extracted successfully. Click 'Use Extracted Data' to populate the purchase order form."
                    }
                  </p>
                  
                  {purchaseOrderId && matchedSupplier && (
                    <div className="mb-3 p-2 bg-white dark:bg-blue-900/30 rounded border border-blue-200 dark:border-blue-700">
                      <div className="flex items-center gap-2">
                        <Building className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                        <p className="text-xs font-medium text-blue-900 dark:text-blue-100">
                          Supplier Matched: {matchedSupplier.name}
                        </p>
                      </div>
                      {matchedSupplier.email && (
                        <p className="text-xs text-blue-700 dark:text-blue-300 ml-5">
                          {matchedSupplier.email}
                        </p>
                      )}
                    </div>
                  )}
                  
                  {purchaseOrderId && useExtractedData ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleRetypeExtractedData}
                      className="text-xs"
                    >
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Clear & Enter Manually
                    </Button>
                  ) : purchaseOrderId ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setUseExtractedData(true)}
                      className="text-xs"
                    >
                      <Sparkles className="h-3 w-3 mr-1" />
                      Use Extracted Data
                    </Button>
                  ) : null}
                </div>
              </div>
            </Card>
          )}

          {/* Invoice Number */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="invoiceNumber">Invoice Number *</Label>
              {extractedData?.invoiceNumber && useExtractedData && (
                <Badge variant="secondary" className="text-xs">
                  Extracted
                </Badge>
              )}
            </div>
            <Input
              id="invoiceNumber"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              placeholder="INV-001234"
              disabled={uploading}
              required
              className={extractedData?.invoiceNumber && useExtractedData ? "border-blue-300 dark:border-blue-700" : ""}
            />
          </div>

          {/* Invoice Date */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Invoice Date *</Label>
              {extractedData?.invoiceDate && useExtractedData && (
                <Badge variant="secondary" className="text-xs">
                  Extracted
                </Badge>
              )}
            </div>
            <Popover>
              <PopoverTrigger>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !invoiceDate && "text-muted-foreground",
                    extractedData?.invoiceDate && useExtractedData ? "border-blue-300 dark:border-blue-700" : ""
                  )}
                  disabled={uploading}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {invoiceDate ? format(invoiceDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={invoiceDate}
                  onSelect={setInvoiceDate}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Due Date (Optional)</Label>
              {extractedData?.dueDate && useExtractedData && (
                <Badge variant="secondary" className="text-xs">
                  Extracted
                </Badge>
              )}
            </div>
            <Popover>
              <PopoverTrigger>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dueDate && "text-muted-foreground",
                    extractedData?.dueDate && useExtractedData ? "border-blue-300 dark:border-blue-700" : ""
                  )}
                  disabled={uploading}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dueDate ? format(dueDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dueDate}
                  onSelect={setDueDate}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Amounts */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="totalAmount">Total Amount *</Label>
                {extractedData?.totalAmount && useExtractedData && (
                  <Badge variant="secondary" className="text-xs">
                    Extracted
                  </Badge>
                )}
              </div>
              <Input
                id="totalAmount"
                type="number"
                step="0.01"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                placeholder="0.00"
                disabled={uploading}
                required
                className={extractedData?.totalAmount && useExtractedData ? "border-blue-300 dark:border-blue-700" : ""}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="taxAmount">Tax Amount</Label>
                {extractedData?.taxAmount && useExtractedData && (
                  <Badge variant="secondary" className="text-xs">
                    Extracted
                  </Badge>
                )}
              </div>
              <Input
                id="taxAmount"
                type="number"
                step="0.01"
                value={taxAmount}
                onChange={(e) => setTaxAmount(e.target.value)}
                placeholder="0.00"
                disabled={uploading}
                className={extractedData?.taxAmount && useExtractedData ? "border-blue-300 dark:border-blue-700" : ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="discountAmount">Discount Amount</Label>
              <Input
                id="discountAmount"
                type="number"
                step="0.01"
                value={discountAmount}
                onChange={(e) => setDiscountAmount(e.target.value)}
                placeholder="0.00"
                disabled={uploading}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this invoice..."
              disabled={uploading}
              rows={3}
            />
          </div>

          {error && (
            <div className={cn(
              "text-sm p-3 rounded-lg",
              extractedData?.errorType === 'gemini' 
                ? "text-amber-700 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800"
                : "text-destructive bg-destructive/10"
            )}>
              <div className="flex items-start gap-2">
                {extractedData?.errorType === 'gemini' && (
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                )}
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Only show form fields when we have a purchaseOrderId */}
          {purchaseOrderId && (
            <>
              {/* Invoice Number */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="invoiceNumber">Invoice Number *</Label>
                  {extractedData?.invoiceNumber && useExtractedData && (
                    <Badge variant="secondary" className="text-xs">
                      Extracted
                    </Badge>
                  )}
                </div>
                <Input
                  id="invoiceNumber"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder="INV-001234"
                  disabled={uploading}
                  required
                  className={extractedData?.invoiceNumber && useExtractedData ? "border-blue-300 dark:border-blue-700" : ""}
                />
              </div>

              {/* Invoice Date */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Invoice Date *</Label>
                  {extractedData?.invoiceDate && useExtractedData && (
                    <Badge variant="secondary" className="text-xs">
                      Extracted
                    </Badge>
                  )}
                </div>
                <Popover>
                  <PopoverTrigger>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !invoiceDate && "text-muted-foreground",
                        extractedData?.invoiceDate && useExtractedData ? "border-blue-300 dark:border-blue-700" : ""
                      )}
                      disabled={uploading}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {invoiceDate ? format(invoiceDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={invoiceDate}
                      onSelect={setInvoiceDate}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Due Date */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Due Date (Optional)</Label>
                  {extractedData?.dueDate && useExtractedData && (
                    <Badge variant="secondary" className="text-xs">
                      Extracted
                    </Badge>
                  )}
                </div>
                <Popover>
                  <PopoverTrigger>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dueDate && "text-muted-foreground",
                        extractedData?.dueDate && useExtractedData ? "border-blue-300 dark:border-blue-700" : ""
                      )}
                      disabled={uploading}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dueDate ? format(dueDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dueDate}
                      onSelect={setDueDate}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Amounts */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="totalAmount">Total Amount *</Label>
                    {extractedData?.totalAmount && useExtractedData && (
                      <Badge variant="secondary" className="text-xs">
                        Extracted
                      </Badge>
                    )}
                  </div>
                  <Input
                    id="totalAmount"
                    type="number"
                    step="0.01"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                    placeholder="0.00"
                    disabled={uploading}
                    required
                    className={extractedData?.totalAmount && useExtractedData ? "border-blue-300 dark:border-blue-700" : ""}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="taxAmount">Tax Amount</Label>
                    {extractedData?.taxAmount && useExtractedData && (
                      <Badge variant="secondary" className="text-xs">
                        Extracted
                    </Badge>
                  )}
                  </div>
                  <Input
                    id="taxAmount"
                    type="number"
                    step="0.01"
                    value={taxAmount}
                    onChange={(e) => setTaxAmount(e.target.value)}
                    placeholder="0.00"
                    disabled={uploading}
                    className={extractedData?.taxAmount && useExtractedData ? "border-blue-300 dark:border-blue-700" : ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discountAmount">Discount Amount</Label>
                  <Input
                    id="discountAmount"
                    type="number"
                    step="0.01"
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(e.target.value)}
                    placeholder="0.00"
                    disabled={uploading}
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any notes about this invoice..."
                  disabled={uploading}
                  rows={3}
                />
              </div>
            </>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={uploading}>
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                purchaseOrderId ? "Upload Invoice" : "Use Extracted Data"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}