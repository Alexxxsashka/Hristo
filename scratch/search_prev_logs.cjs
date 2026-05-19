const fs = require('fs');
const path = require('path');

const logPath = 'C:\\Users\\guard\\.gemini\\antigravity\\brain\\b92fae0a-e444-4fbc-85bf-792807163e16\\.system_generated\\logs\\overview.txt';
if (!fs.existsSync(logPath)) {
  console.log('Log file does not exist');
  process.exit(1);
}

const content = fs.readFileSync(logPath, 'utf8');
const lines = content.split('\n');

console.log('Total log lines:', lines.length);

lines.forEach((line, index) => {
  if (line.includes('DIPLOMA_FULL_TEXT_EXPANDED') || line.includes('write_to_file') || line.includes('replace_file_content')) {
    console.log(`Line ${index + 1}: ${line.substring(0, 150)}`);
  }
});
