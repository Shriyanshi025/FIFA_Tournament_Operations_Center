const fs = require('fs');

let tv = fs.readFileSync('src/pages/TelemetryView.tsx', 'utf8');

tv = tv.replace(/t =>/g, '(t: any) =>');
tv = tv.replace(/g =>/g, '(g: any) =>');
tv = tv.replace(/i =>/g, '(i: any) =>');
tv = tv.replace(/\(t\)/g, '(t: any)');
tv = tv.replace(/\(g\)/g, '(g: any)');
tv = tv.replace(/\(i\)/g, '(i: any)');

fs.writeFileSync('src/pages/TelemetryView.tsx', tv);
