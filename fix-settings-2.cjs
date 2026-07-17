const fs = require('fs');

let app = fs.readFileSync('src/App.tsx', 'utf8');
let setv = fs.readFileSync('src/pages/SettingsView.tsx', 'utf8');

const regex = /\/\/ AI Runtime simulation states[\s\S]*?setAiAudits\(\[\]\);\n    setTestExecutionResult\(null\);\n  \};\n/;

const match = app.match(regex);
if (match) {
  const code = match[0];
  app = app.replace(regex, '');
  
  const insertPos = setv.indexOf('const handleTriggerTestAIRequest');
  setv = setv.substring(0, insertPos) + code + '\n  ' + setv.substring(insertPos);
  
  fs.writeFileSync('src/App.tsx', app);
  fs.writeFileSync('src/pages/SettingsView.tsx', setv);
} else {
  console.log("No match found!");
}
