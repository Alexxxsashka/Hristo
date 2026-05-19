const fs = require('fs');
const path = require('path');

const logPath = 'C:\\Users\\guard\\.gemini\\antigravity\\brain\\b92fae0a-e444-4fbc-85bf-792807163e16\\.system_generated\\logs\\overview.txt';
const logContent = fs.readFileSync(logPath, 'utf8');

const lines = logContent.split('\n');
let step519Line = null;

lines.forEach((line) => {
  if (line.includes('"step_index":519')) {
    step519Line = line;
  }
});

if (!step519Line) {
  console.error('Error: Could not find step 519 in the log file');
  process.exit(1);
}

const data = JSON.parse(step519Line);
const toolCall = data.tool_calls.find(tc => tc.name === 'write_to_file');
if (!toolCall) {
  console.error('Error: Could not find write_to_file tool call in step 519');
  process.exit(1);
}

const codeContent = toolCall.args.CodeContent;
const outputPath = path.resolve(__dirname, '../scratch/update_user_guide.cjs');
fs.writeFileSync(outputPath, codeContent, 'utf8');
console.log('Successfully extracted and restored scratch/update_user_guide.cjs!');
