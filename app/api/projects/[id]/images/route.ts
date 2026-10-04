import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { processAndSaveImage } from '@/lib/image-utils';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = parseInt(params.id, 10);
    if (isNaN(projectId)) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const formData = await req.formData();
    const files = formData.getAll('images') as File[];
    const imageType = (formData.get('imageType') as string) || 'NEW_UI';
    const caption = (formData.get('caption') as string) || '';
    const description = (formData.get('description') as string) || '';

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files uploaded' }, { status: 400 });
    }

    const existingImagesCount = await prisma.image.count({
      where: { projectId }
    });

    const createdImages = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const buffer = Buffer.from(await file.arrayBuffer());

      const { filePath, thumbPath } = await processAndSaveImage(
        projectId,
        buffer,
        file.name,
        file.type,
        imageType
      );

      const image = await prisma.image.create({
        data: {
          projectId,
          filePath,
          thumbPath,
          imageType,
          caption: caption || file.name.replace(/\.[^/.]+$/, ''),
          description: description || null,
          sortOrder: existingImagesCount + i + 1
        }
      });

      createdImages.push(image);
    }

    return NextResponse.json({
      message: `Successfully uploaded ${createdImages.length} images`,
      images: createdImages
    }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
