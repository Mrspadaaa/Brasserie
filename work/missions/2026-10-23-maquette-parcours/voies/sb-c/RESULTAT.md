OK — Substituer série c : huit concepts v0 « vraies valeurs d'abord », baseline et panel OK

## Concepts (une ligne chacun : chaleur, idée, ce qui tient, ce qui casse)
- sbc1 · chaleur froide · u4 affiné : liste classée à plages de score, avec α, dose au même IBU et stock en ligne, puis le face-à-face · tient : la structure de u4, plus d'« arôme 100 », ma stout simulée à 60′, une ligne « au whirlpool la réponse change » · casse : la plage est un calcul de la page, 96 mots hors données.
- sbc2 · chaleur froide · le face-à-face de u4 en tête : sept vraies valeurs, Nugget en contour et le remplaçant en plein, « recouvre / plus bas / plus haut » · tient : Nugget reste le gabarit (pas Comparer), dose, stock restant, mots de fiche · casse : puces au-delà de la 4e hors écran ; remplissage 0,50, au bord.
- sbc3 · chaleur tiède · la règle α : un trait par fiche, le lot en repère, la colonne de Nugget, les grammes au même IBU · tient : Nelson 9,6 % → ~62 g et Galaxy 17,2 % → ~35 g en un regard · casse : huiles et arômes à un toucher seulement.
- sbc4 · chaleur tiède · éprouvettes de grammes devant ton stock, ligne de Nugget 46 g · tient : « assez en stock : Nelson Sauvin et Galaxy » sans lire · casse : Target garde 94 alors que le moteur le relègue (écrit dans sa carte) ; Altus ne tient pas.
- sbc5 · chaleur tiède · le tableau des preuves : sept valeurs en pastilles face à Nugget, fiches lues, score et fiabilité · tient : on voit pourquoi Altus, Trident et Zenia ont une plage · casse : légende nécessaire pour demi et creux.
- sbc6 · chaleur chaude · les huiles en flacons, composés en couches aux couleurs de leur famille, étagère · tient : Galaxy et Altus (hachuré) se distinguent sans lire ; « à 60′ l'huile pèse 0,2 » · casse : le lien composé → famille est une convention ; la valeur la moins utile à 60′.
- sbc7 · chaleur chaude · l'étiquette du sac : sac vide de Nugget, étiquette du remplaçant avec ses vraies valeurs, tampon de dose, étagère · tient : Nelson Sauvin garde sa réputation (vin blanc, groseille à maquereau, raisin, L14) · casse : dense ; score réduit au tampon.
- sbc8 · chaleur chaude · le ticket du calcul : des vraies valeurs au score, ligne à ligne, poids à 60′ · tient : « rien d'étranger » remplace l'« arôme 100 » · casse : chiffres de méthode (risque « chimie nue »), deux α pour un houblon, 95 mots.

## Fichiers écrits (dans Possède)
- `work/refonte-frontend/v4/ecran-1/fils24-substituer/sbc1…sbc8/` : `concept.mjs`, `etat.html`, `NOTE.md`
- `sbc1/commun/` : `socle-sbc.mjs` (vocabulaire, pas un gabarit), `generer.mjs`, `captures.mjs`, `donnees-sbc.json`, `extraction/` (extraire.ts, biere.ts, construire-donnees.mjs : moteur v4 `substitutes` + `hopSheet`, parcours `lireBiere`)
- `captures/sbc*-premier-ecran.png`, `-page.png`, `-choix-<houblon>.png`, `-fiche.png` (8 × 4)

## Critères
- G1 : `SERIE-BIEN-8`
- G2 : `controle-commun … --page=etat.html --sans=mots` → `COMMUN OK` (couleurs, au-style, survol, blocs, contraste, fiche, standard, trait, legende, parlant, brutes)
- G3 : `systeme.mjs note … --contient` → NOTE OK (voir ci-dessous, rejoué)
- Panel : `controle-panel.mjs` (8 premiers écrans) → médiane 0,63, 1 sous 0,50, ressemblance 0,84, 0 paire identique → `PANEL OK`
- Indicatifs, joués une fois et recopiés dans les NOTE : `UNE-QUESTION ECHEC` (le contrôle ne reconnaît pas les cartes-choix `aria-pressed` comme options du facteur « houblon », et 7 pages sur 8 n'ont pas de ligne `data-contexte`) ; `SANS-FAMILLE ECHEC` (Nelson Sauvin 83 % sans famille : ses mots sont écrits dans sbc2, sbc7, sbc8, mais jamais en part « autres » dessinée) ; `MOTS ECHEC 2/8` (sbc1 96, sbc8 95).

## Captures regardées
Les huit premiers écrans, plus `sbc1-choix-nelson-sauvin`, `sbc1-fiche`, `sbc3-choix-galaxy`, `sbc4-choix-sabro`, `sbc8-choix-galaxy`.

## Prédiction
« sbc4 et sbc3, très bien : je vois tout de suite qu'avec mon stock c'est Nelson ou Galaxy et combien de grammes ; sbc7 pas mal pour Nelson, mais sbc8 trop de chiffres. »

DÉCISION À PRENDRE : la convention de `controle-une-question` pour un outil dont le facteur libre est un houblon choisi dans une liste (carte `data-choix` + `aria-pressed`, contexte `data-contexte`) : à fixer avant la passe 2, où ce contrôle devient obligatoire.

CONNAISSANCE : à 60′, remplacer Nugget ne bouge presque pas le profil simulé de la stout (± 1 à 2 sur 110 ; le résineux reste hors style, 82 à 85, quel que soit le remplaçant) ; au whirlpool l'ordre s'inverse (Target 86, Idaho 7 82, Magnat 77, Nelson Sauvin 42 ; Magnat et Yeoman 99 à 60′). Le stock du moteur (Nelson 100 g, Galaxy 60 g) diffère de celui de `socle-w.mjs` (0 g) : un socle du lot 21 lit proto-data, pas les fiches de stock.

LEÇON PROPOSÉE : `controle-panel` compte une ligne de pixels pleine si plus de 2 % de ses pixels s'écartent du fond de plus de 60 (somme RVB) : un gris #f5f5f5 sur blanc ne compte pas. Le dire dans le brief, sinon les pages denses mais aérées échouent (ici 4 sur 8 au premier jet).
