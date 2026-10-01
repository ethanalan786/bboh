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

    const bookmarks = await prisma.reportBookmark.findMany({
      where: {
        userId: session.user.id
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ bookmarks })
  } catch (error) {
    console.error("Error fetching bookmarks:", error)
    return NextResponse.json(
      { error: "Failed to fetch bookmarks", details: error instanceof Error ? error.message : "Unknown error" },
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
    const { reportId, reportTitle } = body

    if (!reportId || !reportTitle) {
      return NextResponse.json({ error: 'Report ID and title are required' }, { status: 400 })
    }

    // Check if bookmark already exists
    const existingBookmark = await prisma.reportBookmark.findUnique({
      where: {
        userId_reportId: {
          userId: session.user.id,
          reportId
        }
      }
    })

    if (existingBookmark) {
      return NextResponse.json({ error: 'Report already bookmarked' }, { status: 400 })
    }

    const bookmark = await prisma.reportBookmark.create({
      data: {
        userId: session.user.id,
        reportId,
        reportTitle
      }
    })

    return NextResponse.json({ bookmark })
  } catch (error) {
    console.error("Error creating bookmark:", error)
    return NextResponse.json(
      { error: "Failed to create bookmark", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const reportId = searchParams.get('reportId')

    if (!reportId) {
      return NextResponse.json({ error: 'Report ID is required' }, { status: 400 })
    }

    await prisma.reportBookmark.deleteMany({
      where: {
        userId: session.user.id,
        reportId
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting bookmark:", error)
    return NextResponse.json(
      { error: "Failed to delete bookmark", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
