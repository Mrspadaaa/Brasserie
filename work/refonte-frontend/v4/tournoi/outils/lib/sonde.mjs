#!/usr/bin/env node
// Sonde HTTP synchrone pour lib/cible.mjs : `node sonde.mjs <existe|lire> <adresse>`.
// existe → imprime « 1 » (réponse 2xx) ou « 0 » ; lire → imprime le corps (code 1 si la réponse n'est pas 2xx).
const [mode, adresse] = process.argv.slice(2);
try {
  const r = await fetch(adresse, { method: mode === 'existe' ? 'HEAD' : 'GET' });
  if (mode === 'existe') { process.stdout.write(r.ok ? '1' : '0'); process.exit(0); }
  if (!r.ok) process.exit(1);
  process.stdout.write(await r.text());
} catch {
  if (mode === 'existe') process.stdout.write('0');
  process.exit(mode === 'existe' ? 0 : 1);
}
