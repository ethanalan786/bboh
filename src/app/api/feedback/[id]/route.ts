import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status } = body

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      )
    }

    const feedback = await (prisma as any).feedback.update({
      where: { id },
      data: { status }
    })

    return NextResponse.json(feedback)
  } catch (error) {
    console.error('Error updating feedback:', error)
    return NextResponse.json(
      { error: 'Failed to update feedback', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await (prisma as any).feedback.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting feedback:', error)
    return NextResponse.json(
      { error: 'Failed to delete feedback', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}