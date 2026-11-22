#!/usr/bin/env node
/**
 * Contrôle statique TE-23 (L05) : tout nombre décimal affiché s'écrit à la virgule (suisse romande).
 *
 * Un `{valeur} L`, `${valeur} kg`, `{valeur} °C`… dont la valeur n'est ni passée par un formateur à
 * virgule, ni prouvée entière, est une écriture qui peut afficher « 25.8 L ». Le contrôle échoue alors.
 *
 * Méthode (aucun calcul n'est touché) :
 *  1. Index des formateurs : chaque fonction nommée de src/ dont le corps contient une virgule décimale
 *     (replace('.', ','), toLocaleString('fr…'), Intl.NumberFormat('fr…'), split('.').join(','), ou l'appel
 *     d'un autre formateur déjà reconnu) est un formateur « à virgule ».
 *  2. Pour chaque `{expr} unité` de src/**.ts(x) : l'expression est sûre si elle appelle un formateur à
 *     virgule, si elle est prouvée entière (Math.round sans division, .length, toFixed(0), constante entière…),
 *     ou si la ligne porte `// virgule-ok : <raison>`. `.toFixed(n)` et `String(x)` sans virgule sont des échecs.
 *  3. Hors champ : les exports texte (listés dans EXPORTS_TEXTE) gardent le point, et les valeurs d'un champ de saisie
 *     (value=, defaultValue=) ne sont pas des affichages.
 *
 * Usage : node scripts/agents/controle-virgule.mjs [--json]  → « VIRGULE OK » ou la liste (code 1).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

/**
 * Hors champ : exports texte (le brasseur les colle ailleurs, le point y reste tel quel : demande du pilote), documents
 * et fichiers générés (PDF de quittance et de facture QR, tableur, noms de fichier : le point y est un format),
 * et la page d'essai des tokens de design.
 */
export const EXPORTS_TEXTE = [
  'src/domain/recipeText.ts',
  'src/domain/recipeExportConcis.ts',
  'src/domain/recipeExport.ts',
  'src/services/receiptService.ts',
  'src/services/swissQrBill.ts',
  'src/services/driveService.ts',
  'src/services/excelService.ts',
  'src/services/financeExport.ts',
  'src/design/DesignPreview.tsx'
];

