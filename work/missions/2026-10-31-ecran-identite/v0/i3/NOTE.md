# i3 — Coller d'abord, sinon un style

- **Chaleur** : tiède : la forme de l'approche « entrée », un départ par écran.
- **Axes** : A6 (grande entrée « coller ou partir d'un style » sur recette neuve), A1, A4.
- **L'idée** : Une recette vide commence par le geste le plus rapide, coller ; sinon un style, pris dans un nuancier où chaque carte a la couleur réelle de sa plage SRM et la teinte de sa famille.
- **État montré** : recette neuve (premier écran), puis l'étape après le collage (page entière).
- **Recette** : neipa v3, Double IPA 22A, 24 L, 60 min, OG 1,080, IBU ~93, EBC 9,5, Royal Catering · cuve 45 L, fermenteur 30 L (export réel `recette-neipa-v3.txt`).
- **Captures** (ouvertes) : `i3-haut.png` (premier écran), `i3-page.png` (page entière).
- **Mesures** : 77 mots au premier écran ; remplissage 0,59.

## Acquis de la baseline
- [x] En-tête commun tel quel : ‹, « Identité 1/7 », pas d'« Abandonner » sur la recette neuve (comme l'app), icône d'import, thème.
- [x] Fil des 7 étapes, tel quel.
- [x] Bandeau Grain · OG · IBU · EBC, tel quel quand la recette a des ingrédients ; absent sur une recette neuve, comme dans l'app (`hasMetrics`).
- [x] Pied « Retour · Suivant — Malts/sucres » tel quel. Le lanceur + commun n'est pas dessiné ; aucune valeur n'occupe son coin bas droit.
- [x] Honnêteté : évaporation lue au profil Royal Catering (3 L/h, export de neipa v3), jamais le repli de 10 %/h sans le dire ; 20 % d'espace libre marqué « repère » ou « ~ » ; remplissage conseillé marqué conseil (tireté) ; un inconnu en « — », jamais 0.
- [x] Interdits : pas de cockpit, pas de légende au repos (« ? » fermé), en-tête inchangé, pas de badge « 16D hypothèse », pas de bouton imposant, pas de superposition, rien sous 12 px (13 px au plus petit), pas de `type="number"`.

## Boosters UX (boosters-ux)
- Booster : puits-coller et coller — déclencher ; zone tiretée et bouton primary ; feuille illustrée et sept traits « ce qu'un collage remplit » ; statique
- Booster : photo — déclencher ; bouton ; caméra ; statique
- Booster : nuancier-styles — choisir ; 12 cartes ; bande du SRM min au max (BJCP 2021) et teinte de famille (BeerStyleTag) ; la carte touchée se cerne (JS)
- Booster : chercher-style — chercher ; champ ; la combobox complète, création comprise (statique)
- Booster : nolo — activer ; interrupteur (JS)
- Booster : jauge-fermenteur — lire ; mini jauge 24/30 et conseil tireté ; statique
- Booster : evaporation — lire ; −3 L ; statique
- B1 OK — 7 boosters marqués `data-booster` ; chaque décision du premier plan a le sien.
- B2 OK — le puits domine ; une seule action primary (Coller) ; Suivant passe en secondaire sur une recette vide.
- B3 OK — 77 mots ; légende derrière « ? ».
- B4 OK — coller, ou un style, puis le brassin : trois groupes.
- B5 à mesurer (R2).
- B6 OK — 18, 14 et 13 px ; mono pour les mesures et les codes.
- B7 OK — CONTRASTE OK (thème clair) ; la couleur accompagne toujours un mot ; le thème cave n'est pas mesuré en v0.
- B8 OK — recette neuve ; le nom vient après (J2).
- B9 OK — la carte choisie se cerne au toucher.
- B10 OK.
- B11 OK — phrase tirée de la capture : « Recette vide : je colle, ou je prends un style dans le nuancier ; 24 L, 60 min. »
- B12 OK — échelle EBC seulement pour la bière (bandes) ; palette de famille seulement en pastille et fond de carte.
- B13 à mesurer (R5).
- Écarts voulus : rayons de 8 px (et 4) au lieu des 10 et 16 px de DESIGN.md, pour tenir `controle-standard` (2, 4 ou 8 px), comme les maquettes houblons choisies ; séparateurs « · » et « — » dessinés en CSS.

## Ce qui tient, ce qui casse
- Tient : Répond à J2 (« coller une recette, ou partir d'un style ») en un écran ; la couleur des cartes est une vraie donnée (plages SRM du catalogue).
- Casse : Le nuancier pousse volume, ébullition et NOLO vers le bas. Les douze styles sont tirés du catalogue BJCP, pas de son carnet : en passe 2, prendre ses styles (Suggestions.recipeStyles).

## Contrôles (joués une fois pour la série, sorties recopiées)
- `verifier-page.mjs etat.html --captures` : PAGE OK (390 px, sans erreur), pour les six.
- `mots-premier-ecran.mjs v0 i1 … i6 --page=etat.html --max=80` : MOTS OK (i1 74, i2 78, i3 77, i4 78, i5 65, i6 80).
- `controle-panel.mjs` sur les six premiers écrans : « remplissage médian 0,59, 1 sous 0,50 · ressemblance moyenne 0,88 · paires presque identiques 0/15 (0 %) » → PANEL OK.
- `controle-commun.mjs v0 i1 … i6 --page=etat.html --sans=mots,au-style,fiche,trait` : COMMUN OK (couleurs, survol, blocs, contraste, standard, légende, parlant, brutes).
  Écarts : `au-style`, `fiche` et `trait` visent les familles d'arômes, la fiche d'un houblon et ses pictos ; l'Identité n'en montre aucun (hors objet, aucun nom de houblon affiché). `mots` est joué à part, à 80 (J4).
- `grep type="number"` : 0. Registre `ecrans.json` : aucune maquette choisie pour l'Identité (choix ouvert), donc pas de `controle-choix`.
