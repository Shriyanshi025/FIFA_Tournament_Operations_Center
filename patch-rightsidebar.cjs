const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

// Find the definition of rightSidebarContent
const startIndex = content.indexOf('const rightSidebarContent = (');
if (startIndex !== -1) {
  let openCount = 0;
  let inBlock = false;
  let endIndex = -1;
  
  for (let i = startIndex + 'const rightSidebarContent = '.length; i < content.length; i++) {
    if (content[i] === '(') {
      openCount++;
      inBlock = true;
    } else if (content[i] === ')') {
      openCount--;
    }
    
    if (inBlock && openCount === 0) {
      // Find the next semicolon
      let j = i + 1;
      while (content[j] === ' ' || content[j] === '\n') j++;
      if (content[j] === ';') j++;
      endIndex = j;
      break;
    }
  }

  if (endIndex !== -1) {
    const start = content.substring(0, startIndex);
    const end = content.substring(endIndex);
    content = start + end;
    
    // Replace rightSidebar={rightSidebarContent} with rightSidebar={<RightSidebar />}
    content = content.replace('rightSidebar={rightSidebarContent}', 'rightSidebar={<RightSidebar />}');
    
    // Add import
    content = content.replace('import { DashboardView }', 'import { RightSidebar } from "./layout/RightSidebar";\nimport { DashboardView }');
    
    fs.writeFileSync('src/App.tsx', content);
  }
}
