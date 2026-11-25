# Juge produit, tour 2 : trois regards (UX mobile compacte, IA, nouveau venu)

Matière ouverte une à une, 84 captures :
- `cap12/` : 60 captures, 5 variantes × 12 cas, au repos, recapturées au tour 2 ;
- `cap/v7-*` : 16 captures (ligne, ligne IA, Aide, refus, IA absente, sur écoulement, bouteilles et chaudière) ;
- `cap/{v1,v2,v3,v6}-ecoulement-{refus,sansia}` : 8 captures.

Les captures `cap/<v>-<cas>-{repos,geste}` de v1, v2, v3 et v6 datent du tour 0 (dessin à la main). Pour ces variantes, le geste « toucher → sa ligne » et l'Aide n'ont donc **pas été rejoués au tour 2** ; mon avis sur leurs gestes repose sur le tour 1. Seule la v7 a ses gestes prouvés.

Règles dures appliquées : ORGANISE-TROP-TEXTUEL, FRISE-GENERIQUE et ENTETE-PEU-UTILE. Décision du pilote (25.11 nuit) : 30 mots au repos ; après un geste, sa ligne citée ne compte pas, le texte ajouté par l'app ou l'IA reste ≤ 30 mots.
B = bloquant, m = mineur. On cite une capture `cap12/<v>-<cas>` ou `cap/<v>-<cas>-<état>`.

## Constats communs du tour 1 : réglé ou restant

