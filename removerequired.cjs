const fs = require('fs');

function processFile(filePath) {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(/\s+required(\s|\/|>)/g, '$1');
    fs.writeFileSync(filePath, content);
}

processFile('src/components/admin/ProductForm.tsx');
processFile('src/components/admin/CategoryManager.tsx');
processFile('src/components/admin/BlogManager.tsx');
processFile('src/components/admin/PolicyManager.tsx');
processFile('src/components/admin/ERPManager.tsx');
processFile('src/pages/RegisterPage.tsx');

console.log('Removed all required attributes safely');
