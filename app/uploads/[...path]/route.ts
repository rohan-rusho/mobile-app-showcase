import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const MIME_MAP: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp'
};

export async function GET(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const rawSegments = params.path || [];
    const sanitizedSegments = rawSegments.map(seg => seg.replace(/[^a-zA-Z0-9_.-]/g, ''));
    const relPath = sanitizedSegments.join('/');

    const uploadsRoot = path.resolve(process.cwd(), 'uploads');
    const fullPath = path.resolve(uploadsRoot, relPath);

    // Block path traversal: target must be inside uploadsRoot
    if (!fullPath.startsWith(uploadsRoot)) {
      return new NextResponse('Access denied', { status: 403 });
    }

    let filePathToServe = fullPath;
    if (!fs.existsSync(filePathToServe)) {
      // Check legacy public/uploads location if migrating
      const legacyPath = path.resolve(process.cwd(), 'public', 'uploads', relPath);
      if (legacyPath.startsWith(path.resolve(process.cwd(), 'public', 'uploads')) && fs.existsSync(legacyPath)) {
        filePathToServe = legacyPath;
      } else {
        return new NextResponse('File not found', { status: 404 });
      }
    }

    const ext = path.extname(filePathToServe).toLowerCase();
    const contentType = MIME_MAP[ext] || 'application/octet-stream';

    const fileBuffer = fs.readFileSync(filePathToServe);

    return new NextResponse(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  } catch (err: any) {
    return new NextResponse(`Error reading file: ${err.message}`, { status: 500 });
  }
}
