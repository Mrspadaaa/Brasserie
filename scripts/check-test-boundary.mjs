import { readFile } from 'node:fs/promises';

const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
const normalScripts = ['test', 'test:smoke:stout', 'test:smoke:hop', 'test:science', 'test:watch', 'test:coverage'];
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

console.log('✓ Suite normale limitée aux tests locaux sans appel Gemini facturable.');
