import { describe, expect, it } from 'vitest';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';

// Le front ne doit atteindre aucun module de functions/ qui importe firebase-admin :
// ce paquet n'est installé que dans functions/node_modules, et tsc (donc `npm run build`) échouerait.
const racine = resolve(__dirname, '..', '..');
const EXTENSIONS = ['.ts', '.tsx', '.d.ts', '/index.ts', '/index.tsx'];
const IMPORT = /(?:^|\n)\s*(?:import|export)\s[^'";]*?from\s*['"]([^'"]+)['"]|(?:^|\n)\s*import\s*['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)/g;

function fichiers(dossier: string): string[] {
  return readdirSync(dossier).flatMap(nom => {
    const chemin = join(dossier, nom);
    if (statSync(chemin).isDirectory()) return fichiers(chemin);
    return /\.(ts|tsx)$/.test(nom) ? [chemin] : [];
  });
}

function resoudre(depuis: string, cible: string): string | null {
  const base = resolve(dirname(depuis), cible.replace(/\.(js|jsx)$/, ''));
  for (const ext of ['', ...EXTENSIONS]) {
    const candidat = base + ext;
    if (existsSync(candidat) && statSync(candidat).isFile()) return candidat;
  }
  return null;
}

function importsDe(fichier: string): string[] {
  const source = readFileSync(fichier, 'utf8');
  return [...source.matchAll(IMPORT)].map(m => m[1] ?? m[2] ?? m[3]).filter(Boolean);
}

describe('le front n\'atteint pas firebase-admin', () => {
  it('aucun module de functions/ atteint depuis src/ n\'importe firebase-admin', () => {
    const dossierFunctions = join(racine, 'functions') ;
    const fautes: string[] = [];
    const vus = new Set<string>();
    const atteints: Array<{ module: string; chaine: string[] }> = [];

    const visiter = (fichier: string, chaine: string[]) => {
      if (vus.has(fichier)) return;
      vus.add(fichier);
      const enFunctions = fichier.startsWith(dossierFunctions);
      const ici = [...chaine, relative(racine, fichier).replace(/\\/g, '/')];
      if (enFunctions) atteints.push({ module: fichier, chaine: ici });
      for (const spec of importsDe(fichier)) {
        if (spec.startsWith('firebase-admin')) {
          if (enFunctions) fautes.push(`${ici.join(' -> ')} importe ${spec}`);
          continue;
        }
        if (!spec.startsWith('.')) continue;
        const cible = resoudre(fichier, spec);
        // On ne suit que les imports du front vers functions/, puis ceux de functions/ entre eux.
        if (cible && (enFunctions || cible.startsWith(dossierFunctions) || !cible.includes('node_modules'))) visiter(cible, ici);
      }
    };

    for (const f of fichiers(join(racine, 'src'))) visiter(f, []);
    expect(atteints.length, 'le front doit encore importer des types depuis functions/').toBeGreaterThan(0);
    expect(fautes).toEqual([]);
  });
});
