# z1 — le champ toujours prêt, la ligne qui se tape (froide)

- **Chaleur** : froide. La liste actuelle, compactée et affinée ; rien n'est inventé dans la forme.
- **Axes** : A1 liste compactée · A2 masse pas à pas (−/+) **et** tapable sur place, ↑↓ au clavier · A3 champ toujours ouvert, nom, Entrée, puis masse, avec les 5 familles en segments sous le champ · A4 pastille de teinte, « ? » tiretée si inconnue, et « à renseigner » sur la ligne (J4).
- **Idée** : l'ajout n'est plus une liste à ouvrir : un champ prêt en tête, et chaque ligne se corrige là où elle se lit.

## Baseline (J12, J5), cochée
- [x] en-tête « ‹ Fermentescibles 2/7 », import, thème · [x] fil des 7 étapes, Malts/sucres courant · [x] bandeau Grain · OG · IBU · EBC · [x] pied « Retour · Suivant — Houblons » · [x] + flottant (n'ajoute pas).
- [x] ligne : nom, moment, part (barre et %), masse · [x] 5 familles (segments) · [x] famille figée sur la ligne (seule la masse et le moment s'y changent) · [x] masse à zéro à l'ajout (joué : « Dextrose », Entrée → 0,0 kg, focus sur la masse) · [x] jour d'ajout en fermentation (annexe, mangue J3) · [x] avertissement lactose (annexe) et densité (annexe, OG calculée) · [x] clavier : nom, Entrée, masse (script `captures-etats.mjs`, focus = « Masse de Dextrose, en kilogrammes »).
- Honnêteté (J7) : « ? » sur chaque pastille et « à renseigner » sur chaque grain ; EBC « — » tant qu'une couleur manque, puis « ~7,6 » (Morey, comme `beerColor.ts`) ; OG « — » comme l'app ; rendement « 75 % repère » ; stock : 0 mot.

## Boosters UX (boosters-ux)
- Boosters : `champ-toujours-pret` — déclencher ; champ + ↵ ; la ligne naît à 0 kg et le curseur passe à la masse (captures `z1-saisie.png`, `z1-sucre.png`) · `familles-segmentees` — choisir ; 5 segments ; la famille du prochain ajout, moment déduit · `couleurs-a-renseigner` — déclencher ; bandeau ambre + « à renseigner » par ligne ; ouvre 3 champs EBC, Entrée passe au suivant (`z1-couleurs.png`) · la masse : −/+ et champ sur place, ↑↓.
- B1 OK (4 boosters, chacun change l'écran) · B2 OK (la liste domine, un seul aplat noir : Suivant ; le segment Grain est un état, pas une action) · B3 OK (76 mots, 7 éléments) · B4 OK · B5 OK (gaps 4/6/8) · B6 OK (12/14/16 ; mono tabulaire pour kg, %, EBC) · B7 OK (CONTRASTE OK, pire 5,21:1) · B8 OK (vide, lactose, fermentation J3, densité : annexe) · B9 partiel (retour au toucher par l'état actif des −/+ ; pas de mouvement) · B10 OK (0 `type="number"`, `inputmode="decimal"`, virgule) · B11 OK (« trois grains, 8 kg, couleurs à renseigner, j'ajoute ici ») · B12 OK (rayons 10/16, STANDARD OK) · B13 OK (24 × 28 px au moins).
- Écarts voulus : B9 — aucune animation en v0.

## Tient / casse
- Tient : 76 mots ; 0,88 écran avec 3 grains, ~1,0 avec 8 (lignes de 58 px) ; PAGE OK ; COMMUN : mots, survol, blocs, contraste, standard, parlant, brutes OK ; COULEURS ECHEC (1 teinte franche : les couleurs de sa recette manquent, l'écran reste neutre par honnêteté ; une fois renseignées, les pastilles prennent leur teinte) ; MOTS OK ; CONTRASTE OK.
- Casse : remplissage du premier écran 0,40 (panel) : trois lignes, puis le pied ; la liste ne grossit pas sans données. Froide, c'est le plancher.

## Captures (ouvertes)
`z1-haut.png` (repos), `z1-page.png`, `z1-couleurs.png` (3,5 · 4 · 2 EBC → ~7,6), `z1-saisie.png` (« Dextrose » tapé, « Créer » en ligne), `z1-sucre.png` (dextrose 0,4 kg à l'ébullition, 5 % ferm.), `z1-1280.png`.
