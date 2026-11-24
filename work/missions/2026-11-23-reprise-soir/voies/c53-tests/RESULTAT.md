OK — TESTS ROUGES 83/90 (R16 64/66, R17 10/12, R18 9/12) 9f7772c0a ; aucun fichier de src/ ni functions/ touché

# RESULTAT c53-tests

## Fichiers écrits
- `tests/unit/c53Regles.test.tsx` (trois `describe` : « R16 : … », « R17 : … », « R18 : … »), `tests/fixtures/c53/houblons.json` (deux houblons réécrits à la main, Citra du tour 53 et un Mosaic à l'huile dominante différente), ce dossier (`tests-rouge.log`, `tests-rouge.txt` : ignorés par Git, restent sur le disque). Commit des tests : `9f7772c0a`.
- `git status -- src functions` : aucune modification suivie (les `??` de `src/asset` et `src/data/hopSources` étaient là avant). `npx tsc --noEmit -p .` : aucune erreur dans le fichier de test.

## Sortie décisive
`npx vitest run tests/unit/c53Regles --reporter=dot > tests-rouge.log` : **83 rouges sur 90, 7 verts** (2,3 s). `tests-rouge.txt` : même sortie en mode détaillé, un test par ligne avec la raison.
- R16 : 66 tests, 64 rouges. Raisons : « les acides ensemble » 13, « huiles par part décroissante » 13, « dimensions ensemble » 20, « porte côte à côte » 8, « puissance et tension ensemble avant couleur et tôle » 8, carte sans récolte ni huiles totales en deuxième et troisième place 2.
- R17 : 12 tests, 10 rouges (tableau, pastille seule, feuille Articles, ligne de détail de la carte, fiche, × marmite et houblon).
- R18 : 12 tests, 9 rouges (Prévisions 5, Calendrier 1, Analyse › Caisse 3).

## Les endroits où chaque règle s'applique (grep) — voir plus haut dans l'historique du fichier, repris ici
- R16 : (1) fiche, grille : `FicheArticle.tsx` → `trierParDecision` (functions/src/lienFusion.ts, `rangDeDecision` : 14 familles ; « performance » rang 11 après les dimensions, « porte » après) puis `ordreHoublon` (fiche seule : alpha, récolte, huiles totales, puis suite fixe pays, type, farnésène, caryophyllène, humulène, myrcène, bêta ; cohumulone au nom) ; (2) résumé de la carte : `CarteArticle.tsx` (l. 165 et 216) → `valeursLuesOrdonnees` → `trierParDecision`, aucun ordre houblon ; (3) lecture serveur : `lireLien.ts` l. 185 → `prioriserValeurs` (lienLibelles.ts, ESSENTIEL puis rang puis NOM : « alpha | bêta | caryophyllène | cohumulone | farnésène | huiles totales… » alphabétique) ; (4) article déjà rangé : `lireCarnet` → `modele.ts` → `prioriserValeurs(…, false)` ; non retenus : `valeursLuesDe` (ordre de la page voulu pour Comparer, CRB-14), `TableauCarnet` (une valeur par ligne).
- R17 : (1) tableau : `TableauCarnet.tsx` l. 198, `.cn-tab-q` ; (2) pastille : `PrixPastille.tsx` l. 67, `.cn-pastille-qte`, reprise par `CarteArticle` et `FeuilleCartes` ; (3) ligne de détail `detailPrix` (PrixPastille l. 125-137) dite par `CarteArticle` l. 182 et 212, `FicheArticle` l. 291 (autres offres), `Choisir.tsx` l. 163 et 253 ; (4) Comparer l. 350.
- R18 : (1) `EscalierSvg.tsx` de Finances › Prévisions ; (2) `Courbe.tsx` `placerNoms` du Calendrier ; (3) `analyse/Escalier.tsx` (Finances › Analyse › Caisse) ; non testé : `annuel/Etapes.tsx` (pas de bulles d'événements).

## R18 : pourquoi l'étiquette du tour 52 a disparu au tour 53 (prouvé par deux tests, un vert, un rouge)
K51-1 (voie rouges) corrige la courbe de l'en-tête du CALENDRIER (`Courbe.tsx`, `placerNoms`) ; la bulle de Finances › Prévisions du tour 52, « ZZ TEST — achat rond + 1 autre −159,95, 08.12 », venait de `texteLot` (PC-117), pas de K51-1. Au tour 53 le script de test a ajouté son préfixe deux fois (« ZZ TEST — ZZ TEST — achat rond »). Le texte du lot passe de 45 à 55 signes ; à 390 px la place pour une bulle va de x = 48 à 382, soit 334 px. Le test « un seul préfixe » reste vert (la bulle tient et dit −159,95) ; le test « libellés plus longs » est rouge avec « sans place : lot:2026-12-08 » : `placerEtiquettes` ne trouve aucune place, l'id passe dans `reste`, et la seule bulle voisine est « achats ≥ 2,40, 13.12 », comme sur la capture. Seul `compacts` (projets de matériel) offre une forme plus courte : un lot n'en a aucune, et rien ne retire un préfixe doublé. Un correctif a donc deux leviers : un repli plus court pour le lot (nom raccourci, puis « 2 sorties −159,95, 08.12 »), et le préfixe jamais doublé à l'affichage.

## Les 7 verts, justifiés
- R16 : 2 « carte, page inversée : le même résumé » (l'ordre de la carte ne dépend pas de la page ; R12 l'a corrigé) : garde-fou contre une régression du correctif.
- R17 : 2 « ligne de prix de Comparer » (Comparer dit déjà le prix entier : le dossier le disait, la cascade CSS de `.cn-comparer` l'accorde).
- R18 : « un seul préfixe » (état du tour 52), « plan daté au préfixe simple garde son nom entier », « Calendrier : la marche du 08.12 dit son nom, + 1 autre et −159,95 » : garde-fous de ce qui marche.

## Doutes et limites
- jsdom ne mesure rien. R17 se lit dans le DOM : espace insécable, ou `white-space: nowrap` en vigueur après la cascade lue dans `src/ui/carnets/*.css` (ordre des fichiers, `!important`, `@media (min-width)` au-delà de 390 écartées ; la spécificité n'est pas calculée). Exemple qui m'a obligé à lire la cascade : `.cn-tab-num {white-space: nowrap}` existe, mais `.cn-tab-ligne:not(.cn-tab-cols) > .cn-tab-num {white-space: normal}` (carnets.css l. 737) l'annule : c'est la cause de « 50 L · / 10,40 / CHF/L ». R18 mesure les textes à 0,5 em par signe (ordre de grandeur) ; le rendu réel à 390 px reste à voir en ligne.
- Non testé volontairement : la pastille empile « 520 » puis « CHF » (maquette B1, D419, choix du brasseur : règle n° 1). `Choisir.tsx` (même `detailPrix`, props lourds) n'est pas rendu ; la carte dit la même ligne.
- Valeurs lues avec unité séparée (« 12,8 » + unite « % ») : la carte les dit sans leur nom (« 12,8 % · 4 % · 7,4 % »), on ne sait plus qui est l'alpha. La lecture en ligne ne les sépare pas (carte du tour 53 : « Alpha 12,8 % »), donc les tests de carte donnent le texte « 12,8 % » sans `unite`. À surveiller, pas un test.
- R16 : le test n'impose pas la place de la récolte (entre les acides ou après) ; il impose acides ensemble puis avant les huiles. Le nom de la porte se reconnaît à `\bporte\b`.

## DÉCISION À PRENDRE : tête de la fiche d'un houblon
T28-14 (`carnetsFix28Fiche.test.tsx`, L04) veut « alpha, récolte, huiles totales » en tête ; C53-1 veut « les acides ensemble (alpha, bêta, cohumulone), puis les huiles totales et leur détail ». Les deux ne tiennent que si la récolte passe après les acides (ou entre eux). Mes tests posent : alpha puis bêta et cohumulone (la récolte tolérée entre eux), puis huiles totales, myrcène…farnésène par part. La CARTE garde « alpha, récolte, huiles totales » (C53-2). Si le brasseur préfère garder la récolte en deuxième place de la fiche, il faut retirer « les acides ensemble » de R16 pour le houblon. Ma recommandation : acides d'abord (sa phrase du tour 53), récolte juste après ; T28-14 à mettre à jour par le correctif.

## DÉCISION À PRENDRE : Analyse › Caisse
J'ai lu « toute courbe qui a des bulles d'événements » au sens large : Analyse › Caisse (une bulle par paiement, nom coupé à 15 signes : « ZZ TEST — ZZ T… ») doit nommer l'écriture, fusionner deux paiements du même jour (« … + 1 autre −159,95 ») et ne pas doubler le préfixe : 3 tests rouges. Si le brasseur ne veut pas cette fusion sur l'Analyse, supprimer les deux premiers de ces trois tests.

CONNAISSANCE : cause du C53-5 : un lot de sorties du même jour n'a aucun repli quand son texte ne tient pas (seuls les projets de matériel en ont un), et un préfixe de libellé doublé le rend trop large à 390 px. LEÇON PROPOSÉE : un test de « jamais coupé » qui lit seulement la règle `nowrap` ment, la cascade l'annule parfois (carnets.css l. 737) ; lire la règle qui gagne.

## Endroits où chaque règle s'applique (grep)

- R16 (ordre par groupes)
  1. fiche, grille « Caractéristiques » : `FicheArticle.tsx` → `trierParDecision` (functions/src/lienFusion.ts, `rangDeDecision` : ORDRE de 14 familles, « performance » rang 11 après les dimensions, « porte » après, couleur) puis `ordreHoublon` (fiche seule : alpha, récolte, huiles totales, puis suite fixe pays, type, farnésène, caryophyllène, humulène, myrcène, bêta ; cohumulone absente de la suite = au nom).
  2. résumé de la carte : `CarteArticle.tsx` (2 endroits, l. 165 et 216) → `valeursLuesOrdonnees` (comparer.ts) → `trierParDecision` : AUCUN ordre houblon, donc « Alpha · Bêta · Caryophyllène · +10 ».
  3. lecture serveur : `lireLien.ts` l. 185 → `prioriserValeurs` (lienLibelles.ts : ESSENTIEL puis `rangDeDecision` puis nom).
  4. article déjà rangé : `lireCarnet` → `modele.ts` `valeursEnFrancais` → `prioriserValeurs(…, false)`.
  5. non retenus : `valeursLuesDe` (base de Comparer, ordre de la page voulu, CRB-14) ; `TableauCarnet` (choisit UNE valeur par ligne).
- R17 (prix unitaire jamais coupé)
  1. tableau du carnet : `TableauCarnet.tsx` l. 198, `<small class="cn-tab-q">{quantite} · {parUnite}</small>` (CSS : `.cn-tab-q{display:block}`, pas de nowrap).
  2. pastille de prix : `PrixPastille.tsx` l. 67 `cn-pastille-qte` (`.cn-pastille-prix small{display:flex}`, pas de nowrap) ; réemployée par `CarteArticle` (`.cn-classee-prix`) et `FeuilleCartes`.
  3. détail du prix : `PrixRenduDetail` (PrixPastille.tsx l. 133-135, parts jointes par « · »), dans la fiche.
  4. Comparer : `Comparer.tsx` l. 350, `<small>{quantite} · {parUnite}</small>`.
  5. déjà juste : valeurs de colonne `ValeurCarnet` (espaces insécables, C48-6).
  6. non testé volontairement : la pastille empile « 520 » puis « CHF » (maquette B1, D419, choix du brasseur : règle n° 1).
- R18 (marche nommée avec son montant)
  1. Finances › Prévisions : `src/ui/finance/previsions/EscalierSvg.tsx` (`texteLot`, `placerEtiquettes`, repli `compacts` réservé aux projets de matériel).
  2. Calendrier, courbe de l'en-tête : `src/ui/calendrier/entete/Courbe.tsx` `placerNoms` (K51-1 : fusion « + N autre », repli « 2 mouvements »).
  3. Finances › Analyse › Caisse : `src/ui/finance/analyse/Escalier.tsx` (`tronque(libelle, 15)`, une bulle par paiement, pas de fusion du même jour).
  4. non testé : `annuel/Etapes.tsx` (escalier annuel, pas de bulles d'événements).
