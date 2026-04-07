const fs = require('fs');
const content = fs.readFileSync('d:\\growvix\\client\\src\\pages\\lead_management\\new_lead.tsx', 'utf8');
let braceCount = 0;
let parenCount = 0;
let bracketCount = 0;

for (let i = 0; i < content.length; i++) {
    const char = content[i];
    if (char === '{') braceCount++;
    else if (char === '}') braceCount--;
    else if (char === '(') parenCount++;
    else if (char === ')') parenCount--;
    else if (char === '[') bracketCount++;
    else if (char === ']') bracketCount--;

    if (braceCount < 0) console.log('Extra } at index ' + i);
    if (parenCount < 0) console.log('Extra ) at index ' + i);
    if (bracketCount < 0) console.log('Extra ] at index ' + i);
}

console.log('Final counts - Braces: ' + braceCount + ', Parens: ' + parenCount + ', Brackets: ' + bracketCount);
