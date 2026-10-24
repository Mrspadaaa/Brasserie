# flb3b — passe 2 de flb3 (série b, la signature, puis le reste)

- **Chaleur** : tiède (forme de la série : la signature d'abord, en une phrase de ses seuls mots).
- **Origine** : flb3 (v0, intacte), candidate n° 1 du conseil (`conseil-fl/verdict.md`, recommandation 1).
- **Fichiers** : `etat.html` écrit par `generer.mjs` ; socle et données copiés de flb1 dans ce dossier (`socle-flb.mjs`, `donnees-flb.mjs`), pour ne pas toucher à la v0 ; captures par `capturer.mjs`.

## Retouches et leur mesure (recomptées sur les captures)

1. **Onglets des houblons sortis de la fiche** : au-dessus de l'étape, avec la question en titre (« Que sent ce houblon, dit avec ses mots ? ») et la ligne de contexte « fixé : Stout export 16D · levure US-05 ». Les onglets sont le seul facteur libre déclaré (`data-libre="houblon"`) ; la feuille ne contient plus de sélecteur. Mesure : UNE-QUESTION OK (1 groupe libre : houblon ; contexte : base, levure).
2. **Zone 16D en pointillé gris d'une seule teinte** : les secteurs Floral, Herbacé et Terreux (ce que la stout attend) en `#f1f2f5`, trait `#8a8f9c` en pointillé, au lieu des trois couleurs de famille. Absolu à un toucher : la zone disparaît.
3. **Règle de repli** : si aucun mot signant n'est dit par toutes ses fiches, la phrase prend ceux d'au moins la moitié de ses fiches, chacun avec son compte, et le dit (« aucun mot dans ses 4 fiches à la fois : ceux d'au moins 2 sur 4 »).
   - Nelson Sauvin (règle normale) : « Vin blanc, raisin, groseille à maquereau. », 2/2 chacun ; « vin blanc » d'abord dans toutes ; puis sauvignon blanc 1/2 (`flb3b-nelson.png`).
   - Nugget (repli) : « Boisé 2/4, ananas 2/4. » ; puis gingembre, géranium, litchi, noix de coco, 1/4 chacun (`flb3b-nugget.png`).
   - Cascade (repli) : « Citron vert 1/2, pamplemousse 1/2, cassis 1/2. » ; puis pin 1/2 (`flb3b-cascade.png`). La phrase garde trois mots au plus : le pin, à égalité (1/2), passe en « puis ».
   - Citra cryo (une seule fiche) : la ligne d'après s'appelle « aussi », pas « puis », car tous ses mots sont à 1/1.
4. **« non décrites » en ligne de pictos « ? »** : picto de la famille suivi d'un « ? » à sa couleur ; les noms sont dans l'aria-label et la légende. Recompté : Nelson Sauvin 10 (Tropicaux, Noyau, Pépins, Baies, Melon, Floral, Herbacé, Résineux, Végétal, Terreux), Nugget 5 (Noyau, Pépins, Baies, Melon, Végétal, comme g1), Cascade 6.
5. **Un seul α, celui de g1** : Hopsteiner 2025 s'il existe, sinon la seule fiche (Citra cryo : Beer Maverick 2023). Nelson Sauvin α 12–14 %, lot 9,6 % (hors de la plage, en orangé) ; Nugget α 11–14 %, lot 13 % ; Cascade α 4,5–7 %, lot 6,5 % ; Motueka 6,5–8,5 %, lot 8,1 % ; Citra cryo 10–15 %, lot 24,8 %. Police du thème (plus de chasse fixe sur l'α). La fiche courte (appui long) suit la même règle.
6. **Mots au premier écran** (G4) : « Agrumes et Épicé : Hopsteiner le range ainsi, sans mot » devient « cat. » après le compte (Nelson : Agrumes 1/2 cat., Épicé 1/2 cat.), expliqué dans la légende ; le libellé « le radar dit aussi » est retiré. 86 → 76 mots.

## Ce qui tient, ce qui casse

- Tient : Nelson Sauvin se lit en trois secondes (vin blanc, raisin, groseille) ; le repli garde l'honnêteté sur Nugget et Cascade, compte affiché.
- Casse : sur Cascade, la phrase en repli fait trois lignes de 1/2 : moins une signature qu'un choix parmi des égaux. La forme neutre « autres » de D100 n'est toujours pas dessinée (contrôle indicatif ci-dessous).

## Sorties des contrôles (24.10, flb3b seule)

- G2 `controle-commun … flb3b --page=etat.html --sans=mots` : couleurs, au-style, survol, blocs, contraste, fiche, standard, trait, legende, parlant, brutes OK → COMMUN OK.
- G3 `controle-une-question … flb3b --page=etat.html` : UNE-QUESTION OK (1 groupe libre : houblon).
- G4 `mots-premier-ecran … flb3b --max=80 --page=etat.html --sans-donnees` : 76 mots → MOTS OK.
- Indicatif `controle-sans-famille` : ECHEC (Nelson Sauvin 83 %, pas de forme `data-role="autres"`).
- Non joués ici : controle-fiche-baseline, controle-fiche-radar, controle-teinte, controle-choix (colonne Contrôles de fl-passe2) : le message du pilote demandait G2 à G4.

Captures : `captures/flb3b-nelson.png`, `flb3b-nugget.png`, `flb3b-cascade.png`, `flb3b-page.png`, `flb3b-nugget-page.png`, `flb3b-legende.png`, `flb3b-fiche-courte.png` (390 × 844, ×2) ; Nelson, Nugget et Cascade ouvertes et recomptées, les autres non regardées.
