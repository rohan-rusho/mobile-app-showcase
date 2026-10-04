import { NextRequest, NextResponse } from 'next/server';
import { prisma, getDatabaseFilePath } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';
import AdmZip from 'adm-zip';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // 1. Perform SQLite WAL checkpoint so showcase.db is completely self-contained
    try {
      await prisma.$queryRawUnsafe('PRAGMA wal_checkpoint(TRUNCATE);');
    } catch (e) {
      console.warn('WAL checkpoint notice:', e);
    }

    const zip = new AdmZip();
    const dbFilePath = getDatabaseFilePath();

    if (!fs.existsSync(dbFilePath)) {
      return NextResponse.json({ error: 'Database file not found' }, { status: 404 });
    }

    // Read the db file safely
    const dbBuffer = fs.readFileSync(dbFilePath);
    zip.addFile('showcase.db', dbBuffer);

    // Add uploads folder if it exists
    const uploadsRoot = path.resolve(process.cwd(), 'uploads');
    if (fs.existsSync(uploadsRoot)) {
      zip.addLocalFolder(uploadsRoot, 'uploads');
    }

    const zipBuffer = zip.toBuffer();

    return new NextResponse(new Uint8Array(zipBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename="showcase-backup.zip"',
        'Cache-Control': 'no-store, no-cache, must-revalidate'
      }
    });
  } catch (err: any) {
    console.error('Backup download error:', err);
    return NextResponse.json({ error: `Backup failed: ${err.message}` }, { status: 500 });
  }
}
