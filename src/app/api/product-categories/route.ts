import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const productCategories = await prisma.productCategory.findMany({
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json({ productCategories });
  } catch (error) {
    console.error('Error fetching product categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product categories' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    const productCategory = await prisma.productCategory.create({
      data: {
        name,
        description: description || null,
        isActive: true
      }
    });

    return NextResponse.json(productCategory, { status: 201 });
  } catch (error) {
    console.error('Error creating product category:', error);
    return NextResponse.json(
      { error: 'Failed to create product category' },
      { status: 500 }
    );
  }
}
