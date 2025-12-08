const fs = require('fs');
const path = require('path');

function removeConsoleLogs(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      removeConsoleLogs(filePath);
    } else if (file.endsWith('.ts') && !file.endsWith('.spec.ts')) {
      let content = fs.readFileSync(filePath, 'utf8');
      const originalContent = content;
      
      // Remove console.log, console.warn, console.error, console.info, console.debug
      // More robust pattern that handles multiline console statements
      content = content.replace(/console\.(log|warn|error|info|debug)\([^;]*\);?/g, '');
      
      // Remove empty lines left behind
      content = content.replace(/^\s*\n/gm, '\n');
      
      if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ Cleaned: ${filePath}`);
      }
    }
  });
}

console.log('🧹 Removing all console statements...');
removeConsoleLogs(path.join(__dirname, 'src', 'app'));
console.log('✅ All console statements removed!');

