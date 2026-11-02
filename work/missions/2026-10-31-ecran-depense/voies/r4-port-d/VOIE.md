# Voie r4-port-d — porter son choix D : les sous-groupes repliés dans une bande (D307)

Agent : `auteur` (Sonnet), neuf. Plafond : 80 tours. Ligne `r4-port-d` de MISSION.md. Aucun commit, aucun déploiement, aucun appel réel,
aucun serveur Vite dans le dépôt. Tests et serveur dans la copie isolée :
`node work/missions/2026-10-31-ecran-depense/voies/p3c-port/copie.mjs "<commande>"` (une commande simple par appel, sans `;`).
Avant : `.claude/rules/affinee-frontend.md`, `DESIGN.md`, `docs/ui-compacte.md` (parties utiles) ; skills `boosters-ux`, `senior-frontend`, `a11y-audit`.
Lis D306 et D307 dans `work/refonte-frontend/decisions.md`, et `voies/r1-renovation/RESULTAT.md` (ce qui est déjà fait : `sousFamilleDe`).

## Ses mots (SPEC, 02.11, mot pour mot)
« J'aime beaucoup D mais il faudrait pouvoir facilement tout plier, déplier »

## Sa maquette (règle n° 1 : reprise telle quelle, L03)
`work/missions/2026-10-31-ecran-depense/choix-sousfamilles/` : option D, `maquettes/d-renovation.html`, `d-renovation-sombre.html`,
`d-nettoyage.html`, `d-repos.html`, leurs captures `img/d-*.png`, le balisage exact dans `outils/gen.mjs` et `outils/sf.css`, et la tête de D
dans `index.html`. Inventaire à faire avant de coder (dans RESULTAT) : chaque élément de D, chaque état, chaque geste.
- Au repos : sous l'en-tête de bande (inchangé), une ligne par sous-famille : chevron, nom, pastille de nombre, quantité en mono gras dans la
  colonne de la quantité de bande, montant ; le filet de famille continue.
- Un toucher sur la ligne de sous-famille ouvre ou ferme son groupe ; ouvert, ses rangées sont celles d'aujourd'hui (rien ne change dans la rangée).
- Une ligne à vérifier (le jaune ou le rouge de `confiance.ts`) ouvre son groupe d'office (`d-nettoyage`).
- Un sous-groupe d'une seule ligne montre sa ligne sans chevron ni ligne de sous-famille.
- Une bande à une seule sous-famille, ou sans sous-famille (Houblons, Malts), reste celle d'aujourd'hui.
- Ordre des sous-groupes : celui de `SOUS_FAMILLES_RENOVATION` pour la Rénovation ; pour les autres, l'ordre de `STOCK_CATEGORIES` ; dans un
  groupe, l'ordre du papier.
- La vue « Papier » ne change pas.

## « tout plier, déplier »
Sa forme visible est un choix montré à part (voie r3-plier) : **n'ajoute aucun contrôle visible**. Prépare l'état : un ensemble des groupes
ouverts par bande, et deux fonctions `toutPlier()` / `toutDeplier()` (toutes bandes, ou une bande) testées, qu'un contrôle branchera.

## Possède
`src/ui/depense/Liste.tsx`, `src/ui/depense/Ligne.tsx` (seulement si la rangée l'exige ; dis pourquoi), `src/ui/depense/groupes.ts` (les sous-groupes
d'une bande, leurs sous-totaux de quantité et de montant, par la même fonction `quantites` que la bande), `src/ui/depense/p3c.css` (classes neuves
`dp-p3c-sg-*`), `src/ui/finance/ExpenseSheet.tsx` (l'état des groupes ouverts et son passage à `Liste`), `tests/unit/depense/bandes/**`,
`tests/unit/depense/ecran/**`, `work/missions/2026-10-31-ecran-depense/voies/r4-port-d/**`.
Interdits : `familles.ts` (sauf un export d'ordre si tsc l'exige, et le dire), la rangée, l'en-tête de bande, le pied, `functions/**`, tout autre fichier.

## Critères (le pilote les rejoue)
1. Témoins rouges sur l'arbre d'avant, verts après : sous-groupes d'une bande à 7 sous-familles (sous-totaux de quantité et de montant justes,
   au centime) ; bande à une sous-famille identique à aujourd'hui ; sous-groupe d'une ligne sans ligne de sous-famille ; ligne à vérifier qui
   ouvre son groupe ; `toutPlier` / `toutDeplier`.
2. Les tests existants des bandes et de l'écran restent verts sans changer une attente (sinon : arrête-toi et dis pourquoi).
3. `npx vitest run tests/unit/depense tests/unit/purchasePrefill.test.ts --maxWorkers=2`, `npx tsc --noEmit -p tsconfig.json`, `npm run build` : 0 erreur.
4. Script `voies/r4-port-d/capturer-d.mjs` (modèle : `voies/r1-renovation/capturer-renovation.mjs`) : états d'aperçu `renovation` et `familles`,
   390 tactile et 1280, clair et sombre ; au repos (replié), un groupe ouvert par un toucher, une ligne à vérifier ouverte d'office ; chaque
   capture écrite **côte à côte avec la vue D de sa maquette** (`img/d-*.png`). Mesures : hauteur de la ligne de sous-famille, taille du texte,
   colonnes de quantité et de montant alignées sur l'en-tête de bande (écart ≤ 2 px), aucune erreur de console, aucune requête hors localhost.
   Sortie `PORT-D OK` ou `PORT-D ECHEC n`. Ouvre chaque capture (L12) et décris-la dans RESULTAT.
5. Clavier et lecteur d'écran : la ligne de sous-famille est un bouton avec `aria-expanded`, focus visible.

## Rendre
`RESULTAT.md` : inventaire de D, fichiers, témoins, sorties, captures décrites, écarts à sa maquette (aucun sans le dire), doutes ;
`LEÇON PROPOSÉE : …`, `CONNAISSANCE : …`. Une ligne : `R4-PORT-D OK — …` ou `R4-PORT-D ECHEC — …`.
