import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { deleteImageFiles } from '@/lib/image-utils';

export const dynamic = 'force-dynamic';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid image ID' }, { status: 400 });
    }

    const body = await req.json();

    const updated = await prisma.image.update({
      where: { id },
      data: {
        caption: body.caption !== undefined ? body.caption : undefined,
        description: body.description !== undefined ? body.description : undefined,
        imageType: body.imageType !== undefined ? body.imageType : undefined,
        sortOrder: body.sortOrder !== undefined ? body.sortOrder : undefined
      }
    });

    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid image ID' }, { status: 400 });
    }

    const image = await prisma.image.findUnique({
      where: { id }
    });

    if (!image) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    // Delete files from disk
    deleteImageFiles(image.filePath, image.thumbPath);

    // Delete from DB
    await prisma.image.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: 'Image deleted successfully' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
