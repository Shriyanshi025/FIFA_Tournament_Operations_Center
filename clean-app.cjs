const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

// Replace {(() => { ... return (<div ... )})()} with <ScenarioGuidanceDialog />
// Let's use a regex or string replacement.
const scenStart = content.indexOf('{/* 2. DYNAMIC SCENARIO GUIDANCE CARD          */}');
if (scenStart !== -1) {
  const nextSection = content.indexOf('{/* 6. INTERACTIVE OPERATOR TOUR WIZARD        */}');
  if (nextSection !== -1) {
    const before = content.substring(0, scenStart);
    const after = content.substring(nextSection);
    content = before + '{/* 2. DYNAMIC SCENARIO GUIDANCE CARD          */}\n      <ScenarioGuidanceDialog />\n      {/* ========================================== */}\n      ' + after;
  }
}

// Remove the Scenario Guidance State and Effect
content = content.replace(/\/\/ Scenario Guidance State[\s\S]*?(?=\/\/ Incident creation state)/, '');

// Import ScenarioGuidanceDialog
content = content.replace('import { WalkthroughDialog }', 'import { ScenarioGuidanceDialog } from "./components/dashboard/ScenarioGuidanceDialog";\nimport { WalkthroughDialog }');

fs.writeFileSync('src/App.tsx', content);
