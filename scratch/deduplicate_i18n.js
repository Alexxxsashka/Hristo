import fs from 'fs';
import path from 'path';

const deduplicateJson = (filePath) => {
  const content = fs.readFileSync(filePath, 'utf8');
  // JSON.parse automatically keeps only the last occurrence of a key
  try {
    const obj = JSON.parse(content);
    const cleanContent = JSON.stringify(obj, null, 2);
    fs.writeFileSync(filePath, cleanContent, 'utf8');
    console.log(`Deduplicated: ${filePath}`);
  } catch (e) {
    console.error(`Error parsing ${filePath}:`, e);
  }
};

const enPath = 'c:/Users/Stafford/Desktop/Diplome/Hristo/src/i18n/en.json';
const hrPath = 'c:/Users/Stafford/Desktop/Diplome/Hristo/src/i18n/hr.json';

deduplicateJson(enPath);
deduplicateJson(hrPath);
