OK — série z : 6 concepts Identité (2 froides, 2 tièdes, 2 chaudes), PANEL OK, COMMUN OK, MOTS OK

## Fichiers écrits (seulement `work/missions/2026-10-31-ecran-identite/v0/z*/`)
- `z1/` La langue de Houblons (froide) · `z2/` Je décide, ça donne (froide) · `z3/` Bento (tiède) · `z4/` Le verre (tiède) · `z5/` Le dialogue (chaude) · `z6/` La ligne (chaude).
- Par concept : `etat.html` (390 × 844, classes préfixées `zN-`, boosters `data-booster`), `NOTE.md` (chaleur, axes, acquis cochés, B1–B13, tient/casse, contrôles), `zN-haut.png`, `zN-page.png`, `zN-nolo.png` (état touché).
- Générateur et script d'états, dans `z1/` : `gen-commun.mjs` (chrome commun : en-tête, fil, bandeau, pied, +, tels quels), `gen-z2.mjs` (six corps), `etats-z.mjs`.

## Sorties décisives
- `verifier-page.mjs` : PAGE OK ×6 (sans erreur, sans défilement horizontal).
- `mots-premier-ecran.mjs --max=80` (chrome compris) : z1 74 · z2 66 · z3 68 · z4 63 · z5 74 · z6 67 → MOTS OK.
- `controle-panel.mjs` (6 captures) : remplissage médian 0,61, 0 sous 0,50 ; ressemblance moyenne 0,89 ; 0 paire presque identique → **PANEL OK**.
- `controle-commun.mjs --sans=mots,fiche,trait,legende,au-style` : couleurs, survol, blocs, contraste, standard, parlant, brutes OK → **COMMUN OK**. Raison des `--sans` (dans chaque NOTE) : contrôles propres aux houblons (fiche au long appui, pictos de famille, légende, lentille au style) sans objet sur Identité, qui ne nomme aucun houblon ni famille d'arôme.
- `controle-contraste.mjs` : CONTRASTE OK (pire 5,1:1). `controle-hauteur.mjs` : HAUTEUR OK 1,00 écran ×6. `type="number"` : 0.
- Données : recette « neipa v3 » (24 L, 60 min, OG 1,080, IBU ~93, EBC 9,5, Royal Catering 45 L, fermenteur 30 L) ; plages 22A du catalogue `brewingStylesBootstrap.json` (IBU 60–100, pas 120) ; estimations marquées « ~ » (3 L, 27 L, 20 %), conseil dit « conseil » ; FG et alc. de la recette inconnus → bandes sans repère.

## Captures ouvertes (L12)
`v0/z1/z1-haut.png`, `z2/z2-haut.png`, `z3/z3-haut.png`, `z4/z4-haut.png`, `z5/z5-haut.png`, `z6/z6-haut.png`, plus `z3/z3-nolo.png`, `z6/z6-nolo.png`. Un bug vu à l'image et corrigé : dans z4, la classe `z4-ebc` entrait en collision avec le point EBC du bandeau (étiquettes rendues en points dorés).

## Prédiction
Il gardera z3 (Bento) et z6 (La ligne) comme idées (« visuellement parlant »), trouvera z1/z2 « pas mal » mais proches du formulaire, et dira de z4 que le verre est joli mais « inutile » si la couleur ne sert à rien de plus.

DÉCISION À PRENDRE : A6 — deux concepts retirent le bouton d'import du corps (z2, z4), trois le gardent (z1, z3, z6) ; le lot devra trancher sur une page de choix, pas ici.

CONNAISSANCE : `controle-panel.mjs` estime le fond à la couleur quantifiée (248, pas 255) : une surface doit s'écarter de plus de 60 (somme RVB) de ce gris pour compter comme remplie ; les panneaux `#F5F5F5`/`#EBEBEB` de DESIGN.md ne comptent jamais. Sur un écran court comme Identité, le chrome commun (en-tête, fil, bandeau, pied, +) occupe ~40 % des lignes de la vignette 24 × 52 et plafonne la diversité mesurable vers 0,89–0,90.

LEÇON PROPOSÉE : une classe de chrome commun (`zN-ebc`) réutilisée par mégarde dans un corps change le rendu sans erreur ; préfixer aussi par rôle (`zN-chrome-…`) ou vérifier chaque capture (L12) — c'est la capture qui l'a montré, pas un contrôle.
