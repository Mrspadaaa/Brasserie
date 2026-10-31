# i6 — Le texte collé devient l'écran

- **Chaleur** : chaude : forme libre (le texte collé devient l'écran).
- **Axes** : A6 (recette collée), A1 (l'identité éditable sur place).
- **L'idée** : L'écran est le texte collé lui-même : un ticket où ce que l'app a lu est surligné et s'édite là où il se lit, avec son effet à droite (jauge, eau évaporée, profil) ; le reste part vers ses étapes.
- **État montré** : juste après « Coller » : l'export L'Affinée de neipa v3, ses vraies lignes (recette-neipa-v3.txt).
- **Recette** : neipa v3, Double IPA 22A, 24 L, 60 min, OG 1,080, IBU ~93, EBC 9,5, Royal Catering · cuve 45 L, fermenteur 30 L (export réel `recette-neipa-v3.txt`).
- **Captures** (ouvertes) : `i6-haut.png` (premier écran), `i6-page.png` (page entière).
- **Mesures** : 80 mots au premier écran ; remplissage 0,52.

## Acquis de la baseline
- [x] En-tête commun tel quel : ‹, « Identité 1/7 », « Abandonner » (brouillon), icône d'import, thème.
- [x] Fil des 7 étapes, tel quel.
- [x] Bandeau Grain · OG · IBU · EBC, tel quel quand la recette a des ingrédients ; absent sur une recette neuve, comme dans l'app (`hasMetrics`).
- [x] Pied « Retour · Suivant — Malts/sucres » tel quel. Le lanceur + commun n'est pas dessiné ; aucune valeur n'occupe son coin bas droit.
- [x] Honnêteté : évaporation lue au profil Royal Catering (3 L/h, export de neipa v3), jamais le repli de 10 %/h sans le dire ; 20 % d'espace libre marqué « repère » ou « ~ » ; remplissage conseillé marqué conseil (tireté) ; un inconnu en « — », jamais 0.
- [x] Interdits : pas de cockpit, pas de légende au repos (« ? » fermé), en-tête inchangé, pas de badge « 16D hypothèse », pas de bouton imposant, pas de superposition, rien sous 12 px (13 px au plus petit), pas de `type="number"`.

## Boosters UX (boosters-ux)
- Booster : ticket — lire ; ticket dentelé ; 8 lignes du texte, valeurs surlignées par couleur ; statique
- Booster : editer-sur-place — ajuster ; surlignage ; un toucher ouvre l'édition sur place, Échap ferme (JS)
- Booster : jauge-fermenteur — lire ; 24/30, 6 L libres, conseil tireté ; à côté de « Fermenteur total »
- Booster : evaporation — lire ; −3 L ; à côté de « Évaporation à chaud (L/h) : 3 »
- Booster : reste-du-texte — suivre ; pastilles Malts 2, Houblons 1, Verdant IPA, avec le numéro de leur étape
- Booster : absent-du-texte et nolo — activer ; interrupteur dans un cadre tireté « Absent » (JS)
- B1 OK — 6 boosters marqués `data-booster` ; chaque décision du premier plan a le sien.
- B2 OK — le ticket domine ; une action primary.
- B3 OK — 80 mots, à la limite ; légende derrière « ? ».
- B4 OK — le texte lu, ce qui manque, le pied.
- B5 à mesurer (R2).
- B6 ECHEC partiel — 18 (valeurs et titre), 14 et 13 px ; mono pour le texte collé.
- B7 OK — CONTRASTE OK (thème clair) ; la couleur accompagne toujours un mot ; le thème cave n'est pas mesuré en v0.
- B8 OK — ce qui n'est pas dans le texte est dit « Absent », pas inventé ; la marge de mousse lue reste un « repère ».
- B9 OK — édition sur place au toucher.
- B10 OK — valeurs éditées sur place, jamais en type="number".
- B11 OK — phrase tirée de la capture : « J'ai collé neipa v3 : voici ce qui a été lu, 24 L, 60 min, Royal Catering ; NOLO n'y est pas. »
- B12 OK — une couleur par ligne lue, reprise par sa valeur ; rayons de 4 et 8 px.
- B13 à mesurer (R5).
- Écarts voulus : rayons de 8 px (et 4) au lieu des 10 et 16 px de DESIGN.md, pour tenir `controle-standard` (2, 4 ou 8 px), comme les maquettes houblons choisies ; séparateurs « · » et « — » dessinés en CSS.

## Ce qui tient, ce qui casse
- Tient : La confiance dans l'import : il voit ce que l'app a lu, mot pour mot, et corrige à la source. Les lignes du matériel viennent du texte collé.
- Casse : Le texte collé en mono frôle le costume (DESIGN : le mono pour les mesures). Un texte d'ailleurs (Brewfather, forum) a d'autres libellés, plus longs : le ticket les montrerait tels quels.

## Contrôles (joués une fois pour la série, sorties recopiées)
- `verifier-page.mjs etat.html --captures` : PAGE OK (390 px, sans erreur), pour les six.
- `mots-premier-ecran.mjs v0 i1 … i6 --page=etat.html --max=80` : MOTS OK (i1 74, i2 78, i3 77, i4 78, i5 65, i6 80).
- `controle-panel.mjs` sur les six premiers écrans : « remplissage médian 0,59, 1 sous 0,50 · ressemblance moyenne 0,88 · paires presque identiques 0/15 (0 %) » → PANEL OK.
- `controle-commun.mjs v0 i1 … i6 --page=etat.html --sans=mots,au-style,fiche,trait` : COMMUN OK (couleurs, survol, blocs, contraste, standard, légende, parlant, brutes).
  Écarts : `au-style`, `fiche` et `trait` visent les familles d'arômes, la fiche d'un houblon et ses pictos ; l'Identité n'en montre aucun (hors objet, aucun nom de houblon affiché). `mots` est joué à part, à 80 (J4).
- `grep type="number"` : 0. Registre `ecrans.json` : aucune maquette choisie pour l'Identité (choix ouvert), donc pas de `controle-choix`.
