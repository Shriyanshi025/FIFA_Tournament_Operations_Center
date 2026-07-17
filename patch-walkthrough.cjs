const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

const marker = '{walkthroughStep !== null && (';
const startIndex = content.indexOf(marker);

if (startIndex !== -1) {
  let openCount = 0;
  let inBlock = false;
  let endIndex = -1;
  
  for (let i = startIndex; i < content.length; i++) {
    if (content[i] === '{') {
      openCount++;
      inBlock = true;
    } else if (content[i] === '}') {
      openCount--;
    }
    
    if (inBlock && openCount === 0) {
      endIndex = i;
      break;
    }
  }

  if (endIndex !== -1) {
    const start = content.substring(0, startIndex);
    const end = content.substring(endIndex + 1);
    const block = content.substring(startIndex, endIndex + 1);
    
    fs.writeFileSync('src/components/dashboard/WalkthroughDialog.tsx', `
import * as React from "react";
import { Sparkles } from "lucide-react";
import { Button } from "../index";

export function WalkthroughDialog({ walkthroughStep, setWalkthroughStep }: any) {
  return (
    ${block.replace(/^{walkthroughStep !== null && \(\s*/, '').replace(/\s*\)\}$/, '')}
  );
}
    `.trim());
    
    content = start + `{walkthroughStep !== null && <WalkthroughDialog walkthroughStep={walkthroughStep} setWalkthroughStep={setWalkthroughStep} />}` + end;
    
    content = content.replace('import { DashboardView }', 'import { WalkthroughDialog } from "./components/dashboard/WalkthroughDialog";\nimport { DashboardView }');
    fs.writeFileSync('src/App.tsx', content);
  }
}
