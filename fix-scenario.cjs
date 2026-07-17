const fs = require('fs');
const content = fs.readFileSync('src/App.tsx', 'utf8');

const match = content.indexOf('// Scenario Guidance State');
console.log(match > -1);
