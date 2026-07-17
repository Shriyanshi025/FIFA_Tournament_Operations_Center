const fs = require('fs');

let tv = fs.readFileSync('src/pages/TelemetryView.tsx', 'utf8');

// I'll re-import what was needed from useTournament
tv = tv.replace('export function TelemetryView() {\n', 
  'export function TelemetryView() {\n' +
  '  const { incidents, gates, matches, transportLines } = require("../context/TournamentContext").useTournament();\n'
);

fs.writeFileSync('src/pages/TelemetryView.tsx', tv);
