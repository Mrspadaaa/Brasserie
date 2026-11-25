# Juge produit, tour 3 (final) : trois regards (UX mobile compacte, IA, nouveau venu)

Matière ouverte une à une, 56 captures :
- `cap12/` : les 36 captures au repos (v2, v6, v7 × 12 cas) ;
- `cap/v7-*` : ligne, ligne IA, Aide, ✕ sur « conseillé », bouteilles (ligne, Aide, refus, Prendre, IA absente), chaudière (ligne, IA absente), écoulement (IA absente) ;
- `cap/v6-ecoulement-{ligne,aide,sansia}` et `cap/v2-ecoulement-{ligne,aide,sansia}`.

Je ne cite que des captures que j'ai ouvertes. Règles dures : ORGANISE-TROP-TEXTUEL, FRISE-GENERIQUE et ENTETE-PEU-UTILE.

Décisions du pilote appliquées :
- en « IA absente », ses lignes affichées en entier ne comptent pas dans les 30 mots ;
- les fausses tâches de la lecture locale (« Chaudière », « Levure »…) ne comptent pas contre les variantes, car elles sont corrigées à part (`cap/v7-chaudiere-sansia` n'est donc pas retenu contre la v7).

Mots et px : je reprends RESULTAT.md. Au repos, les 3 variantes restent ≤ 30 mots sur les 12 cas, et la première info utile arrive entre 46 et 50 px. Je recoupe à l'œil : aucun mot coupé, aucun débordement, sauf v2-bar (m ci-dessous).
B = bloquant, m = mineur.

## Communs du tour 2 : réglé ou restant

| Tour 2 | Tour 3 |
|---|---|
| C-1 : « ✦ conseillé » sans ✕ | **Réglé** dans les 3. Le ✕ retire la marque, pas l'option, et le toast propose « ↶ Annuler » (`cap/v7-ecoulement-sansconseil`) |
| C-2 : IA absente mal rangée | **Réglé** (hors défaut de lecture locale). La ligne lue « à faire » devient le héros, avec « lu par l'app » ; ses lignes restent entières, numérotées, avec le prix lu (`cap/v7-ecoulement-sansia`, `cap/v6-…`, `cap/v2-ecoulement-sansia`, `cap/v7-bouteilles-sansia`). Rien n'est inventé : « avant le 15 du mois » reste sa phrase, sans faux J-n. |
| C-3 : hachuré sans légende | **Réglé** : « prix inconnu » ou « inconnu » apparaît sous ce qui est hachuré, et le citra n'a plus aucun hachuré (`cap12/*-citra`) |
| « Raccord changé » (fait) rangé en option | **Réglé** dans les 3 : ✓ vert plein (`cap12/v7-co2`, `v6-co2`, `v2-co2`). Le comptage reste ambigu dans v7 et v6 (voir plus bas) |
| J-n sans objet, J-n répété | **Réglé** dans les 3 : « 🍺 Brassage IPA · J-1 · demain 7h », « Brassin J-8 », « ⏳ Renouveler l'assurance J-36 » ; un seul J-n par échéance |

---

## v7 : la recette

**UX mobile compacte.**
- Ce qui marche :
  - le héros occupe environ 25 % de l'écran ;
  - sous lui, au plus 2 chiffres légendés, puis des rangées à repère (🔎 🛠️ 📋 🧪) ;
  - aucun cas ne dépasse l'écran.
- La jauge des bouteilles est le meilleur visuel des trois variantes (`cap12/v7-bouteilles`) :
  - une colonne par offre, et sa hauteur donne le coût pour 600 ;
  - un capuchon hachuré marque la livraison inconnue ;
  - 👑 410 en vert, ⚠ ≥80 en rouge avec 400 sous le nom ;
  - le geste est dans le héros : « ✓ Prendre Fournisseur B ».
- La bulle de ligne s'ouvre enfin sous l'élément touché, avec une pointe (`cap/v7-ecoulement-ligne` sous Sanitaire, `cap/v7-chaudiere-ligne` sous Technicien, `cap/v7-bouteilles-ligne` sous l'en-tête Verallia).
- L'urgence se lit sans lire :
  - J-1 en rouge (`cap12/v7-chaudiere`) ;
  - J-5 et J-7 en orange (`v7-bar`, `v7-co2`) ;
  - J-96 en gris calme (`v7-fete`).
- Ce qui ne marche pas :
  - deux verts disent « meilleur » à deux endroits différents : la colonne 👑 de Fournisseur B, et la case 0.20 /bt de l'Occasion, sur fond vert (`cap12/v7-bouteilles`) ;
  - dans le CO2, « Raccord changé ✓ », en vert plein vif, est l'objet le plus voyant sous le héros, et il se trouve dans la rangée 🔎 à côté de « 1/3 trouvé », alors qu'on y voit deux ✓ (`cap12/v7-co2`).

**IA.**
- Toujours la meilleure :
  - ✦ IA et ✕ au repos sur chaque proposition ;
  - ✕ sur « ✦ conseillé » ;
  - la ligne de l'IA dit « Proposé par l'IA, pas dans tes notes », avec « ✕ Retirer » et « ＋ Garder » (`cap/v7-ecoulement-ia-ligne`) ;
  - le refus s'annule, et le compteur de l'Aide passe de 2 à 1 (`cap/v7-bouteilles-refus`) ;
  - l'Aide propose une chose à la fois, avec « non », « plus tard » et « ＋ Garder » (`cap/v7-ecoulement-aide`, `cap/v7-bouteilles-aide`) ;
  - l'IA absente reste honnête et utile, avec « ⟳ Réessayer » (`cap/v7-ecoulement-sansia`).
- Reste un point. Le gros bouton « Prendre Fournisseur B » et la marque « ✦ conseillé » désignent la même offre. Rien ne dit que le bouton vient du calcul de l'app (👑) et non de l'IA. Si l'IA conseillait une autre offre, le bouton doit suivre 👑, jamais la marque (`cap12/v7-bouteilles`).

**Nouveau venu.**
- Il comprend sans explication :
  - « plus tard » ;
  - « Réglé » et « Choisi » ;
  - « Brassin J-8 » ;
  - la légende « prix inconnu » ;
  - « 1/2 trouvé » avec l'anneau ;
  - « non » et « plus tard » dans l'Aide.
- Il bute sur :
  - « 🧾 CHF » comme libellé de la jauge : ≥504 de quoi ? Il manque le mot « total » (`cap12/v7-bouteilles`) ;
  - « 3e génération / Génération », où la légende répète la valeur (`cap12/v7-levure`) ;
  - après « Prendre », un héros « ✓ Choisi · Fournisseur B » qui ne dit plus quoi faire. Il ne propose que « Rouvrir », alors que l'étape suivante, commander, attend avant J-20 (`cap/v7-bouteilles-prendre`).

Problèmes :
1. **m** : après « Prendre », le héros annonce un état au lieu de la prochaine action. FRISE-GENERIQUE demande « la prochaine chose utile » (comparé › choisi › **commandé**). Il faut « 📦 Commander chez Fournisseur B · J-20 », avec ✓ et « plus tard » (`cap/v7-bouteilles-prendre`).
2. **m** : deux « meilleurs » en vert : la case 0.20 /bt de l'Occasion est verte alors qu'elle ne couvre pas le besoin (`cap12/v7-bouteilles`, `cap/v7-bouteilles-ligne`).
3. **m** : CO2 : le fait accompli « Raccord changé ✓ » est en vert plein dans la rangée 🔎, ce qui fait lire « 1/3 trouvé » à côté de deux ✓ (`cap12/v7-co2`). Le fait doit passer en ✓ discret, sous 🛠️, ou hors des pistes.
4. **m** : la jauge n'a pas le mot « total » : 🧾 CHF seul (`cap12/v7-bouteilles`).
5. **m** : rien ne dit que le bouton « Prendre » vient de 👑 et non de « ✦ conseillé » (`cap12/v7-bouteilles`).
6. **m** : 🛒 apparaît deux fois, sur la rangée et sur chaque puce (`cap12/v7-citra`).
7. **m** : levure : la légende « Génération » répète « 3e génération » (`cap12/v7-levure`).
8. **m** : le CO2 est à 30 mots pile (RESULTAT.md), sans marge. Sur une vraie note plus longue, le port dépassera si le contrôle des 30 mots n'est pas rejoué sur l'app.

À greffer : c'est la base.

Notes : UX 8,5, IA 8,5, nouveau venu 8, soit **8,3/10** (7,8 au tour 2).

---

## v6 : une seule chose maintenant

**UX mobile compacte.**
- Réglé :
  - un seul J-n ;
  - « Brassage IPA J-1 » est nommé ;
  - les chiffres ont leur légende (« Avant coupure », « Budget », « Le 15 / Le 22 ») et montent sous le héros (`cap12/v6-chaudiere`, `v6-fete`, `v6-co2`).
- Reste :
  - le héros occupe encore 37 à 44 % de la hauteur (`cap12/v6-chaudiere` : 740 px sur 1688 ; `v6-pilsner`) ;
  - pour les achats, le héros n'a **aucun geste** : « Choisir l'offre » est un grand titre sans ✓, sans « plus tard » et sans « Prendre » (`cap12/v6-bouteilles`, `cap12/v6-citra`). La promesse du genre, « la seule chose à faire, en grand », devient une impasse sur 2 cas sur 12 ;
  - les bouteilles sont en pastilles « Verallia ≥504 », « Fournisseur B 410 », « Occasion ≥80 ⚠ 400/600 » : on ne voit ni longueur ni prix par bouteille, et « 👑 Fournisseur B par 600 » reste à part (`cap12/v6-bouteilles`) ;
  - « ✓0 ?2 » dans le coin (`cap12/v6-chaudiere`).

**IA.**
- Ce qui va : ✕ au repos, « conseillé » avec ✕, et IA absente au même niveau que la v7 (`cap/v6-ecoulement-sansia`).
- Ce qui ne va pas :
  - dans l'Aide, la carte IA s'insère sous le héros et pousse les options sous le pli ;
  - le ✕ y est presque invisible, un cercle sans bord ; ✕ et ＋ n'ont pas de mot ; pas de « plus tard » (`cap/v6-ecoulement-aide`) ;
  - la feuille de ligne n'a pas « Retenir » (`cap/v6-ecoulement-ligne`) ;
  - le bouton Aide n'affiche pas de compteur.

**Nouveau venu.**
- ⏭ du héros sans mot (`cap12/v6-*`) ;
- citra : les étapes ⚖️ › ✋ › 📦 annoncent une comparaison qu'il n'y a pas (`cap12/v6-citra`) ;
- « Maintenant » en jaune sur chaque carnet, même quand le J-n dit 96 jours (`cap12/v6-fete`).

Problèmes :
1. **B** : le héros d'un achat n'a aucun geste, alors que c'est la seule chose en grand (`cap12/v6-bouteilles`, `cap12/v6-citra`).
2. **m** : le héros fait environ 40 % de l'écran, et les blocs utiles passent sous la moitié (`cap12/v6-chaudiere`, `v6-co2`, `v6-assurance`).
3. **m** : les bouteilles n'ont ni jauge ni prix par bouteille ; la couronne est à part (`cap12/v6-bouteilles`).
4. **m** : Aide : ✕ invisible, sans mot, pas de « plus tard », et les options sont poussées sous le pli (`cap/v6-ecoulement-aide`).
5. **m** : ⏭ sans mot ; « ✓0 » (`cap12/v6-chaudiere`).
6. **m** : citra : des étapes ⚖️›✋›📦 sans rien à comparer (`cap12/v6-citra`).
7. **m** : la feuille de ligne n'a pas « Retenir » (`cap/v6-ecoulement-ligne`).

À greffer : rien que la v7 n'ait déjà.

Notes : UX 6,5, IA 7, nouveau venu 6,5, soit **6,7/10** (7 au tour 2 ; elle perd le point d'avance du héros sans geste, que la v7 a réglé).

---

## v2 : grosses tuiles

**UX mobile compacte.**
- Le plus compact des trois au repos : 12 à 22 mots, info à 50 px.
- Ses **barres horizontales de coût total** se lisent en une seconde (`cap12/v2-bouteilles`) :
  - la longueur donne le prix ;
  - le hachuré marque l'inconnu ;
  - 👑 410 en vert, « ⚠ 80 » en rouge avec « 400/600 » dessous.
- Reste :
  - des demi-tuiles laissent un trou à droite (`cap12/v2-ecoulement`, `v2-co2`, `v2-levure`, `v2-citra`, `v2-assurance`) ;
  - « Appeler / le / technicien » tient sur 3 lignes (`cap12/v2-chaudiere`) ;
  - « 2 fûts par mois » touche le bord de sa tuile (`cap12/v2-bar`) ;
  - « Fournisseur / B » est coupé, et la lettre B se retrouve seule (`cap12/v2-bouteilles`) ;
  - le héros n'a qu'une case : ni ✓ franc, ni « plus tard », ni « Prendre » pour l'achat.

**IA.**
- Ce qui va : ✕ au repos, « conseillé » avec ✕, IA absente correcte (`cap/v2-ecoulement-sansia`).
- Ce qui ne va pas :
  - l'Aide arrive en feuille du bas, avec ✕ et ＋ sans mot, sans « plus tard » ni compteur (`cap/v2-ecoulement-aide`) ;
  - la feuille de ligne n'a pas « Retenir » (`cap/v2-ecoulement-ligne`).

**Nouveau venu.**
- La tuile « n/m trouvé » ne montre que des **icônes** de pistes : boulon ✓, briques ✗, « FR ? », un fût « ? ». Sans les mots, il ne sait pas quelle piste est trouvée (`cap12/v2-ecoulement`, `v2-chaudiere`, `v2-citra`, `v2-bar`).
- « 0/1 trouvé » sur une simple question (`cap12/v2-citra`, `v2-bar`).
- Citra : l'étiquette « ⚖️ comparé » est allumée alors que rien n'est comparé (`cap12/v2-citra`).

Problèmes :
1. **m** : les pistes ne sont que des icônes dans la tuile « trouvé », et il faut toucher pour savoir laquelle (`cap12/v2-ecoulement`, `v2-chaudiere`, `v2-bar`).
2. **m** : le héros n'a ni ✓, ni « plus tard », ni « Prendre » (`cap12/v2-*`, `cap12/v2-bouteilles`).
3. **m** : demi-tuiles et trous ; « Appeler / le / technicien » sur 3 lignes ; « mois » au bord de la tuile (`cap12/v2-chaudiere`, `v2-bar`, `v2-levure`).
4. **m** : « ⚖️ comparé » faux au citra, et « 0/1 trouvé » sur une question (`cap12/v2-citra`).
5. **m** : Aide et ligne : boutons sans mot, ni « plus tard » ni « Retenir » (`cap/v2-ecoulement-aide`, `cap/v2-ecoulement-ligne`).
6. **m** : « Fournisseur / B » coupé (`cap12/v2-bouteilles`).

À greffer : les **barres horizontales** du coût total (`cap12/v2-bouteilles`), comme seconde forme de la jauge de la v7 à 4 offres ou plus, où les colonnes deviennent trop étroites. Les noms complets s'alignent à gauche.

Notes : UX 7, IA 6,5, nouveau venu 6, soit **6,5/10** (6,3 au tour 2).

---

## Classement final

1. **v7 (8,3)** : en 2 secondes, sur les 12 cas, il voit quoi faire, pour quand, avec quelle urgence, et si c'est réglé.
   - Elle est seule à avoir un geste dans le héros pour tous les genres : ✓ et « plus tard », « Prendre », « Rouvrir ».
   - Elle est seule à donner les mots « non » et « plus tard » dans l'Aide.
   - Ses 8 problèmes sont des mineurs de règle, pas de dessin.
2. **v6 (6,7)** : légendes et J-n réglés, IA honnête. Mais son héros sans geste sur les achats contredit son propre genre, et sa hauteur repousse tout le reste.
3. **v2 (6,5)** : la plus sobre, avec les meilleures barres. Mais des pistes en icônes muettes et un héros sans geste.

Aucune n'est sous 6 chez moi. La v2 et la v6 restent montrables à côté de la v7, pour lui donner un vrai choix de genre.

## Répond au besoin ? (v7)

**Oui.** Sa demande : « un peu trop textuel » pour un TDAH visuel, un en-tête qui « mange » l'écran, une frise « trop générique ». La v7 y répond :
- 14 à 30 mots au repos ;
- la première info utile à 46 px ;
- l'urgence en couleur ;
- le coût en hauteur ;
- l'état en forme (anneau, ✓, barré) ;
- un avancement propre au genre (n/m trouvé, J-n nommé, Choisi, Réglé), sans frise fixe.

L'IA y est visible, refusable et annulable. Sans IA, le carnet reste utilisable. Il reste les retouches ci-dessous, aucune bloquante.

## Retouches à faire avant le port dans le jouable (v7)

1. **Après « Prendre »**, le héros devient la prochaine action de l'achat : « 📦 Commander chez <offre> · J-n », avec ✓ et « plus tard », et « Rouvrir » en second (`cap/v7-bouteilles-prendre`).
2. **Un seul vert « meilleur »** par comparaison : celui de 👑. Une case /bt d'une offre qui ne couvre pas le besoin reste neutre (`cap12/v7-bouteilles`).
3. **Le fait accompli** (« Raccord changé ») sort de la rangée 🔎 et prend un ✓ discret, rangé sous 🛠️ ou à part. « n/m trouvé » ne compte que les pistes (`cap12/v7-co2`).
4. **Le libellé de la jauge** dit « total » : « 🧾 total CHF » (`cap12/v7-bouteilles`).
5. **Règle de port** : « Prendre » suit toujours 👑, le calcul de l'app ; « ✦ conseillé » n'est qu'une marque, et peut désigner une autre offre.
6. **Supprimer l'icône redondante** : 🛒 sur la rangée ou sur la puce, pas les deux (`cap12/v7-citra`). Une légende qui répète la valeur (« 3e génération / Génération ») disparaît (`cap12/v7-levure`).
7. **Rejouer le contrôle des 30 mots** sur l'app portée, avec les vraies notes (le CO2 est à 30 pile).
8. **Barres horizontales de la v2** comme repli de la jauge à 4 offres ou plus.

Hors variantes, pour l'app : « samedi 6 déc. » (ranger la cave) est un dimanche en 2026. L'app pourrait signaler un jour et une date qui se contredisent au lieu d'afficher J-11 sans réserve (`cap12/v7-cave`). La lecture locale qui croit voir des tâches (« Chaudière », « Levure ») est déjà traitée à part.
