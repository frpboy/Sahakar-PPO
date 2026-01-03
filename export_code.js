const fs = require('fs');
const path = require('path');

const rootDir = process.cwd();
const outputFile = path.join(rootDir, 'all_project_code.txt');

const ignoreDirs = ['node_modules', '.next', 'dist', 'build', '.git', '.gemini', 'coverage', '.turbo'];
// Extensions to strictly include. 
const includeExts = ['.ts', '.tsx', '.js', '.jsx', '.json', '.css', '.md', '.yml', '.yaml', '.prisma'];
// Specific filenames to include even if extension doesn't match
const includeFiles = ['.env', '.gitignore', '.dockerignore', 'Dockerfile', 'LICENSE'];

function shouldInclude(file) {
    const ext = path.extname(file);
    const basename = path.basename(file);

    if (includeExts.includes(ext)) return true;
    if (includeFiles.includes(basename)) return true;

    return false;
}

function getAllFiles(dirPath, arrayOfFiles) {
    const files = fs.readdirSync(dirPath);

    arrayOfFiles = arrayOfFiles || [];

    files.forEach(function (file) {
        const fullPath = path.join(dirPath, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (!ignoreDirs.includes(file)) {
                arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
            }
        } else {
            if (shouldInclude(fullPath) && fullPath !== outputFile && !fullPath.includes('package-lock.json')) {
                arrayOfFiles.push(fullPath);
            }
        }
    });

    return arrayOfFiles;
}

console.log('Scanning files...');
const allFiles = getAllFiles(rootDir);
console.log(`Found ${allFiles.length} files. Writing to ${outputFile}...`);

let outputContent = `PROJECT CODE EXPORT
Date: ${new Date().toISOString()}
Total Files: ${allFiles.length}

`;

allFiles.forEach(file => {
    try {
        const content = fs.readFileSync(file, 'utf8');
        const relativePath = path.relative(rootDir, file);
        outputContent += `\n\n================================================================\nFile: ${relativePath}\n================================================================\n\n`;
        outputContent += content;
    } catch (err) {
        console.error(`Error reading ${file}: ${err.message}`);
    }
});

fs.writeFileSync(outputFile, outputContent);
console.log('Export complete.');
