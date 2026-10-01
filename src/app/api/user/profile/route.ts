import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        phone: true,
        address: true,
        city: true,
        state: true,
        zipCode: true,
        image: true,
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const profileData = {
      phone: user.phone || '',
      address: user.address || '',
      city: user.city || '',
      state: user.state || '',
      zipCode: user.zipCode || '',
      image: user.image || null,
    };

    return NextResponse.json(profileData, { status: 200 });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { firstName, lastName, phone, address, city, state, zipCode } = body;

    // Validate required fields
    if (!firstName && !lastName && !phone && !address && !city && !state && !zipCode) {
      return NextResponse.json(
        { error: 'At least one field must be provided' },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: any = {
      phone: phone || undefined,
      address: address || undefined,
      city: city || undefined,
      state: state || undefined,
      zipCode: zipCode || undefined,
    };

    // Combine firstName and lastName to update the name field
    if (firstName || lastName) {
      const currentName = session.user.name || '';
      const nameParts = currentName.split(' ');
      const updatedFirstName = firstName || nameParts[0] || '';
      const updatedLastName = lastName || nameParts.slice(1).join(' ') || '';
      updateData.name = `${updatedFirstName} ${updatedLastName}`.trim();
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: updateData
    });

    return NextResponse.json(
      { success: true, message: 'Profile updated successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}