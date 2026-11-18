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

## Reprise 1 (pilote, 02.11) : son choix E, puis les mineurs du critique
Critique de r4 : ACCEPTÉ (`critique/VERDICT-r4-port-d.md`, lis-le). Ses mots (SPEC, 02.11, mot pour mot) : « E c'est très bien », puis
« Avec e, on doit toujours pouvoir plier déplier individuelle les catégories, ce bouton lock rien, juste un shortcut ». D311.
Sa maquette (règle n° 1, la base) : `choix-plier/maquettes/e-plie.html`, `e-deplie.html`, `e-mele.html`, `e-plie-sombre.html` et `choix-plier/img/e-*.png`.

**E, le segment « Plié | Déplié »** (28 px, dans l'en-tête de la feuille, entre le titre et le justificatif, pour toute la dépense) :
1. « Plié » replie tous les sous-groupes pliables, **sauf un groupe qui porte une ligne à vérifier, qui reste ouvert** (sa page : « Une ligne
   à vérifier garde son groupe ouvert, même tout plié »). Le `plierTout` actuel replie aussi ce groupe : corrige-le (témoin rouge avant).
   « Déplié » les ouvre tous.
2. C'est un raccourci, il ne fige rien : après l'un ou l'autre, chaque sous-groupe se plie et se déplie toujours d'un toucher, y compris celui
   d'une ligne à vérifier. L'état allumé se **calcule** sur l'état réel des groupes (jamais un mode gardé) : « Plié » allumé quand l'état égale
   ce que « Plié » produit, « Déplié » quand tout est ouvert, aucun des deux sinon (état mêlé, sa vue `e-mele`). Au repos d'une lecture, « Plié »
   est donc allumé.
3. Visible en vue Catégorie seulement, et seulement quand une bande a deux sous-familles ou plus (lecture du pilote, réversible ; dis-la dans RESULTAT).
4. Mesure de l'en-tête avec le titre le plus long que la feuille affiche (critique r3) : rien ne se chevauche ni ne passe à la ligne à 390 et à 1280.
   Boutons à `aria-pressed`, focus visible, cibles selon DESIGN.md.
5. Témoins : tout plié avec une ligne à vérifier (son groupe ouvert) ; un toucher après « Plié » ouvre un groupe et éteint « Plié » ; un toucher
   replie un groupe à vérifier ; « Déplié » puis un toucher ; segment absent en vue Papier et sur une dépense sans bande à deux sous-familles.
6. Captures côte à côte avec `choix-plier/img/e-plie.png`, `e-deplie.png`, `e-mele.png`, `e-plie-sombre.png` (390 tactile ; plus 1280 clair) ;
   ouvre chacune (L12).

**Les mineurs du critique** :
- M1 : colonne des quantités décalée sur une ligne « + ? » (`10 Stk` à 505 px contre 538) ; l'en-tête de bande a le même décalage. Corrige les
  deux ensemble : la colonne du montant réserve la largeur de « 000,00 + ? » dès qu'un inconnu existe dans la bande. Pour ce seul point, l'en-tête
  de bande t'est ouvert (même fichier, mêmes classes) ; mesure l'écart ≤ 2 px sur toutes les lignes et l'en-tête, avant et après.
- « Y aller » vers une ligne d'un groupe replié (`reveler`) : un test d'écran, et un geste dans `capturer-d.mjs` (la cible visible, le groupe ouvert).
- M2 (« Consommable » dans Nettoyage) : mesuré par le pilote sur sa pièce du 02.11 : 2 lignes de Nettoyage sur 2 en Détergent, aucun groupe « Consommable » ; rien à faire ici.

Critères 2 à 5 de la voie rejoués à l'identique ; tests dans `tests/unit/depense/bandes/` et `tests/unit/depense/ecran/` (fichiers `*-d311.test.*`).
Rendre : RESULTAT.md complété (section « Reprise 1 »), une ligne `R4-PORT-D OK — …` ou `R4-PORT-D ECHEC — …`.
