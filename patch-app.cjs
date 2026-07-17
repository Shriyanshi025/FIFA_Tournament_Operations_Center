const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

const blocks = [
  { marker: '{activeNavId === "dashboard" && (', component: '<DashboardView />' },
  { marker: '{activeNavId === "incidents" && (', component: '<IncidentsView />' },
  { marker: '{activeNavId === "map" && (', component: '<MapView />' },
  { marker: '{activeNavId === "telemetry" && (', component: '<TelemetryView />' },
  { marker: '{activeNavId === "settings" && (', component: '<SettingsView />' },
  { marker: '{activeNavId === "diagnostics" && (', component: '<DiagnosticsView />' }
];

const getBlock = (startMarker) => {
  const startIndex = content.indexOf(startMarker);
  if (startIndex === -1) return null;
  
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
  return { start: startIndex, end: endIndex + 1 };
};

// We will do replacement backwards to not mess up indices, or just replace one by one since we get the index again each time.
blocks.forEach(({ marker, component }) => {
  const res = getBlock(marker);
  if (res) {
    const start = content.substring(0, res.start);
    const end = content.substring(res.end);
    content = start + `{activeNavId === "${marker.split('"')[1]}" && (\n            ${component}\n          )}` + end;
  }
});

const importsToAdd = `
import { DashboardView } from "./pages/DashboardView";
import { IncidentsView } from "./pages/IncidentsView";
import { MapView } from "./pages/MapView";
import { TelemetryView } from "./pages/TelemetryView";
import { SettingsView } from "./pages/SettingsView";
import { DiagnosticsView } from "./pages/DiagnosticsView";
`;

content = content.replace('import { CollaborationProvider', importsToAdd + 'import { CollaborationProvider');

fs.writeFileSync('src/App.tsx', content);

