const fs = require('fs');
let appContent = fs.readFileSync('src/App.tsx', 'utf8');
let incContent = fs.readFileSync('src/pages/IncidentsView.tsx', 'utf8');

// 1. Extract state from App.tsx
const stateRegex = /\/\/ Incident creation state[\s\S]*?(?=\/\/ AI Runtime simulation states)/;
const stateMatch = appContent.match(stateRegex);
const stateCode = stateMatch ? stateMatch[0] : '';

// 2. Extract handleCreateIncidentSubmit from App.tsx
const funcRegex = /const handleCreateIncidentSubmit[\s\S]*?(?=\/\/ Quick Action:)/;
let funcCode = appContent.match(funcRegex) ? appContent.match(funcRegex)[0] : '';
funcCode = funcCode.replace('// Quick Action:', '');

// 3. Remove them from App.tsx
appContent = appContent.replace(stateRegex, '');
appContent = appContent.replace(funcRegex, '');

// 4. Update IncidentsView component props
incContent = incContent.replace('export function IncidentsView({ newIncDesc, setNewIncDesc, newIncCategory, setNewIncCategory, newIncSeverity, setNewIncSeverity, newIncSector, setNewIncSector, newIncSection, setNewIncSection, newIncSuccessMsg, handleCreateIncidentSubmit }: any)', 'export function IncidentsView()');

// 5. Insert state and function into IncidentsView
const importMatch = incContent.match(/export function IncidentsView\(\) \{\n/);
if (importMatch) {
  incContent = incContent.replace('export function IncidentsView() {\n', 
    'export function IncidentsView() {\n' +
    '  const { createIncident } = useTournament();\n  ' + stateCode + '\n' + funcCode + '\n'
  );
}

// 6. Fix App.tsx <IncidentsView /> call
appContent = appContent.replace(/<IncidentsView\s+newIncDesc=\{newIncDesc\}[\s\S]*?handleCreateIncidentSubmit=\{handleCreateIncidentSubmit\}\s*\/>/, '<IncidentsView />');

fs.writeFileSync('src/App.tsx', appContent);
fs.writeFileSync('src/pages/IncidentsView.tsx', incContent);
