const fs = require('fs');

let db = fs.readFileSync('src/pages/DashboardView.tsx', 'utf8');
db = `import { WeatherWidget } from "../components/dashboard/WeatherWidget";\n` + db;
fs.writeFileSync('src/pages/DashboardView.tsx', db);

let sv = fs.readFileSync('src/pages/SettingsView.tsx', 'utf8');
sv = sv.replace(/aiAudits\.map\(\(audit, idx\)/g, 'aiAudits.map((audit: AIAuditEntry, idx: number)');
fs.writeFileSync('src/pages/SettingsView.tsx', sv);

