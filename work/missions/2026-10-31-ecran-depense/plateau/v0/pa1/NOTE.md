# pa1 — froide : p3c-3 affinée, la proposition posée sur le champ même

**L'idée.** Le plateau de p3c-3, tel quel, où chaque valeur proposée porte son état sur le champ (D277) : l'article proposé est
un champ jaune pointillé avec sa raison et ses trois issues en boutons radio ; l'unité à remplir est le champ d'unité en rouge,
nommé, avec le focus et ses choix dessous. Les gestes rares passent derrière ⋯, au bout de la ligne « imprimé ».

Page : `etat.html#a` … `#f`, `#repos`, `-cave` pour le sombre (sans dièse : le cas b). Captures : `pa1-<cas>.png` (390 × 844),
`pa1-b-sombre.png`, `pa1-d-sombre.png`, `pa1-1280-b.png`.

## Les 13 problèmes de sa capture
Le nom n'est dit qu'une fois (« imprimé » ; plus de libellé ni de nom barré) · un seul contrôle d'unité (le champ, qui ouvre ses
choix) · 9,50 au centime · Matériel pour le détartrant · l'article dit une fois · plus d'ancien formulaire ni de « Mettre en stock »
contradictoire · corbeille, extrait et type fin derrière ⋯ · le plateau tient entre la rangée et le pied dans les six cas · le
rouge sur le champ à remplir · pas de puce « Payé le » au pied.

## Baseline (p3c-3 et ses voisins)
- [x] « imprimé « … » · référence » — avec ⋯ au bout
- [x] quantité, unité, × prix = montant sur une ligne (champs 52/70 px pour tenir « sachets » à 390)
- [x] « ✓ au centime »
- [x] segment Ingrédient · Service · Matériel
- [x] « article « … » · relié ⇄ Retirer » ; pour (b) le champ devient la proposition, ses issues dessous
- [x] mouture « Rattacher » (cas a ; une ligne Mouture ajoutée à la fixture, 6 Kg × 0,10 = 0,60)
- [x] plateau dans la rangée, bande teintée, filet de famille, pied « Catégorie | Papier » + « Confirmer »
- [x] B du nom (français sur la rangée, imprimé au plateau) · [x] d-lue (3 en bleu, 2 barré, « Revenir à 2 ») · [x] D277

## Honnêteté
« Citra bis » se dit « proposé », raison « même variété, autre α : 12,5 ici, 13,1 au stock » ; « Nouvel article » se dit
« doublon » ; « Rien n'est créé au stock avant Confirmer ». Aucun chiffre hors de la fixture ; somme 63,90 = lignes.

## Contrôles (joués une fois, 02.11)
- `controle-commun --profil=sans-houblons --sans=mots` : **COMMUN OK** (mots écarté en v0, selon l'entonnoir)
- `mots-premier-ecran --profil=sans-houblons` : 134 mots (cas b ouvert : récap, liste et plateau ; au-dessus de 98)
- `controle-contraste --profil=sans-houblons` : CONTRASTE OK, pire 5,24:1
- `verifier-page --min-images 0` : PAGE OK (390 px, sans erreur)
- `captures.mjs` (voie) : six cas « tient=oui », aucun texte < 12 px, aucune cible < 24 px, 0 `type="number"`, 0 requête
- `controle-panel` (un cas b par concept) : PANEL OK, ressemblance 0,90
- `controle-choix` : sans objet, le registre n'a pas d'écran Dépense

## Boosters
- `unite` : choisir ; le champ d'unité ouvre ses choix sur place, au toucher · `mapping` : choisir ; trois issues, une cochée ·
  `rares` : déclencher ; ⋯ ouvre type fin, extrait et suppression (capture f).
