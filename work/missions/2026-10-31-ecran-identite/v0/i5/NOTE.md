# i5 — La roue des styles

- **Chaleur** : chaude : forme libre (une roue), la baseline gardée en haut et en bas.
- **Axes** : A6 (partir d'un style), A1, A3 (chiffres du style, sans barres).
- **L'idée** : Partir d'un style en tournant une roue au pouce : douze secteurs à la couleur réelle de chaque style, du plus pâle au plus sombre ; le verre prend la couleur du style choisi.
- **État montré** : recette neuve, Double IPA choisie.
- **Recette** : neipa v3, Double IPA 22A, 24 L, 60 min, OG 1,080, IBU ~93, EBC 9,5, Royal Catering · cuve 45 L, fermenteur 30 L (export réel `recette-neipa-v3.txt`).
- **Captures** (ouvertes) : `i5-haut.png` (premier écran), `i5-page.png` (page entière).
- **Mesures** : 65 mots au premier écran ; remplissage 0,59.

## Acquis de la baseline
- [x] En-tête commun tel quel : ‹, « Identité 1/7 », pas d'« Abandonner » sur la recette neuve, icône d'import, thème.
- [x] Fil des 7 étapes, tel quel.
- [x] Bandeau Grain · OG · IBU · EBC, tel quel quand la recette a des ingrédients ; absent sur une recette neuve, comme dans l'app (`hasMetrics`).
- [x] Pied « Retour · Suivant — Malts/sucres » tel quel. Le lanceur + commun n'est pas dessiné ; aucune valeur n'occupe son coin bas droit.
- [x] Honnêteté : évaporation lue au profil Royal Catering (3 L/h, export de neipa v3), jamais le repli de 10 %/h sans le dire ; 20 % d'espace libre marqué « repère » ou « ~ » ; remplissage conseillé marqué conseil (tireté) ; un inconnu en « — », jamais 0.
- [x] Interdits : pas de cockpit, pas de légende au repos (« ? » fermé), en-tête inchangé, pas de badge « 16D hypothèse », pas de bouton imposant, pas de superposition, rien sous 12 px (13 px au plus petit), pas de `type="number"`.

## Boosters UX (boosters-ux)
- Booster : roue-styles — choisir ; roue ; secteurs peints du SRM min au max ; glisser ou toucher un secteur la fait tourner, flèches ‹ › en équivalent (JS)
- Booster : chercher-style — chercher ; champ ; tous les styles, création comprise (statique)
- Booster : chiffres-style — lire ; OG, IBU, alcool du style choisi ; suivent la roue (JS)
- Booster : nolo — activer ; interrupteur (JS)
- Booster : jauge-fermenteur — lire ; mini jauge 24/30 ; statique
- B1 OK — 5 boosters marqués `data-booster` ; chaque décision du premier plan a le sien.
- B2 OK — la roue domine, puis le verre ; une action primary.
- B3 OK — 65 mots ; légende derrière « ? ».
- B4 OK — le style (verre et chiffres), la roue, le brassin.
- B5 à mesurer (R2).
- B6 ECHEC partiel — 28 (style), 16, 14 et 13 px.
- B7 OK — CONTRASTE OK (thème clair) ; la couleur accompagne toujours un mot ; le thème cave n'est pas mesuré en v0.
- B8 OK — « Créer » hachuré pour un style hors liste.
- B9 OK — rotation de 250 ms, coupée sous prefers-reduced-motion ; le glisser a son équivalent au toucher.
- B10 OK.
- B11 OK — phrase tirée de la capture : « Je tourne la roue jusqu'à Double IPA ; OG 1,065–085, IBU 60–100 ; 24 L. »
- B12 OK — rayons de 8 px, pilules ; pastille de famille au code.
- B13 à mesurer (R5) ; secteurs larges.
- Écarts voulus : rayons de 8 px (et 4) au lieu des 10 et 16 px de DESIGN.md, pour tenir `controle-standard` (2, 4 ou 8 px), comme les maquettes houblons choisies ; séparateurs « · » et « — » dessinés en CSS.

## Ce qui tient, ce qui casse
- Tient : Le geste du pouce, et l'échelle EBC qui ordonne les styles : la couleur dit le style avant le mot.
- Casse : Douze styles seulement sur la roue ; les noms longs sont abrégés (« Am. IPA », « Oatmeal »). 21A et 22A ont la même plage de couleur et se suivent.

## Contrôles (joués une fois pour la série, sorties recopiées)
- `verifier-page.mjs etat.html --captures` : PAGE OK (390 px, sans erreur), pour les six.
- `mots-premier-ecran.mjs v0 i1 … i6 --page=etat.html --max=80` : MOTS OK (i1 74, i2 78, i3 77, i4 78, i5 65, i6 80).
- `controle-panel.mjs` sur les six premiers écrans : « remplissage médian 0,59, 1 sous 0,50 · ressemblance moyenne 0,88 · paires presque identiques 0/15 (0 %) » → PANEL OK.
- `controle-commun.mjs v0 i1 … i6 --page=etat.html --sans=mots,au-style,fiche,trait` : COMMUN OK (couleurs, survol, blocs, contraste, standard, légende, parlant, brutes).
  Écarts : `au-style`, `fiche` et `trait` visent les familles d'arômes, la fiche d'un houblon et ses pictos ; l'Identité n'en montre aucun (hors objet, aucun nom de houblon affiché). `mots` est joué à part, à 80 (J4).
- `grep type="number"` : 0. Registre `ecrans.json` : aucune maquette choisie pour l'Identité (choix ouvert), donc pas de `controle-choix`.
