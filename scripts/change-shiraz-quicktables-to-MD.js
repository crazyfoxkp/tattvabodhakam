const fs = require('fs');
const path = require('path');

// Core conversion logic
function transformText(text) {
    // 1. Convert dblock regions to Markdown tables
    const dblockRegex = /@@\.dblock(?:\.[^\r\n]+)?\r?\n([\s\S]*?)\r?\n@@/g;
    text = text.replace(dblockRegex, (match, blockContent) => {
        const lines = blockContent.split(/\r?\n/).map(l => l.trim()).filter(l => l !== '');
        if (lines.length === 0) return '';

        return lines.map((line, index) => {
            const pipeSeparated = line.replace(/¦/g, '|');
            if (index === 0) {
                return `|${pipeSeparated}|h`;
            } else {
                return `|${pipeSeparated}|`;
            }
        }).join('\n');
    });

    // 2. Remove all leftover table-csv macro lines
    const macroRegex = /<<table-csv\s+[^>]*>>/g;
    text = text.replace(macroRegex, '');

    // Clean up excessive blank lines
    text = text.replace(/\n{3,}/g, '\n\n').trim();
    return text;
}

// Helper to safely check target tag
function hasTargetTag(tiddler) {
    if (!tiddler || !tiddler.tags) return false;
    if (Array.isArray(tiddler.tags)) {
        return tiddler.tags.includes('SKS शब्दरूपाणि v2');
    }
    if (typeof tiddler.tags === 'string') {
        return tiddler.tags.includes('SKS शब्दरूपाणि v2');
    }
    return false;
}

// Helper to parse file whether object or array wrapper
function parseTiddlerFile(filePath) {
    const rawData = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(rawData);
    return { isArray: Array.isArray(parsed), data: Array.isArray(parsed) ? parsed[0] : parsed };
}

// RECURSIVE BATCH PROCESSOR
function processBatchUpdate(dirPath) {
    let updatedCount = 0;
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
            updatedCount += processBatchUpdate(fullPath);
        } else if (entry.isFile() && entry.name.endsWith('.json')) {
            try {
                const { isArray, data: tiddler } = parseTiddlerFile(fullPath);
                if (hasTargetTag(tiddler) && tiddler.text) {
                    // Apply transformation
                    tiddler.text = transformText(tiddler.text);

                    // Save back in the exact original format (array or flat object)
                    const outputData = isArray ? [tiddler] : tiddler;
                    fs.writeFileSync(fullPath, JSON.stringify(outputData, null, 2), 'utf8');
                    
                    console.log(`Updated: ${path.basename(fullPath)}`);
                    updatedCount++;
                }
            } catch (err) {
                console.error(`Error processing ${fullPath}:`, err.message);
            }
        }
    }
    return updatedCount;
}

const targetDir = path.join(__dirname, '../tiddlers'); 

console.log('--------------------------------------------------');
console.log('STARTING BATCH MIGRATION');
console.log('--------------------------------------------------');

const totalUpdated = processBatchUpdate(targetDir);

console.log('--------------------------------------------------');
console.log(`Batch complete! Successfully updated ${totalUpdated} tiddler files.`);
console.log('--------------------------------------------------');