| Tour 1 | Tour 2 |
|---|---|
| IA-1 (B) : pas de mot « IA » ; ★ conseillé confondu avec ☆ Retenir | **Réglé.** « ✦ IA » et « ✦ conseillé » en pointillé violet ; Retenir reste ☆ blanc plein (`cap/v7-ecoulement-ligne`) |
| IA-2 (B) : une option perd son titre (« 🔧 ? ») | **Réglé** dans les 5 variantes (« Changer le joint », « Fin d'ébullition », « À froid ») |
| IA-3 (B) : pas de ✕ au repos | **Réglé** pour une option proposée par l'IA. **Reste** : la marque « ✦ conseillé » posée par l'IA sur une option à lui n'a pas de ✕ (voir C-1) |
| IA-4 (m) : pas d'état IA absente | **Réglé** : l'état existe et il est honnête. **Reste** : la lecture locale qu'il montre se trompe (voir C-2) |
| N-1 (B) : « ? » seul | **Réglé** pour le coût. **Reste** : le hachuré n'a aucune légende (voir C-3) |
| N-2 (B) : pilsner réglé lu comme ouvert | **Réglé** dans les 5 variantes |

Mots et px : je reprends `cap12/mesures.json` et RESULTAT.md (≤ 30 mots et ≤ 118 px sur les 60 cas), et je les recoupe à l'œil sur les captures ; je ne vois aucun texte coupé ni débordement.
Après un geste, la v7 respecte la règle du pilote :
- Aide : 10 à 12 mots ajoutés par l'IA ;
- ligne de l'IA : 14 mots ;
- ligne : 3 mots ajoutés autour de sa ligne.

### Nouveaux communs, retirés de la note de chaque variante concernée
- **C-1 (m, IA)** : « ✦ conseillé » vient de l'IA mais ne se refuse pas au repos (`cap12/v7-ecoulement` Sanitaire, `cap12/v7-chaudiere` Technicien ; idem v1, v2, v3 et v6).
- **C-2 (m, IA)** : en IA absente, la lecture de l'app range mal.
  - Chaudière : ☐ sur « Chaudière s'arrête toute… », qui est un constat, et 📝 sur « Technicien », qui est le vrai appel. Le J-1 de demain 7h disparaît (`cap/v7-chaudiere-sansia`).
  - Bouteilles : « Besoin avant » sans le 15, et 🛒 sur Fournisseur B mais 📝 sur Verallia (`cap/v7-bouteilles-sansia`).
  - Écoulement : 🛒 sur « Devis attendu » (`cap/v7-ecoulement-sansia`).
  - La tâche lue (☐) ne remonte pas en tête, alors que l'app la reconnaît.
- **C-3 (m, nouveau venu)** : le hachuré violet veut dire « inconnu », mais rien ne le dit. Au citra, 4 cases hachurées occupent la place centrale et ne disent rien (`cap12/v7-citra`, `cap12/v3-citra`).

---

## v7 : la recette

**UX.**
- Ce qui marche :
  - Le héros fait 23 % de la hauteur au lieu de 41 % : verbe, icône, J-n avec ses mots, ✓ et « plus tard ».
  - En dessous viennent 2 chiffres au plus, les rangées à repère (🔎 🛠️ 📋 🧪), puis le champ.
  - Le tableau des bouteilles se lit sans lire : vert = meilleur, rouge ⚠ 400/600, ligne 🧾 du coût total (`cap12/v7-bouteilles`).
  - Les 12 cas tiennent dans un écran, et rien ne passe sous le champ.
  - L'Aide arrive au-dessus du pouce, sans cacher le héros (`cap/v7-chaudiere-aide`).
- Ce qui ne marche pas : la bulle de ligne s'ouvre sous le **dernier** élément de la rangée, pas sous l'élément touché.
  - `cap/v7-ecoulement-ligne` : ligne 5 de Sanitaire, placée sous « Changer le joint ».
  - `cap/v7-chaudiere-ligne` : ligne 4 de Technicien, placée sous « Décaler au jeudi ».

**IA.**
- La meilleure des 5 :
  - chaque proposition porte ✦ IA et ✕ au repos ;
  - la ligne de l'IA dit « Proposé par l'IA, pas dans tes notes » avec ✕ Retirer et ＋ Garder (`cap/v7-ecoulement-ia-ligne`) ;
  - le refus s'annule (« Proposition retirée · ↶ Annuler ») et le compteur de l'Aide baisse (`cap/v7-bouteilles-refus`) ;
  - la question de l'IA (« Livraison Verallia ? ») est passée dans l'Aide (`cap/v7-bouteilles-aide`), et le héros reste « Choisir l'offre » J-20.
- Restent C-1 et C-2.

**Nouveau venu.**
- Il comprend sans explication : « À faire », « Réglé », J-n avec la date en mots, « plus tard », la jauge vert/rouge des bouteilles.
- Il bute sur :
  - J-8 à côté de « Réglé » : J-8 de quoi ? (`cap12/v7-pilsner`) ;
  - le hachuré (C-3) ;
  - ✕ et ⏭ sans mot dans la carte de l'Aide (`cap/v7-ecoulement-aide`) ;
  - « Raccord changé », déjà fait, rangé dans 🛠️ comme une option à faire (`cap12/v7-co2`).

Problèmes :
1. **m** : la bulle s'ouvre sous le bout de la rangée, pas sous l'élément touché (`cap/v7-ecoulement-ligne`, `cap/v7-chaudiere-ligne`). On ne sait plus quel élément elle explique.
2. **m** : en IA absente, la tâche et la date se perdent, et la lecture locale met ☐ sur un constat (C-2 ; `cap/v7-chaudiere-sansia`, `cap/v7-bouteilles-sansia`).
3. **m** : « ✦ conseillé » n'a pas de ✕ (C-1 ; `cap12/v7-ecoulement`, `cap12/v7-chaudiere`).
4. **m** : J-8 n'a pas d'objet sur le pilsner réglé (`cap12/v7-pilsner`). La v3 dit « Brassin J-8 ».
5. **m** : « Raccord changé » (fait) se lit comme une option ouverte, et J-7 n'a pas ses mots (« dans une semaine ») (`cap12/v7-co2`).
6. **m** : au citra, une grille entièrement hachurée et un héros « Choisir l'offre » sans rien à choisir (`cap12/v7-citra`). Le cas est pauvre et l'affichage honnête, mais on ne sait pas ce que veut dire le hachuré (C-3).
7. **m** : ✕ et ⏭ sans mot dans l'Aide (`cap/v7-ecoulement-aide`, `cap/v7-chaudiere-aide`). Le ⏭ du héros, lui, a « plus tard ».
8. **m** : l'anneau affiche « ✓0 » (`cap12/v7-chaudiere`), un zéro qui ne dit rien. Il suffit d'écrire ?2.

À greffer : c'est déjà la base.

Notes : UX 8, IA 8, nouveau venu 7,5, soit **7,8/10**.

---

## v6 : une seule chose maintenant

**Réglé depuis le tour 1** :
- le héros est une tâche, jamais une question de l'IA (`cap12/v6-bouteilles` : « Choisir l'offre » J-20) ;
- le pilsner est réglé (`cap12/v6-pilsner`) ;
- dates et compte à rebours sont dans le héros (`cap12/v6-cave` J-11 samedi 6 déc., `v6-bar` J-5 lundi) ;
- l'option garde son titre, l'occasion n'a plus de couronne et porte ⚠ 400/600 ;
- l'Aide passe sous le héros.

