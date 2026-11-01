# i2 — Posé ou proposé

- **Chaleur** : froide : la baseline et ses valeurs, affinées par un seul code posé/proposé.
- **Axes** : A1 (formulaire compacté en tuiles), A2 (cuve et fermenteur en jauges), A6 (après collage).
- **L'idée** : Après un collage, chaque valeur dit si elle est posée (vert : lue dans le texte ou dans ton profil) ou seulement proposée par l'app (ambre tireté : repère, conseil, profil d'eau) ; un toucher la pose.
- **État montré** : neipa v3 juste collée.
- **Recette** : neipa v3, Double IPA 22A, 24 L, 60 min, OG 1,080, IBU ~93, EBC 9,5, Royal Catering · cuve 45 L, fermenteur 30 L (export réel `recette-neipa-v3.txt`).
- **Captures** (ouvertes) : `i2-haut.png` (premier écran), `i2-page.png` (page entière).
- **Mesures** : 78 mots au premier écran ; remplissage 0,50.

## Acquis de la baseline
- [x] En-tête commun tel quel : ‹, « Identité 1/7 », « Abandonner » (brouillon), icône d'import, thème.
- [x] Fil des 7 étapes, tel quel.
- [x] Bandeau Grain · OG · IBU · EBC, tel quel quand la recette a des ingrédients ; absent sur une recette neuve, comme dans l'app (`hasMetrics`).
- [x] Pied « Retour · Suivant — Malts/sucres » tel quel. Le lanceur + commun n'est pas dessiné ; aucune valeur n'occupe son coin bas droit.
- [x] Honnêteté : évaporation lue au profil Royal Catering (3 L/h, export de neipa v3), jamais le repli de 10 %/h sans le dire ; 20 % d'espace libre marqué « repère » ou « ~ » ; remplissage conseillé marqué conseil (tireté) ; un inconnu en « — », jamais 0.
- [x] Interdits : pas de cockpit, pas de légende au repos (« ? » fermé), en-tête inchangé, pas de badge « 16D hypothèse », pas de bouton imposant, pas de superposition, rien sous 12 px (13 px au plus petit), pas de `type="number"`.

## Boosters UX (boosters-ux)
- Booster : compte-pose — suivre ; pastilles ; « 8 posées · 3 proposées » ; se met à jour au toucher (JS)
- Booster : poser — choisir ; tuile tiretée ; ambre devient vert, le compte baisse (JS)
- Booster : garder-tout — déclencher ; bouton secondaire ; pose les trois propositions (JS)
- Booster : evaporation — lire ; goutte −3 L ; statique
- Booster : jauge-fermenteur — lire ; deux jauges, cuve à chaud 30,2 / 35 L « provisoire » et fermenteur 24 / 30 L, seuils tiretés ; statique
- Booster : nolo — activer ; interrupteur ; bascule (JS)
- Booster : etapes-remplies — lire ; tuiles Malts 8,6 kg, Houblons 84 g, Levure Verdant IPA, Eau « profil 22A » proposée
- B1 OK — 7 boosters marqués `data-booster` ; chaque décision du premier plan a le sien.
- B2 OK — la grille posé/proposé domine ; une action primary (Suivant).
- B3 OK — 78 mots ; légende derrière « ? ».
- B4 OK — la bière, ses valeurs, les jauges, les autres étapes : quatre groupes.
- B5 à mesurer (R2).
- B6 ECHEC partiel — 18 (nom), 20 (valeurs), 14 et 13 px : quatre tailles ; mesures en mono.
- B7 OK — CONTRASTE OK (thème clair) ; la couleur accompagne toujours un mot ; le thème cave n'est pas mesuré en v0.
- B8 OK — proposé distinct de posé ; limite de cuve « provisoire » ; aucune valeur à 0.
- B9 OK sur « poser » : 200 ms, coupé sous prefers-reduced-motion.
- B10 OK — inputmode, aucun type="number".
- B11 OK — phrase tirée de la capture : « neipa v3 collée : 8 valeurs posées, 3 à confirmer ; elle tient dans la cuve et le fermenteur. »
- B12 OK — vert = posé, ambre tireté = proposé, partout ; rayons de 8 px.
- B13 à mesurer (R5).
- Écarts voulus : rayons de 8 px (et 4) au lieu des 10 et 16 px de DESIGN.md, pour tenir `controle-standard` (2, 4 ou 8 px), comme les maquettes houblons choisies ; séparateurs « · » et « — » dessinés en CSS.

## Ce qui tient, ce qui casse
- Tient : Rend visible ce que l'app propose en silence : le repère de 20 %, le conseil de 24 L, et le profil d'eau tiré du style (l'inventaire relève qu'il change l'étape Eau sans prévenir). La cuve à chaud, 30,2 / 35 L, vient de l'export.
- Casse : Beaucoup de vert : l'écran peut sembler « tout va bien » et trop teinté. « Conseil » remplace « Remplissage conseillé », et « Royal Catering » perd « cuve 45 L », pour tenir 80 mots.

## Contrôles (joués une fois pour la série, sorties recopiées)
- `verifier-page.mjs etat.html --captures` : PAGE OK (390 px, sans erreur), pour les six.
- `mots-premier-ecran.mjs v0 i1 … i6 --page=etat.html --max=80` : MOTS OK (i1 74, i2 78, i3 77, i4 78, i5 65, i6 80).
- `controle-panel.mjs` sur les six premiers écrans : « remplissage médian 0,59, 1 sous 0,50 · ressemblance moyenne 0,88 · paires presque identiques 0/15 (0 %) » → PANEL OK.
- `controle-commun.mjs v0 i1 … i6 --page=etat.html --sans=mots,au-style,fiche,trait` : COMMUN OK (couleurs, survol, blocs, contraste, standard, légende, parlant, brutes).
  Écarts : `au-style`, `fiche` et `trait` visent les familles d'arômes, la fiche d'un houblon et ses pictos ; l'Identité n'en montre aucun (hors objet, aucun nom de houblon affiché). `mots` est joué à part, à 80 (J4).
- `grep type="number"` : 0. Registre `ecrans.json` : aucune maquette choisie pour l'Identité (choix ouvert), donc pas de `controle-choix`.
