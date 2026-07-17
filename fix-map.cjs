const fs = require('fs');
let mv = fs.readFileSync('src/pages/MapView.tsx', 'utf8');
mv = mv.replace('export function MapView(props: any) {', 'export function MapView() {');
mv = mv.replace('export function MapView({}: any) {', 'export function MapView() {');

const regex1 = /  const \{\n    activeNavId[\s\S]*?setIsJudgeMode\n  \} = useShell\(\);\n/;
const regex2 = /  const \{\n    incidents[\s\S]*?resetSimulation\n  \} = useTournament\(\);\n/;
const regex3 = /  const \{ currentTab: dashTab, setCurrentTab: setDashTab \} = useCollaboration\(\);\n/;

mv = mv.replace(regex1, '');
// MapView uses currentVenue probably? 