**Reste.**
- **UX** :
  - le héros fait encore environ 35 % de l'écran (≈ 295 px) pour un verbe ;
  - les chiffres arrivent en bas, sans repère de rangée ni libellé : « 10 min » sans « avant coupure », « 4.5% » seul, la paire de bar en blanc (`cap12/v6-chaudiere`, `v6-sureau`, `v6-co2`) ;
  - le citra n'a plus de comparaison, seulement deux pastilles hachurées (`cap12/v6-citra`).
- **IA** : ✕ au repos, refus annulable (`cap/v6-ecoulement-refus`). Le bouton Aide ne dit pas combien de propositions attendent. Restent C-1 et C-2.
- **Nouveau venu** :
  - ⏭ n'a toujours pas de mot ;
  - « 👑 Fournisseur B par 600 » est illisible : 600 de quoi, et gagne quoi ? (`cap12/v6-bouteilles`) ;
  - le prix par bouteille et la livraison ont disparu.

Problèmes :
1. **m** : le compte à rebours est répété : « Renouveler l'assurance J-36 » sous le héros J-36 (`cap12/v6-assurance`), « Brassage IPA J-1 » sous le héros J-1 (`cap12/v6-chaudiere`).
2. **m** : les rangées de chiffres n'ont ni repère ni libellé (`cap12/v6-chaudiere`, `v6-sureau`, `v6-bar`, `v6-levure`).
3. **m** : ⏭ n'a pas de mot (`cap12/v6-*`).
4. **m** : bouteilles : la couronne ne dit pas le critère, et le prix par bouteille et la livraison manquent (`cap12/v6-bouteilles`).
5. **m** : le héros fait 35 % de la hauteur (`cap12/v6-ecoulement`, `v6-pilsner`).
6. **m** : le citra n'a aucune grille de comparaison (`cap12/v6-citra`).

À greffer : rien que la v7 n'ait déjà.

Notes : UX 7, IA 7, nouveau venu 6,5, soit **7/10** (6,7 au tour 1).

---

## v2 : grosses tuiles

**Réglé depuis le tour 1** :
- la tâche est en première tuile avec J-n (`cap12/v2-chaudiere`, `v2-bar`) ;
- le pilsner réglé tient en une carte verte compacte (`cap12/v2-pilsner`) ;
- les bouteilles tombent à 22 mots, avec des **barres de coût total** : la longueur fait le coût, la partie hachurée l'inconnu, la couronne le moins cher (`cap12/v2-bouteilles`) ;
- plus de « ? » sur une barre pleine ;
- plus de mot coupé ;
- « 1/2 trouvé » se comprend.

