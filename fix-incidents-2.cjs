const fs = require('fs');

let inc = fs.readFileSync('src/pages/IncidentsView.tsx', 'utf8');

const func = `
  const handleCreateIncidentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIncDesc.trim()) return;

    try {
      await createIncident({
        description: newIncDesc,
        category: newIncCategory as any,
        severity: newIncSeverity as any,
        sector: newIncSector,
        section: newIncSection,
        stadiumId: "V-LUSAIL"
      });
      setNewIncDesc("");
      setNewIncSuccessMsg("Incident successfully dispatched to field stewards.");
      setTimeout(() => setNewIncSuccessMsg(""), 4000);
    } catch (err) {
      console.error(err);
    }
  };
`;

inc = inc.replace('const { createIncident } = useTournament();', '');
inc = inc.replace('const [newIncSuccessMsg, setNewIncSuccessMsg] = React.useState("");', 'const [newIncSuccessMsg, setNewIncSuccessMsg] = React.useState("");\n' + func);
fs.writeFileSync('src/pages/IncidentsView.tsx', inc);

let app = fs.readFileSync('src/App.tsx', 'utf8');
const funcRegex = /const handleCreateIncidentSubmit[\s\S]*?console\.error\(err\);\n    \}\n  \};\n/;
app = app.replace(funcRegex, '');
app = app.replace('import { ScenarioGuidanceDialog } from "./components/dashboard/ScenarioGuidanceDialog";\nimport { ScenarioGuidanceDialog } from "./components/dashboard/ScenarioGuidanceDialog";', 'import { ScenarioGuidanceDialog } from "./components/dashboard/ScenarioGuidanceDialog";');
fs.writeFileSync('src/App.tsx', app);
