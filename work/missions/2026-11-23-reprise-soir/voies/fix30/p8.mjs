import fs from 'node:fs';
import { R } from './r.mjs';

/* la table de mots : l'espace après un mot traduit n'est plus mangé ; seule la 1re lettre de la valeur prend une majuscule */
R('functions/src/lienValeurs.ts', [
  ["        if (fr && cle(essai) !== cle(fr)) { sortie.push(/^[A-ZÀ-ß]/.test(essai) && fr !== 'oui' && fr !== 'non' ? MAJ(fr) : fr); pris = n; }",
   "        if (fr && cle(essai) !== cle(fr)) {\n          /* la majuscule de la page se garde en tête de valeur seulement (« Pellets type 90 », pas « PelletsType ») ; la fin du groupe (espace, tiret) n'est pas mangée */\n          const reste = mots.slice(i, i + n).join('').match(/[- ]+$/)?.[0] ?? '';\n          sortie.push((i === 0 && /^[A-ZÀ-ß]/.test(essai) && fr !== 'oui' && fr !== 'non' ? MAJ(fr) : fr) + reste);\n          pris = n;\n        }"],
]);

/* le test T30-9 sur de vraies pages du banc */
let s = fs.readFileSync('tests/unit/carnetsFix30.test.ts', 'utf8');
const i = s.indexOf("describe('T30-9");
if (i < 0) throw new Error('T30-9 absent');
s = s.slice(0, i) + `describe('T30-9 : « N caractéristiques », sans « mesures » ni « ailleurs dans la page » seul', () => {
  const BANC = path.join(__dirname, '../../work/missions/2026-11-23-carnet-en-ligne/banc-liens/pages');
  const page = (n: number) => zlib.gunzipSync(fs.readFileSync(path.join(BANC, String(n).padStart(2, '0') + '.html.gz'))).toString('utf8');
  const reseau = (html: string): typeof fetch => (async (input: string | URL | Request) => {
    const u = String(input instanceof Request ? input.url : input);
    return u.endsWith('/robots.txt') ? new Response('', { status: 404 }) : new Response(html, { status: 200, headers: { 'content-type': 'text/html' } });
  }) as typeof fetch;
  it('galaxus : l’étape dit le nombre de caractéristiques, rien d’autre', async () => {
    const p = await lireLien('https://www.galaxus.ch/de/s2/product/kibernetik-ks240l-242-l-kuehlschrank-freistehend-49548562', { fetchPage: reseau(page(59)), maintenant: 1, cours: null });
    const d = p.etapes?.find(x => x.nom === 'caract')?.detail ?? '';
    expect(d).toMatch(/^\\d+ caractéristiques?/);
    expect(d).not.toMatch(/mesure/);
    expect(d).not.toMatch(/ailleurs dans la page$/);
  });
  it('IA : « rien de plus à lire », jamais « lite » ni « fort »', () => {
    /* le texte vit dans lienIA.ts ; il est vérifié sur la source pour ne pas appeler Gemini (jamais dans un test unitaire) */
    const src = fs.readFileSync(path.join(__dirname, '../../functions/src/lienIA.ts'), 'utf8');
    expect(src).toContain("'rien de plus à lire'");
    expect(src).not.toMatch(/\\[direct \\? 'modèle fort' : 'lite'\\]/);
  });
});
`;
s = s.replace("import { extraireProduit } from '../../functions/src/lienProduit';\n", "import { lireLien } from '../../functions/src/lireLien';\nimport fs from 'node:fs';\nimport path from 'node:path';\nimport zlib from 'node:zlib';\n");
fs.writeFileSync('tests/unit/carnetsFix30.test.ts', s);