**Reste.**
- **UX** : une tuile seule sur une demi-largeur laisse un trou (`cap12/v2-ecoulement`, `v2-citra`, `v2-sureau`, `v2-levure`). Le nom « Fournisseur B » passe à la ligne et laisse « B » seul (`cap12/v2-bouteilles`).
- **IA** : ✕ au repos, refus annulable (`cap/v2-ecoulement-refus`). La feuille Aide du tour 1 n'a pas été rejouée. Restent C-1 et C-2.
- **Nouveau venu** :
  - deux comptes à rebours identiques au premier écran : « J-36 31 déc. » deux fois (`cap12/v2-assurance`), « J-1 demain 7h » deux fois (`cap12/v2-chaudiere`). Lequel compte ?
  - « ⚠ 80 » en rouge ne dit plus pourquoi : le 400/600 a disparu (`cap12/v2-bouteilles`) ;
  - la tuile « Fournisseur B / par 600 » est un mystère ;
  - « 0/1 trouvé » sur une simple question (`cap12/v2-citra`, `v2-bar`).

Problèmes :
1. **B** : deux J-n identiques empilés en haut d'écran (`cap12/v2-assurance`, `cap12/v2-chaudiere`). Pour un TDAH, deux urgences égales valent zéro urgence.
2. **m** : l'occasion porte ⚠ 80 sans 400/600, et le prix par bouteille et la livraison manquent (`cap12/v2-bouteilles`).
3. **m** : la tuile « par 600 » est illisible (`cap12/v2-bouteilles`).
4. **m** : des demi-tuiles laissent des trous (`cap12/v2-ecoulement`, `v2-sureau`, `v2-levure`).
5. **m** : « 0/1 trouvé » pour une question, et non pour une piste (`cap12/v2-citra`, `v2-bar`).
6. **m** : la tâche n'a ni ✓ ni « plus tard », seulement une case (`cap12/v2-*`).
7. **m** : « Raccord changé » (fait) se lit comme une option (`cap12/v2-co2`).

À greffer : les **barres de coût total par offre** (`cap12/v2-bouteilles`), sous la ligne 🧾 du tableau v7, ou à sa place.

Notes : UX 6,5, IA 6,5, nouveau venu 6, soit **6,3/10** (5,2 au tour 1).

---

## v3 : chemin vertical

**Réglé depuis le tour 1** :
- le tableau à N colonnes tient à 3 offres, avec 👑 sur 410 et ⚠ 400/600 (`cap12/v3-bouteilles`) ;
- la station porte l'icône de la tâche (🧹 ✉️ 🎟️) ;
- le pilsner est réglé, avec « Brassin J-8 3 déc. » : la seule variante qui dit **de quoi** est le J-8 (`cap12/v3-pilsner`) ;
- pas de rail sur le sureau ni sur la levure ;
- la case fait 28 px ;
- le titre est à gauche.

**Reste.**
- **UX** :
  - le J-n est détaché de sa tâche : il est placé à la dernière station, 500 à 600 px plus bas, dans un rond rouge (`cap12/v3-cave` : « J-11 samedi 6 déc. » seul, sans objet ; `v3-bar` : « J-5 lundi » seul ; `v3-fete`) ;
  - à la chaudière, la tâche urgente est au milieu de l'écran, après les pistes, et son titre tient sur 3 lignes à cause de la pastille J-1 (`cap12/v3-chaudiere`) ;
  - les valeurs du tableau sont grises et peu contrastées (`cap12/v3-bouteilles`).
- **FRISE-GENERIQUE** : échéance, événement, liste et bar ont le même rail tâche → 📋 → 🗓️, avec un dégradé vert, jaune puis gris qui ne veut rien dire (`cap12/v3-fete`, `v3-assurance`, `v3-cave`, `v3-bar`). C'est moins faux qu'au tour 1, mais c'est encore une forme fixe.
- **IA** : ✕ au repos, refus annulable (`cap/v3-ecoulement-refus`). La bulle avec ✕ et ＋ n'est pas rejouée au tour 2. Restent C-1 et C-2.
- **Nouveau venu** :
  - « Site français ? », une piste, est rangé dans la station ✋ « choisi » (`cap12/v3-citra`) ;
  - « Assez de fûts ? » est rangé dans 📋 « liste » (`cap12/v3-bar`) ;
  - ☆ Verallia, ☆ Fournisseur B et ☆ Occasion répètent l'en-tête du tableau (`cap12/v3-bouteilles`).

