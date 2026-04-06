const fs = require('fs');
const content = fs.readFileSync('d:\\growvix\\client\\src\\pages\\lead_management\\new_lead.tsx', 'utf8');
const lines = content.split('\n');
let depth = 0;
for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const opens = (line.match(/{/g) || []).length;
    const closes = (line.match(/}/g) || []).length;
    depth += opens - closes;
    console.log(`${i + 1}: [Depth ${depth}] ${line.trim()}`);
}
