import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET - Only admins can view audit logs
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    // Only admins can view audit logs
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    const auditLogs = await prisma.auditLog.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      },
      // Sort by _id (ObjectId) instead of createdAt: MongoDB can use the _id
      // index, avoiding an in-memory sort that exceeds the 32MB limit and
      // fails once the collection grows. ObjectIds are time-ordered, so the
      // result is equivalent for insert-only audit records.
      orderBy: {
        id: 'desc'
      },
      take: limit,
      skip: offset
    })

    return NextResponse.json(auditLogs)
  } catch (error) {
    console.error('Error fetching audit logs:', error)
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 })
  }
}

// Prevent any modification attempts - audit logs are read-only
export async function POST() {
  return NextResponse.json({ error: 'Audit logs are read-only and cannot be created via API' }, { status: 403 })
}

export async function PUT() {
  return NextResponse.json({ error: 'Audit logs are read-only and cannot be modified' }, { status: 403 })
}

export async function PATCH() {
  return NextResponse.json({ error: 'Audit logs are read-only and cannot be modified' }, { status: 403 })
}

export async function DELETE() {
  return NextResponse.json({ error: 'Audit logs are read-only and cannot be deleted' }, { status: 403 })
}