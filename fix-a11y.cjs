const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /      \{?\/\* ========================================== \*\/\n      \{\/\* 4\. ACCESSIBILITY DYNAMIC STYLE INJECTOR   \*\/\}\n      \{\/\* ========================================== \*\/\}\n      <style>\{\`[\s\S]*?\`\}<\/style>/;

app = app.replace(regex, `      <AccessibilityStyle 
        a11yLargeText={a11yLargeText} 
        a11yHighContrast={a11yHighContrast} 
        a11yReducedMotion={a11yReducedMotion} 
        a11yColorblindMode={a11yColorblindMode} 
      />`);
      
const importStr = 'import { AccessibilityStyle } from "./components/dashboard/AccessibilityStyle";\nimport { ScenarioGuidanceDialog } from "./components/dashboard/ScenarioGuidanceDialog";';
app = app.replace('import { ScenarioGuidanceDialog } from "./components/dashboard/ScenarioGuidanceDialog";', importStr);

fs.writeFileSync('src/App.tsx', app);
