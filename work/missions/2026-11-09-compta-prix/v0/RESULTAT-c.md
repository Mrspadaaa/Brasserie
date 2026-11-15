OK — 6 concepts v0 coût du litre et prix (c1a–c2c), NOTE, captures ouvertes

## Fichiers écrits (voie c seulement)
`v0/c1a/`, `v0/c1b/`, `v0/c1c/`, `v0/c2a/`, `v0/c2b/`, `v0/c2c/` : chacun `etat.html`, `NOTE.md`, `<id>-haut.png`, `<id>-page.png`, `<id>-1280.png`. Ce fichier.
Script de capture à 1280 hors dépôt (dossier temporaire de la session). Rien dans `src/`, aucun commit ; `git status` : seul `SPEC-BRASSEUR.md` modifié, déjà avant la voie.

| id | écran | chaleur | idée |
|---|---|---|---|
| c1a | coût d'un brassin | froide | la feuille d'aujourd'hui, deux tuiles « À payer 64,26 » (poche) / « Le litre 7,51 » (coût), ↗ sur chaque poste payé maintenant |
| c1b | coût d'un litre | tiède | le verre doseur gradué en francs, une couche par poste, curseur des litres nets |
| c1c | coût d'un brassin | chaude | flux (Sankey) « quand tu paies → pour quoi », fini en « ÷ 27 L = 7,51 » ; toucher « Maintenant » donne 64,26 |
| c2a | prix et marges | froide | tableau relié au litre 6,37, barre coût / reste par format, Privé / Pro, reste par brassin de 27 L ; état vide |
| c2b | prix et marges | tiède | cascade litre → bouteille → impôt → coût, curseur de prix, reste vivant ; états « à perte » et fût incomplet |
| c2c | prix et marges | chaude | trois formats ramenés au litre côte à côte ; Prix déplacé dans Finances ; IA « Proposer » en fantôme « exemple » |

Chiffres : tous tirés de `src/dev/financeDemo.ts` (malt 44,83 ; frais 41,84 ; charges fixes 4 800/1 200 L → 108,00 ; amortissement 8,10 ; 7,51 CHF/L ; à payer 64,26) ; impôt 25,32 CHF/hl ; prix marqués « exemple ». Houblon et levure absents de la recette de démo : « ? » hachuré, jamais 0. Emballage 33 cl = 24,00 ÷ 81 (estimé) ; 75 cl et fût : inconnus (« ≥ », « ≤ »). Aucun IBAN.
IA (ajout du 09.11) : un bouton au toucher par concept (Pourquoi ce loyer ? · Baisser ? · Expliquer · Proposer), rendu dessiné dans c2c cadre 2. Maquettes statiques (09.11) : les états utiles sont dessinés en cadres voisins.

## Sorties décisives
- `verifier-page.mjs` ×6 : PAGE OK (390 px, sans erreur) ; 1280 : débord 0 ×6.
- `controle-panel.mjs` (6 premiers écrans) : remplissage médian 0,70, 1 sous 0,50 (c2a 0,411), ressemblance 0,81, 0/15 paires identiques → PANEL OK.
- `controle-commun.mjs v0 c1a c1b c1c c2a c2b c2c --page=etat.html --profil=sans-houblons` : COMMUN OK (mots, couleurs, survol, blocs, contraste, standard, parlant, brutes).
- `mots-premier-ecran` : c1a 98 · c1b 68 · c1c 59 · c2a 98 · c2b 94 · c2c 48 → MOTS OK (alerte modérée sur c1a, c2a, c2b ; chiffres compris dans le compte).
- `type="number"` : 0.

## Captures (ouvertes)
`v0/c1a/c1a-haut.png`, `c1a-page.png`, `c1a-1280.png` ; idem pour c1b, c1c, c2a, c2b, c2c (même dossier que chaque `etat.html`).

## Prédiction
Il prendra c1c ou c1b pour le coût (« ton litre, c'est surtout le loyer » se voit d'un coup) et c2c pour les prix, en demandant le Privé / Pro et le reste par brassin de c2a.

DÉCISION À PRENDRE : Prix et marges reste dans Clients (c2a, c2b) ou part dans Finances (c2c) ; le coût du litre vit dans la feuille (c1a) ou dans le brassin (c1b, c1c). Se montre en variantes, déjà dessinées.
CONNAISSANCE : la fixture de démo décompose 7,51 CHF/L ainsi : charges fixes 4,00 (53 %), malt 1,66, emballage 0,89, énergie 0,30, matériel 0,30, impôt 0,25, nettoyage 0,11 ; la part de l'année (4 800 CHF ÷ 1 200 L) pèse plus que les ingrédients, ce qui fait du fût 20 L (≤ 1,38 CHF/L de reste à 160 CHF) un format presque sans marge.
LEÇON PROPOSÉE : `controle-panel` compte vides les interlignes d'une liste dense (c2a, 0,41 alors que l'écran est plein à l'œil) et ne voit pas un fond de panneau #F5F5F5 (écart ≤ 60) ; préciser dans le brief que le remplissage se gagne par du contenu, pas par des fonds gris plus foncés.
