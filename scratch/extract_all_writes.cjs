const fs = require('fs');
const path = require('path');

const logPath = 'C:\\Users\\guard\\.gemini\\antigravity\\brain\\b92fae0a-e444-4fbc-85bf-792807163e16\\.system_generated\\logs\\overview.txt';
if (!fs.existsSync(logPath)) {
  console.log('Log file does not exist');
  process.exit(1);
}

const content = fs.readFileSync(logPath, 'utf8');
const lines = content.split('\n');

const stepIndices = [310, 350, 429, 451, 467, 510, 519];

lines.forEach((line) => {
  try {
    const data = JSON.parse(line);
    if (stepIndices.includes(data.step_index)) {
      console.log(`\n--- Step ${data.step_index} (${data.created_at}) ---`);
      if (data.tool_calls) {
        data.tool_calls.forEach((tc) => {
          console.log(`Tool: ${tc.name}`);
          if (tc.args) {
            console.log(`TargetFile: ${tc.args.TargetFile || tc.args.TargetContent}`);
            if (tc.args.CodeContent) {
              console.log(`Code length: ${tc.args.CodeContent.length}`);
            }
            if (tc.args.ReplacementContent) {
              console.log(`Replacement length: ${tc.args.ReplacementContent.length}`);
            }
          }
        });
      }
    }
  } catch (e) {
    // Ignore invalid JSON lines
  }
});
