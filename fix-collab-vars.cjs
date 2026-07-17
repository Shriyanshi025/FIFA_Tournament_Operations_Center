const fs = require('fs');

const leasingPath = 'src/components/dashboard/live-collaboration/PresenceLeasingPanel.tsx';
let leasing = fs.readFileSync(leasingPath, 'utf8');

leasing = leasing.replace(
  'connectionStatus, presences, locks, isConnected, operatorId, toggleNetworkState, acquireRecordLock, releaseRecordLock',
  'connectionStatus, presences, locks, isConnected, operatorId, toggleNetworkState, acquireRecordLock, releaseRecordLock, offlineQueue, operatorName, operatorRole, currentTab, currentActivity'
);

fs.writeFileSync(leasingPath, leasing);

