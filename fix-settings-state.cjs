const fs = require('fs');

let app = fs.readFileSync('src/App.tsx', 'utf8');
let setv = fs.readFileSync('src/pages/SettingsView.tsx', 'utf8');

const stateRegex = /\/\/ AI Runtime simulation states[\s\S]*?AIAuditLayer\.getInstance\(\)\.getAllEntries\(\)\);\n  \}, \[\]\);\n/;
const match = app.match(stateRegex);

if (match) {
  app = app.replace(stateRegex, '');
  const insertPos = setv.indexOf('const handleTriggerTestAIRequest');
  setv = setv.substring(0, insertPos) + match[0] + '\n  ' + setv.substring(insertPos);
  
  fs.writeFileSync('src/App.tsx', app);
  fs.writeFileSync('src/pages/SettingsView.tsx', setv);
}
