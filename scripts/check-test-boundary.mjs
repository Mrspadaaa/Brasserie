import { readFile } from 'node:fs/promises';

const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
const normalScripts = ['test', 'test:smoke:stout', 'test:smoke:hop', 'test:science', 'test:smoke:yeast', 'test:science:yeast', 'test:science:nolo', 'test:smoke:nolo', 'test:smoke:fruty', 'test:watch', 'test:coverage'];
const forbiddenCommands = [
  'eval-brewer',
  'check-brewer-persistence',
  'test:ai:',
  '--confirm-paid-ai'
];

for (const name of normalScripts) {
  const command = packageJson.scripts?.[name];
  if (typeof command !== 'string') throw new Error(`Script normal manquant : ${name}`);
  const forbidden = forbiddenCommands.find((token) => command.includes(token));
  if (forbidden) {
    throw new Error(`Le script ${name} référence un test IA facturable (${forbidden}).`);
  }
}

const vitestConfig = await readFile(new URL('../vitest.config.ts', import.meta.url), 'utf8');
const requiredScopes = [
  "tests/unit/**/*.test.{ts,tsx}",
  "tests/integration/**/*.test.{ts,tsx}",
  "tests/fuzz/**/*.test.{ts,tsx}"
];
for (const scope of requiredScopes) {
  if (!vitestConfig.includes(scope)) {
    throw new Error(`La frontière de tests locaux a disparu de Vitest : ${scope}`);
  }
}
if (vitestConfig.includes("include: ['tests/**/*.test.{ts,tsx}']")) {
  throw new Error('Vitest inclut de nouveau tous les tests, y compris les futurs tests IA réels.');
}

/** Source without its // and /* *\/ comments; string and template literals are kept intact. */
function withoutComments(source) {
  let out = '';
  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];
    if (char === '"' || char === "'" || char === '`') {
      let end = i + 1;
      while (end < source.length && source[end] !== char) end += source[end] === '\\' ? 2 : 1;
      out += source.slice(i, end + 1);
      i = end;
    } else if (char === '/' && source[i + 1] === '/') {
      while (i < source.length && source[i] !== '\n') i += 1;
      out += '\n';
    } else if (char === '/' && source[i + 1] === '*') {
      const end = source.indexOf('*/', i + 2);
      i = end < 0 ? source.length : end + 1;
    } else out += char;
  }
  return out;
}

// The normal suite must not be able to reach Gemini: its network guard is loaded and the key is emptied.
// Comments are removed first, so a commented-out entry or marker never satisfies these checks.
const activeConfig = withoutComments(vitestConfig);
const setupFiles = activeConfig.match(/setupFiles:\s*\[([^\]]*)\]/)?.[1] ?? '';
if (!setupFiles.includes("'tests/setup.gemini-guard.ts'")) {
  throw new Error('La garde réseau Gemini (tests/setup.gemini-guard.ts) a disparu des setupFiles de Vitest.');
}
if (!/GEMINI_API_KEY:\s*''/.test(activeConfig)) {
  throw new Error('Vitest ne vide plus GEMINI_API_KEY dans l’environnement des workers.');
}
const geminiGuard = withoutComments(await readFile(new URL('../tests/setup.gemini-guard.ts', import.meta.url), 'utf8').catch(() => ''));
if (!geminiGuard.includes("Symbol.for('laffinee.geminiNetworkGuard')") || !geminiGuard.includes('delete process.env.GEMINI_API_KEY')) {
  throw new Error('tests/setup.gemini-guard.ts ne bloque plus Gemini ou ne retire plus la clé.');
}

console.log('✓ Suite normale limitée aux tests locaux sans appel Gemini facturable.');
