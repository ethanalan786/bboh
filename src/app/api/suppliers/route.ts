import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const suppliers = await prisma.supplier.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { products: true }
        }
      }
    })

    const transformedSuppliers = suppliers.map((supplier: any) => ({
      id: supplier.id,
      name: supplier.name,
      email: supplier.email,
      phone: supplier.phone,
      address: supplier.address,
      city: supplier.city,
      state: supplier.state,
      zipCode: supplier.zipCode,
      country: supplier.country,
      contactPerson: supplier.contactPerson,
      notes: supplier.notes,
      isActive: supplier.isActive,
      createdAt: supplier.createdAt,
      updatedAt: supplier.updatedAt,
      productCount: supplier._count.products
    }))

    const stats = {
      totalSuppliers: suppliers.length,
      activeSuppliers: suppliers.filter((s: any) => s.isActive).length,
      inactiveSuppliers: suppliers.filter((s: any) => !s.isActive).length,
      totalProducts: suppliers.reduce((sum: number, s: any) => sum + s._count.products, 0)
    }

    return NextResponse.json({
      suppliers: transformedSuppliers,
      stats
    })
  } catch (error) {
    console.error("Error fetching suppliers:", error)
    return NextResponse.json(
      { error: "Failed to fetch suppliers", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      name,
      email,
      phone,
      address,
      city,
      state,
      zipCode,
      country,
      contactPerson,
      notes,
      isActive = true
    } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    // Check if email already exists
    if (email) {
      const existingSupplier = await (prisma as any).supplier.findUnique({
        where: { email }
      })
      if (existingSupplier) {
        return NextResponse.json({ error: 'Email already exists' }, { status: 400 })
      }
    }

    const supplier = await (prisma as any).supplier.create({
      data: {
        name,
        email,
        phone,
        address,
        city,
        state,
        zipCode,
        country,
        contactPerson,
        notes,
        isActive
      }
    })

    // Create audit log
    await (prisma as any).auditLog.create({
      data: {
        userId: session.user.id,
        actionType: 'SUPPLIER_ADDED',
        entityType: 'Supplier',
        entityId: supplier.id,
        description: `Created supplier: ${name}`,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    })

    return NextResponse.json({ 
      success: true, 
      supplier,
      message: 'Supplier created successfully'
    })
  } catch (error) {
    console.error('Error creating supplier:', error)
    return NextResponse.json({ error: 'Failed to create supplier' }, { status: 500 })
  }
}