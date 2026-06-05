const fs = require('fs');
const path = require('path');

const dir = 'd:/Project/GoTicket/frontend/src';
const hexRegex = /#[0-9a-fA-F]{3,6}\b/g;
const colorCounts = {};

function scanDir(currentDir) {
  const files = fs.readdirSync(currentDir);
  for (const file of files) {
    const fullPath = path.join(currentDir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      scanDir(fullPath);
    } else if (file.endsWith('.css') || file.endsWith('.jsx') || file.endsWith('.js')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      let match;
      while ((match = hexRegex.exec(content)) !== null) {
        const color = match[0].toLowerCase();
        // standardize 3-char to 6-char
        let fullColor = color;
        if (color.length === 4) {
          fullColor = '#' + color[1]+color[1]+color[2]+color[2]+color[3]+color[3];
        }
        colorCounts[fullColor] = (colorCounts[fullColor] || 0) + 1;
      }
    }
  }
}

scanDir(dir);

const sortedColors = Object.entries(colorCounts).sort((a, b) => b[1] - a[1]);
console.log('Top 30 colors:');
for (let i = 0; i < Math.min(30, sortedColors.length); i++) {
  console.log(`${sortedColors[i][0]}: ${sortedColors[i][1]} times`);
}
