import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const AGENT_INSTRUCTION_MAP = Object.freeze([
  Object.freeze({
    source: '.agents/roles/sol.md',
    targets: Object.freeze([
      '.codex/agents/sol.toml',
      '.codex/profiles/sol-full.config.toml',
    ]),
  }),
  Object.freeze({
    source: '.agents/roles/luna.md',
    targets: Object.freeze([
      '.codex/agents/luna.toml',
      '.codex/profiles/luna-full.config.toml',
    ]),
  }),
  Object.freeze({
    source: '.agents/roles/astra.md',
    targets: Object.freeze(['.codex/profiles/astra-review.config.toml']),
  }),
]);

const INSTALLED_PROFILE_MAP = Object.freeze([
  Object.freeze({ source: '.agents/roles/sol.md', targets: Object.freeze(['sol-full.config.toml']) }),
  Object.freeze({ source: '.agents/roles/luna.md', targets: Object.freeze(['luna-full.config.toml']) }),
  Object.freeze({ source: '.agents/roles/astra.md', targets: Object.freeze(['astra-review.config.toml']) }),
]);

const DEFAULT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const GENERATED_BY = 'scripts/sync-agent-instructions.mjs';

function escapeTomlMultilineContent(value) {
  let escaped = '';

  for (let index = 0; index < value.length; index += 1) {
    const codePoint = value.codePointAt(index);
    const character = String.fromCodePoint(codePoint);

    if (codePoint > 0xffff) index += 1;

    if (character === '"') {
      escaped += '\\"';
    } else if (character === '\\') {
      escaped += '\\\\';
    } else if (character === '\n' && index === 0) {
      // TOML strips one newline immediately following the opening delimiter.
      escaped += '\\n';
    } else if (character === '\n') {
      escaped += '\n';
    } else if (character === '\r') {
      escaped += '\\r';
    } else if (character === '\t') {
      escaped += '\\t';
    } else if (character === '\b') {
      escaped += '\\b';
    } else if (character === '\f') {
      escaped += '\\f';
    } else if ((codePoint >= 0x00 && codePoint <= 0x1f) || (codePoint >= 0x7f && codePoint <= 0x9f)) {
      escaped += `\\u${codePoint.toString(16).padStart(4, '0')}`;
    } else {
      escaped += character;
    }
  }

  return `"""${escaped}"""`;
}

function skipSingleLineString(text, start, quote) {
  let cursor = start + 1;
  const isBasic = quote === '"';

  while (cursor < text.length && text[cursor] !== '\n') {
    if (isBasic && text[cursor] === '\\') {
      cursor += 2;
      continue;
    }
    if (text[cursor] === quote) return cursor + 1;
    cursor += 1;
  }

  return cursor;
}

function findMultilineClose(text, start, quote) {
  let cursor = start + 3;
  const isBasic = quote === '"';

  while (cursor < text.length) {
    if (isBasic && text[cursor] === '\\') {
      cursor += 1;
      if (text[cursor] === '\r' && text[cursor + 1] === '\n') {
        cursor += 2;
        while (cursor < text.length && /[ \t\r\n]/.test(text[cursor])) cursor += 1;
      } else if (text[cursor] === '\n' || text[cursor] === '\r') {
        cursor += 1;
        while (cursor < text.length && /[ \t\r\n]/.test(text[cursor])) cursor += 1;
      } else if (cursor < text.length) {
        cursor += 1;
      }
      continue;
    }

    if (text[cursor] === quote) {
      let runEnd = cursor + 1;
      while (text[runEnd] === quote) runEnd += 1;
      const quoteCount = runEnd - cursor;
      if (quoteCount >= 3) return runEnd - 3;
    }

    cursor += 1;
  }

  return -1;
}

function findDeveloperInstructionBlocks(tomlText, targetPath) {
  const declarations = [];
  const fieldAssignment = /^[ \t]*developer_instructions[ \t]*=/;
  let cursor = 0;
  let lineStart = 0;

  while (cursor < tomlText.length) {
    if (cursor === lineStart) {
      const lineEnd = tomlText.indexOf('\n', cursor);
      const line = tomlText.slice(cursor, lineEnd === -1 ? tomlText.length : lineEnd);
      const match = fieldAssignment.exec(line);

      if (match) {
        let valueStart = cursor + match[0].length;
        while (tomlText[valueStart] === ' ' || tomlText[valueStart] === '\t') valueStart += 1;
        const assignmentStart = cursor + (match[0].match(/^[ \t]*/) ?? [''])[0].length;
        declarations.push({
          lineStart: cursor,
          assignmentStart,
          indent: match[0].match(/^[ \t]*/)?.[0] ?? '',
          valueStart,
          isTripleBasic: tomlText.startsWith('"""', valueStart),
          closeStart: -1,
        });
      }
    }

    const character = tomlText[cursor];
    if (character === '#') {
      const newline = tomlText.indexOf('\n', cursor);
      cursor = newline === -1 ? tomlText.length : newline;
      continue;
    }

    if (character === '"' || character === "'") {
      if (tomlText.startsWith(character.repeat(3), cursor)) {
        const closeStart = findMultilineClose(tomlText, cursor, character);
        if (closeStart === -1) {
          throw new Error(`Chaîne TOML multilignes inachevée dans ${targetPath}.`);
        }

        const declaration = declarations.find((item) => item.valueStart === cursor);
        if (declaration) declaration.closeStart = closeStart;

        cursor = closeStart + 3;
        lineStart = tomlText.lastIndexOf('\n', cursor - 1) + 1;
        continue;
      }

      cursor = skipSingleLineString(tomlText, cursor, character);
      continue;
    }

    if (character === '\n') lineStart = cursor + 1;
    cursor += 1;
  }

  if (declarations.length !== 1) {
    throw new Error(
      `${targetPath} doit contenir exactement un bloc developer_instructions triple-quote; trouvé : ${declarations.length}.`,
    );
  }

  const [block] = declarations;
  if (!block.isTripleBasic || block.closeStart === -1) {
    throw new Error(`${targetPath} ne contient pas de bloc developer_instructions en chaîne triple-double-quote valide.`);
  }

  return block;
}

