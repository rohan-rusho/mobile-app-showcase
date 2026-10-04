import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';
import { ensureProjectUploadDir, getImageSubfolder, UPLOADS_ROOT } from '@/lib/image-utils';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
    }

    const { includeImages = false } = await req.json().catch(() => ({}));

    const source = await prisma.project.findUnique({
      where: { id },
      include: {
        projectCategories: true,
        changes: true,
        features: true,
        technicalDetails: true,
        images: true
      }
    });

    if (!source) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Get max sortOrder
    const maxOrder = await prisma.project.aggregate({
      _max: { sortOrder: true }
    });
    const nextOrder = (maxOrder._max.sortOrder ?? 0) + 1;

    // Next serial number
    const lastProject = await prisma.project.findFirst({
      orderBy: { id: 'desc' }
    });
    const nextNum = lastProject ? (parseInt(lastProject.serialNumber, 10) || lastProject.id) + 1 : 1;
    const nextSerial = String(nextNum).padStart(2, '0');

    // Create duplicate project
    const duplicated = await prisma.project.create({
      data: {
        serialNumber: nextSerial,
        appName: source.appName,
        title: `${source.title} (Copy)`,
        shortDescription: source.shortDescription,
        detailedDescription: source.detailedDescription,
        status: 'Draft',
        startedDate: source.startedDate,
        completedDate: source.completedDate,
        result: source.result,
        sortOrder: nextOrder,
        projectCategories: {
          create: source.projectCategories.map(pc => ({
            categoryId: pc.categoryId
          }))
        },
        changes: {
          create: source.changes.map(c => ({
            title: c.title,
            description: c.description,
            category: c.category,
            priority: c.priority,
            sortOrder: c.sortOrder
          }))
        },
        features: {
          create: source.features.map(f => ({
            title: f.title,
            description: f.description,
            sortOrder: f.sortOrder
          }))
        },
        technicalDetails: {
          create: source.technicalDetails.map(t => ({
            key: t.key,
            value: t.value,
            sortOrder: t.sortOrder
          }))
        }
      }
    });

    // If duplicate images requested, copy files on disk and create image records
    if (includeImages && source.images.length > 0) {
      for (const img of source.images) {
        const subfolder = getImageSubfolder(img.imageType);
        const targetDir = ensureProjectUploadDir(duplicated.id, img.imageType);

        // Resolve source path from uploads root
        const cleanSrc = img.filePath.replace(/^\/?(uploads\/)?/, '');
        let srcFullPath = path.resolve(UPLOADS_ROOT, cleanSrc);
        if (!fs.existsSync(srcFullPath)) {
          // Fallback legacy public
          const legacySrc = path.resolve(process.cwd(), 'public', img.filePath.replace(/^\//, ''));
          if (fs.existsSync(legacySrc)) srcFullPath = legacySrc;
        }

        if (fs.existsSync(srcFullPath)) {
          const ext = path.extname(srcFullPath);
          const newFileName = `copy_${Date.now()}_${Math.random().toString(36).substring(2, 6)}${ext}`;
          const destFullPath = path.join(targetDir, newFileName);
          fs.copyFileSync(srcFullPath, destFullPath);

          let newThumbPath = null;
          if (img.thumbPath) {
            const cleanThumb = img.thumbPath.replace(/^\/?(uploads\/)?/, '');
            let srcThumbPath = path.resolve(UPLOADS_ROOT, cleanThumb);
            if (!fs.existsSync(srcThumbPath)) {
              const legacyThumb = path.resolve(process.cwd(), 'public', img.thumbPath.replace(/^\//, ''));
              if (fs.existsSync(legacyThumb)) srcThumbPath = legacyThumb;
            }

            if (fs.existsSync(srcThumbPath)) {
              const newThumbName = `thumb_${newFileName}.webp`;
              const destThumbPath = path.join(targetDir, newThumbName);
              fs.copyFileSync(srcThumbPath, destThumbPath);
              newThumbPath = `/uploads/project-${duplicated.id}/${subfolder}/${newThumbName}`;
            }
          }

          await prisma.image.create({
            data: {
              projectId: duplicated.id,
              filePath: `/uploads/project-${duplicated.id}/${subfolder}/${newFileName}`,
              thumbPath: newThumbPath,
              imageType: img.imageType,
              caption: img.caption,
              description: img.description,
              sortOrder: img.sortOrder
            }
          });
        }
      }
    }

    return NextResponse.json(duplicated, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
