import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const files = fs.readdirSync(__dirname)
  .filter(f => f.endsWith('.test.js'))
  .sort();

let failed = 0;
for (const file of files) {
  try {
    console.log(`Running ${file}...`);
    await import(pathToFileURL(path.join(__dirname, file)));
  } catch (err) {
    console.error(`Error in ${file}:`, err);
    failed++;
  }
}

if (failed) {
  console.error(`${failed} test(s) failed.`);
  process.exit(1);
} else {
  console.log(`All ${files.length} tests passed.`);
}