Problèmes :
1. **B** : le compte à rebours est séparé de sa tâche, et sans objet pour la cave et le bar (`cap12/v3-cave`, `v3-bar`, `v3-fete`). C'est exactement le défaut que la correction devait régler (« date de la tâche visible »).
2. **m** : un rail de même forme pour 4 genres, avec un dégradé décoratif (`cap12/v3-assurance`, `v3-cave`, `v3-bar`, `v3-fete`), à la limite de FRISE-GENERIQUE.
3. **m** : à la chaudière, la tâche J-1 est au milieu, avec un titre sur 3 lignes (`cap12/v3-chaudiere`).
4. **m** : des éléments sont dans la mauvaise station : une piste dans ✋ (`cap12/v3-citra`), une piste dans 📋 (`cap12/v3-bar`).
5. **m** : les ☆ répètent le tableau ; 3 pastilles pour rien (`cap12/v3-bouteilles`, `v3-citra`).
6. **m** : les valeurs du tableau sont grises, peu contrastées (`cap12/v3-bouteilles`).
7. **m** : au sureau et à la levure, les blocs n'ont aucun repère : on ne sait pas que « Fin d'ébullition » et « À froid » sont des options (`cap12/v3-sureau`).

À greffer : « **Brassin** J-8 », le nom de l'objet dans la pastille J-n (`cap12/v3-pilsner`). Le tableau et la bulle sont déjà dans la v7.

Notes : UX 5,5, IA 6,5, nouveau venu 5,5, soit **5,8/10** (5,8 au tour 1).

---

## v1 : carte mentale

**Réglé depuis le tour 1** :
- 8 branches au plus, plus de chevauchement de nœuds (`cap12/v1-bouteilles`, `v1-fete`) ;
- plus de coupure au bord ;
- une carte « maintenant » au-dessus du pouce, avec J-n (`cap12/v1-chaudiere`, `v1-bar`) ;
- le pilsner est réglé ;
- les pastilles ne se coupent plus.

**Reste.**
- **UX** :
  - les 230 premiers px sont vides (`cap12/v1-*`) ;
  - la tâche est à 640 px, alors que l'œil va au centre ;
  - les traits traversent les étiquettes : « Joint d|u siphon », « Voy|ant rouge », « Asse|z de fûts » (`cap12/v1-ecoulement`, `v1-chaudiere`, `v1-bar`) ;
  - l'étiquette « Changer le joint » touche l'anneau (`cap12/v1-ecoulement`) ;
  - les listes sont repliées en « 📋 4 » et « 📋 3 » : rien n'est visible sans toucher (`cap12/v1-cave`, `v1-assurance`, `v1-fete`) ;
  - le pilsner n'a qu'un grand anneau vide (`cap12/v1-pilsner`).
- **IA** : ✕ sur le nœud de l'IA, refus annulable, mais le trait pointillé reste après le refus (`cap/v1-ecoulement-refus`). Restent C-1 et C-2.
- **Nouveau venu** :
  - le centre « 🎪 J-96 » se lit « la fête dans 96 jours », alors que J-96 est la date limite du stand, « avant mars » ; la fête est en juin (`cap12/v1-fete`) ;
  - J-36 apparaît **3 fois** (centre, nœud, carte) (`cap12/v1-assurance`) ;
  - J-11 et J-5 apparaissent 2 fois (`cap12/v1-cave`, `v1-bar`).

