import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface GymMasterReport {
  id?: number | string
  name?: string
  description?: string
  report_id?: number | string
  title?: string
  [key: string]: any
}

interface GymMasterTransaction {
  transaction_id?: string
  invoice_number?: string
  timestamp?: string
  member?: {
    member_id?: string
    first_name?: string
    last_name?: string
  }
  payment_method?: string
  pos_station?: string
  items?: Array<{
    item_id?: string
    description?: string
    quantity?: number
    unit_price?: number
    tax?: number
    total?: number
  }>
  subtotal?: number
  tax_total?: number
  grand_total?: number
}

interface GymMasterSaleResponse {
  transactions?: GymMasterTransaction[]
  data?: GymMasterTransaction[]
  results?: GymMasterTransaction[]
}

interface ParsedGymMasterSale {
  invoiceNumber: string
  accountTitle: string
  saleType: string
  saleAmountInclTax: string | number
  saleDate: string
  isVoided: boolean
}

function parseGymMasterJSON(jsonData: any): ParsedGymMasterSale[] {
  const sales: ParsedGymMasterSale[] = []
  
  try {
    // GymMaster JSON responses can have different structures
    // Common patterns: data array, results array, transactions array, result array
    let dataArray = jsonData.data || jsonData.results || jsonData.transactions || jsonData.result || jsonData
    
    // Handle nested structures
    if (jsonData.result && Array.isArray(jsonData.result)) {
      dataArray = jsonData.result
    } else if (jsonData.data && Array.isArray(jsonData.data)) {
      dataArray = jsonData.data
    } else if (Array.isArray(jsonData)) {
      dataArray = jsonData
    }
    
    console.log(`Data array found: ${dataArray ? dataArray.length : 0} items`)
    
    if (Array.isArray(dataArray) && dataArray.length > 0) {
      for (const item of dataArray) {
        // Handle the specific GymMaster response structure
        // Based on the actual response: Account Title, Sale Date, Sale Type, Invoice Number, Sale Amount (Incl Tax), Is Voided Sale
        const invoiceNumber = item['Invoice Number'] || item.invoice_number || item.transaction_id || item.id || item.invoice || 'UNKNOWN'
        const accountTitle = item['Account Title'] || item.product || item.description || item.account_title || item.item_name || 'Unknown Product'
        const saleType = item['Sale Type'] || item.type || item.sale_type || item.transaction_type || 'Product Sale'
        const saleAmountInclTax = item['Sale Amount (Incl Tax)'] || item.amount || item.total || item.grand_total || item.sale_amount || 0
        const saleDate = item['Sale Date'] || item.timestamp || item.date || item.sale_date || item.transaction_date || new Date().toISOString()
        const isVoided = item['Is Voided Sale'] !== undefined ? item['Is Voided Sale'] : (item.voided || item.is_voided || item.void || false)
        
        sales.push({
          invoiceNumber,
          accountTitle,
          saleType,
          saleAmountInclTax,
          saleDate,
          isVoided
        })
      }
    }
    
    console.log(`Parsed ${sales.length} sales from JSON`)
    console.log(`Sample parsed sale:`, JSON.stringify(sales[0]))
    return sales
    
  } catch (error) {
    console.error('Error parsing GymMaster JSON:', error)
    return sales
  }
}

