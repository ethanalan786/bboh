import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { extractInvoiceData, matchSupplier } from '@/lib/invoice-extraction'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { fileUrl, fileType } = body

    if (!fileUrl || !fileType) {
      return NextResponse.json({ 
        error: 'Missing required fields: fileUrl, fileType' 
      }, { status: 400 })
    }

    // Extract data from invoice
    const extractedData = await extractInvoiceData(fileUrl, fileType)

    // If supplier was extracted, try to match with database
    if (extractedData.supplier) {
      const suppliers = await prisma.supplier.findMany({
        where: { isActive: true },
        select: { id: true, name: true, email: true }
      })
      
      const matchedSupplierId = await matchSupplier(extractedData.supplier, suppliers)
      if (matchedSupplierId) {
        // In a real implementation, we'd return the matched supplier ID
        extractedData.supplier = matchedSupplierId
      }
    }

    return NextResponse.json({ 
      success: true, 
      extractedData,
      message: 'Invoice data extracted successfully'
    })
  } catch (error) {
    console.error('Error extracting invoice data:', error)
    return NextResponse.json(
      { error: 'Failed to extract invoice data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}