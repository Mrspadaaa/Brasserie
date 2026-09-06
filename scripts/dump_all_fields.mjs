import fs from 'fs';
import path from 'path';

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat && stat.isDirectory()) results = results.concat(walk(full));
    else if (file.endsWith('.tsx')) results.push(full);
  }
  return results;
}

const files = walk('./src');
const allFields = [];

for (const f of files) {
  const content = fs.readFileSync(f, 'utf-8');
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('<input') || line.includes('<textarea')) {
      const slice = lines.slice(i, i + 25).join(' ');
      const m = slice.match(/<(input|textarea)\b([^>]*)/);
      if (m) {
        const tag = m[1];
        const rawAttrs = m[2];
        const typeMatch = rawAttrs.match(/type=["']([^"']+)["']/);
        const nameMatch = rawAttrs.match(/name=["']([^"']+)["']/);
        const idMatch = rawAttrs.match(/id=["']([^"']+)["']/);
        const autoMatch = rawAttrs.match(/autoComplete=["']([^"']+)["']/i);
        const typeVal = typeMatch ? typeMatch[1] : (tag === 'textarea' ? 'textarea' : 'text');
        
        if (['hidden', 'file', 'checkbox', 'radio', 'button', 'submit'].includes(typeVal)) continue;
        
        allFields.push({
          file: f,
          line: i + 1,
          tag,
          type: typeVal,
          name: nameMatch ? nameMatch[1] : '',
          id: idMatch ? idMatch[1] : '',
          autoComplete: autoMatch ? autoMatch[1] : 'NONE',
          hasFormType: rawAttrs.includes('data-form-type'),
          hasLp: rawAttrs.includes('data-lpignore'),
          has1p: rawAttrs.includes('data-1p-ignore')
        });
      }
    }
  }
}

console.log(`Total interactive text/number/search fields: ${allFields.length}`);
fs.writeFileSync('./scripts/all_fields_dump.json', JSON.stringify(allFields, null, 2));
console.log('Saved to ./scripts/all_fields_dump.json');
