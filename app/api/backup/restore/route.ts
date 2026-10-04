import { NextRequest, NextResponse } from 'next/server';
import { prisma, getDatabaseFilePath } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';
import AdmZip from 'adm-zip';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No backup zip file provided' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let zip: AdmZip;
    try {
      zip = new AdmZip(buffer);
    } catch (err: any) {
      return NextResponse.json({ error: 'Invalid zip archive' }, { status: 400 });
    }

    const zipEntries = zip.getEntries();
    const dbEntry = zipEntries.find(
      entry => entry.entryName === 'showcase.db' || entry.entryName === 'data/showcase.db'
    );

    if (!dbEntry) {
      return NextResponse.json({
        error: 'Invalid backup: showcase.db not found inside the zip archive.'
      }, { status: 400 });
    }

    // Validate SQLite file header
    const dbData = dbEntry.getData();
    const sqliteHeader = dbData.slice(0, 16).toString('utf-8');
    if (!sqliteHeader.startsWith('SQLite format 3')) {
      return NextResponse.json({
        error: 'Invalid backup: showcase.db is not a valid SQLite database.'
      }, { status: 400 });
    }

    // Disconnect prisma before replacing db file
    try {
      await prisma.$disconnect();
    } catch (e) {
      console.warn('Prisma disconnect warning:', e);
    }

    const dbFilePath = getDatabaseFilePath();
    const dbDir = path.dirname(dbFilePath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    // Remove old DB and WAL/SHM files
    const baseName = path.basename(dbFilePath);
    const walFile = path.join(dbDir, `${baseName}-wal`);
    const shmFile = path.join(dbDir, `${baseName}-shm`);
    if (fs.existsSync(walFile)) fs.unlinkSync(walFile);
    if (fs.existsSync(shmFile)) fs.unlinkSync(shmFile);
    if (fs.existsSync(dbFilePath)) fs.unlinkSync(dbFilePath);

    // Write restored database
    fs.writeFileSync(dbFilePath, dbData);

    // Extract uploads if present in zip
    const uploadsRoot = path.resolve(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsRoot)) {
      fs.mkdirSync(uploadsRoot, { recursive: true });
    }

    for (const entry of zipEntries) {
      if (entry.entryName.startsWith('uploads/') && !entry.isDirectory) {
        const relPath = entry.entryName.replace(/^uploads\//, '');
        const targetPath = path.resolve(uploadsRoot, relPath);
        // Ensure path traversal safety
        if (targetPath.startsWith(uploadsRoot)) {
          const parent = path.dirname(targetPath);
          if (!fs.existsSync(parent)) {
            fs.mkdirSync(parent, { recursive: true });
          }
          fs.writeFileSync(targetPath, entry.getData());
        }
      }
    }

    // Reconnect prisma
    await prisma.$connect();

    return NextResponse.json({
      success: true,
      message: 'Backup restored successfully. Database and uploads replaced.'
    });
  } catch (err: any) {
    console.error('Backup restore error:', err);
    return NextResponse.json({ error: `Restore failed: ${err.message}` }, { status: 500 });
  }
}
