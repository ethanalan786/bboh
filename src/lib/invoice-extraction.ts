// Invoice data extraction service
// This service handles extracting information from uploaded invoice files
import { GoogleGenerativeAI } from '@google/generative-ai'
import { prisma } from '@/lib/prisma'

// Cache the pdf-parse module import
let pdfParseModule: any = null
async function getPdfParse() {
  if (!pdfParseModule) {
    try {
      const module = await import('pdf-parse')
      // pdf-parse exports the function directly
      pdfParseModule = module.default || module
    } catch (error) {
      console.error('Failed to import pdf-parse:', error)
      throw error
    }
  }
  return pdfParseModule
}

export interface ExtractedInvoiceData {
  supplier?: string
  invoiceNumber?: string
  invoiceDate?: string
  dueDate?: string
  items?: ExtractedInvoiceItem[]
  subtotal?: number
  taxAmount?: number
  shippingAmount?: number
  totalAmount?: number
  confidence?: number
  error?: string
  errorType?: 'gemini' | 'pdf' | 'general'
}

export interface ExtractedInvoiceItem {
  name?: string
  quantity?: number
  unitPrice?: number
  total?: number
  description?: string
}

export async function extractInvoiceData(fileUrl: string, fileType: string): Promise<ExtractedInvoiceData> {
  try {
    // Check if Gemini extraction is enabled and API key is configured
    const settings = await (prisma as any).settings.findFirst()
    const geminiApiKey = settings?.geminiApiKey
    const geminiEnabled = settings?.geminiExtractionEnabled || false

    if (geminiEnabled && geminiApiKey) {
      try {
        return await extractWithGemini(fileUrl, fileType, geminiApiKey)
      } catch (geminiError) {
        console.error('Gemini extraction failed, falling back to basic extraction:', geminiError)
        const errorMessage = geminiError instanceof Error ? geminiError.message : 'Unknown Gemini error'
        
        // Check if it's a service availability error
        if (errorMessage.includes('503') || errorMessage.includes('high demand') || errorMessage.includes('temporarily')) {
          const basicResult = await basicExtraction(fileUrl, fileType)
          return {
            ...basicResult,
            error: 'Gemini AI service is currently experiencing high demand. Using basic extraction instead.',
            errorType: 'gemini'
          }
        }
        
        // Fall back to basic extraction for other Gemini errors
        const basicResult = await basicExtraction(fileUrl, fileType)
        return {
          ...basicResult,
          error: `Gemini extraction failed: ${errorMessage}. Using basic extraction instead.`,
          errorType: 'gemini'
        }
      }
    }

    // Fallback to basic extraction
    return await basicExtraction(fileUrl, fileType)
  } catch (error) {
    console.error('Error extracting invoice data:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return {
      confidence: 0,
      error: `Failed to extract invoice data: ${errorMessage}`,
      errorType: 'general'
    }
  }
}

