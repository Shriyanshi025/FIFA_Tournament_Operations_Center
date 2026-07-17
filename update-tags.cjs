const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(/<DashboardView \/>/g, `
            <DashboardView 
              formatSimTime={formatSimTime} 
              setWalkthroughStep={setWalkthroughStep}
              selectedScenarioId={selectedScenarioId}
              setSelectedScenarioId={setSelectedScenarioId}
            />`);

content = content.replace(/<IncidentsView \/>/g, `
            <IncidentsView
              newIncDesc={newIncDesc}
              setNewIncDesc={setNewIncDesc}
              newIncCategory={newIncCategory}
              setNewIncCategory={setNewIncCategory}
              newIncSeverity={newIncSeverity}
              setNewIncSeverity={setNewIncSeverity}
              newIncSector={newIncSector}
              setNewIncSector={setNewIncSector}
              newIncSection={newIncSection}
              setNewIncSection={setNewIncSection}
              newIncSuccessMsg={newIncSuccessMsg}
              handleCreateIncidentSubmit={handleCreateIncidentSubmit}
            />`);

content = content.replace(/<SettingsView \/>/g, `
            <SettingsView
              a11yLargeText={a11yLargeText}
              setA11yLargeText={setA11yLargeText}
              a11yHighContrast={a11yHighContrast}
              setA11yHighContrast={setA11yHighContrast}
              a11yReducedMotion={a11yReducedMotion}
              setA11yReducedMotion={setA11yReducedMotion}
              a11yColorblindMode={a11yColorblindMode}
              setA11yColorblindMode={setA11yColorblindMode}
              aiAudits={aiAudits}
              handleClearAudits={handleClearAudits}
              selectedPromptId={selectedPromptId}
              setSelectedPromptId={setSelectedPromptId}
              selectedProviderId={selectedProviderId}
              setSelectedProviderId={setSelectedProviderId}
              selectedPriority={selectedPriority}
              setSelectedPriority={setSelectedPriority}
              testExecutionLoading={testExecutionLoading}
              testExecutionResult={testExecutionResult}
              testExecutionError={testExecutionError}
              handleTriggerTestAIRequest={handleTriggerTestAIRequest}
            />`);

fs.writeFileSync('src/App.tsx', content);
