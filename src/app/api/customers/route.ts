import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch users (for customer selection) - only users with CUSTOMER role
    const customers = await prisma.user.findMany({
      where: {
        role: 'CUSTOMER'
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json({ customers }, { status: 200 })
  } catch (error) {
    console.error('Error fetching customers:', error)
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 })
  }
}

export async function POST(request: Request) {
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

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 409 })
    }

    // Create new customer with a default password (they can reset it later)
    const defaultPassword = Math.random().toString(36).slice(-8)
    
    const customer = await prisma.user.create({
      data: {
        name,
        email,
        phone: phone || null,
        password: defaultPassword,
        role: 'CUSTOMER'
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
      message: 'Customer created successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating customer:', error)
    return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 })
  }
}