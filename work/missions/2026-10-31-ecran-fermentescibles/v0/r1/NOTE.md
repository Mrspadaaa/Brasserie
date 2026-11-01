# r1 — la liste nette, le rayon sous la main (v0, Malts/sucres 2/7, 31.10)

- **Chaleur** : froide (la baseline affinée : mêmes blocs, l'ajout toujours ouvert, sans phrase d'aide).
- **Axes** : A1 (a) liste compactée, une barre de part sous chaque grain ; A2 (a) masse pas à pas (− champ +), tapable ; A3 (b + c) champ toujours ouvert, Entrée puis masse, et habituels en puces ; A4 (b) pastille de teinte, « ? » si inconnue.
- **L'idée** : l'écran d'aujourd'hui sans son formulaire : la recette en lignes nettes (teinte, nom, moment, part, masse), puis le rayon des habituels ouvert, chaque puce ajoute en un toucher.
- **Série** : r, représentations distinctes dans la langue de r4-a.

## Ce qui tient
- Lecture immédiate : trois lignes, trois « ? », « 3 à renseigner » ; le geste ? → 3,5 colore la pastille et la barre (`r1-geste-teinte.png`).
- Les 5 familles en segment (le baseline les cachait derrière une pastille qui tourne) ; les puces des autres familles portent un cube et ajoutent dans leur famille, figée.
- Clavier : « Cara », Entrée, la masse prend le focus à 0, « 0,3 », Entrée, le focus revient au champ (`r1-geste-ajout.png`).

## Ce qui casse
- Remplissage 0,45 (le plus bas de la série) : avec trois grains, le premier écran garde ~130 px vides sous le pied.
- Le rayon passe sous la liste (le baseline le met au-dessus) : écart voulu, la recette d'abord (« des le premier coup d'œil, quel matière première j'ai »).
- Le stepper prend 130 px par ligne : 8 lignes tiennent (1,03 écran), mais la barre de part y disparaît (mode serré).

## Acquis de la baseline
- [x] En-tête « ‹ Fermentescibles 2/7 », import, thème (sans « Abandonner », comme la capture de l'étape) ; fil des 7 étapes, Malts/sucres courant, Identité faite ; bandeau Grain · OG · IBU · EBC ; pied « Retour · Suivant — Houblons » ; + flottant. Repris de r4-a, non redessinés.
- [x] Ligne : nom, moment (pastille qui tourne, tons de l'app : ébullition rouge, fermentation verte), part « % du grain », masse.
- [x] 5 familles ; famille figée sur la ligne (étiquette « Sucre », « Lactose », non cliquable) ; masse à 0 à l'ajout (en ocre) ; jour d'ajout J+3 tapable en fermentation (annexe : purée de mangue) ; avertissement lactose (annexe et état `#huit`) ; avertissement de densité (annexe, exemple d'une autre recette) ; parcours au clavier.

## Honnêteté des données
- Sa recette : Pilsner Malz 5,0 kg (63 %), Weizenmalz hell 1,5 kg (19 %), Haferflocken 1,5 kg (19 %) ; couleurs « ? » ; EBC « — » ; OG « — », IBU 24 comme l'app.
- `#couleurs` : 3,5 · 4 · 2 EBC saisis → EBC 7,3, calculé par Morey comme `computeBeerColor` (30 L). `#sucre` : + dextrose 0,4 kg, ébullition (pas de part du grain, comme l'app).
- Rendement « 75 % repère », replié. Les puces sont un stock de démonstration (noms seuls, sans couleur) ; l'app montrera son stock.

## Contrôles (31.10)
- `verifier-page.mjs` : PAGE OK. `mots-premier-ecran --profil=sans-houblons --max=80` : 68 mots, MOTS OK.
- `controle-commun --profil=sans-houblons` : mots, survol, blocs, contraste, standard, parlant, brutes OK ; **couleurs ECHEC** (1 teinte franche, l'ocre de « à renseigner »). Écart voulu : sa recette n'a aucune couleur connue ; inventer des teintes trahirait J7. Elles arrivent avec les données (`r1-couleurs.png`).
- `controle-contraste --profil=sans-houblons` : CONTRASTE OK (pire 4,82:1). `type="number"` : 0.
- `capturer.mjs` (série) : 8 grains à 1,03 écran ; gestes sans erreur ni valeur brute.
- `controle-panel` (série) : voir `../r-serie/RESULTAT.md` (r1 à 0,45).
- `controle-choix` : s.o. (écran ouvert, aucun choix au registre).

## Captures (ouvertes)
`r1-haut.png`, `r1-page.png`, `r1-couleurs.png`, `r1-sucre.png`, `r1-vide.png`, `r1-huit.png`, `r1-geste-teinte.png`, `r1-geste-saisie.png`, `r1-geste-ajout.png`, `r1-ordinateur.png` (1280).

## Boosters UX (boosters-ux)
- teinte-pastille — ajuster ; bouton « ? » → champ EBC sur place ; la pastille prend la teinte, la barre aussi (avant/après : `r1-haut`, `r1-geste-teinte`).
- pas-masse — ajuster ; − / champ tapable / +, 0,05 kg sous 1 kg, 0,1 au-dessus, ↑ ↓ au clavier.
- puces-habituels, ajout-clavier, familles — déclencher ; un toucher ajoute ; Entrée ajoute la première puce ou crée « Créer « X » ».
- moment-cycle — choisir ; la pastille tourne empâtage → ébullition → fermentation (J+ apparaît).
- part-barre — lire ; la part du grain en barre teintée (hachurée si inconnue).
- B1 OK · B2 OK (la liste ; un seul primaire) · B3 OK (68 mots, 7 blocs) · B4 OK (recette / rayon) · B5 non mesuré · B6 OK (12, 14, 16 px ; mono pour les mesures) · B7 OK (clair ; cave non mesuré) · B8 OK (vide, inconnu « ? », 0 en ocre, 8 grains) · B9 partiel (flash de la ligne ajoutée, mouvement réduit respecté) · B10 OK · B11 « Trois grains, 8 kg, couleurs à renseigner ; j'ajoute du rayon. » · B12 OK · B13 OK (cibles ≥ 24 px).
