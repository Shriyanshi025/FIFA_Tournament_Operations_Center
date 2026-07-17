const fs = require('fs');

let app = fs.readFileSync('src/App.tsx', 'utf8');
let setv = fs.readFileSync('src/pages/SettingsView.tsx', 'utf8');

const regex = /  \/\/ Quick Action: Simulate refreshing workspace indicators\n  const handleRefreshWorkspace = async \(\) => \{\n    setIsRefreshing\(true\);\n    await reloadAllState\(\);\n    setTimeout\(\(\) => setIsRefreshing\(false\), 800\);\n  \};\n/;

setv = setv.replace(regex, '');

const insertPos = app.indexOf('  // Toggle Operations Recommendations Panel');
app = app.substring(0, insertPos) + '  // Quick Action: Simulate refreshing workspace indicators\n  const handleRefreshWorkspace = async () => {\n    setIsRefreshing(true);\n    await reloadAllState();\n    setTimeout(() => setIsRefreshing(false), 800);\n  };\n\n' + app.substring(insertPos);

fs.writeFileSync('src/App.tsx', app);
fs.writeFileSync('src/pages/SettingsView.tsx', setv);
