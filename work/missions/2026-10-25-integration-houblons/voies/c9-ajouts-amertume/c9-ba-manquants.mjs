// Voie c9, point 3 : combien des 435 houblons de Beer Analytics manquent vraiment au catalogue (base + ajouts) ?
// Lancement (depuis la racine) : node work/missions/2026-10-25-integration-houblons/voies/c9-ajouts-amertume/c9-ba-manquants.mjs
// Lit src/data/hopV4/{proto-data,catalogue-ajouts}.json, alias-noms.json et scripts/collecte-hop/c9-recettes-ba.json ; écrit ba-manquants.md ici. Déterministe.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const ICI = dirname(fileURLToPath(import.meta.url));
const R = resolve(ICI, '../../../../..');
const { indexer, resoudreNom, lireTable, norm } = await import(`file:///${R.replace(/\\/g, '/')}/src/data/hopV4/rattachement.mjs`);
const lire = (p) => JSON.parse(readFileSync(resolve(R, p), 'utf8'));
const table = lireTable();
const proto = lire('src/data/hopV4/proto-data.json').varieties.filter((v) => v.id.startsWith('beermaverick-') && !table.idsFusionnes[v.id]);
const ajouts = lire('src/data/hopV4/catalogue-ajouts.json').varieties;
const ba = lire('scripts/collecte-hop/c9-recettes-ba.json');
const index = indexer(proto);
const PRODUIT = /pink boots|blend|veterans|density|exp \d/i;
const g = { base: [], ajout: [], confirmer: [], produit: [], manque: [] };
for (const f of ba) {
  const r = resoudreNom(f.nom, index, table);
  if (r.id) { g.base.push(f); continue; }
  if (r.statut === 'aconfirmer') { g.confirmer.push([f, r.raison]); continue; }
  if (r.statut === 'forme' || PRODUIT.test(f.nom)) { g.produit.push(f); continue; }
  const a = ajouts.find((x) => norm(x.name) === norm(f.nom) || x.aliases.some((y) => norm(y) === norm(f.nom)));
  if (a) g.ajout.push(f); else g.manque.push(f);
}
const ligne = (f) => `| ${f.nom} | ${f.recettes ?? '?'} | ${f.alpha ? `${f.alpha.plage[0]}–${f.alpha.plage[1]} (milieu ${f.alpha.milieu})` : '—'} | ${f.origine ?? '?'} | ${f.usage ?? '?'} | ${f.url} |`;
const tete = '| Nom (Beer Analytics) | Recettes | α des recettes (10e–90e centile) | Origine | Usage | Fiche |\n|---|---|---|---|---|---|';
const manque = g.manque.sort((a, b) => (b.recettes ?? 0) - (a.recettes ?? 0) || a.nom.localeCompare(b.nom));
const seuil = (n) => manque.filter((f) => (f.recettes ?? 0) >= n).length;
const md = `# Les houblons de Beer Analytics qui manquent au catalogue (c9, point 3)

${ba.length} fiches Beer Analytics.

| Groupe | Nombre |
|---|---|
| Déjà au catalogue de base (nom ou alias, table d'alias comprise) | ${g.base.length} |
| Déjà dans les ajouts (c6) | ${g.ajout.length} |
| Nom ambigu, à confirmer (GR/US, Cerera, HBC 522) | ${g.confirmer.length} |
| Produits ou mélanges (Pink Boots, SAB Blend…) | ${g.produit.length} |
| **Vraiment manquants** | **${manque.length}** (dont ${manque.filter((f) => f.alpha).length} avec un α de recettes) |

Parmi les manquants : ${seuil(100)} ont au moins 100 recettes, ${seuil(50)} au moins 50, ${seuil(10)} au moins 10.

Proposition : ajouter les ${manque.length} comme variétés à une source (Beer Analytics), marquées « déclaré par les recettes », avec leur compte de sources ; ce n'est pas un ajout massif sans le dire, c'est ${manque.length} fiches de plus au fichier à la demande (moins de 40 ko). Mécanisme : ajouter Beer Analytics aux sources de nom de rattachement.mjs (SOURCES_NOMS) ; la voie c9 n'y touche pas (le test de la fusion compte 18 sources).

## À confirmer
${g.confirmer.map(([f, r]) => `- ${f.nom} : ${r}`).join('\n')}

## Produits ou mélanges
${g.produit.map((f) => `- ${f.nom} (${f.url})`).join('\n')}

## Vraiment manquants
${tete}
${manque.map(ligne).join('\n')}
`;
writeFileSync(resolve(ICI, 'ba-manquants.md'), md);
console.log(`BA ${ba.length} : base ${g.base.length}, ajouts ${g.ajout.length}, à confirmer ${g.confirmer.length}, produits ${g.produit.length}, manquants ${manque.length}`);
