import fs from 'fs';
import path from 'path';

const rootDir = process.cwd();
console.log('[Debug] Scanning root directory:', rootDir);

const outDir = path.join(rootDir, 'tiddlers', 'external');
fs.mkdirSync(outDir, { recursive: true });

const targetFolders = [
  { folder: 'TW_Audio_files', defaultType: 'audio/mpeg' },
  { folder: 'TW_image_files', defaultType: 'image/png' },
  { folder: 'TW_pdf_files', defaultType: 'application/pdf' }
];

const getMimeType = (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.mp3') return 'audio/mpeg';
  if (ext === '.wav') return 'audio/wav';
  if (ext === '.png') return 'image/png';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.pdf') return 'application/pdf';
  return 'application/octet-stream';
};

const walk = (dir) => {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(fullPath));
    } else {
      results.push(fullPath);
    }
  });
  return results;
};

let count = 0;
for (const item of targetFolders) {
  const absPath = path.join(rootDir, item.folder);
  if (!fs.existsSync(absPath)) {
    console.log(`[Debug] Folder not found: ${absPath} (skipping)`);
    continue;
  }
  console.log(`[Debug] Scanning folder: ${absPath}`);

  const files = walk(absPath);
  for (const file of files) {
    const relPath = path.relative(rootDir, file).split(path.sep).join('/');
    const mime = getMimeType(file);
    
    const tidTitle = relPath;
    const safeFilename = relPath.replace(/[/\\?%*:|"<>]/g, '__') + '.tid';
    const tidPath = path.join(outDir, safeFilename);

    const content = `title: ${tidTitle}\ntype: ${mime}\n_canonical_uri: ${relPath}\n\n`;
    fs.writeFileSync(tidPath, content, 'utf8');
    count++;
  }
}

console.log(`Generated ${count} external stub tiddlers.`);