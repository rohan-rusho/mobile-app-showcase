import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const backup = await req.json();
    if (!backup || !backup.data) {
      return NextResponse.json({ error: 'Invalid backup file structure' }, { status: 400 });
    }

    const { categories = [], projects = [] } = backup.data;

    // Reset current database records cleanly
    await prisma.technicalDetail.deleteMany();
    await prisma.image.deleteMany();
    await prisma.feature.deleteMany();
    await prisma.change.deleteMany();
    await prisma.projectCategory.deleteMany();
    await prisma.category.deleteMany();
    await prisma.project.deleteMany();

    // Import categories
    for (const c of categories) {
      await prisma.category.upsert({
        where: { id: c.id },
        update: { name: c.name },
        create: { id: c.id, name: c.name }
      });
    }

    // Import projects and nested items
    for (const p of projects) {
      await prisma.project.create({
        data: {
          id: p.id,
          serialNumber: p.serialNumber,
          appName: p.appName,
          title: p.title,
          shortDescription: p.shortDescription,
          detailedDescription: p.detailedDescription,
          status: p.status,
          startedDate: p.startedDate,
          completedDate: p.completedDate,
          result: p.result,
          sortOrder: p.sortOrder,
          createdAt: new Date(p.createdAt),
          updatedAt: new Date(p.updatedAt),
          projectCategories: {
            create: (p.projectCategories || []).map((pc: any) => ({
              categoryId: pc.categoryId
            }))
          },
          changes: {
            create: (p.changes || []).map((ch: any) => ({
              title: ch.title,
              description: ch.description,
              category: ch.category,
              priority: ch.priority,
              sortOrder: ch.sortOrder
            }))
          },
          features: {
            create: (p.features || []).map((f: any) => ({
              title: f.title,
              description: f.description,
              sortOrder: f.sortOrder
            }))
          },
          technicalDetails: {
            create: (p.technicalDetails || []).map((t: any) => ({
              key: t.key,
              value: t.value,
              sortOrder: t.sortOrder
            }))
          },
          images: {
            create: (p.images || []).map((img: any) => ({
              filePath: img.filePath,
              thumbPath: img.thumbPath,
              imageType: img.imageType,
              caption: img.caption,
              description: img.description,
              sortOrder: img.sortOrder,
              createdAt: new Date(img.createdAt)
            }))
          }
        }
      });
    }

    return NextResponse.json({ success: true, message: 'Data imported successfully' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
