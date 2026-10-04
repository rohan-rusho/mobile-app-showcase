import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      include: {
        projectCategories: { include: { category: true } },
        changes: true,
        features: true,
        technicalDetails: true,
        images: true
      },
      orderBy: { sortOrder: 'asc' }
    });

    const categories = await prisma.category.findMany();

    const backup = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      data: {
        categories,
        projects
      }
    };

    return new NextResponse(JSON.stringify(backup, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="showcase-backup-${Date.now()}.json"`
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
