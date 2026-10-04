import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { deleteProjectFolder } from '@/lib/image-utils';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
    }

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        projectCategories: {
          include: { category: true }
        },
        changes: {
          orderBy: { sortOrder: 'asc' }
        },
        features: {
          orderBy: { sortOrder: 'asc' }
        },
        technicalDetails: {
          orderBy: { sortOrder: 'asc' }
        },
        images: {
          orderBy: { sortOrder: 'asc' }
        }
      }
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const formatted = {
      ...project,
      categories: project.projectCategories.map(pc => pc.category.name)
    };

    return NextResponse.json(formatted);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
    }

    const body = await req.json();

    // Delete existing relation items if they are being updated
    if (Array.isArray(body.changes)) {
      await prisma.change.deleteMany({ where: { projectId: id } });
    }
    if (Array.isArray(body.features)) {
      await prisma.feature.deleteMany({ where: { projectId: id } });
    }
    if (Array.isArray(body.technicalDetails)) {
      await prisma.technicalDetail.deleteMany({ where: { projectId: id } });
    }
    if (Array.isArray(body.categories)) {
      await prisma.projectCategory.deleteMany({ where: { projectId: id } });
    }

    const categoryConnectOrCreate = (body.categories || []).map((catName: string) => ({
      category: {
        connectOrCreate: {
          where: { name: catName.trim() },
          create: { name: catName.trim() }
        }
      }
    }));

    const updated = await prisma.project.update({
      where: { id },
      data: {
        serialNumber: body.serialNumber !== undefined ? body.serialNumber : undefined,
        appName: body.appName !== undefined ? body.appName.trim() : undefined,
        title: body.title !== undefined ? body.title.trim() : undefined,
        shortDescription: body.shortDescription !== undefined ? body.shortDescription : undefined,
        detailedDescription: body.detailedDescription !== undefined ? body.detailedDescription : undefined,
        status: body.status !== undefined ? body.status : undefined,
        startedDate: body.startedDate !== undefined ? body.startedDate : undefined,
        completedDate: body.completedDate !== undefined ? body.completedDate : undefined,
        result: body.result !== undefined ? body.result : undefined,
        sortOrder: body.sortOrder !== undefined ? body.sortOrder : undefined,
        ...(Array.isArray(body.categories) && {
          projectCategories: {
            create: categoryConnectOrCreate
          }
        }),
        ...(Array.isArray(body.changes) && {
          changes: {
            create: body.changes.map((ch: any, idx: number) => ({
              title: ch.title.trim(),
              description: ch.description || null,
              category: ch.category || null,
              priority: ch.priority || 'Medium',
              sortOrder: ch.sortOrder ?? idx + 1
            }))
          }
        }),
        ...(Array.isArray(body.features) && {
          features: {
            create: body.features.map((feat: any, idx: number) => ({
              title: feat.title.trim(),
              description: feat.description || null,
              sortOrder: feat.sortOrder ?? idx + 1
            }))
          }
        }),
        ...(Array.isArray(body.technicalDetails) && {
          technicalDetails: {
            create: body.technicalDetails.map((td: any, idx: number) => ({
              key: td.key.trim(),
              value: td.value.trim(),
              sortOrder: td.sortOrder ?? idx + 1
            }))
          }
        })
      },
      include: {
        projectCategories: { include: { category: true } },
        changes: { orderBy: { sortOrder: 'asc' } },
        features: { orderBy: { sortOrder: 'asc' } },
        technicalDetails: { orderBy: { sortOrder: 'asc' } },
        images: { orderBy: { sortOrder: 'asc' } }
      }
    });

    const formatted = {
      ...updated,
      categories: updated.projectCategories.map(pc => pc.category.name)
    };

    return NextResponse.json(formatted);
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
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
    }

    // Delete folder from disk
    deleteProjectFolder(id);

    // Delete from DB (Prisma CASCADE will delete changes, features, images, technicalDetails, projectCategories)
    await prisma.project.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: 'Project deleted successfully' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
