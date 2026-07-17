const fs = require('fs');
const content = fs.readFileSync('src/App.tsx', 'utf8');

const getBlock = (startMarker) => {
  const startIndex = content.indexOf(startMarker);
  if (startIndex === -1) return null;
  
  let openCount = 0;
  let inBlock = false;
  let endIndex = -1;
  
  for (let i = startIndex; i < content.length; i++) {
    if (content[i] === '{') {
      openCount++;
      inBlock = true;
    } else if (content[i] === '}') {
      openCount--;
    }
    
    if (inBlock && openCount === 0) {
      endIndex = i;
      break;
    }
  }
  return { start: startIndex, end: endIndex + 1 };
};

const markers = [
  '{activeNavId === "dashboard" && (',
  '{activeNavId === "incidents" && (',
  '{activeNavId === "map" && (',
  '{activeNavId === "telemetry" && (',
  '{activeNavId === "settings" && (',
  '{activeNavId === "diagnostics" && ('
];

markers.forEach(marker => {
  const res = getBlock(marker);
  if (res) {
    const block = content.substring(res.start, res.end);
    console.log(`Found block for ${marker.split('"')[1]}: ${block.split('\n').length} lines`);
    fs.writeFileSync(`block-${marker.split('"')[1]}.tsx`, block);
  }
});
