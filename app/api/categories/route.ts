import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { projectCategories: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    const formatted = categories.map(c => ({
      id: c.id,
      name: c.name,
      projectCount: c._count.projectCategories
    }));

    return NextResponse.json(formatted);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
