const fs = require('fs');
let appContent = fs.readFileSync('src/App.tsx', 'utf8');
let setContent = fs.readFileSync('src/pages/SettingsView.tsx', 'utf8');

const stateRegex = /\/\/ AI Runtime simulation states[\s\S]*?(?=const \[isRefreshing)/;
const stateCode = appContent.match(stateRegex) ? appContent.match(stateRegex)[0] : '';
appContent = appContent.replace(stateRegex, '');

const funcRegex = /const handleTriggerTestAIRequest[\s\S]*?(?=\/\/ Toggle Operations Recommendations Panel)/;
const funcCode = appContent.match(funcRegex) ? appContent.match(funcRegex)[0] : '';
appContent = appContent.replace(funcRegex, '');

// Adjust props of SettingsView
setContent = setContent.replace('export function SettingsView({ a11yLargeText, setA11yLargeText, a11yHighContrast, setA11yHighContrast, a11yReducedMotion, setA11yReducedMotion, a11yColorblindMode, setA11yColorblindMode, aiAudits, handleClearAudits, selectedPromptId, setSelectedPromptId, selectedProviderId, setSelectedProviderId, selectedPriority, setSelectedPriority, testExecutionLoading, testExecutionResult, testExecutionError, handleTriggerTestAIRequest }: any) {',
'export function SettingsView({ a11yLargeText, setA11yLargeText, a11yHighContrast, setA11yHighContrast, a11yReducedMotion, setA11yReducedMotion, a11yColorblindMode, setA11yColorblindMode }: any) {');

const insertPos = setContent.indexOf('const { currentTab: dashTab');
setContent = setContent.substring(0, insertPos) + stateCode + '\n' + funcCode + '\n' + setContent.substring(insertPos);

// Fix App.tsx call
appContent = appContent.replace(/aiAudits=\{aiAudits\}[\s\S]*?handleTriggerTestAIRequest=\{handleTriggerTestAIRequest\}/, '');

fs.writeFileSync('src/App.tsx', appContent);
fs.writeFileSync('src/pages/SettingsView.tsx', setContent);
