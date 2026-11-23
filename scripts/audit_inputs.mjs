// Guard the actual entry primitives, not just autocomplete attributes (ignored by Android).
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import ts from 'typescript';

const root = resolve('src');
const nativeTypes = new Set(['button', 'submit', 'reset', 'hidden', 'file', 'checkbox', 'radio', 'range', 'date', 'month', 'time', 'datetime-local', 'week', 'color']);
function audit(code, file) {
  const source = ts.createSourceFile(file, code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const issues = [];
  let protectedCount = 0;
  function visit(node) {
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const tag = node.tagName.getText(source);
      const attrs = node.attributes.properties;
      const attr = name => attrs.find(a => ts.isJsxAttribute(a) && a.name.getText(source) === name);
      const string = name => {
        const init = attr(name)?.initializer;
        return init && ts.isStringLiteral(init) ? init.text : undefined;
      };
      const problem = message => issues.push(`${file}:${source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1}: ${message}`);
      if (tag === 'input' && !nativeTypes.has(string('type'))) problem('Use Input or NumberInput for typing; autocomplete=off alone does not suppress the Android accessory.');
      if (tag === 'textarea') problem('Use Textarea for multiline entry.');
      if (tag === 'form' && string('autoComplete') !== 'off') problem('Set autoComplete="off" on the form.');
      if (attr('contentEditable')) problem('Use the native protected Input; contenteditable does not preserve native field behavior.');
      if (tag === 'Command.Input') {
        const child = ts.isJsxOpeningElement(node) && node.parent.children.some(c => (ts.isJsxElement(c) ? c.openingElement : c).tagName?.getText(source) === 'Input');
        if (!attr('asChild') || !child) problem('Command.Input must delegate to Input using asChild.');
      }
      if (['Input', 'Textarea', 'TextInput', 'NumberInput', 'NumericField', 'MoneyField', 'QuantityStepper'].includes(tag)) protectedCount++;
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
  return { issues, protectedCount };
}

// Positive and negative controls keep an empty scan or a weakened rule from passing.
assert(audit('<input autoComplete="off" />', 'control.tsx').issues.length);
assert(audit('<input type="search" autoComplete="off" />', 'control.tsx').issues.length);
assert(audit('<textarea autoComplete="off" />', 'control.tsx').issues.length);
assert(audit('<input type={kind} />', 'control.tsx').issues.length);
assert(audit('<Command.Input />', 'control.tsx').issues.length);
assert(audit('<div contentEditable="plaintext-only" />', 'control.tsx').issues.length);
assert.equal(audit('<><Input /><Textarea /><input type="date" /><Command.Input asChild><Input /></Command.Input></>', 'control.tsx').issues.length, 0);

const issues = [];
let files = 0, protectedCount = 0;
function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const file = join(dir, entry.name);
    if (entry.isDirectory()) { walk(file); continue; }
    if (!file.endsWith('.tsx')) continue;
    const name = relative(root, file).replaceAll('\\', '/');
    // The only implementation of the native typing elements; tested in inputProtection.test.tsx.
    if (name === 'ui/Input.tsx') continue;
    const result = audit(readFileSync(file, 'utf8'), name);
    files++; protectedCount += result.protectedCount; issues.push(...result.issues);
  }
}
walk(root);
assert(files > 0 && protectedCount > 0, 'The source scan must include real fields.');
if (issues.length) { console.error(issues.join('\n')); process.exitCode = 1; }
else console.log(`INPUT PROTECTION AUDIT PASSED: ${protectedCount} protected usages in ${files} files; negative controls passed. Android native UI still requires device verification.`);
