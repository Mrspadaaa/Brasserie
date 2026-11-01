# i1 — Deux départs, puis plus rien

- **Chaleur** : froide : la baseline affinée (ordre et libellés gardés, l'import à sa juste place).
- **Axes** : A6 (import seulement sur une recette vide), A2 (ligne actuelle et petite jauge).
- **L'idée** : Sur une recette vide, deux départs côte à côte, « Coller une recette » et « Partir d'un style » ; dès qu'elle est remplie, ils disparaissent et l'icône d'en-tête suffit.
- **État montré** : recette neuve (premier écran), puis la même étape après le collage de neipa v3 (page entière).
- **Recette** : neipa v3, Double IPA 22A, 24 L, 60 min, OG 1,080, IBU ~93, EBC 9,5, Royal Catering · cuve 45 L, fermenteur 30 L (export réel `recette-neipa-v3.txt`).
- **Captures** (ouvertes) : `i1-haut.png` (premier écran), `i1-page.png` (page entière).
- **Mesures** : 74 mots au premier écran ; remplissage 0,34.

## Acquis de la baseline
- [x] En-tête commun tel quel : ‹, « Identité 1/7 », pas d'« Abandonner » sur la recette neuve (aucun brouillon repris, comme l'app) ; présent dans l'état collé, icône d'import, thème.
- [x] Fil des 7 étapes, tel quel.
- [x] Bandeau Grain · OG · IBU · EBC, tel quel quand la recette a des ingrédients ; absent sur une recette neuve, comme dans l'app (`hasMetrics`).
- [x] Pied « Retour · Suivant — Malts/sucres » tel quel. Le lanceur + commun n'est pas dessiné ; aucune valeur n'occupe son coin bas droit.
- [x] Honnêteté : évaporation lue au profil Royal Catering (3 L/h, export de neipa v3), jamais le repli de 10 %/h sans le dire ; 20 % d'espace libre marqué « repère » ou « ~ » ; remplissage conseillé marqué conseil (tireté) ; un inconnu en « — », jamais 0.
- [x] Interdits : pas de cockpit, pas de légende au repos (« ? » fermé), en-tête inchangé, pas de badge « 16D hypothèse », pas de bouton imposant, pas de superposition, rien sous 12 px (13 px au plus petit), pas de `type="number"`.

## Boosters UX (boosters-ux)
- Booster : depart-coller — déclencher ; tuile ; presse-papiers et « texte ou photo » ; ouvrirait la feuille d'import (statique ici)
- Booster : depart-style — choisir ; tuile ; quatre pastilles de couleur de bière ; ouvrirait la liste des styles (statique)
- Booster : evaporation — lire ; pastille ; goutte et −3 L ; statique
- Booster : nolo — activer ; case native ; change au toucher
- Booster : jauge-fermenteur — lire ; jauge ; 24 sur 30 L, conseil tireté à 24 ; statique
- Booster : volumes-inconnus — lire ; tableau ; « — » tant que les malts manquent ; statique
- B1 OK — 6 boosters marqués `data-booster` ; chaque décision du premier plan a le sien.
- B2 OK — deux masses : les deux départs, puis le formulaire ; une action primary (Suivant).
- B3 OK — 74 mots ; repères et détail du matériel à un toucher (⌄).
- B4 OK — identité et volumes en deux panneaux, pas de carte dans une carte.
- B5 à mesurer (R2) ; 4–8 px dans les groupes, 8 px entre eux.
- B6 ECHEC partiel — 18, 14 et 13 px, plus le texte saisi à 16 ; mesures en Plex Mono tabulaire.
- B7 OK — CONTRASTE OK (thème clair) ; la couleur accompagne toujours un mot ; le thème cave n'est pas mesuré en v0.
- B8 OK — la recette neuve est dessinée ; volumes à chaud en « — » et non « 0 L » (défaut relevé par l'inventaire, § 15).
- B9 s.o. en v0 (case native seule).
- B10 OK — inputmode decimal ou numeric, aucun type="number".
- B11 OK — phrase tirée de la capture : « Une recette vide : je colle ou je pars d'un style ; 24 L, 60 min, le fermenteur tient. »
- B12 OK — rayons de 8 px et pilules, un seul chevron ⌄, traits d'icône de 1,75.
- B13 à mesurer (R5) ; cibles de 24 px au moins.
- Écarts voulus : rayons de 8 px (et 4) au lieu des 10 et 16 px de DESIGN.md, pour tenir `controle-standard` (2, 4 ou 8 px), comme les maquettes houblons choisies ; séparateurs « · » et « — » dessinés en CSS.

## Ce qui tient, ce qui casse
- Tient : Le plus proche de la baseline : même ordre, mêmes libellés ; l'import en double disparaît (J9-1, C084). Les volumes à chaud en « — » corrigent le « 0 L » de la recette neuve.
- Casse : L'idée est discrète : elle se voit surtout d'un état à l'autre. Remplissage 0,34 : le seul premier écran de la série sous 0,50 (une recette vide a peu à montrer).

## Contrôles (joués une fois pour la série, sorties recopiées)
- `verifier-page.mjs etat.html --captures` : PAGE OK (390 px, sans erreur), pour les six.
- `mots-premier-ecran.mjs v0 i1 … i6 --page=etat.html --max=80` : MOTS OK (i1 74, i2 78, i3 77, i4 78, i5 65, i6 80).
- `controle-panel.mjs` sur les six premiers écrans : « remplissage médian 0,59, 1 sous 0,50 · ressemblance moyenne 0,88 · paires presque identiques 0/15 (0 %) » → PANEL OK.
- `controle-commun.mjs v0 i1 … i6 --page=etat.html --sans=mots,au-style,fiche,trait` : COMMUN OK (couleurs, survol, blocs, contraste, standard, légende, parlant, brutes).
  Écarts : `au-style`, `fiche` et `trait` visent les familles d'arômes, la fiche d'un houblon et ses pictos ; l'Identité n'en montre aucun (hors objet, aucun nom de houblon affiché). `mots` est joué à part, à 80 (J4).
- `grep type="number"` : 0. Registre `ecrans.json` : aucune maquette choisie pour l'Identité (choix ouvert), donc pas de `controle-choix`.
