import * as fs from 'fs';
import * as path from 'path';
import { transformContent } from './transforms.js';

// 1. Grab the folder path from the command line.
const folderPath = process.argv[2];

if (!folderPath) {
  console.error('Usage: upgrade <folder-path>');
  process.exit(1);
}

// 2. A helper function to read all files in a folder (non-recursive).
function getMarkdownFilesInFolder(dir: string): string[] {
  return fs
    .readdirSync(dir)
    .filter((file) => file.toLowerCase().endsWith('.md'))
    .map((file) => path.join(dir, file));
}

// 3. Main function to process the files
function transformMarkdownFiles(dir: string): void {
  const mdFiles = getMarkdownFilesInFolder(dir);

  mdFiles.forEach((filePath) => {
    try {
      const content = fs.readFileSync(filePath, 'utf8');

      const newContent = transformContent(content);

      // 3c. Write the transformed content back to the file
      fs.writeFileSync(filePath, newContent, 'utf8');

      console.log(`Transformed: ${filePath}`);
    } catch (err) {
      console.error(`Error processing file ${filePath}`, err);
    }
  });
}

// 4. Invoke the transformation
try {
  // Make sure the folder exists
  if (!fs.existsSync(folderPath) || !fs.lstatSync(folderPath).isDirectory()) {
    throw new Error(`Folder does not exist or is not a directory: ${folderPath}`);
  }
  transformMarkdownFiles(folderPath);
} catch (err) {
  console.error(err);
  process.exit(1);
}
