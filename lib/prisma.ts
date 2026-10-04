import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';

const globalForPrisma = global as unknown as { prisma: PrismaClient; dbInitialized: boolean };

// Ensure data and uploads directories exist in project root
const dataDir = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const uploadsDir = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Compute the database file path
export function getDatabaseFilePath(): string {
  const envUrl = process.env.DATABASE_URL || 'file:./data/showcase.db';
  if (envUrl.startsWith('file:')) {
    const rawPath = envUrl.slice(5);
    if (path.isAbsolute(rawPath)) {
      return rawPath;
    }
    const normalized = rawPath.replace(/^(\.\/|\.\.\/)+/, '');
    return path.resolve(process.cwd(), normalized);
  }
  return path.resolve(dataDir, 'showcase.db');
}

export function getDatabaseUrl(): string {
  const dbPath = getDatabaseFilePath();
  return `file:${dbPath.replace(/\\/g, '/')}`;
}

// Ensure database and tables exist on startup if file does not exist
function ensureDatabaseInitialized() {
  if (globalForPrisma.dbInitialized) return;

  const dbPath = getDatabaseFilePath();
  if (!fs.existsSync(dbPath)) {
    try {
      console.log(`[Database] Initializing new SQLite database at ${dbPath}...`);
      execSync('npx prisma migrate deploy', {
        cwd: process.cwd(),
        env: { ...process.env, DATABASE_URL: getDatabaseUrl() },
        stdio: 'inherit'
      });
    } catch (err) {
      console.error('[Database] Failed to deploy migrations:', err);
    }
  }

  globalForPrisma.dbInitialized = true;
}

ensureDatabaseInitialized();

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: getDatabaseUrl()
      }
    },
    log: ['error']
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
