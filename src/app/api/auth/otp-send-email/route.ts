import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

// Simple in-memory OTP storage (in production, use Redis or database)
const otpStore = new Map<string, { code: string; expiresAt: number }>();

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes expiration

    // Store OTP
    otpStore.set(email, { code: otp, expiresAt });

    // Send email
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your Password Reset Verification Code",
      html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
      <header style="background-color: #668E2B; padding: 20px; text-align: center;">
        <h1 style="font-size: 24px; color: white; margin: 0;">Password Reset Verification</h1>
      </header>
      <div style="padding: 20px;">
        <p style="font-size: 16px; color: #333;">Hello,</p>
        <p style="font-size: 16px; color: #666;">You requested a password reset for your account. Use the following verification code to proceed:</p>
        <div style="background-color: #f5f5f5; padding: 15px; text-align: center; border-radius: 4px; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; color: #668E2B; letter-spacing: 5px;">${otp}</span>
        </div>
        <p style="font-size: 14px; color: #666;">This code will expire in 10 minutes.</p>
        <p style="font-size: 14px; color: #666;">If you didn't request this code, please ignore this email.</p>
      </div>
      <footer style="background-color: #f5f5f5; padding: 10px; text-align: center;">
        <p style="font-size: 14px; color: #999; margin: 0;">&copy; ${new Date().getFullYear()} Burn Box Operations Hub. All rights reserved.</p>
      </footer>
    </div>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
      return NextResponse.json({ success: true, message: "OTP sent successfully" }, { status: 200 });
    } catch (error) {
      console.error("Error sending email:", error);
      return NextResponse.json(
        { error: "Failed to send email" },
        { status: 500 }
      );
    }
  } catch (e) {
    console.error("Unexpected error:", e);
    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong! Please try again",
      },
      { status: 500 }
    );
  }
}

// Endpoint to verify OTP
export async function PUT(req: NextRequest) {
  try {
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json(
        { error: "Email and OTP are required" },
        { status: 400 }
      );
    }

    const storedData = otpStore.get(email);

    if (!storedData) {
      return NextResponse.json(
        { error: "Invalid or expired OTP" },
        { status: 400 }
      );
    }

    if (Date.now() > storedData.expiresAt) {
      otpStore.delete(email);
      return NextResponse.json(
        { error: "OTP has expired" },
        { status: 400 }
      );
    }

    if (storedData.code !== otp) {
      return NextResponse.json(
        { error: "Invalid OTP" },
        { status: 400 }
      );
    }

    // OTP is valid, remove it from store
    otpStore.delete(email);

    return NextResponse.json({ success: true, message: "OTP verified successfully" }, { status: 200 });
  } catch (e) {
    console.error("Unexpected error:", e);
    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong! Please try again",
      },
      { status: 500 }
    );
  }
}