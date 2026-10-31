# u2b — nom et masse d'un trait, passe 2 (31.10)

OK — u2b : u2 reconnaissable, 4 greffes et 3 corrections du critique ; COMMUN OK, PANEL ECHEC (remplissage 0,46)

- **Base** : `v0/u2`, intacte. Reste d'u2 : la ligne de saisie en tête (mono, touche Entrée), l'aperçu ambré avant Entrée, `pils 5`,
  `dextrose 400g`, « déjà dans la recette », la facture sous la saisie.
- **Chaleur** : tiède (forme de l'approche, affinée).

## Corrections du critique (SYNTHESE § u2)
1. **La grammaire sans exemple** : le texte du champ vide alterne « Nom, puis Entrée » et « Nom 5 kg » (toutes les 2,4 s). L'aperçu
   s'affiche dès la première lettre (`cap-premiere-lettre` : « p » → Pilsner Malz, et Pale Ale Malz en second choix). Sous 2 lettres
   sans nom connu : « encore une lettre pour créer », Entrée ne fait rien. Un nom déjà là sans masse : « déjà dans la recette : Entrée,
   puis la masse », avec sa masse actuelle (5,0 kg), jamais « 0 kg ».
2. **La facture sans points de conduite** : nom à gauche, masse alignée à droite, un filet entre les lignes.
3. **Le premier écran se remplit** : la masse en grand (26 px ; 36 px tant que la recette tient en 5 lignes), tapable ; sous le nom,
   la barre de part, à la teinte du malt, hachurée si elle manque. Le moment passe à côté du nom. Au-delà de 5 lignes, la facture se
   compacte : 8 grains à 0,98 écran.

## Greffes
- **5 familles en segments** sous le champ (r1, z1) : le choix se voit ; il donne la famille d'un nom créé et le rayon de l'étagère.
- **Étagère de sacs colorés** (u4) à la place des puces : sacs du stock de la famille, à la couleur du malt, hachurés si elle manque,
  icône verte du stock ; un toucher prend le sac (0 kg, curseur sur la masse). Plus de mot « 1 kg = 1 sac » : un sac est un article.
- **Barre de composition en teintes** sous le bandeau (r2) : une part par ingrédient, à la masse, hachurée où la couleur manque, le
  sucre en crème cerné ; un toucher sur une part place le curseur sur sa masse.
- **« 3 couleurs à renseigner »** (u1), au bout de la barre, en 12 px gras : elle ouvre la première, Entrée passe à la suivante ;
  la pastille, la barre de part et la composition prennent la teinte à la frappe (`cap-couleur-pendant`).

## Baseline (plancher à enrichir)
- [x] En-tête « ‹ Fermentescibles 2/7 », import, thème ; fil, Malts/sucres courant ; bandeau Grain · OG · IBU · EBC (absent sur la
  recette vide) ; pied « Retour · Suivant — Houblons » ; + flottant (rien ne passe dessous au repos ; la saisie est en haut).
- [x] Ligne : nom, moment, part, masse. [x] 5 familles. [x] Famille figée sur la ligne (affichée dans le détail, jamais un bouton).
- [x] Masse à zéro à l'ajout sans masse tapée. [x] J+ en fermentation. [x] Lactose (sous la ligne), densité (annexe).
- [x] Clavier : `pale`, Entrée → focus « Masse de Pale Ale Malz » ; `0,5`, Entrée → retour au champ. Et `pils 5`, Entrée → 5 kg posés.

## Honnêteté
- Couleur inconnue : « ? », hachure, EBC « — » ; Morey de l'app : 7,3 avec 3,5 · 4 · 2. Rendement replié. Stock dit fictif (annexe).
- Part d'un sucre rapportée au grain (5 %), comme « % du grain » du code : décision ouverte, rappelée au pilote.

## Boosters UX
- ligne-de-saisie, apercu-entree — déclencher : l'aperçu change à chaque lettre (`cap-premiere-lettre`, `cap-clavier-pendant`).
- familles, etagere-sacs — choisir, déclencher. composition, part — lire : les longueurs et les teintes (`cap-recette` → `cap-couleurs`).
- masse — ajuster : chiffre tapable, ↑ ↓ au pas de l'hypothèse 3. teinte, a-renseigner — régler, suivre. moment.
- B1 OK (10 boosters marqués) · B2 OK (la saisie en haut, les masses à droite ; un seul primaire) · B3 OK (57 mots) · B4 OK ·
  B5 OK · B6 partiel (12/14/16 + 36 px des masses, qui sont des champs) · B7 OK (pire 5,27:1) · B8 OK (vide, inconnu, 8 grains,
  lactose et fruit J+3 ; hors ligne non dessiné) · B9 partiel (retour à la frappe, délai non mesuré) · B10 OK (0 `type="number"`,
  `inputmode="decimal"`, virgule) · B11 « trois malts et leurs kilos, la couleur manque ; une ligne pour en ajouter » · B12 OK
  (STANDARD OK) · B13 OK à l'œil (segments 30 px, masses 36 px de haut).

## Contrôles (31.10, `--profil=sans-houblons`)
- `controle-commun v1 u2b --page=etat.html` : **COMMUN OK** (premier essai : STANDARD ECHEC, trait de 2,1 px des sacs agrandis en CSS ;
  les sacs sont maintenant dessinés à leur taille).
- `mots-premier-ecran --max=80` : 57 mots, **MOTS OK**. `controle-contraste` : **CONTRASTE OK**, pire 5,27:1.
- `controle-panel` sur `cap-recette`, `cap-couleurs`, `cap-sucre`, `cap-huit` : **PANEL ECHEC** — remplissage médian 0,46 (0,42 pour
  v0/u2) ; ressemblance 0,96 : ce sont quatre états du même écran, la diversité ne s'y applique pas. Le reste vide est sous le pied :
  sa recette a 3 malts. Écart signalé, pas comblé par du remplissage sans donnée.
- `verifier-page` : PAGE OK. Hauteurs (bas du pied) : repos 0,73 · couleurs 0,73 · sucre 0,82 · lactose 0,92 · **8 grains 0,98** · vide 0,41.

## Captures (ouvertes)
`cap-recette.png` (repos 390), `cap-1280.png`, `cap-huit.png`, `cap-couleurs.png`, `cap-sucre.png`, `cap-premiere-lettre.png`,
`cap-clavier-pendant.png` (`pils 5` sur la recette vide), `cap-clavier-apres.png` (sa recette en 3 frappes : `pils 5`, `weizen 1,5`,
`hafer 1,5`), `cap-clavier-zero.png`, `cap-couleur-pendant.png`, `cap-couleur-apres.png`, `cap-lactose.png`, `cap-vide.png`, `cap-page.png`.

## Ce qui tient, ce qui casse
- Tient : sa recette se tape en trois frappes ; au téléphone, l'aperçu dit ce qu'Entrée va faire dès la première lettre.
- Casse : le bas d'écran reste blanc avec 3 malts ; le texte du champ qui change peut distraire.
