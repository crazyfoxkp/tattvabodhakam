import fs from 'fs';
import path from 'path';

const rootDir = process.cwd();
const outDir = path.join(rootDir, 'tiddlers', 'external');
fs.mkdirSync(outDir, { recursive: true });

const targetFolders = [
  path.join('files', 'TW_Audio_files'),
  path.join('files', 'TW_image_files'),
  path.join('files', 'TW_pdf_files')
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
  if (!fs.existsSync(dir)) return results;
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

const safeCharRegex = new RegExp('[/\\\\?%*:|"<>]', 'g');

let count = 0;
for (const relFolder of targetFolders) {
  const absPath = path.join(rootDir, relFolder);
  if (!fs.existsSync(absPath)) continue;

  const files = walk(absPath);
  for (const file of files) {
    const relPath = path.relative(rootDir, file).split(path.sep).join('/'); // files/TW_Audio_files/...
    const mime = getMimeType(file);
    
    const tidTitle = relPath;
    const safeFilename = relPath.replace(safeCharRegex, '__') + '.tid';
    const tidPath = path.join(outDir, safeFilename);

    const content = `title: ${tidTitle}\ntype: ${mime}\n_canonical_uri: ${relPath}\n\n`;
    fs.writeFileSync(tidPath, content, 'utf8');
    count++;
  }
}

console.log(`Generated ${count} external stub tiddlers.`);