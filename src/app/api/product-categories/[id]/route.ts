import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json();
    const { name, description, isActive } = body;

    const productCategory = await prisma.productCategory.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(isActive !== undefined && { isActive }),
      }
    });

    return NextResponse.json(productCategory);
  } catch (error) {
    console.error('Error updating product category:', error);
    return NextResponse.json(
      { error: 'Failed to update product category' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.productCategory.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting product category:', error);
    return NextResponse.json(
      { error: 'Failed to delete product category' },
      { status: 500 }
    );
  }
}
