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

    const users = await prisma.user.findMany({
      select: {
        _count: {
          select: {
            stockHistory: true,
            sales: true,
            customerSales: true,
            auditLogs: true,
            reportBookmarks: true,
            feedback: true,
          }
        },
        id: true,
        email: true,
        name: true,
        role: true,
        image: true,
        phone: true,
        address: true,
        city: true,
        state: true,
        zipCode: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const mappedUsers = users.map(({ _count, ...user }) => ({
      ...user,
      activityCount:
        _count.stockHistory +
        _count.sales +
        _count.customerSales +
        _count.auditLogs +
        _count.reportBookmarks +
        _count.feedback
    }))

    return NextResponse.json({ users: mappedUsers })
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json(
      { error: "Failed to fetch users", details: error instanceof Error ? error.message : "Unknown error" },
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
    const { name, email, password, role, phone, address, city, state, zipCode } = body

    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: 'Name, email, password, and role are required' }, { status: 400 })
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 400 })
    }

    // Create user
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password,
        role,
        phone: phone || null,
        address: address || null,
        city: city || null,
        state: state || null,
        zipCode: zipCode || null
      }
    })

    return NextResponse.json(newUser)
  } catch (error) {
    console.error("Error creating user:", error)
    return NextResponse.json(
      { error: "Failed to create user", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, name, email, role, phone, address, city, state, zipCode, isActive } = body

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id }
    })

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if email is being changed and if it's already in use
    if (email && email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email }
      })

      if (emailExists) {
        return NextResponse.json({ error: 'Email already in use' }, { status: 400 })
      }
    }

    // Prevent users from changing their own role to something lower
    if (id === session.user.id && role !== existingUser.role) {
      return NextResponse.json({ error: 'Cannot change your own role' }, { status: 400 })
    }

    // Prevent users from deactivating themselves
    if (id === session.user.id && isActive === false) {
      return NextResponse.json({ error: 'Cannot deactivate your own account' }, { status: 400 })
    }

    // Update user — only apply fields that were actually sent
    const data: Record<string, unknown> = { updatedAt: new Date() }
    if (name !== undefined) data.name = name || existingUser.name
    if (email !== undefined) data.email = email || existingUser.email
    if (role !== undefined) data.role = role || existingUser.role
    if (phone !== undefined) data.phone = phone || null
    if (address !== undefined) data.address = address || null
    if (city !== undefined) data.city = city || null
    if (state !== undefined) data.state = state || null
    if (zipCode !== undefined) data.zipCode = zipCode || null
    if (typeof isActive === 'boolean') data.isActive = isActive

    const updatedUser = await prisma.user.update({
      where: { id },
      data
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json(
      { error: "Failed to update user", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}