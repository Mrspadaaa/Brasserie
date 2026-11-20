OK — 1a57b53e4 : 3 corrigés (pied 390, variante fournisseur, prix déduit), 1 écarté ; captures demandées

n° | verdict | commit | test | rouge→vert | capture
---|---|---|---|---|---
1 v3-5 suite | corrige (pied coupé) ; « Lecture en cours… » au pied : ecarte — maquette `p3c-3-lecture.png` (work/missions/2026-10-31-ecran-depense/v3/p3c-3/) n'a aucun pied pendant la 1re lecture, la frise dit « lecture » | 1a57b53e4 | tests/unit/depense/f10-tour3.test.tsx « v3-5 suite » | rouge : `expected 'ml-auto inline-flex min-h-9 shrink-0 …' not to match` → vert | à faire (DEMANDE EXECUTANT)
2 doc2 | corrige : un désaccord de fournisseur dont les lectures sont un même nom (le plus court contenu en mots entiers dans chacun, ou ≥ 0,9) n'est ni compté, ni en file, ni « À confirmer », ni baisse de l'en-tête ; un vrai désaccord reste compté | 1a57b53e4 | f10-tour3 « doc2 » (4 tests) | rouge : `expected [ {…} ] to deeply equal []`, `expected 'repris' to be 'sur'`, écran « 3/3 · 1 valeur en désaccord » → vert « 3/3 d'accord » | à faire
3 LR1-7 | corrige : rangée `title` « prix déduit : 50,00 ÷ 2 (montant ÷ quantité, non imprimé) » + texte lu sr-only ; champ écrit par le trio : `title` et `aria-describedby` « prix déduit : 50,00 ÷ 4 » ; prix tapé : tout part | 1a57b53e4 | f10-tour3 « LR1-7 » ; f6b-tour3 LR1-7 mis à jour (title avec la formule) | rouge : `expected 'prix déduit : montant ÷ quantité, non…' to match /déduit : 50,00 ÷ 2/` → vert | à faire
4 saisie 3,00 | ecarte — geste du banc : total 3 → 1 rangée ; « Ajouter une ligne » ×2 → 3 rangées (jamais 6). Les 6 rangées de g3 venaient de ses touchers sur des rangées fermées | — | f10-tour3 « saisie à la main » (vert dès le code d'origine) | vert sur le code d'origine | à confirmer au banc (DEMANDE EXECUTANT)

Fichiers (port-carnet) : src/ui/depense/Pied.tsx, confiance.ts, ressemblanceNoms.ts (varianteDeFournisseur y déménage, finale.ts la ré-exporte), finale.ts, Ligne.tsx, ChampNombre.tsx,
src/ui/finance/ExpenseSheet.tsx, tests/unit/depense/f10-tour3.test.tsx (neuf), tests/unit/depense/f6b-tour3.test.tsx (attente du title).
Tests : voies/f10/tests-rouge.txt (5 rouges), tests-vert.txt (15/15), tests-final.txt : 221 fichiers passés, 1 sauté ; 2837 tests passés, 4 sautés. tsc --noEmit : aucune erreur. Commit 1a57b53e4 : git show --stat = 9 chemins, tous de la voie.
Prédiction : il voit « 3e lecture / en cours… » entier sur deux lignes et doc2 sans rouge ; le reste ne se voit pas, c'est voulu.

## DEMANDE EXECUTANT (captures, banc v3, PORT_BANC=5198)
1. Serveur (Bash en fond, cwd port-carnet) : `VITE_FIREBASE_API_KEY=fake node_modules/.bin/vite --config ../Brasserie/work/missions/2026-11-19-carnet-tour3/voies/v3/vite.v3.config.mjs --port 5198 --strictPort`
2. Copier `voies/v5b/outil.mjs` dans `voies/f10/outil.mjs` (captures → voies/f10/captures) ; reprendre les gestes de `voies/v5b/g3.mjs` (v35, lr19) et `g1.mjs` (lr17), noms préfixés `f10-`,
   en 390 clair, 390 cave, 1280 clair, 1280 cave : `f10-v35` (pendant l'attente, `?dev-local&depense=v3-lent`), `f10-doc2` (`reel-doc2`, en-tête et bloc Lectures),
   `f10-lr17` (`medicament`, prix vidé puis quantité 4 ; relever `title` et `aria-describedby` du champ Prix ligne 1), `f10-e12` (saisie à la main, total 3, compter `article[data-purchase-line]`).
3. Attendus : pied à 390 : bouton principal entier, `getBoundingClientRect().right ≤ 390` ; doc2 : « Lectures 3/3 d'accord », aucun « valeur en désaccord » ; lr17 : title « prix déduit : 13,40 ÷ 4 … » ; e12 : 1 rangée.
4. Arrêter le serveur, vérifier le port 5198 libre. Rendre les chemins des captures ; le concepteur les ouvre et juge.

DÉCISION À PRENDRE : aucune
CONNAISSANCE : la variante de fournisseur vit dans src/ui/depense/ressemblanceNoms.ts (confiance.ts ne peut importer finale.ts sans cycle).
LEÇON PROPOSÉE : aucune