function isGeneratedComment(line) {
  return /^[ \t]*# Generated from \.agents\/roles\/[^ \t]+\.md by scripts\/sync-agent-instructions\.mjs\.$/.test(line);
}

function upsertGeneratedComment(text, lineStart, indent, sourcePath) {
  const comment = `${indent}# Generated from ${sourcePath} by ${GENERATED_BY}.`;

  if (lineStart > 0 && text[lineStart - 1] === '\n') {
    const previousContentEnd = text[lineStart - 2] === '\r' ? lineStart - 2 : lineStart - 1;
    const previousLineStart = text.lastIndexOf('\n', previousContentEnd - 1) + 1;
    const previousLine = text.slice(previousLineStart, previousContentEnd);

    if (isGeneratedComment(previousLine)) {
      return `${text.slice(0, previousLineStart)}${comment}${text.slice(previousContentEnd)}`;
    }
  }

  let lineEnding = '\n';
  if (lineStart > 0) {
    lineEnding = text[lineStart - 2] === '\r' ? '\r\n' : '\n';
  } else {
    const firstNewline = text.indexOf('\n');
    if (firstNewline > 0 && text[firstNewline - 1] === '\r') lineEnding = '\r\n';
  }

  return `${text.slice(0, lineStart)}${comment}${lineEnding}${text.slice(lineStart)}`;
}

export function replaceDeveloperInstructions(tomlText, markdown, targetPath, sourcePath) {
  if (typeof markdown !== 'string' || markdown.trim().length === 0) {
    throw new Error(`La source ${sourcePath} est absente ou vide.`);
  }

  const block = findDeveloperInstructionBlocks(tomlText, targetPath);
  const replacement = escapeTomlMultilineContent(markdown);
  const updated = `${tomlText.slice(0, block.valueStart)}${replacement}${tomlText.slice(block.closeStart + 3)}`;
  return upsertGeneratedComment(updated, block.lineStart, block.indent, sourcePath);
}

function readRequiredFile(root, relativePath, kind) {
  const absolutePath = resolve(root, relativePath);
  try {
    return readFileSync(absolutePath, 'utf8');
  } catch (error) {
    throw new Error(`Lecture impossible de ${kind} ${relativePath} : ${error.message}`, { cause: error });
  }
}

export function syncAgentInstructions({ root = DEFAULT_ROOT, write = false, installedRoot } = {}) {
  const resolvedRoot = resolve(root);
  const targetRoot = installedRoot === undefined ? resolvedRoot : resolve(installedRoot);
  const entries = installedRoot === undefined ? AGENT_INSTRUCTION_MAP : INSTALLED_PROFILE_MAP;
  const sourceContents = new Map();
  const plannedWrites = [];

  for (const entry of entries) {
    if (!sourceContents.has(entry.source)) {
      const source = readRequiredFile(resolvedRoot, entry.source, 'la source');
      if (source.trim().length === 0) throw new Error(`La source ${entry.source} est vide.`);
      sourceContents.set(entry.source, source);
    }

    for (const target of entry.targets) {
      const original = readRequiredFile(targetRoot, target, 'la cible');
      const updated = replaceDeveloperInstructions(original, sourceContents.get(entry.source), target, entry.source);
      if (updated !== original) {
        plannedWrites.push({
          path: installedRoot === undefined ? target : resolve(targetRoot, target),
          absolutePath: resolve(targetRoot, target),
          updated,
        });
      }
    }
  }

  if (write) {
    for (const file of plannedWrites) writeFileSync(file.absolutePath, file.updated, 'utf8');
  }

  return {
    changedFiles: plannedWrites.map(({ path }) => path),
    writtenFiles: write ? plannedWrites.map(({ path }) => path) : [],
  };
}

export function main(args = process.argv.slice(2), { root = DEFAULT_ROOT, stdout = console.log, stderr = console.error } = {}) {
  let mode = 'check';
  let modeSpecified = false;
  let installedRoot;
  let installedRootSpecified = false;
  let validArgs = true;

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === '--check' || argument === '--write') {
      if (modeSpecified) validArgs = false;
      modeSpecified = true;
      mode = argument === '--write' ? 'write' : 'check';
    } else if (argument === '--installed-root') {
      if (installedRootSpecified || !args[index + 1] || args[index + 1].startsWith('--')) {
        validArgs = false;
      } else {
        installedRootSpecified = true;
        installedRoot = args[index + 1];
        index += 1;
      }
    } else {
      validArgs = false;
    }
  }

  if (!validArgs) {
    stderr('Usage: node scripts/sync-agent-instructions.mjs [--check|--write] [--installed-root <dossier>]');
    return 2;
  }

  try {
    const result = syncAgentInstructions({ root, write: mode === 'write', installedRoot });
    if (result.changedFiles.length === 0) {
      stdout('Les developer_instructions sont synchronisées.');
      return 0;
    }

    const action = mode === 'write' ? 'Mises à jour' : 'Désynchronisées';
    stdout(`${action} : ${result.changedFiles.join(', ')}`);
    return mode === 'write' ? 0 : 1;
  } catch (error) {
    stderr(error.message);
    return 1;
  }
}

const isDirectExecution = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirectExecution) process.exitCode = main();