function parseGymMasterReportHTML(html: string): ParsedGymMasterSale[] {
  const sales: ParsedGymMasterSale[] = []
  
  try {
    // Look for table rows containing sales data
    // GymMaster reports typically use table structures with specific classes
    const tableRowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi
    const matches = html.match(tableRowRegex)
    
    if (!matches) {
      console.log('No table rows found in HTML')
      return sales
    }
    
    for (const row of matches) {
      // Skip header rows and empty rows
      if (row.includes('<th') || row.trim() === '') {
        continue
      }
      
      // Extract cell data from table cells
      const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi
      const cells = []
      let cellMatch
      while ((cellMatch = cellRegex.exec(row)) !== null) {
        // Remove HTML tags and get text content
        const cellContent = cellMatch[1]
          .replace(/<[^>]*>/g, '')
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .trim()
        cells.push(cellContent)
      }
      
      // We need at least some cells to consider this a valid sale row
      if (cells.length < 3) {
        continue
      }
      
      // Try to extract sale data from cells
      // The exact column structure depends on the GymMaster report format
      // Common patterns: Invoice #, Date, Account/Title, Type, Amount
      
      // Look for invoice number pattern (typically numeric or with prefix)
      let invoiceNumber = ''
      let accountTitle = ''
      let saleType = 'Product Sale'
      let saleAmountInclTax = '0'
      let saleDate = ''
      let isVoided = false
      
      // Try to identify columns based on content patterns
      for (let i = 0; i < cells.length; i++) {
        const cell = cells[i]
        
        // Check for voided status
        if (cell.toLowerCase().includes('void') || cell.toLowerCase().includes('cancelled')) {
          isVoided = true
        }
        
        // Check for date pattern (MM-DD-YYYY or similar)
        const datePattern = /\d{1,2}-\d{1,2}-\d{4}/
        if (datePattern.test(cell) && !saleDate) {
          saleDate = cell
        }
        
        // Check for amount pattern (currency or number)
        const amountPattern = /\$?[\d,]+\.?\d*/
        if (amountPattern.test(cell) && parseFloat(cell.replace(/[$,]/g, '')) > 0) {
          saleAmountInclTax = cell
        }
        
        // Check for invoice number (often numeric or alphanumeric)
        if (/^[A-Z0-9-]+$/.test(cell) && cell.length > 3 && !invoiceNumber) {
          invoiceNumber = cell
        }
        
        // Check for account title (usually descriptive text)
        if (cell.length > 5 && !/^\d+$/.test(cell) && !amountPattern.test(cell) && !datePattern.test(cell)) {
          if (!accountTitle) {
            accountTitle = cell
          }
        }
      }
      
      // If we couldn't identify specific columns, use positional fallback
      if (!invoiceNumber && cells[0]) {
        invoiceNumber = cells[0]
      }
      if (!saleDate && cells[1]) {
        saleDate = cells[1]
      }
      if (!accountTitle && cells[2]) {
        accountTitle = cells[2]
      }
      if (!saleAmountInclTax && cells[cells.length - 1]) {
        saleAmountInclTax = cells[cells.length - 1]
      }
      
      // Only add if we have meaningful data
      if (invoiceNumber || accountTitle || saleAmountInclTax !== '0') {
        sales.push({
          invoiceNumber: invoiceNumber || 'UNKNOWN',
          accountTitle: accountTitle || 'Unknown Product',
          saleType: saleType,
          saleAmountInclTax: saleAmountInclTax,
          saleDate: saleDate || new Date().toISOString(),
          isVoided
        })
      }
    }
    
    console.log(`Parsed ${sales.length} sales from HTML`)
    return sales
    
  } catch (error) {
    console.error('Error parsing GymMaster HTML:', error)
    return sales
  }
}

