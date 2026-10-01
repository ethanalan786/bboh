import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const supplier = await (prisma as any).supplier.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true }
        }
      }
    })

    if (!supplier) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 })
    }

    const transformedSupplier = {
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
    }

    return NextResponse.json({ supplier: transformedSupplier })
  } catch (error) {
    console.error("Error fetching supplier:", error)
    return NextResponse.json(
      { error: "Failed to fetch supplier", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

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
      isActive
    } = body

    const existingSupplier = await prisma.supplier.findUnique({
      where: { id }
    })

    if (!existingSupplier) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 })
    }

    // Check if email already exists for another supplier
    if (email && email !== existingSupplier.email) {
      const emailExists = await (prisma as any).supplier.findUnique({
        where: { email }
      })
      if (emailExists) {
        return NextResponse.json({ error: 'Email already exists' }, { status: 400 })
      }
    }

    const supplier = await (prisma as any).supplier.update({
      where: { id },
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
        actionType: 'SUPPLIER_UPDATED',
        entityType: 'Supplier',
        entityId: supplier.id,
        description: `Updated supplier: ${name}`,
        previousValue: JSON.stringify(existingSupplier),
        newValue: JSON.stringify(supplier),
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    })

    return NextResponse.json({ 
      success: true, 
      supplier,
      message: 'Supplier updated successfully'
    })
  } catch (error) {
    console.error('Error updating supplier:', error)
    return NextResponse.json({ error: 'Failed to update supplier' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const supplier = await (prisma as any).supplier.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true }
        }
      }
    })

    if (!supplier) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 })
    }

    // Check if supplier has products
    if (supplier._count.products > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete supplier with associated products' 
      }, { status: 400 })
    }

    await (prisma as any).supplier.delete({
      where: { id }
    })

    // Create audit log
    await (prisma as any).auditLog.create({
      data: {
        userId: session.user.id,
        actionType: 'SUPPLIER_DELETED',
        entityType: 'Supplier',
        entityId: id,
        description: `Deleted supplier: ${supplier.name}`,
        previousValue: JSON.stringify(supplier),
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Supplier deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting supplier:', error)
    return NextResponse.json({ error: 'Failed to delete supplier' }, { status: 500 })
  }
}