const UNITES = ['L', 'kg', 'g', '°C', '°P', '%', 'EBC', 'SG', 'mL', 'ml', 'cl', 'dl', 'mg', 'ppm', 'IBU', 'CHF'];
const UNITE_RE = UNITES.map(u => u.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
// {expr} unité — expr peut contenir une accolade imbriquée (littéral objet, gabarit).
const MOTIF = new RegExp(`\\{((?:[^{}]|\\{[^{}]*\\})*)\\}[ \\u00a0\\u202f]?(${UNITE_RE})(?![A-Za-zÀ-ÿ0-9_\\-’'])`, 'g');

const COMMA_TOKEN = /(?:replace\(\s*['"`]\.['"`]\s*,\s*['"`],['"`]\s*\)|\.split\(\s*['"`]\.['"`]\s*\)\s*\.join\(\s*['"`],['"`]\s*\)|toLocaleString\(\s*['"`]fr|NumberFormat\(\s*['"`]fr|replaceAll\(\s*['"`]\.['"`]\s*,\s*['"`],['"`])/;

export function listerSources(dossier = 'src') {
  const sortie = [];
  const aller = d => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) aller(p);
      else if (/\.(ts|tsx)$/.test(e.name) && !/\.d\.ts$/.test(e.name)) sortie.push(p);
    }
  };
  aller(path.join(RACINE, dossier));
  return sortie;
}

/** Corps approximatif d'une définition : de son nom jusqu'à la prochaine définition de même niveau (≤ 14 lignes). */
function definitions(texte) {
  const lignes = texte.split('\n');
  const defs = [];
  const re = /^\s*(?:export\s+)?(?:const|let|function)\s+([A-Za-z_$][\w$]*)\b|^\s*([A-Za-z_$][\w$]*)\s*\(.*\)\s*(?::[^={]+)?\{\s*$|^\s*([A-Za-z_$][\w$]*)\s*[:(]\s*(?:\(|function)/;
  const debuts = [];
  lignes.forEach((l, i) => {
    const m = re.exec(l);
    const nom = m && (m[1] || m[2] || m[3]);
    if (nom) debuts.push({ nom, i, indent: l.length - l.trimStart().length });
  });
  // Le corps s'arrête à la définition suivante de même niveau (ou moins indentée) : un formateur voisin
  // ne rend pas sain celui d'à côté, et un `let f` interne ne coupe pas le corps de son formateur.
  debuts.forEach((d, k) => {
    let fin = Math.min(d.i + 14, lignes.length);
    for (let j = k + 1; j < debuts.length; j++) {
      if (debuts[j].indent <= d.indent) { fin = Math.min(fin, Math.max(debuts[j].i, d.i + 1)); break; }
    }
    defs.push({ nom: d.nom, corps: lignes.slice(d.i, fin).join('\n') });
  });
  return defs;
}

/**
 * Index des formateurs. Une définition est saine si son corps a une virgule décimale ou appelle un formateur sain.
 * Un nom est sain dans un fichier si toutes ses définitions locales le sont (à défaut : toutes ses définitions de src/) :
 * un `fmt` à point d'un fichier ne se cache pas derrière le `fmt` à virgule d'un autre.
 */
export function indexerFormateurs(fichiers) {
  const defs = [];
  for (const f of fichiers) {
    for (const d of definitions(fs.readFileSync(f, 'utf8'))) {
      d.fichier = f;
      d.appels = new Set();
      // Les commentaires ne sont pas du code : « l'ancienne formule (OG - FG) » n'appelle pas `formule`.
      const code = d.corps.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');
      for (const m of code.matchAll(/([A-Za-z_$][\w$]*)\s*\(/g)) d.appels.add(m[1]);
      // `montantFr.format(x)` : le formateur est l'objet Intl, défini plus haut dans le fichier.
      for (const m of code.matchAll(/([A-Za-z_$][\w$]*)\.format\(/g)) d.appels.add(m[1]);
      d.sain = COMMA_TOKEN.test(code);
      defs.push(d);
    }
  }
  const parNom = new Map();
  for (const d of defs) { if (!parNom.has(d.nom)) parNom.set(d.nom, []); parNom.get(d.nom).push(d); }
  // Ces noms sont, par contrat, des écritures à virgule (domain/stock/regles.ts, domain/brewAssist.ts, services/units.ts).
  const CONTRAT = new Set(['nombreFr', 'roundFr', 'formatFr']);
  // Imports et réexportations : `import { nombre } from './commun'` mène au `nombre` de ce module, pas à un homonyme d'ailleurs.
  const liens = new Map();
  const lireLiens = fichier => {
    if (liens.has(fichier)) return liens.get(fichier);
    const texte = fs.readFileSync(fichier, 'utf8');
    const l = { imports: new Map(), reexports: new Map(), etoiles: [] };
    const noms = liste => liste.split(',').map(s => s.trim().replace(/^type\s+/, '')).filter(Boolean).map(s => {
      const [orig, local] = s.split(/\s+as\s+/);
      return [orig.trim(), (local || orig).trim()];
    });
    for (const m of texte.matchAll(/import\s+(?:type\s+)?\{([^}]*)\}\s*from\s*['"]([^'"]+)['"]/g)) {
      for (const [orig, local] of noms(m[1])) l.imports.set(local, { orig, spec: m[2] });
    }
    for (const m of texte.matchAll(/export\s+(?:type\s+)?\{([^}]*)\}\s*from\s*['"]([^'"]+)['"]/g)) {
      for (const [orig, local] of noms(m[1])) l.reexports.set(local, { orig, spec: m[2] });
    }
    for (const m of texte.matchAll(/export\s+\*\s+from\s*['"]([^'"]+)['"]/g)) l.etoiles.push(m[1]);
    liens.set(fichier, l);
    return l;
  };
  const resoudreModule = (spec, depuis) => {
    if (!spec.startsWith('.')) return null;
    const base = path.resolve(path.dirname(depuis), spec);
    for (const c of [base + '.ts', base + '.tsx', path.join(base, 'index.ts'), path.join(base, 'index.tsx'), base]) {
      if (fs.existsSync(c) && fs.statSync(c).isFile()) return c;
    }
    return null;
  };
  const nomSain = (nom, fichier, profondeur = 0) => {
    if (CONTRAT.has(nom)) return true;
    const toutes = parNom.get(nom);
    const locales = (toutes || []).filter(d => d.fichier === fichier);
    // Un homonyme d'une portée interne (`const fr = parId.get(…)`) ne défait pas le formateur du fichier.
    if (locales.length) return locales.some(d => d.sain);
    if (profondeur < 6) {
      const l = lireLiens(fichier);
      const lien = l.imports.get(nom) || l.reexports.get(nom);
      if (lien) {
        const cible = resoudreModule(lien.spec, fichier);
        if (cible) return nomSain(lien.orig, cible, profondeur + 1);
      }
      for (const spec of l.etoiles) {
        const cible = resoudreModule(spec, fichier);
        if (cible && (parNom.get(nom) || []).some(d => d.fichier === cible)) return nomSain(nom, cible, profondeur + 1);
      }
    }
    if (!toutes) return false;
    return toutes.every(d => d.sain);
  };
  for (let tour = 0; tour < 5; tour++) {
    let change = false;
    for (const d of defs) {
      if (d.sain) continue;
      for (const a of d.appels) {
        if (a !== d.nom && nomSain(a, d.fichier)) { d.sain = true; change = true; break; }
      }
    }
    if (!change) break;
  }
  return { defs, pour: fichier => ({ has: nom => nomSain(nom, fichier) }) };
}

const ENTIER = [
  /^\s*[\d_]+\s*$/,
  /^\s*ent\(/,
  /^\s*Math\.max\(\s*\d+\s*,\s*Math\.(?:round|floor|ceil)\((?:[^()]|\([^()]*\))*\)\s*\)\s*$/,
  /^\s*Math\.(?:round|floor|ceil|trunc)\((?:[^()]|\([^()]*\))*\)\s*$/,
  /\.length\s*$/,
  /\.toFixed\(\s*0\s*\)\s*$/,
  /^\s*(?:parseInt|Number\.parseInt)\(/,
  /^\s*\(?\s*(?:Math\.round|Math\.floor|Math\.ceil)\([^)]*\)\s*\)?\s*(?:\+|-)\s*[\d]+\s*$/
];

function appelleUnFormateur(expr, sains) {
  const re = /(?:^|[^\w$])([A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*)\s*\(/g;
  let m;
  while ((m = re.exec(expr))) {
    const chemin = m[1];
    const dernier = chemin.split('.').pop();
    if (dernier === 'format' && chemin.includes('.')) { if (sains.has(chemin.split('.')[0])) return true; continue; }
    if (sains.has(dernier) || sains.has(chemin)) return true;
    if (/^(?:Units\.format)$/.test(chemin)) return true;
  }
  // toLocaleString('fr…') / Intl.NumberFormat('fr…') écrits en ligne.
  return COMMA_TOKEN.test(expr);
}

/** Un nom déjà du texte (`texte`, `label`…) n'est pas un nombre brut : il vient d'un formateur ou d'une phrase. */
const DEJA_TEXTE = /(?:^|\.)(?:texte|text|label|libelle|message|reason)$/i;

/** `{avant} mg` où `const avant = … formatDecimal(…)` : la variable locale porte déjà le texte à virgule. */
function variableFormatee(expr, lignes, sains) {
  const tete = /^\s*([A-Za-z_$][\w$]*)(?:\.join\([^()]*\))?\s*$/.exec(expr);
  if (!tete) return false;
  const id = tete[1];
  const def = new RegExp(`(?:const|let)\\s+${id.replace(/\$/g, '\\$')}\\b[^=]*=`);
  for (let i = 0; i < lignes.length; i++) {
    if (def.test(lignes[i])) {
      // L'instruction seule : de la définition au premier `;` (4 lignes au plus), pas les lignes voisines.
      let fin = i;
      while (fin < Math.min(i + 3, lignes.length - 1) && !/;\s*$/.test(lignes[fin])) fin++;
      const bloc = lignes.slice(i, fin + 1).join('\n');
      if (appelleUnFormateur(bloc, sains)) return true;
    }
  }
  return false;
}

export function analyserFichier(rel, texte, sains) {
  const violations = [];
  const lignes = texte.split('\n');
  lignes.forEach((ligne, i) => {
    if (/virgule-ok\s*:/.test(ligne)) return;
    if (/^\s*(?:\/\/|\*|\/\*)/.test(ligne)) return;
    if (/(?:\bvalue|defaultValue)=\{[^}]*\}\s*$/.test(ligne)) return;
    MOTIF.lastIndex = 0;
    let m;
    while ((m = MOTIF.exec(ligne))) {
      const expr = m[1];
      const avant = ligne.slice(0, m.index);
      // `{x} L` doit être du texte affiché : au moins un ${ ou un >, ou une chaîne, avant. Les blocs de code `{ ... } g` sont rares.
      if (/^\s*$/.test(expr)) continue;
      // Un littéral de texte seul (`{' '} g`) n'est pas un nombre ; un chemin SVG (`M${x} ${y} L${x2}`) non plus.
      if (/^\s*(?:'[^']*'|"[^"]*"|`[^`$]*`)\s*$/.test(expr)) continue;
      if (m[2] === 'L' && (/\bM\s*\$?\{|<path|\bd=\{?[`'"]|\bd:\s*[`'"]|\bpath\b/i.test(ligne) || /\bM\s*$/.test(avant.trimEnd()))) continue;
      if (/[;]|=>|\breturn\b|\bif\s*\(|\bconst\b|\blet\b/.test(expr) && !/\$$/.test(avant)) continue;
      // `${x}%` collé, dans un style (width, left, flex…) ou une variable CSS : une mesure de mise en page, pas un affichage.
      if (m[2] === '%' && !/[   ]%/.test(m[0].slice(-3)) && /\b(?:width|height|left|right|top|bottom|translate|flex|clipPath|gradient|inset|margin|padding|offset|background|transform|style|minWidth|maxWidth)\b|--[\w-]+|\bpc\b|\bpos\b|\bpct\b/i.test(ligne)) continue;
      if (appelleUnFormateur(expr, sains)) continue;
      if (DEJA_TEXTE.test(expr.trim()) || variableFormatee(expr, lignes, sains)) continue;
      if (ENTIER.some(r => r.test(expr))) continue;
      violations.push({ fichier: rel, ligne: i + 1, expr: expr.trim(), unite: m[2], texte: ligne.trim().slice(0, 140) });
    }
  });
  return violations;
}

export function controler({ fichiers = listerSources(), exclus = EXPORTS_TEXTE } = {}) {
  const index = indexerFormateurs(fichiers);
  const tout = [];
  for (const f of fichiers) {
    const rel = path.relative(RACINE, f).split(path.sep).join('/');
    if (exclus.includes(rel)) continue;
    tout.push(...analyserFichier(rel, fs.readFileSync(f, 'utf8'), index.pour(f)));
  }
  return tout;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const v = controler();
  if (process.argv.includes('--json')) console.log(JSON.stringify(v, null, 1));
  else if (!v.length) console.log('VIRGULE OK');
  else {
    for (const x of v) console.log(`${x.fichier}:${x.ligne}  {${x.expr}} ${x.unite}`);
    console.log(`VIRGULE ÉCHEC : ${v.length} écriture(s) sans formateur à virgule`);
  }
  process.exit(v.length ? 1 : 0);
}