async function generateWithRetry(
  model: any,
  prompt: string,
  maxRetries = 5
) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await model.generateContent(prompt);
    } catch (error: any) {
      const message = error?.message || "";

      const is503 =
        message.includes("503") ||
        message.includes("Service Unavailable") ||
        message.includes("high demand");

      if (!is503 || attempt === maxRetries) {
        throw error;
      }

      const delay = Math.min(1000 * 2 ** attempt, 30000);

      console.log(
        `Gemini temporarily unavailable. Retrying in ${delay / 1000}s...`
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

async function extractWithGemini(fileUrl: string, fileType: string, apiKey: string): Promise<ExtractedInvoiceData> {
  const genAI = new GoogleGenerativeAI(apiKey)
  
  // Try models in order of preference (newest first)
  const modelsToTry = [
    "gemini-flash-lite-latest",
    "gemini-3.1-flash-lite",
    "gemini-3.1-pro-preview", 
  ]
  
  let lastError: any = null

  // Parse the data URL to get the base64 content
  if (!fileUrl.startsWith('data:')) {
    throw new Error('Invalid file URL format')
  }

  const matches = fileUrl.match(/^data:([^;]+);base64,(.+)$/)
  if (!matches) {
    throw new Error('Could not parse data URL')
  }

  const mimeType = matches[1]
  const base64Data = matches[2]

  // Prepare the prompt for Gemini
  const prompt = `Extract invoice information from this ${fileType} file. Return a JSON object with the following structure:
{
  "supplier": "Supplier name",
  "invoiceNumber": "Invoice number",
  "invoiceDate": "YYYY-MM-DD",
  "dueDate": "YYYY-MM-DD",
  "items": [
    {
      "name": "Item name",
      "quantity": number,
      "unitPrice": number,
      "total": number
    }
  ],
  "subtotal": number,
  "taxAmount": number,
  "totalAmount": number
}

Only return the JSON, no additional text. If a field cannot be found, omit it or set to null.`

  // Prepare content based on file type
  let content: any
  if (mimeType === 'application/pdf') {
    // For PDFs, we need to use a different approach
    // Convert base64 to buffer and then try to extract text first
    const pdfBuffer = Buffer.from(base64Data, 'base64')
    
    try {
      // Try to use pdf-parse if available, otherwise use fallback
      let extractedText: string
      try {
        const pdfParse = await getPdfParse()
        const pdfData = await pdfParse(pdfBuffer)
        extractedText = pdfData.text
      } catch (importError) {
        console.log('pdf-parse not available, using fallback extraction')
        // Fallback: extract text from raw PDF content
        const pdfContent = pdfBuffer.toString('latin1')
        extractedText = extractTextFromRawPDF(pdfContent)
      }
      
      content = [prompt, extractedText]
    } catch (pdfError) {
      console.error('PDF text extraction failed for Gemini:', pdfError)
      throw pdfError
    }
  } else if (mimeType.startsWith('image/')) {
    // For images, use Gemini's vision capabilities
    const imageData = {
      inlineData: {
        data: base64Data,
        mimeType: mimeType
      }
    }
    content = [prompt, imageData]
  } else {
    throw new Error(`Unsupported file type: ${mimeType}`)
  }

  // Try each model with retry logic
  for (const modelName of modelsToTry) {
    try {
      console.log(`Attempting extraction with model: ${modelName}`)
      const model = genAI.getGenerativeModel({ model: modelName })
      const result = await generateWithRetry(model, content)
      
      const response = await result.response
      const text = response.text()

      // Parse the JSON response
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('Could not extract JSON from Gemini response')
      }

      const extractedData = JSON.parse(jsonMatch[0])

      // Add confidence score
      extractedData.confidence = 0.9

      console.log(`Successfully extracted data using model: ${modelName}`)
      return extractedData as ExtractedInvoiceData
    } catch (error: any) {
      lastError = error
      console.error(`Failed with model ${modelName}:`, error.message)
      
      // If this isn't the last model, continue to the next one
      if (modelsToTry.indexOf(modelName) < modelsToTry.length - 1) {
        console.log(`Falling back to next model...`)
        continue
      }
    }
  }

  // If all models failed, throw the last error
  console.error('All Gemini models failed, throwing last error')
  throw lastError
}

async function basicExtraction(fileUrl: string, fileType: string): Promise<ExtractedInvoiceData> {
  const extractedData: ExtractedInvoiceData = {
    confidence: 0.7 // Default confidence score
  }

  // Parse the data URL to get the base64 content
  if (fileUrl.startsWith('data:')) {
    const matches = fileUrl.match(/^data:([^;]+);base64,(.+)$/)
    if (matches) {
      const mimeType = matches[1]
      const base64Data = matches[2]
      
      if (mimeType === 'application/pdf') {
        // Decode base64 to buffer
        const pdfBuffer = Buffer.from(base64Data, 'base64')
        
        // Try to extract text using pdf-parse
        let extractedText: string
        let usedFallback = false
        try {
          const pdfParse = await getPdfParse()
          const pdfData = await pdfParse(pdfBuffer)
          extractedText = pdfData.text
        } catch (importError) {
          console.log('pdf-parse not available, using fallback extraction')
          usedFallback = true
          // Fallback: extract text from raw PDF content
          const pdfContent = pdfBuffer.toString('latin1')
          extractedText = extractTextFromRawPDF(pdfContent)
        }
        
        const result = parseInvoiceText(extractedText)
        
        if (usedFallback) {
          return {
            ...result,
            error: 'PDF library not available, used basic text extraction. Results may be less accurate.',
            errorType: 'pdf'
          }
        }
        
        return result
      } else if (mimeType.startsWith('image/')) {
        // For images, we would use OCR
        // For now, return a placeholder extraction
        return {
          ...extractedData,
          supplier: 'Detected Supplier',
          invoiceNumber: 'INV-EXTRACTED',
          items: [
            {
              name: 'Sample Item',
              quantity: 1,
              unitPrice: 0,
              total: 0
            }
          ]
        }
      }
    }
  }

  return extractedData
}

function extractTextFromRawPDF(pdfContent: string): string {
  // Enhanced extraction from raw PDF content
  // This handles common PDF text encoding patterns
  
  let text = pdfContent
  
  // Extract text from between parentheses (common PDF text encoding)
  text = text.replace(/\(([^)]*)\)/g, ' $1 ')
  
  // Handle escaped characters in PDF strings
  text = text.replace(/\\([0-9]{3})/g, (match, octal) => {
    try {
      return String.fromCharCode(parseInt(octal, 8))
    } catch {
      return match
    }
  })
  
  // Handle common escape sequences
  text = text.replace(/\\n/g, ' ')
  text = text.replace(/\\r/g, ' ')
  text = text.replace(/\\t/g, ' ')
  text = text.replace(/\\\\/g, '\\')
  text = text.replace(/\\\(/g, '(')
  text = text.replace(/\\\)/g, ')')
  
  // Remove PDF operators and commands
  text = text.replace(/BT\s*ET/g, ' ')
  text = text.replace(/\/F\d+\s*\d+\s*Tf/g, ' ')
  text = text.replace(/\d+\s*\d+\s*Td/g, ' ')
  text = text.replace(/\d+\s*\d+\s*Tm/g, ' ')
  text = text.replace(/Tj/g, ' ')
  text = text.replace(/TJ/g, ' ')
  text = text.replace(/Td/g, ' ')
  text = text.replace(/TD/g, ' ')
  text = text.replace(/Tm/g, ' ')
  text = text.replace(/Ts/g, ' ')
  text = text.replace(/TL/g, ' ')
  text = text.replace(/Tc/g, ' ')
  text = text.replace(/Tw/g, ' ')
  text = text.replace(/Tr/g, ' ')
  
  // Remove hex-encoded content (between < and >)
  text = text.replace(/<[^>]*>/g, ' ')
  
  // Remove common PDF keywords and commands
  text = text.replace(/\/[A-Za-z]+\s*/g, ' ')
  text = text.replace(/obj\s*/g, ' ')
  text = text.replace(/endobj\s*/g, ' ')
  text = text.replace(/stream\s*/g, ' ')
  text = text.replace(/endstream\s*/g, ' ')
  text = text.replace(/xref\s*/g, ' ')
  text = text.replace(/trailer\s*/g, ' ')
  text = text.replace(/startxref\s*/g, ' ')
  
  // Remove numeric coordinates and measurements that aren't useful
  text = text.replace(/\b\d+\s+\d+\s+\d+\s+\d+\s+\d+\s+\d+\b/g, ' ')
  text = text.replace(/\b\d+\.\d+\s+\d+\.\d+\b/g, ' ')
  
  // Normalize whitespace
  text = text.replace(/\s+/g, ' ')
  text = text.trim()
  
  return text
}

