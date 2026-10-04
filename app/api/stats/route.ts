import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [
      totalProjects,
      publishedProjects,
      draftProjects,
      totalScreenshots,
      totalChanges,
      totalFeatures
    ] = await Promise.all([
      prisma.project.count(),
      prisma.project.count({ where: { status: 'Published' } }),
      prisma.project.count({ where: { status: 'Draft' } }),
      prisma.image.count(),
      prisma.change.count(),
      prisma.feature.count()
    ]);

    return NextResponse.json({
      totalProjects,
      publishedProjects,
      draftProjects,
      totalScreenshots,
      totalChanges,
      totalFeatures
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
