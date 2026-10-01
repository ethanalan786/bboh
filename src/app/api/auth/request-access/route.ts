import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, role, reason } = body

    // Validate required fields
    if (!name || !email || !role || !reason) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate role
    const validRoles = ['FRONT_DESK', 'INVENTORY', 'CUSTOMER']
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role selected' },
        { status: 400 }
      )
    }

    // Role display names
    const roleNames: Record<string, string> = {
      'FRONT_DESK': 'Front Desk',
      'INVENTORY': 'Inventory Manager',
      'CUSTOMER': 'Customer'
    }

    // Create email transporter
    // Note: You'll need to configure these environment variables
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })

    // Email to admin
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@burnbox.com'

    const mailOptions = {
      from: process.env.SMTP_FROM || 'noreply@burnbox.com',
      to: adminEmail,
      subject: `New Access Request: ${name} (${roleNames[role]})`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #668E2B;">New Access Request</h2>
          <p>A new user has requested access to the Burn Box Operations Hub:</p>
          
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Requested Role:</strong> ${roleNames[role]}</p>
            <p><strong>Reason:</strong></p>
            <p style="white-space: pre-wrap; margin-top: 10px;">${reason}</p>
          </div>
          
          <p><strong>Submitted on:</strong> ${new Date().toLocaleString()}</p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
          
          <p style="color: #666; font-size: 12px;">
            This is an automated message from the Burn Box Operations Hub.
          </p>
        </div>
      `,
    }

    // Send email
    await transporter.sendMail(mailOptions)

    // In a real application, you might also want to:
    // 1. Store this request in a database for tracking
    // 2. Send a confirmation email to the requester
    // 3. Create a notification in the admin dashboard

    return NextResponse.json(
      { 
        message: 'Access request submitted successfully',
        success: true 
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Error processing access request:', error)
    return NextResponse.json(
      { error: 'Failed to process request. Please try again.' },
      { status: 500 }
    )
  }
}