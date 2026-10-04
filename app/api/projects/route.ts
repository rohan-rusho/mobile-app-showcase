import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const ProjectSchema = z.object({
  appName: z.string().min(1, 'Application Name is required'),
  title: z.string().min(1, 'Project Title is required'),
  serialNumber: z.string().optional(),
  shortDescription: z.string().optional().nullable(),
  detailedDescription: z.string().optional().nullable(),
  status: z.enum(['Draft', 'In Progress', 'Completed', 'Published', 'Archived']).default('Draft'),
  startedDate: z.string().optional().nullable(),
  completedDate: z.string().optional().nullable(),
  result: z.string().optional().nullable(),
  categories: z.array(z.string()).optional().default([]),
  changes: z.array(z.object({
    title: z.string().min(1, 'Change title is required'),
    description: z.string().optional().nullable(),
    category: z.string().optional().nullable(),
    priority: z.string().optional().nullable(),
    sortOrder: z.number().optional()
  })).optional().default([]),
  features: z.array(z.object({
    title: z.string().min(1, 'Feature title is required'),
    description: z.string().optional().nullable(),
    sortOrder: z.number().optional()
  })).optional().default([]),
  technicalDetails: z.array(z.object({
    key: z.string().min(1, 'Technical detail area is required'),
    value: z.string().min(1, 'Technical detail value is required'),
    sortOrder: z.number().optional()
  })).optional().default([])
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.trim() || '';
    const category = searchParams.get('category')?.trim() || '';
    const status = searchParams.get('status')?.trim() || '';
    const sort = searchParams.get('sort')?.trim() || 'newest';

    const where: any = {};

    if (status && status !== 'all') {
      where.status = { equals: status };
    }

    if (category && category !== 'all') {
      where.projectCategories = {
        some: {
          category: {
            name: { equals: category }
          }
        }
      };
    }

    if (search) {
      where.OR = [
        { appName: { contains: search } },
        { title: { contains: search } },
        { shortDescription: { contains: search } },
        { detailedDescription: { contains: search } },
        { changes: { some: { title: { contains: search } } } },
        { features: { some: { title: { contains: search } } } }
      ];
    }

    let orderBy: any = [{ sortOrder: 'asc' }, { createdAt: 'desc' }];
    if (sort === 'oldest') {
      orderBy = [{ createdAt: 'asc' }];
    } else if (sort === 'name' || sort === 'appName') {
      orderBy = [{ appName: 'asc' }, { title: 'asc' }];
    } else if (sort === 'serial') {
      orderBy = [{ sortOrder: 'asc' }, { serialNumber: 'asc' }];
    } else if (sort === 'recentlyUpdated') {
      orderBy = [{ updatedAt: 'desc' }];
    } else if (sort === 'custom') {
      orderBy = [{ sortOrder: 'asc' }];
    }

    const projects = await prisma.project.findMany({
      where,
      orderBy,
      include: {
        projectCategories: {
          include: { category: true }
        },
        images: {
          orderBy: { sortOrder: 'asc' }
        },
        _count: {
          select: {
            changes: true,
            features: true,
            images: true
          }
        }
      }
    });

    const formatted = projects.map(p => {
      // Find representative thumbnail (New UI first, then Additional, then Old UI)
      const thumbImg = p.images.find(img => img.imageType === 'NEW_UI') ||
                       p.images.find(img => img.imageType === 'ADDITIONAL') ||
                       p.images[0];

      return {
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
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        categories: p.projectCategories.map(pc => pc.category.name),
        changeCount: p._count.changes,
        featureCount: p._count.features,
        imageCount: p._count.images,
        thumbnailPath: thumbImg ? (thumbImg.thumbPath || thumbImg.filePath) : null
      };
    });

    return NextResponse.json(formatted);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = ProjectSchema.parse(body);

    // Compute serial number if not provided
    let serialNumber = validated.serialNumber?.trim();
    if (!serialNumber) {
      const lastProject = await prisma.project.findFirst({
        orderBy: { id: 'desc' }
      });
      const nextNum = lastProject ? (parseInt(lastProject.serialNumber, 10) || lastProject.id) + 1 : 1;
      serialNumber = String(nextNum).padStart(2, '0');
    }

    // Compute sortOrder
    const maxOrder = await prisma.project.aggregate({
      _max: { sortOrder: true }
    });
    const nextOrder = (maxOrder._max.sortOrder ?? 0) + 1;

    // Handle categories connection
    const categoryConnectOrCreate = (validated.categories || []).map(catName => ({
      category: {
        connectOrCreate: {
          where: { name: catName.trim() },
          create: { name: catName.trim() }
        }
      }
    }));

    const project = await prisma.project.create({
      data: {
        serialNumber,
        appName: validated.appName.trim(),
        title: validated.title.trim(),
        shortDescription: validated.shortDescription || null,
        detailedDescription: validated.detailedDescription || null,
        status: validated.status || 'Draft',
        startedDate: validated.startedDate || null,
        completedDate: validated.completedDate || null,
        result: validated.result || null,
        sortOrder: nextOrder,
        projectCategories: {
          create: categoryConnectOrCreate
        },
        changes: {
          create: validated.changes.map((ch, idx) => ({
            title: ch.title.trim(),
            description: ch.description || null,
            category: ch.category || null,
            priority: ch.priority || 'Medium',
            sortOrder: ch.sortOrder ?? idx + 1
          }))
        },
        features: {
          create: validated.features.map((feat, idx) => ({
            title: feat.title.trim(),
            description: feat.description || null,
            sortOrder: feat.sortOrder ?? idx + 1
          }))
        },
        technicalDetails: {
          create: validated.technicalDetails.map((td, idx) => ({
            key: td.key.trim(),
            value: td.value.trim(),
            sortOrder: td.sortOrder ?? idx + 1
          }))
        }
      },
      include: {
        projectCategories: {
          include: { category: true }
        },
        changes: true,
        features: true,
        technicalDetails: true,
        images: true
      }
    });

    return NextResponse.json(project, { status: 201 });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors.map(e => e.message).join(', ') }, { status: 400 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
