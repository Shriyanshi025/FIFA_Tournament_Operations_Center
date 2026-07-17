const fs = require('fs');

let tv = fs.readFileSync('src/pages/TelemetryView.tsx', 'utf8');

tv = tv.replace('require("../context/TournamentContext").useTournament()', 'useTournament()');
const importStmt = 'import { useTournament } from "../context/TournamentContext";\n';
if (!tv.includes('import { useTournament }')) {
  tv = tv.replace('import * as React from "react";\n', 'import * as React from "react";\n' + importStmt);
}

fs.writeFileSync('src/pages/TelemetryView.tsx', tv);