function parseInvoiceText(text: string): ExtractedInvoiceData {
  const extractedData: ExtractedInvoiceData = {
    confidence: 0.85
  }
  
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0)
  
  // Parse supplier name - specifically look for Burn Box patterns
  const supplierPatterns = [
    /BURN BOX(?:\s+LTD)?/i,
    /BURN BOX/i,
    / LTD/i,
    /INCORPORATED/i,
    /CORPORATION/i
  ]
  
  for (const line of lines) {
    for (const pattern of supplierPatterns) {
      if (pattern.test(line)) {
        extractedData.supplier = line
        break
      }
    }
    if (extractedData.supplier) break
  }
  
  // Parse invoice number - enhanced patterns for Burn Box format
  const invoiceNumberPatterns = [
    /(?:Invoice\s*(?:Number|#?)\s*[:#]?\s*)(\d+)/i,
    /(?:INV\s*[:#]?\s*)(\d+)/i,
    /(?:Payment\s*Ref\s*[:#]?\s*)(\d+)/i,
    /(?:Receipt\s*#?\s*)(\d+)/i,
    /(?:Invoice\s*Number)\s*[:#]?\s*(\d+)/i,
    /#(\d{6,})/,
    /(\d{6,})/ // Look for 6+ digit numbers as potential invoice numbers
  ]
  
  for (const line of lines) {
    for (const pattern of invoiceNumberPatterns) {
      const match = line.match(pattern)
      if (match) {
        extractedData.invoiceNumber = match[1]
        break
      }
    }
    if (extractedData.invoiceNumber) break
  }
  
  // Parse dates - enhanced patterns for various formats
  const datePatterns = [
    /(\d{4}-\d{2}-\d{2})/, // YYYY-MM-DD
    /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/, // MM/DD/YYYY or DD/MM/YYYY
    /((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4})/i, // Sep 6 2026
    /(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})/i // 6 Sep 2026
  ]
  
  for (const line of lines) {
    for (const pattern of datePatterns) {
      const match = line.match(pattern)
      if (match) {
        const date = parseDate(match[1])
        if (date) {
          if (!extractedData.invoiceDate) {
            extractedData.invoiceDate = date.toISOString().split('T')[0]
          } else if (!extractedData.dueDate) {
            extractedData.dueDate = date.toISOString().split('T')[0]
          }
        }
      }
    }
  }
  
  // Parse items - enhanced patterns for Burn Box format
  const items: ExtractedInvoiceItem[] = []
  const itemPatterns = [
    /(\d+)\s+X\s+(.+?)\s+\$?([\d,]+\.?\d*)\s+\$?([\d,]+\.?\d*)\s+\$?([\d,]+\.?\d*)/i, // Qty X Item Unit Tax Total
    /(\d+)\s+X\s+(.+?)\s+\$?([\d,]+\.?\d*)/i, // Qty X Item Price
    /(\d+)\s+(.+?)\s+\$?([\d,]+\.?\d*)\s+\$?([\d,]+\.?\d*)/i, // Qty Item Unit Total
    /(.+?)\s+-\s+(?:Cash|Card)\s+\$?([\d,]+\.?\d*)/i, // Item - Cash $10.00
    /(.+?)\s+\$?([\d,]+\.?\d*)/i // Item Price
  ]
  
  for (const line of lines) {
    for (const pattern of itemPatterns) {
      const match = line.match(pattern)
      if (match) {
        if (match.length === 6) {
          // Full format: Qty X Item Unit Tax Total
          items.push({
            name: match[2].trim(),
            quantity: parseInt(match[1]),
            unitPrice: parseFloat(match[3].replace(/,/g, '')),
            total: parseFloat(match[5].replace(/,/g, ''))
          })
        } else if (match.length === 4) {
          // Qty X Item Price or Item - Cash $Price
          const quantity = match[1].match(/^\d+$/) ? parseInt(match[1]) : 1
          const price = parseFloat(match[3].replace(/,/g, ''))
          items.push({
            name: match[2].trim(),
            quantity: quantity,
            unitPrice: price,
            total: price
          })
        } else if (match.length === 5) {
          // Qty Item Unit Total
          items.push({
            name: match[2].trim(),
            quantity: parseInt(match[1]),
            unitPrice: parseFloat(match[3].replace(/,/g, '')),
            total: parseFloat(match[4].replace(/,/g, ''))
          })
        } else if (match.length === 3) {
          // Item Price
          const price = parseFloat(match[2].replace(/,/g, ''))
          if (!isNaN(price) && price > 0) {
            items.push({
              name: match[1].trim(),
              quantity: 1,
              unitPrice: price,
              total: price
            })
          }
        }
      }
    }
  }
  
  // Filter out items with invalid data
  const validItems = items.filter(item => 
    item.name && 
    item.name.length > 2 && 
    item.quantity !== undefined && 
    !isNaN(item.quantity) && 
    item.quantity > 0 &&
    item.total !== undefined &&
    !isNaN(item.total) && 
    item.total > 0
  )
  
  if (validItems.length > 0) {
    extractedData.items = validItems
  }
  
  // Parse monetary amounts - enhanced patterns for Burn Box format
  for (const line of lines) {
    const subtotalMatch = line.match(/(?:Subtotal)\s*[:#]?\s*\$?([\d,]+\.?\d*)/i)
    if (subtotalMatch) {
      extractedData.subtotal = parseFloat(subtotalMatch[1].replace(/,/g, ''))
    }
    
    const taxMatch = line.match(/(?:Tax|GST|VAT|General Sales Tax)\s*[:#]?\s*\$?([\d,]+\.?\d*)/i)
    if (taxMatch) {
      extractedData.taxAmount = parseFloat(taxMatch[1].replace(/,/g, ''))
    }
    
    const totalMatch = line.match(/(?:Total|To Pay|Grand Total|Amount Paid|Total Amount Paid)\s*[:#]?\s*\$?([\d,]+\.?\d*)/i)
    if (totalMatch) {
      extractedData.totalAmount = parseFloat(totalMatch[1].replace(/,/g, ''))
    }
  }
  
  // If we found items but no total, calculate from items
  if (validItems.length > 0 && !extractedData.totalAmount) {
    const calculatedTotal = validItems.reduce((sum, item) => sum + (item.total || 0), 0)
    if (calculatedTotal > 0) {
      extractedData.totalAmount = calculatedTotal
    }
  }

  // Adjust confidence based on how much data we extracted
  let extractedFields = 0
  if (extractedData.supplier) extractedFields++
  if (extractedData.invoiceNumber) extractedFields++
  if (extractedData.invoiceDate) extractedFields++
  if (validItems.length > 0) extractedFields++
  if (extractedData.totalAmount) extractedFields++

  extractedData.confidence = 0.5 + (extractedFields * 0.1)
  if (extractedData.confidence > 0.95) extractedData.confidence = 0.95

  return extractedData
}

// Function to match extracted supplier with database suppliers
export async function matchSupplier(extractedSupplier: string, suppliers: any[]): Promise<string | null> {
  if (!extractedSupplier || suppliers.length === 0) return null

  const normalizedExtracted = extractedSupplier.toLowerCase().trim()
  
  // Try exact match first
  const exactMatch = suppliers.find(s => 
    s.name.toLowerCase() === normalizedExtracted
  )
  if (exactMatch) return exactMatch.id

  // Try partial match
  const partialMatch = suppliers.find(s => 
    s.name.toLowerCase().includes(normalizedExtracted) ||
    normalizedExtracted.includes(s.name.toLowerCase())
  )
  if (partialMatch) return partialMatch.id

  // Try email match if available
  const emailMatch = suppliers.find(s => 
    s.email && s.email.toLowerCase().includes(normalizedExtracted)
  )
  if (emailMatch) return emailMatch.id

  return null
}

// Function to parse common invoice number formats
export function parseInvoiceNumber(text: string): string | null {
  const patterns = [
    /invoice\s*[:#]?\s*([a-zA-Z0-9-]+)/i,
    /inv\s*[:#]?\s*([a-zA-Z0-9-]+)/i,
    /#\s*([a-zA-Z0-9-]+)/i,
    /([a-zA-Z]{2,4}-?\d{4,})/  // Common format like INV-1234
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) return match[1].toUpperCase()
  }

  return null
}

// Function to parse date from text
export function parseDate(text: string): Date | null {
  const datePatterns = [
    /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/, // MM/DD/YYYY or DD/MM/YYYY
    /(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})/, // YYYY/MM/DD
    /(\w+)\s+(\d{1,2}),?\s+(\d{4})/i // January 15, 2024
  ]

  for (const pattern of datePatterns) {
    const match = text.match(pattern)
    if (match) {
      try {
        const date = new Date(match[0])
        if (!isNaN(date.getTime())) return date
      } catch {
        continue
      }
    }
  }

  return null
}

// Function to parse monetary amounts
export function parseAmount(text: string): number | null {
  const patterns = [
    /\$?([\d,]+\.?\d*)/, // $1,234.56 or 1,234.56
    /([\d,]+\.?\d*)\s*(?:usd|dollars?)/i
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      try {
        const amount = parseFloat(match[1].replace(/,/g, ''))
        if (!isNaN(amount)) return amount
      } catch {
        continue
      }
    }
  }

  return null
}