# i4 — Reprendre : v3 vers v4

- **Chaleur** : tiède : la forme de l'approche (repartir d'une recette).
- **Axes** : A6 (une reprise contre une recette neuve), A1, A2.
- **L'idée** : Une reprise se lit contre sa source : la colonne v3 en gouttière verte « = », ou ambre pour ce qui a changé (barré, avec retour d'un toucher) ; et le choix « Nouvelle version » ou « Modifier v3 ».
- **État montré** : neipa v3 dupliquée, ébullition passée de 60 à 90 min.
- **Recette** : neipa v3, Double IPA 22A, 24 L, 60 min, OG 1,080, IBU ~93, EBC 9,5, Royal Catering · cuve 45 L, fermenteur 30 L (export réel `recette-neipa-v3.txt`).
- **Captures** (ouvertes) : `i4-haut.png` (premier écran), `i4-page.png` (page entière).
- **Mesures** : 78 mots au premier écran ; remplissage 0,65.

## Acquis de la baseline
- [x] En-tête commun tel quel : ‹, « Identité 1/7 », « Abandonner » (brouillon), icône d'import, thème.
- [x] Fil des 7 étapes, tel quel.
- [x] Bandeau Grain · OG · IBU · EBC, tel quel quand la recette a des ingrédients ; absent sur une recette neuve, comme dans l'app (`hasMetrics`).
- [x] Pied « Retour · Suivant — Malts/sucres » tel quel. Le lanceur + commun n'est pas dessiné ; aucune valeur n'occupe son coin bas droit.
- [x] Honnêteté : évaporation lue au profil Royal Catering (3 L/h, export de neipa v3), jamais le repli de 10 %/h sans le dire ; 20 % d'espace libre marqué « repère » ou « ~ » ; remplissage conseillé marqué conseil (tireté) ; un inconnu en « — », jamais 0.
- [x] Interdits : pas de cockpit, pas de légende au repos (« ? » fermé), en-tête inchangé, pas de badge « 16D hypothèse », pas de bouton imposant, pas de superposition, rien sous 12 px (13 px au plus petit), pas de `type="number"`.

## Boosters UX (boosters-ux)
- Booster : lignee — lire ; deux verres v3 → v4 ; nom proposé « neipa v4 », éditable ; statique
- Booster : version-ou-modifier — choisir ; segments ; Nouvelle version / Modifier v3 (JS)
- Booster : table-v3 — comparer ; gouttière de diff ; vert = comme v3, ambre = changé ; statique
- Booster : revenir-v3 — annuler ; flèche ronde ; remet 60 min, la cuve revient à 30,2 (JS)
- Booster : evaporation-cuve — lire ; goutte et jauge 31,7 / 35 L « provisoire » ; conséquence des 90 min
- Booster : nolo — activer ; interrupteur (JS)
- Booster : suite-v3 — lire ; malts 8,6 kg, houblons 84 g, Verdant IPA, 67 °C, tous « = »
- B1 OK — 7 boosters marqués `data-booster` ; chaque décision du premier plan a le sien.
- B2 OK — la table v4 | v3 domine ; une action primary.
- B3 OK — 78 mots ; légende derrière « ? ».
- B4 OK — lignée, identité, autres étapes.
- B5 à mesurer (R2).
- B6 OK — 18, 14 et 13 px, plus les champs à 16.
- B7 OK — CONTRASTE OK (thème clair) ; la couleur accompagne toujours un mot ; le thème cave n'est pas mesuré en v0.
- B8 OK — limite de cuve « provisoire » (35 L à vérifier, PRODUCT.md) ; 31,7 L = les 30,2 L de v3 + 1,5 L évaporés en plus (3 L/h × 30 min).
- B9 OK — retour d'un toucher.
- B10 OK.
- B11 OK — phrase tirée de la capture : « neipa v4 reprend v3 ; seule l'ébullition change (60 → 90), et la cuve passe à 31,7 L sur 35. »
- B12 OK — vert et ambre comme posé et changé ; rayons de 8 et 4 px.
- B13 à mesurer (R5).
- Écarts voulus : rayons de 8 px (et 4) au lieu des 10 et 16 px de DESIGN.md, pour tenir `controle-standard` (2, 4 ou 8 px), comme les maquettes houblons choisies ; séparateurs « · » et « — » dessinés en CSS.

## Ce qui tient, ce qui casse
- Tient : Le seul concept de la série qui traite la reprise (modifier ou dupliquer, un état réel de l'app). « Modifier v3 » ne réécrit jamais le brassin du 12.09 (dit en légende).
- Casse : Le passage de 60 à 90 min est un exemple de saisie, pas une donnée. Le nom suggéré « neipa v4 » n'existe pas dans l'app.

## Contrôles (joués une fois pour la série, sorties recopiées)
- `verifier-page.mjs etat.html --captures` : PAGE OK (390 px, sans erreur), pour les six.
- `mots-premier-ecran.mjs v0 i1 … i6 --page=etat.html --max=80` : MOTS OK (i1 74, i2 78, i3 77, i4 78, i5 65, i6 80).
- `controle-panel.mjs` sur les six premiers écrans : « remplissage médian 0,59, 1 sous 0,50 · ressemblance moyenne 0,88 · paires presque identiques 0/15 (0 %) » → PANEL OK.
- `controle-commun.mjs v0 i1 … i6 --page=etat.html --sans=mots,au-style,fiche,trait` : COMMUN OK (couleurs, survol, blocs, contraste, standard, légende, parlant, brutes).
  Écarts : `au-style`, `fiche` et `trait` visent les familles d'arômes, la fiche d'un houblon et ses pictos ; l'Identité n'en montre aucun (hors objet, aucun nom de houblon affiché). `mots` est joué à part, à 80 (J4).
- `grep type="number"` : 0. Registre `ecrans.json` : aucune maquette choisie pour l'Identité (choix ouvert), donc pas de `controle-choix`.
