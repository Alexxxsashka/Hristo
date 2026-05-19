const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../DIPLOMA_FULL_TEXT_EXPANDED.md');
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split(/\r?\n/);
lines.forEach((line, index) => {
  if (line.trim().startsWith('### 3.3') || line.trim().startsWith('### 3.4') || line.trim().startsWith('### 3.5')) {
    console.log(`Line ${index + 1}: "${line}"`);
  }
});
