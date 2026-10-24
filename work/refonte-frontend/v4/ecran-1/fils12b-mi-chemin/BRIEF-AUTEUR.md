# Lot 12b · À mi-chemin entre la carte actuelle et une idée du lot 12 (fils de fer, #140)

Fils de fer statiques, 15 min par variante, puis tu livres ce que tu as. Écris en français.
Répertoire : C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie (chemins absolus).
Texte avec barres obliques inverses ou accents graves : outil Write, jamais Bash. Pas de git.
Ne touche à rien hors de `work/refonte-frontend/v4/ecran-1/fils12b-mi-chemin/<ta variante>/` et de
`fils12b-mi-chemin/captures/`.

## Ce que le brasseur a dit du lot 12 (19.10, soir)

« Non c'est très mauvais. Tu as pas du tout bien compris le besoin, c'est entre la version actuelle
qui est déjà vraiment plutôt bien et une de ces versions ».

Sa demande d'origine : « montrer à quoi correspond exactement ces valeurs facile lors du long appuie
sur le houblons » (les petits carrés d'arômes de la carte Motueka).

**La version actuelle est bonne et reste telle quelle.** Le lot 12 refaisait la carte ou ouvrait de
grands panneaux. Ici, la carte au repos est exactement celle de la base. Seul le long appui ajoute
quelque chose : un petit ajout, collé aux carrés, qui reprend une seule idée de ta variante du lot 12,
en plus léger.

## La carte de référence

Ouvre `work/refonte-frontend/v4/ecran-1/base/consolide/index.html`, puis regarde l'ajout proposé
Motueka : le bouton `.rapide`, avec son nom, l'α, le rôle, la dose, l'IBU, les 12 carrés et le
moment. Ses styles :
- `ecran-1/base/generateur/page.html` (`.rapide`, `.mini`) ;
- `ecran-1/base/generateur/etape-consolide.css` (`.ajouts .mini .c` 6 × 10 px, couleurs `.f-*`).

Reprends ce balisage et ces styles **à l'identique**, pour les trois cartes et au repos : mêmes
mots, même hauteur (54 px), carrés de 6 × 10 px. Ta page au repos est donc la même pour toutes les
variantes, et c'est voulu.

Les données sont celles du lot 12, dans `fils12-descriptions/BRIEF-AUTEUR.md`. Pour Motueka :
- Agrumes : marqué, 2 fiches sur 2 (Beer Maverick, Hopsteiner) ;
- Tropicaux : cité, 1 fiche sur 2 (Beer Maverick) ;
- Floral : cité, 1 fiche sur 2 (Beer Maverick) ;
- les 9 autres : non décrites.

Ce sont des citations des fiches, pas des intensités. « mojito » ne fait naître aucune famille.

## Ta variante : ton idée du lot 12, en léger

- **b1, de d1 (bulle)** :
  - la bulle de d1, plus petite, s'ouvre juste sous la carte ;
  - au-dessus seulement s'il y a la place sans couvrir le titre ni le champ ;
  - une ligne par famille décrite (sa case, son nom, son niveau, ses fiches), puis « 9 non décrites ».
- **b2, de d2 (loupe)** :
  - la bande de carrés grossit sur place, dans la carte (environ ×2) ;
  - seules les cases décrites écrivent leur nom, juste dessous ;
  - une ligne : « marqué 2 fiches sur 2 », « cité 1 fiche sur 2 », « 9 non décrites ».
  - Pas de liste de mots.
- **b3, de d3 (mots)** :
  - au repos, rien ne change ;
  - au long appui, une ligne sous les carrés : deux ou trois mots des fiches, soulignés de leur
    couleur, puis les familles en une ligne.
- **b4, de d4 (feuille)** :
  - une petite carte collée sous la carte, 160 px au plus ;
  - les 3 familles décrites, avec un point par fiche ;
  - puis « 9 non décrites ».
- **b5, de d5 (carrés lisibles)** :
  - au repos, rien ne change ;
  - au long appui, les carrés grossissent sur place et prennent leur initiale ;
  - le trait 16D entoure les 3 attendues ;
  - une ligne de niveaux.
- **b6, de d6 (une case par fiche)** :
  - au repos, rien ne change ;
  - au long appui, la bande s'ouvre en deux rangées, une par fiche (Beer Maverick, Hopsteiner) ;
  - une ligne de compte.

## Règles (contrôlées)

- **A6** : au repos, la carte est celle de la base. Mêmes mots, même hauteur à 6 px près, carrés de
  6 × 10 px.
- **A7** : au long appui, 30 mots au plus et 160 px de haut au plus, collé à la carte (à 12 px au
  plus).
- **A8** : l'ajout ne couvre ni le titre « Houblons » ni le champ « Ajouter — houblon… ». Les deux
  autres cartes peuvent descendre ; elles ne s'effacent pas.
- **A1 à A5** comme au lot 12 : rien d'expliqué au repos ; au long appui, chaque famille décrite dit
  son nom, son niveau et ses fiches ; « non décrit(es) » est écrit ; le mot « fiche » apparaît ; les
  niveaux viennent du pack.
- Texte de 12 px au moins ; fil de fer gris, et seules les couleurs des familles.
- Le long appui se fait sur le nom ou la carte ; un toucher bref ajoute toujours le houblon.

## Livrable et contrôles

Mêmes conventions qu'au lot 12 : `data-houblon` sur la carte, `data-famille` et `data-niveau` sur
chaque carré, dans `data-role="aromes"`, `data-role="appui"`, `data-explique`. Dans
`fils12b-mi-chemin/<numéro>/`, livre `vue.html`, `appui.html` et `NOTE.md` (3 lignes).

1. Capture des deux pages :
   - `node work/refonte-frontend/v4/tournoi/outils/capture-page.mjs work/refonte-frontend/v4/ecran-1/fils12b-mi-chemin/<num>/vue.html work/refonte-frontend/v4/ecran-1/fils12b-mi-chemin/captures/<num>-vue-390.png 844`
   - même commande pour `appui.html`, vers `<num>-appui-390.png`.

   Puis **regarde les deux captures**.
2. `node work/refonte-frontend/v4/tournoi/outils/controle-appui.mjs work/refonte-frontend/v4/ecran-1/fils12b-mi-chemin <num>` : `APPUI OK` (A1 à A8).
3. `node work/refonte-frontend/v4/tournoi/outils/controle-fil6.mjs work/refonte-frontend/v4/ecran-1/fils12b-mi-chemin <num> --objet=libre --pages=vue.html,appui.html` : `FIL6 OK`.
4. `node work/refonte-frontend/v4/tournoi/outils/mots-premier-ecran.mjs work/refonte-frontend/v4/ecran-1/fils12b-mi-chemin <num> --max=90 --page=vue.html` : `MOTS OK`.

Réponse finale : une ligne par variante.
