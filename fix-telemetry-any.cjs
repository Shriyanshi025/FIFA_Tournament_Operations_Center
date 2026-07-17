const fs = require('fs');
let tv = fs.readFileSync('src/pages/TelemetryView.tsx', 'utf8');

tv = tv.replace(/t: any/g, 't: transportLine'); // wait, I don't know the exact interface
tv = tv.replace(/g: any/g, 'g: { waitTimeMinutes: number; currentFlowRate: number }');
tv = tv.replace(/i: any/g, 'i: { category: string; status: string }');

fs.writeFileSync('src/pages/TelemetryView.tsx', tv);
