import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

// Dedicated root uploads directory outside of build/next/temp folders
export const UPLOADS_ROOT = path.resolve(process.cwd(), 'uploads');

export function getImageSubfolder(imageType: string): string {
  switch (imageType) {
    case 'OLD_UI':
      return 'old-ui';
    case 'ADDITIONAL':
      return 'additional';
    case 'NEW_UI':
    default:
      return 'new-ui';
  }
}

export function ensureProjectUploadDir(projectId: number, imageType: string = 'NEW_UI'): string {
  const subfolder = getImageSubfolder(imageType);
  const dir = path.join(UPLOADS_ROOT, `project-${projectId}`, subfolder);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

export function sanitizeFilename(originalName: string): string {
  const ext = path.extname(originalName).toLowerCase();
  const base = path.basename(originalName, ext)
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .substring(0, 50);
  const unique = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  return `${base}_${unique}${ext}`;
}

export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp'
];

export const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

export async function processAndSaveImage(
  projectId: number,
  fileBuffer: Buffer,
  originalFilename: string,
  mimeType: string,
  imageType: string = 'NEW_UI'
): Promise<{ filePath: string; thumbPath: string }> {
  const ext = path.extname(originalFilename).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext) || !ALLOWED_MIME_TYPES.includes(mimeType.toLowerCase())) {
    throw new Error('Unsupported image format. Allowed formats: JPG, JPEG, PNG, WEBP.');
  }

  const projectDir = ensureProjectUploadDir(projectId, imageType);
  const safeName = sanitizeFilename(originalFilename);
  const destPath = path.join(projectDir, safeName);

  // Path traversal check
  if (!destPath.startsWith(UPLOADS_ROOT)) {
    throw new Error('Invalid upload path');
  }

  // Write full-res original
  fs.writeFileSync(destPath, fileBuffer);

  // Generate WebP optimized thumbnail using sharp
  const subfolder = getImageSubfolder(imageType);
  const thumbName = `thumb_${path.parse(safeName).name}.webp`;
  const thumbDestPath = path.join(projectDir, thumbName);

  try {
    await sharp(fileBuffer)
      .resize({ width: 600, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(thumbDestPath);
  } catch (err) {
    console.error('Sharp thumbnail generation error:', err);
    fs.copyFileSync(destPath, thumbDestPath);
  }

  const relativeFilePath = `/uploads/project-${projectId}/${subfolder}/${safeName}`;
  const relativeThumbPath = `/uploads/project-${projectId}/${subfolder}/${thumbName}`;

  return {
    filePath: relativeFilePath,
    thumbPath: relativeThumbPath
  };
}

export function deleteImageFiles(filePath: string, thumbPath?: string | null) {
  try {
    if (filePath) {
      const cleanRel = filePath.replace(/^\/?(uploads\/)?/, '');
      const fullPath = path.resolve(UPLOADS_ROOT, cleanRel);
      if (fullPath.startsWith(UPLOADS_ROOT) && fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    }
    if (thumbPath) {
      const cleanRel = thumbPath.replace(/^\/?(uploads\/)?/, '');
      const fullThumb = path.resolve(UPLOADS_ROOT, cleanRel);
      if (fullThumb.startsWith(UPLOADS_ROOT) && fs.existsSync(fullThumb)) {
        fs.unlinkSync(fullThumb);
      }
    }
  } catch (err) {
    console.error('Error removing image files from disk:', err);
  }
}

export function deleteProjectFolder(projectId: number) {
  try {
    const dir = path.join(UPLOADS_ROOT, `project-${projectId}`);
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  } catch (err) {
    console.error(`Error deleting project folder for ${projectId}:`, err);
  }
}
