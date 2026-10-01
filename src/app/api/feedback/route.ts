import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import nodemailer from 'nodemailer'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const status = searchParams.get('status')
    const category = searchParams.get('category')

    const where: any = {}
    if (userId) where.userId = userId
    if (status) where.status = status
    if (category) where.category = category

    const feedback = await (prisma as any).feedback.findMany({
      where,
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
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(feedback)
  } catch (error) {
    console.error('Error fetching feedback:', error)
    return NextResponse.json(
      { error: 'Failed to fetch feedback', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, category, subject, message, priority, screenshot } = body

    if (!userId || !category || !subject || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, category, subject, message' },
        { status: 400 }
      )
    }

    const feedback = await (prisma as any).feedback.create({
      data: {
        userId,
        category,
        subject,
        message,
        priority: priority || 'MEDIUM',
        screenshot: screenshot || null,
        status: 'OPEN'
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    // Send email notification
    try {
      const transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      })

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: 'aimahusnain@gmail.com',
        subject: `New Feedback: ${feedback.subject}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
            <header style="background-color: #668E2B; padding: 20px; text-align: center;">
              <h1 style="font-size: 24px; color: white; margin: 0;">New Feedback Received</h1>
            </header>
            <div style="padding: 20px;">
              <p style="font-size: 16px; color: #333;"><strong>From:</strong> ${feedback.user.name} (${feedback.user.email})</p>
              <p style="font-size: 16px; color: #333;"><strong>Category:</strong> ${feedback.category}</p>
              <p style="font-size: 16px; color: #333;"><strong>Priority:</strong> ${feedback.priority}</p>
              <p style="font-size: 16px; color: #333;"><strong>Subject:</strong> ${feedback.subject}</p>
              <div style="background-color: #f5f5f5; padding: 15px; border-radius: 4px; margin: 20px 0;">
                <p style="font-size: 14px; color: #666; margin: 0;"><strong>Message:</strong></p>
                <p style="font-size: 14px; color: #333; margin: 10px 0 0 0;">${feedback.message}</p>
              </div>
              <p style="font-size: 14px; color: #666;">Feedback ID: ${feedback.id}</p>
              <p style="font-size: 14px; color: #666;">Submitted: ${new Date(feedback.createdAt).toLocaleString()}</p>
            </div>
            <footer style="background-color: #f5f5f5; padding: 10px; text-align: center;">
              <p style="font-size: 14px; color: #999; margin: 0;">&copy; ${new Date().getFullYear()} Burn Box Operations Hub. All rights reserved.</p>
            </footer>
          </div>
        `
      }

      await transporter.sendMail(mailOptions)
      console.log('Feedback email sent successfully')
    } catch (emailError) {
      console.error('Error sending feedback email:', emailError)
      // Don't fail the request if email fails
    }

    return NextResponse.json(feedback, { status: 201 })
  } catch (error) {
    console.error('Error creating feedback:', error)
    return NextResponse.json(
      { error: 'Failed to create feedback', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}