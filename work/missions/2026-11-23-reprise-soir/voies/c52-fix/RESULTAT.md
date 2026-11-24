OK — R12..R15 verts : même ordre par le nom, jauge seulement chiffrée, prix sans quantité, vendeur espacé du prix

# RESULTAT c52-fix

## Plan (par règle : endroits de voies/c52-tests/RESULTAT.md et correctif)
- **R12 (même ordre)** — cause : `rangDeDecision` ne connaît que 14 familles ; pour un nom inconnu, `trierParDecision` et `prioriserValeurs` départageaient par l'ORDRE DE LA PAGE. Correctif : à rang égal, connu ou non, le nom normalisé (`cleDeNom`) départage.
  1. grille de la fiche `FicheArticle.tsx` → `trierParDecision` (functions/src/lienFusion.ts) ;
  2. résumé de la carte `CarteArticle.tsx` (2 endroits) → nouvelle `valeursLuesOrdonnees` (src/domain/carnets/comparer.ts, via `trierParDecision`) ;
  3. lecture serveur `lireLien.ts` → `prioriserValeurs` (functions/src/lienLibelles.ts, tri par nom) ;
  4. article déjà rangé : `lireCarnet` → `modele.ts` `valeursEnFrancais` → `prioriserValeurs(…, false)` : garde l'ordre de sa page comme avant (T30 le teste) ; la fiche et la carte remettent l'ordre commun ;
  5. houblon (`ordreHoublon`) : après alpha, récolte, huiles totales, une suite fixe (pays, type, farnésène, caryophyllène, humulène, myrcène, bêta), puis le nom. Sinon T28-14 (« le reste garde l'ordre de la page ») et R12 se contredisaient ;
  6. `valeursLuesDe` garde l'ordre de la page (base de Comparer, CRB-14) : non touché.
- **R13 (jauge)** — `CarteClassee` : la jauge (`.cn-reglette`) ne se dessine plus que si la valeur est chiffrée et placée entre les bornes. Plage, dimensions, inconnu : aucune piste vide (le registre accepte « pas de jauge »). « Veiller » reste à droite (`margin-left:auto`).
- **R14 (prix)** — `PrixPastille` : la quantité quitte l'espace entre montant et devise ; elle se dit après, avec le prix unitaire entier (« 50 L · 10,40 CHF/L »), seulement s'il se calcule. `TableauCarnet` : « 520 » puis « 50 L · 10,40 CHF/L » (`l.parUnite`). Ligne Offre et Comparer : déjà justes.
- **R15 (vendeur / prix)** — `FicheArticle` ligne Offre : vraies espaces (nœuds texte) entre vendeur, disponibilité et prix. Conteneur flex : l'espace est ignorée à l'écran, aucun changement visuel ; le texte lu est séparé.

## Fichiers écrits
functions/src/lienFusion.ts, functions/src/lienLibelles.ts, src/domain/carnets/comparer.ts, src/domain/carnets/modele.ts, src/ui/carnets/CarteArticle.tsx, FicheArticle.tsx, PrixPastille.tsx, TableauCarnet.tsx ; work/missions/BUGS.md (C50-4, C52-1..3) ; dans ce dossier : tests*.log, tsc-*.log, banc.log, registre.mjs. Commit du code : 26f5b8333.

## Sortie décisive de chaque critère
- c52Regles + c48Regles + c50Regles + tests/unit/carnets* + tests/unit/proprietes : 56 fichiers, **911 tests verts** (tests.log).
- tsc racine : 2 erreurs connues seulement (seedData GanttTask, virtual:pwa-register) ; tsc functions : 0 (tsc-racine.log, tsc-functions.log).
- Banc des liens sans IA (`--etiquette c52`) : nom 92 %, prix affiché 93 %, photo 95 %, caractéristiques 35/48 (73 %), HT 100 %, livraison CH 15/23 ; **identique** à c48 et c50 (aucun champ en recul) ; inventions 0 ; coût IA 0 (banc.log, mesures/c52.json).
- `node scripts/agents/controle-bugs.mjs` : BUGS OK (2234 bugs, 510 ouverts).
- Essais : 1 itération par règle, aucune relance de critère ; un second passage a été nécessaire pour deux vieux tests (T28-14, T30) que le tri par nom cassait (voir ci-dessus, résolus dans le code, tests intacts).

## Doutes et limites
- Hors de mes règles, rouge avant et après mon changement, sans lien avec lui : `tests/integration/carnet/lot7-champ-choisir.test.tsx` L-44 attend « 2 495,6 CHF » et reçoit « 2 495,60 CHF » (format du montant, pas de tri ni de prix de carte). Non touché.
- Le nom comme clé : à rang égal, les noms inconnus se suivent par ordre alphabétique, ce qui est stable mais pas « métier ». Pour que ce soit lu comme un brasseur, il faudrait grouper les dimensions (Hauteur, Largeur, Épaisseur, Profondeur) ; je ne l'ai pas fait : le changement d'ORDRE touche tous les rangs et l'acquis du Comparer. À regarder par le critique en ligne (Hauteur de la porte et Hauteur de l'unité ne seront pas voisines : « Hauteur de la porte », « Hauteur de l'unité » le sont, « Largeur de la porte » plus loin).
- `lireLien` rend encore deux lignes « Température » pour la page de test (bandeau + bornes) : observation de c52-tests, non traitée (hors R12..R15).
- Rien vu en navigateur : consigne (pas de captures locales), preuve en ligne par le pilote et le critique. Vérifier surtout : R13 (carte sans piste, « Veiller » toujours à droite, 390 px), R14 (pastille avec petite ligne « 50 L · 10,40 CHF/L »), R15 (aucun changement visible attendu).

DÉCISION À PRENDRE : aucune.
CONNAISSANCE : un tri « le nom départage » est la seule garantie d'un même ordre sur des noms que le code ne connaît pas ; l'ordre de la page ne peut servir qu'à départager deux noms identiques. Une suite fixe pour les noms de houblon (pays, type, huiles, bêta) remplace l'ordre de la page dans la fiche.
LEÇON PROPOSÉE : aucune (celle de c52-tests suffit).
