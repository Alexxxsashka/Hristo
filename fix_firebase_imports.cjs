const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir('./src', function(filePath) {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('firebaseService')) {
      let newContent = content.replace(/firebaseService/g, 'databaseService');

      newContent = newContent.replace(/from\s+['\"](.*)firebaseService['\"]/g, `from '$1databaseService'`);

      if (newContent !== content) {
        fs.writeFileSync(filePath, newContent);
        console.log('Fixed', filePath);
      }
    }
  }
});
