OK — 17 versions gardées corrigées sur g-d1, 68 captures, page14/gestes-corriges.html

# Corrections après la critique du 16.11 soir (21 problèmes, 4 bloquants)

Base : `paliers/g-d1.html`, non modifié. Seules les versions gardées par la critique sont reconstruites. Les versions écartées
(f1-a, f2-b, f5-a, c2-a, c4-b) gardent leurs fichiers et captures de la v0, sans y toucher.

## Corrections communes (toutes les versions gardées)
- **1. Le + cachait des chiffres** : une marge fixe de 88 px au-dessus des onglets (`.gx-pied`, fond de page, filet en haut et fondu
  de 14 px). La frise défile dessous ; le + reste à sa place (16 px au-dessus des onglets). Plus aucun chiffre sous le +.
- **2. Le message passait sous le +** : il tient sur une ligne et s'arrête 12 px avant le + (largeur calculée sur le +). Contrôle
  `TOAST-FAB` et `TOAST 2 LIGNES` ajoutés au banc.
- **3. « −1 180 / +1 180 » sous les soldes** : la ligne est retirée partout. La case qui change s'allume avec son nouveau solde.
  « ancien → nouveau » s'écrit dans le message (« S51 : 5 064 → 4 524 ») ou dans la carte (« S47 4 032 → 4 180 »). Rien n'est
  écrit sous un solde inchangé. Écart à la suggestion « dans la case » : dans 61 px, « 5 064 → 4 524 » ne tient pas à 14 px.
- **13. La puce « 6 sem. » couvrait la poignée** : elle sort de la courbe, sous elle, à droite, sur l'axe des mois. Le libellé
  « sept. » est retiré pour lui faire la place. Écart à g-d1, voulu par le défaut n° 11.
- **21. Le doigt est le même partout** : violet translucide (il touche), en pointillé (il vient de lâcher), anneau violet qui se
  remplit (appui long, c3-b comme f5-b).

## Par version
- **f1-b** (4, greffe de c4-a) : la barre garde sa longueur (S52 → S51, une semaine). Pendant le glisser, la courbe se zoome sur
  S49 → S2 : avant en pointillé, si tu lâches en plein, écart en rouge, « −540 ». La silhouette reste à l'ancienne place.
- **f2-a** (5, BLOQUANT, greffe de f2-b) : l'alerte rouge de f6-b sur les 3 fûts promis à La Cigogne le 15 déc., avec « Livrer le
  22 déc. » et « Annuler l'allongement ». Les jours actifs (brassage, transfert, mise en fût) sont des points sur la barre seule ;
  la mise en fût passe en rouge au 21 déc. La bande n'a aucune ligne de plus (7).
- **f3-a** (8) : l'indice au repos est le + de la rangée Ventes ; le doigt le touche, sans case de pose (choix n° 33). La carte
  dit « S52 5 550 → 5 680 · au plus serré 113 → 243 ».
- **f3-b** (9) : la carte décompte ce que les jours usent : « S50 déjà 4/2 j · S49 et S52 pleins · place pour 1 j (S51) ». Les
  points de la barre sont rouges là où ça déborde. La carte est resserrée pour tenir au-dessus de la marge du +.
- **f4-a** : la marge du + seulement.
- **f4-b** (doute 1, greffe de f4-a) : un ruban rouge entre la courbe « avec » et la courbe « sans » rend l'écart visible. Ajout
  des actions : « Ouvrir la vente » et « Commander 2 coffrets » (coffrets : 4 en stock, il en manque 2).
- **f5-b** : la marge du + seulement.
- **f6-a** : même défaut que 4 : le Porter garde sa longueur (deux semaines). Le message dit « S50 : 5 120 → 4 944 ».
- **f6-b** (11, 12) : le doigt est au milieu de la barre et toute la barre glisse. « Garder le 15 déc. » devient « Annuler le
  décalage ». La caisse est écrite dans la carte : « S47 4 032 → 4 180, la suite inchangée ».
- **c1-a** (13, 14) : le frigo est grisé et hachuré, « Frigo : mis de côté, non compté · 120 / sem. ». La puce est hors de la courbe.
- **c1-b** : la marge et la puce seulement (doute du loyer de janvier non traité).
- **c2-b** (16, greffe de c3-a) : le doigt glisse de S49 à S50 sur la bande et la tête lit la semaine (« 5 120 CHF · S50 · 7 déc.
  +988 »). Les ventes +120 s'allument, avec leur montant. Les rangées sans mouvement en S50 se replient (« rien en S50 »), donc la
  facture −312 se voit au-dessus de la marge.
- **c3-a** (17, BLOQUANT) : « +3 autres » (S13 a 5 mouvements).
- **c3-b** (doute 2) : la semaine détaillée est celle sous le doigt, S24 au plus serré (14 → 20 juin, libre 113, −320 +120 = −200).
- **c4-a** : même défaut que 4 : le Porter garde ses deux semaines, la deuxième sort à droite (coupée).
- **c5-a** : la marge seulement.
- **c5-b** (13, 20) : la puce est hors de la courbe. Sous la marge, « Activités » n'est plus coupé. En vue année, un montant
  qui ne tient pas avec son nom garde au moins sa valeur (−176, −380, +640…).
- **Non repris** : 6, 7 (f2-b écartée ; ses points de jours sont greffés sur f2-a), 10 (f5-a écartée), 15 (c2-a écartée), 18 et
  19 (c4-b écartée).

## Contrôles (sortie décisive)
- `node gx/build-frise.mjs` → `FRISE OK : 18 états, texte et + conformes`. Le + est à 16 px au-dessus des onglets, aucun texte sous
  14 px, rien de coupé ni de chevauché, aucun texte sous le +, message sur une ligne à 12 px du + au moins. `gx/cap/verif-frise.txt`.
- `node gx/build.mjs` → `BUILD OK 16 pages` ; `node gx/cap.mjs` → `REGLES OK` (16 états × clair et cave).
- `node gx/page-corr.mjs` → `PAGE OK 68 images`.
- Captures ouvertes : planches avant | après de f1-b, f2-a, f3-a, f3-b, f4-a, f4-b, f6-a, f6-b, c1-a, c2-b, c3-a, c3-b, c4-a,
  c5-a et c5-b, et en cave f6-a et c2-b. Non ouvertes après correction : f5-b, c1-b (marge seule) ; contrôles verts.

## Captures
`gx/cap/<v>-avant.png`, `<v>-apres.png`, `-cave` ; planches `gx/cap/planche-f*.png`, `gx/cap/pl-c*.png`.

## Prédiction
« Là le + ne mange plus rien et la Blonde prévient pour La Cigogne ; il me reste à choisir entre déplacer en direct et "et si". »

DÉCISION À PRENDRE : la même chose (déplacer une barre) se fait en direct avec Annuler (f1-b) ou en « et si » avec Valider (c4-a).
Les deux sont montrés côte à côte dans page14/gestes-corriges.html, pour qu'il choisisse.
CONNAISSANCE : aucune.
LEÇON PROPOSÉE : un déplacement garde la longueur de la barre. Le défaut était dans trois versions (f1-b, f6-a, c4-a), une seule
avait été vue. Après une plainte sur un geste, chercher le même défaut dans toutes les versions du même geste.
