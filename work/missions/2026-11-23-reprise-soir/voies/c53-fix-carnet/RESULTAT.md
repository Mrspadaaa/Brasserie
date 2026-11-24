OK — R16 (ordre par groupes) et R17 (prix unitaire insécable) corrigés, 78 tests verts, build de types propre, commit 01c080d50

# RESULTAT c53-fix-carnet

## Plan (endroits de c53-tests/RESULTAT.md, un correctif chacun)
- R16 (ordre par groupes)
  1. Ordre de décision `rangDeDecision` (functions/src/lienFusion.ts) : `ORDRE` refait par groupes : acides (alpha, bêta, cohumulone), récolte, huiles totales, huiles (myrcène, humulène, caryophyllène, farnésène : par part décroissante, `trierParDecision` reçoit un 4e paramètre `valeurDe`), puis température, volume, matière, induction, énergie ensemble (puissance, performance, consommation, tension), froid, fluide, mode, tôle (« Matériau du produit »), dimensions ensemble (extérieures, intérieures, porte : hauteur et largeur côte à côte), construction (épaisseur, densité), couleur. Un nom inconnu vient après la porte (`RANG_INCONNU` calculé).
  2. Fiche (grille) : `FicheArticle.tsx` : `ordreHoublon` retiré (une seule source : `rangDeDecision`), valeur transmise pour les huiles.
  3. Carte (résumé) : `comparer.ts` `valeursLuesOrdonnees` : un houblon dit alpha, récolte, huiles totales en tête ; `CarteArticle.tsx` (variante liste) : un houblon dit ces trois valeurs puis « +N » (elle disait les dix).
  4. Lecture serveur : `lienLibelles.ts` `prioriserValeurs` : l'ordre est celui des groupes de `rangDeDecision` (le rang `ESSENTIEL` séparait la tension de « Branchement » et la tôle de la puissance), huiles par part. `lienPlateforme.ts` `bruitDeBoutique` : « Dimensions intérieures (L x P x H) » était jetée comme phrase d'en-tête (7 mots) : la parenthèse ne compte plus.
  5. Article déjà rangé : `modele.ts` passe la valeur à `prioriserValeurs` (les huiles se rangent par part).
  6. Tableau du carnet : `TableauCarnet.tsx` : la colonne unique garde les dimensions intérieures avant les extérieures (c48 R2).
- R17 (prix unitaire jamais coupé)
  1. à 4. (tableau, pastille, feuille Articles, carte, fiche, Comparer, Choisir) : source unique : `prixUnitaire.ts` : `texteParUnite` (« 10,40 CHF/L ») et `quantiteArticle().texte` (« 50 L ») portent une espace insécable entre le nombre et l'unité ; tout rendu qui les dit (`detailPrix`, `.cn-pastille-qte`, `.cn-tab-q`, Comparer) en profite. La cascade CSS `white-space: normal` de carnets.css l. 737 n'y peut plus rien.

## Fichiers écrits
- functions/src/lienFusion.ts, lienLibelles.ts, lienPlateforme.ts ; src/domain/carnets/comparer.ts, modele.ts, prixUnitaire.ts ; src/ui/carnets/FicheArticle.tsx, CarteArticle.tsx, TableauCarnet.tsx.
- Tests d'avant mis à jour (leur attente est l'ancienne règle, contredite par R16/R17 ; les tests de c53Regles n'ont pas été touchés) : tests/unit/carnetsFix28Fiche.test.tsx (T28-14), carnetsFix28App.test.ts et carnetsFix30.test.ts (espace insécable de « 1 kg », « 72,50 CHF/kg »), carnetsFix30.test.ts (ordre d'un article déjà rangé), carnetsPageBloquee.test.ts (« Hauteur » avant « Ausladung »).

## Sortie décisive des critères
- `npx vitest run tests/unit/c53Regles -t "R16|R17"` : R16 66 verts, R17 12 verts (essais : 4 passes sur R16, 2 sur R17). Le bloc R18 est à la voie c53-fix-courbe.
- c48, c50, c52, carnets*, cx*, c53, proprietes : `Test Files 63 passed, Tests 1035 passed` (tests-large.log). Les 58 fichiers qui importent lienFusion, lienLibelles, lienPlateforme, lireLien, lienProduit, domain/carnets, ui/carnets, prixUnitaire : `58 passed, 1004 passed` (tests-lies.log). La suite entière dépasse 9 min : non terminée, remplacée par ce balayage ciblé.
- `npx tsc --noEmit -p .` : 2 erreurs, les 2 connues (seedData GanttTask, virtual:pwa-register) ; aucune neuve.
- `node scripts/agents/controle-bugs.mjs` : BUGS OK (C53-1 à C53-4 : « corrigé en local 01c080d50 »).

## Causes trouvées en route
- C53-3 : la ligne « Dimensions intérieures (L x P x H) » n'entrait pas dans la fiche d'un article lu par lien : `bruitDeBoutique` la jetait comme phrase d'en-tête (plus de 6 mots, parenthèse comprise). Corrigé.
- C53-3 : `prioriserValeurs` triait d'abord par `ESSENTIEL` (tension, mais pas « Branchement » ni « Performance »), ce qui séparait l'énergie ; l'ordre est maintenant celui des groupes de `rangDeDecision` seul.
- C53-4 : la cascade `white-space: normal` (carnets.css l. 737) annulait le `nowrap` ; l'espace insécable à la source n'en dépend plus.

## Doutes et limites
- jsdom ne mesure rien : à voir en ligne à 390 px (fiche d'un houblon, carte, chambre froide, colonne CHF du tableau).
- La carte (liste) d'un houblon dit désormais alpha, récolte, huiles totales puis « +N » (elle disait les dix valeurs) : seul changement visible hors de la règle stricte, demandé par R16 (« aucune huile mineure »). Une valeur lue avec son unité séparée perd son nom sur la carte (« 12,8 % · 2025 ») : déjà ainsi, hors de cette voie.
- Les tests d'avant modifiés (voir « Fichiers écrits ») étaient l'ancienne règle ; aucun test de c53Regles n'a été touché, aucun ne m'a paru faux.

## DÉCISION À PRENDRE : tête de la fiche d'un houblon (suite de c53-tests)
J'ai suivi la recommandation de c53-tests : fiche = alpha, bêta, cohumulone (les acides ensemble), récolte, huiles totales, puis chaque huile par part ; T28-14 mis à jour. Décision : (a) garder, ou (b) remettre la récolte en 2e place de la fiche (alors R16 « acides ensemble » à retirer). Recommandation : (a). La carte garde alpha, récolte, huiles totales (C53-2).

## DÉCISION À PRENDRE : « Matériau du produit »
Placé après le mode de fonctionnement (avant les dimensions), pas avec la couleur : c48 R5 exige qu'il reste parmi les 10 caractéristiques gardées ; R16 demande seulement l'énergie avant la tôle. Un « Matériau » seul (marmite) reste 3e, avant l'énergie.

CONNAISSANCE : l'ordre d'affichage des caractéristiques tient dans une seule liste, `ORDRE` de functions/src/lienFusion.ts (groupes : acides, huiles, décision, énergie, froid, tôle, dimensions, construction, couleur) ; la fiche, la carte, la lecture serveur et l'article déjà rangé la lisent, plus aucun ordre local. Les huiles d'un houblon se rangent par part, via `valeurDe`.
LEÇON PROPOSÉE : une correction d'ordre qui passe par deux tris (`ESSENTIEL` puis `rangDeDecision`) casse un groupe : un seul rang, une seule liste. Et un « jamais coupé » se règle à la source du texte (espace insécable), pas dans chaque CSS.