async function getStandardReportData(clientName: string, apiKey: string, reportId: number | string, dateFrom: string, dateTo: string): Promise<any> {
  // Use the correct API endpoint and body format based on GymMaster API documentation
  const endpoint = `https://${clientName}.gymmasteronline.com/api/v2/report/standard_report`
  
  const body = {
    report_id: reportId,
    start_date: dateFrom,
    end_date: dateTo
  }
  
  console.log(`Fetching GymMaster report data for: ${dateFrom} to ${dateTo}`)
  
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'X-GM-API-KEY': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('GymMaster report data error:', errorText)
    throw new Error(`Failed to fetch report data: ${response.status} - ${errorText}`)
  }

  const data = await response.json()
  console.log('GymMaster report data received successfully')
  return data
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { dateFrom, dateTo } = body

    if (!dateFrom || !dateTo || typeof dateFrom !== 'string' || typeof dateTo !== 'string') {
      return NextResponse.json({ error: 'dateFrom and dateTo are required as strings' }, { status: 400 })
    }

    // Fetch GymMaster credentials from database settings
    const settings = await (prisma as any).settings.findFirst()
    const clientName = settings?.gymMasterClientId
    const apiKey = settings?.gymMasterApiKey

    if (!clientName || !apiKey) {
      return NextResponse.json({ error: 'GymMaster API credentials not configured in settings' }, { status: 500 })
    }

    // Format dates for GymMaster API (YYYY-MM-DD)
    const formatDate = (date: Date) => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }
    
    const formattedStartDate = formatDate(new Date(dateFrom))
    const formattedEndDate = formatDate(new Date(dateTo))

    // Use the specific report ID for 'All Sales' (ID: 14)
    const reportId = 14
    const reportName = 'All Sales'
    console.log(`Using specific report: ${reportName} (ID: ${reportId})`)

    // Fetch the actual report data
    console.log(`Fetching report data from ${formattedStartDate} to ${formattedEndDate} using report: ${reportName} (ID: ${reportId})...`)
    const reportData = await getStandardReportData(clientName, apiKey, reportId, formattedStartDate, formattedEndDate)
    console.log('Report data received:', JSON.stringify(reportData).slice(0, 500))

    // Parse the JSON response from GymMaster API
    const salesData = parseGymMasterJSON(reportData)
    console.log('Parsed sales count:', salesData.length)
    console.log('Sample sale data:', JSON.stringify(salesData[0]))
    
    // Save sales to database
    const savedSales = []
    const skippedSales = []
    const errorSales = []
    
    console.log(`Starting database save for ${salesData.length} sales...`)
    
    for (const sale of salesData) {
      try {
        // Parse amount if it's a string with currency symbol
        const parsedAmount = typeof sale.saleAmountInclTax === 'string' 
          ? parseFloat(sale.saleAmountInclTax.replace(/[$,]/g, '')) || 0
          : (typeof sale.saleAmountInclTax === 'number' ? sale.saleAmountInclTax : 0)
        
        console.log(`Processing sale: invoice=${sale.invoiceNumber}, account=${sale.accountTitle}, amount=${parsedAmount}, voided=${sale.isVoided}`)
        
        // Skip voided sales and $0 sales (signups, complimentary, etc.)
        if (sale.isVoided || parsedAmount === 0) {
          console.log(`Skipping sale: voided=${sale.isVoided}, amount=${parsedAmount}`)
          skippedSales.push({ reason: 'voided_or_zero', sale })
          continue
        }
        
        // Create external ID from invoice number and account title
        const externalId = `${sale.invoiceNumber}-${sale.accountTitle}`.replace(/\s+/g, '-')
        console.log(`Checking for existing sale with externalId: ${externalId}`)
        
        // Check if sale already exists
        const existingSale = await (prisma as any).gymMasterSale.findUnique({
          where: { externalId }
        })

        if (existingSale) {
          console.log(`Sale already exists: ${externalId}`)
          skippedSales.push({ reason: 'already_exists', externalId })
          continue
        }

        // Parse date time - handle GymMaster date format "Sep 14 2025 12:00 am"
        let parsedDateTime: Date
        if (sale.saleDate) {
          try {
            parsedDateTime = new Date(sale.saleDate)
            // If invalid date, try alternative parsing
            if (isNaN(parsedDateTime.getTime())) {
              // Try parsing GymMaster format
              const dateMatch = sale.saleDate.match(/(\w{3})\s+(\d{1,2})\s+(\d{4})/)
              if (dateMatch) {
                const months: { [key: string]: number } = {
                  'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
                  'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
                }
                parsedDateTime = new Date(parseInt(dateMatch[3]), months[dateMatch[1]], parseInt(dateMatch[2]))
              } else {
                parsedDateTime = new Date()
              }
            }
          } catch (e) {
            console.error('Error parsing date:', sale.saleDate, e)
            parsedDateTime = new Date()
          }
        } else {
          parsedDateTime = new Date()
        }

        console.log(`Creating sale record: externalId=${externalId}, dateTime=${parsedDateTime.toISOString()}`)
        
        const gymMasterSale = await (prisma as any).gymMasterSale.create({
          data: {
            externalId,
            dateTime: parsedDateTime,
            orderNumber: String(sale.invoiceNumber || ''), // Convert to string for database compatibility
            product: sale.accountTitle,
            type: sale.saleType,
            amount: parsedAmount,
            quantity: 1, // Default to 1 since the HTML doesn't show quantity
            location: 'burn-box', // Match schema default location
            rawResponse: JSON.stringify(sale),
          }
        })
        savedSales.push(gymMasterSale)
        console.log(`✓ Successfully saved sale: ${externalId}, amount: ${parsedAmount}`)
      } catch (error) {
        console.error('✗ Error saving sale:', error, sale)
        errorSales.push({ error: error instanceof Error ? error.message : 'Unknown error', sale })
        // Continue with other sales even if one fails
      }
    }
    
    console.log(`Sync complete - Total: ${salesData.length}, Saved: ${savedSales.length}, Skipped: ${skippedSales.length}, Errors: ${errorSales.length}`)

    return NextResponse.json({
      success: true,
      totalFetched: salesData.length,
      newSalesSaved: savedSales.length,
      skippedSales: skippedSales.length,
      errorSales: errorSales.length,
      sales: savedSales,
      reportUsed: reportName,
      details: {
        skipped: skippedSales.slice(0, 10), // Return first 10 skipped sales for debugging
        errors: errorSales.slice(0, 10) // Return first 10 errors for debugging
      }
    })
  } catch (error) {
    console.error('Error syncing GymMaster sales:', error)
    return NextResponse.json(
      { error: 'Failed to sync GymMaster sales', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
