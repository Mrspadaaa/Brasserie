import fs from 'fs';
import path from 'path';

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat && stat.isDirectory()) results = results.concat(walk(full));
    else if (file.endsWith('.tsx') || file.endsWith('.html')) results.push(full);
  }
  return results;
}

function stripComments(code) {
  return code
    .replace(/\/\*[\s\S]*?\*\//g, (match) => ' '.repeat(match.length))
    .replace(/\/\/.*/g, (match) => ' '.repeat(match.length));
}

function extractTags(content) {
  const results = [];
  const tagRegex = /<(input|textarea)\b/g;
  let match;
  while ((match = tagRegex.exec(content)) !== null) {
    const startIndex = match.index;
    let index = match.index + match[0].length;
    let braceDepth = 0;
    let inQuote = null;
    let tagContent = '';
    
    while (index < content.length) {
      const char = content[index];
      if (inQuote) {
        if (char === inQuote && content[index - 1] !== '\\') {
          inQuote = null;
        }
      } else if (char === '"' || char === "'" || char === '`') {
        inQuote = char;
      } else if (char === '{') {
        braceDepth++;
      } else if (char === '}') {
        if (braceDepth > 0) braceDepth--;
      } else if (char === '>' && braceDepth === 0) {
        break;
      }
      tagContent += char;
      index++;
    }
    results.push({
      tagType: match[1],
      attrs: tagContent,
      index: startIndex
    });
  }
  return results;
}

const files = walk('./src');
let count = 0;
const issues = [];

for (const f of files) {
  const rawContent = fs.readFileSync(f, 'utf-8');
  const cleanContent = stripComments(rawContent);

  const tags = extractTags(cleanContent);
  for (const item of tags) {
    count++;
    const tagType = item.tagType;
    const attrs = item.attrs;
    const hasType = attrs.match(/type=["']([^"']+)["']/);
    const typeVal = hasType ? hasType[1] : (tagType === 'textarea' ? 'textarea' : 'text');
    if (['hidden', 'file', 'checkbox', 'radio', 'button', 'submit'].includes(typeVal)) continue;

    const hasSpread = attrs.includes('noAutofillProps');
    const autoMatch = attrs.match(/(?:^|\s)autoComplete=["']([^"']+)["']/i);
    const autoVal = autoMatch ? autoMatch[1] : (hasSpread ? 'off' : '');

    const hasFormType = attrs.includes('data-form-type="other"') || hasSpread;
    const hasLp = attrs.includes('data-lpignore="true"') || hasSpread;
    const has1p = attrs.includes('data-1p-ignore="true"') || hasSpread;
    const hasBw = attrs.includes('data-bwignore="true"') || hasSpread;

    const hasName = attrs.match(/name=["']([^"']+)["']/);
    const hasId = attrs.match(/id=["']([^"']+)["']/);

    const nameVal = hasName ? hasName[1] : '';
    const idVal = hasId ? hasId[1] : '';

    const problems = [];
    if (autoVal !== 'off') problems.push(`autoComplete(${autoVal || 'missing'})`);
    if (!hasFormType) problems.push('missing-data-form-type');
    if (!hasLp) problems.push('missing-data-lpignore');
    if (!has1p) problems.push('missing-data-1p-ignore');
    if (!hasBw) problems.push('missing-data-bwignore');

    if (typeVal === 'email') problems.push('forbidden-type(email)');
    if (typeVal === 'tel') problems.push('forbidden-type(tel)');
    if (typeVal === 'password') problems.push('forbidden-type(password)');

    // Check for unconditional autoFocus (causes virtual keyboard to pop up on mobile)
    const autoFocusMatch = attrs.match(/\bautoFocus(?:=\{([^}]+)\})?/);
    if (autoFocusMatch) {
      const expr = autoFocusMatch[1];
      if (!expr || !expr.includes('coarse')) {
        problems.push('unconditional-autoFocus-on-mobile');
      }
    }

    // Check if name or id triggers password / location / contact / credit card heuristics
    const triggerMatch = (nameVal + ' ' + idVal).match(/pass|user|email|phone|addr|card|iban|pin|account|login|cred|secret|money|\bname\b|\bnom\b/i);
    if (triggerMatch) {
      problems.push(`trigger-word(${triggerMatch[0]})`);
    }

    if (problems.length > 0) {
      const lineNum = cleanContent.slice(0, item.index).split('\n').length;
      issues.push({
        file: f,
        line: lineNum,
        tag: tagType,
        type: typeVal,
        name: nameVal,
        id: idVal,
        problems
      });
    }
  }
}

console.log(`Audited ${count} inputs/textareas across codebase.`);
console.log(`Found ${issues.length} potential issues:\n`);
issues.forEach(iss => {
  console.log(`${iss.file}:${iss.line} <${iss.tag} type="${iss.type}" name="${iss.name}" id="${iss.id}"> => ${iss.problems.join(', ')}`);
});

if (issues.length === 0) {
  console.log('✅ 100% CLEAN: ALL INPUTS PROTECTED AGAINST GBOARD AUTOFILL & PASSWORD MANAGERS!');
  process.exit(0);
} else {
  process.exit(1);
}
