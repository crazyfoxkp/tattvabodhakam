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

// 1. COUNT MATCHING FILES
function countMatchingFiles(dirPath) {
    let matchCount = 0;
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
            matchCount += countMatchingFiles(fullPath);
        } else if (entry.isFile() && entry.name.endsWith('.json')) {
            try {
                const rawData = fs.readFileSync(fullPath, 'utf8');
                const tiddler = JSON.parse(rawData);
                const tags = tiddler.tags || '';
                if (tags.includes('SKS शब्दरूपाणि v2') && tiddler.text) {
                    matchCount++;
                }
            } catch (err) {
                // Ignore parse errors on unrelated JSONs
            }
        }
    }
    return matchCount;
}

const targetDir = './tiddlers'; // Adjust if running from elsewhere
console.log('--------------------------------------------------');
console.log('1. COUNTING MATCHING FILES');
console.log('--------------------------------------------------');
try {
    const totalMatches = countMatchingFiles(targetDir);
    console.log(`Total files containing tag "SKS शब्दरूपाणि v2": ${totalMatches}`);
} catch (e) {
    console.log('Could not scan directory automatically. Ensure path is correct.');
}

console.log('\n--------------------------------------------------');
console.log('2. TESTING SPECIFIC FILE TRANSFORMATION');
console.log('--------------------------------------------------');
const testFilePath = '/Volumes/External_SSD/swiperfox/Documents/Sanskara/Tiddlywiki Content/तत्त्वबोधकम्/tiddlers/मधु test clone.json';

try {
    if (fs.existsSync(testFilePath)) {
        const fileRaw = fs.readFileSync(testFilePath, 'utf8');
        const tiddlerObj = JSON.parse(fileRaw);

        console.log(`Successfully loaded: ${path.basename(testFilePath)}`);
        console.log(`Tags present: ${tiddlerObj.tags}`);
        
        // Preview original text length
        console.log('\n--- BEFORE TRANSFORMATION ---');
        console.log(tiddlerObj.text.substring(0, 300) + '...\n');

        // Apply transformation
        const updatedText = transformText(tiddlerObj.text);

        console.log('--- AFTER TRANSFORMATION (PREVIEW) ---');
        console.log(updatedText);
        console.log('\nTest transformation completed successfully!');
    } else {
        console.error(`Test file not found at path: ${testFilePath}`);
    }
} catch (err) {
    console.error('Error processing test file:', err.message);
}