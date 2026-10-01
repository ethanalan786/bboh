import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, email, phone } = body

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 })
    }

    const { id } = await params

    // Check if customer exists
    const existingCustomer = await prisma.user.findUnique({
      where: { id }
    })

    if (!existingCustomer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    // Check if email is taken by another user
    if (email !== existingCustomer.email) {
      const emailTaken = await prisma.user.findUnique({
        where: { email }
      })

      if (emailTaken) {
        return NextResponse.json({ error: 'Email already exists' }, { status: 409 })
      }
    }

    // Update customer
    const customer = await prisma.user.update({
      where: { id },
      data: {
        name,
        email,
        phone: phone || undefined,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
      }
    })

    return NextResponse.json({ 
      customer,
      message: 'Customer updated successfully'
    }, { status: 200 })
  } catch (error) {
    console.error('Error updating customer:', error)
    return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Check if customer exists
    const existingCustomer = await prisma.user.findUnique({
      where: { id }
    })

    if (!existingCustomer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    // Delete customer
    await prisma.user.delete({
      where: { id }
    })

    return NextResponse.json({ 
      message: 'Customer deleted successfully'
    }, { status: 200 })
  } catch (error) {
    console.error('Error deleting customer:', error)
    return NextResponse.json({ error: 'Failed to delete customer' }, { status: 500 })
  }
}