Problèmes :
1. **B** : le compte à rebours du centre est attribué au carnet entier : la fête paraît à J-96 (`cap12/v1-fete`). L'outil affirme une date fausse.
2. **m** : le même J-n répété 2 ou 3 fois (`cap12/v1-assurance`, `v1-cave`, `v1-bar`, `v1-chaudiere`).
3. **m** : les traits passent sur les étiquettes (`cap12/v1-ecoulement`, `v1-chaudiere`, `v1-bar`, `v1-levure`).
4. **m** : les listes sont cachées derrière « 📋 n » (`cap12/v1-cave`, `v1-assurance`, `v1-fete`).
5. **m** : le trait pointillé reste après le refus (`cap/v1-ecoulement-refus`).
6. **m** : 230 px vides en haut ; la prochaine action est en bas, l'œil au centre (`cap12/v1-*`).

À greffer : rien de neuf ; l'anneau ✓n ?n est déjà dans la v7.

Notes : UX 5,5, IA 6, nouveau venu 5, soit **5,5/10** (5 au tour 1).

---

## Classement

1. **v7 (7,8)** : la seule où, sur les 12 cas, il voit en 2 secondes **quoi faire, pour quand, et si c'est réglé**. L'IA y est visible, refusable et annulable. Ses 8 problèmes sont tous mineurs et se corrigent par des règles, pas par un redessin.
2. **v6 (7)** : même genre en moins abouti. Héros trop haut, chiffres sans libellé, pas de grille de comparaison, J-n répété. Elle n'apporte rien que la v7 n'ait déjà.
3. **v2 (6,3)** : a beaucoup progressé. Ses barres de coût total sont le meilleur visuel « sans lire » des 5. Mais elle empile deux urgences égales et perd le pourquoi du ⚠.
4. **v3 (5,8)** : le tableau et « Brassin J-8 » sont bons, mais la date est séparée de sa tâche, et le rail reste une forme fixe.
5. **v1 (5,5)** : belle, mais elle attribue au carnet la date d'une tâche et répète le même J-n 3 fois.

## À écarter (sous 6 chez moi)

- **v1 : à écarter.** Le centre unique impose un seul chiffre au carnet, et ce chiffre ment dès que la date porte sur une tâche.
- **v3 : à écarter.** Le rail sépare la date de la chose datée. Ses deux greffes (tableau, bulle) sont déjà dans la v7, et « Brassin J-8 » passe dans la recette.
- v2 et v6 restent au-dessus de 6. Je les garde comme variantes à lui montrer, à côté de la v7, pour qu'il ait un vrai choix de genre (tuiles, ou une chose à la fois).

## Recette de la meilleure combinaison (mécanisme → source)

| Mécanisme | Source | Règle |
|---|---|---|
| Base : héros tâche ou « ✓ Réglé », J-n avec ses mots, ✓ et « plus tard », rangées à repère, tableau à N offres avec 🧾, ✦ IA avec ✕, Aide une à la fois, IA absente | v7 | Inchangée |
| Barre de coût total par offre : la longueur fait le coût, le hachuré l'inconnu, 👑 le moins cher | v2 (`cap12/v2-bouteilles`) | Dans la ligne 🧾 du tableau v7, et ⚠ 400/600 garde sa raison |
| L'objet du J-n : « Brassin J-8 » | v3 (`cap12/v3-pilsner`) | Toute pastille J-n hors du héros nomme son objet en un mot |
| Bulle ancrée sous l'élément touché | v3 (tour 1, `cap/v3-ecoulement-geste`) | Corrige le problème 1 de la v7 |
| Un seul J-n par échéance à l'écran | contre-exemples v1, v2, v6 | La rangée qui répète le héros disparaît |
| ✕ sur « ✦ conseillé » | nouveau (C-1) | Retire la marque, pas l'option |
| IA absente utile | nouveau (C-2) | La ligne lue ☐ devient le héros, avec sa date lue ; un constat ne reçoit jamais ☐ |
| Légende du hachuré au premier usage | nouveau (C-3) | « inconnu » une fois, en petit, sous la grille |
| Un élément fait ne se lit plus comme à faire | nouveau | « Raccord changé » prend ✓ et se range sous ce qui est trouvé |
| Mots sous ✕ et ⏭ dans l'Aide | v7 (« plus tard » du héros) | « non » et « plus tard » |
