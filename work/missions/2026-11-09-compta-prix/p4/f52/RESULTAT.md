OK — Prévisions par Fable 5.2 : p5g à p5l (90 jours, six représentations), p5m à p5o (12 mois : Gantt d'épargne et coups durs), et le métier réécrit (`METIER.md`)

## Ses mots pendant la voie (09.11), mot pour mot, à verser dans SPEC-BRASSEUR par le pilote
1. « Analyse le business, c'est pas très bien fait et d'écrit »
2. « C'est plutôt, prévision, anticipation ECT... »
3. Sur la capture `p5g-1280.png`, avec une croix rouge à droite de la planche : « Ça me plaît bien mais ça montre pas trop comment étalé
   les frais à venir pour l'achat de frigo, par exemple.. SI par exemple je fais 300chf par mois, combien je peux mettre pour prendre mon
   frigo, combien je dois économiser. Ça serait plus un type de diagramme de Gantt »
4. « Aussi si j'ai un coup dire, une panne d'un système, qu'est-ce que ca fait à mon année, j'ai un système qui laché, j'ai un contrôle
   d'électricité, fond de rénovation qui augmente ECT... C'est des exemples generalise »

Mes lectures (L01, étroites, à confirmer) :
- 1 et 2 : l'écran Prévisions sert à voir venir, pas seulement à répondre « puis-je acheter le frigo ? ». → `METIER.md` § 1 à § 6 ; les six
  maquettes du 90 jours dessinent deux lignes, « sans vente » et « avec les ventes ».
- 3 : p5g (le socle) lui plaît ; il manque l'étalement d'un achat sur l'année. La croix rouge est hors des deux écrans : lue comme
  « il manque ça », pas comme un refus de p5g. → `METIER.md` § 7, et `p5m` à `p5o`.
- 4 : un coup dur et son effet sur l'année. → `METIER.md` § 8 ; chaque maquette 12 mois a son état « Panne » dessiné à côté.
Je n'ai écrit que dans `p4/f52/` : SPEC, DEFAUTS-RECURRENTS, le plan métier et le panel restent au pilote.

## Les neuf (sous `work/missions/2026-11-09-compta-prix/p4/f52/`)
| Id | Horizon | Représentation | Où est la réponse | États dessinés |
|---|---|---|---|---|
| `p5g` Le socle | 90 j | un seul escalier ; le frigo est un socle de 3 000 à franchir (« Ça me plaît bien ») | le creux rouge dans le socle | avec, sans frigo |
| `p5h` Le plafond | 90 j | ce qui sort s'empile en couches ; le trait est ce que j'ai | ce qui dépasse le trait | avec |
| `p5i` L'escalier couché | 90 j | une ligne par flux, la barre dit ce qui reste | à gauche du zéro | avec, sans |
| `p5j` Trois mois | 90 j | une colonne par mois, des tranches étiquetées | dans le vide que le frigo laisse | avec |
| `p5k` Le fleuve | 90 j | la langue de c3a : avec quoi je paie → ce qui sort | le bloc noir ; le trait rouge où la caisse est vide | avec, sans |
| `p5l` L'escalier et ses pistes | 90 j | l'escalier nu, une piste par nature dessous | dans le vide de l'escalier | avec, sans |
| `p5m` Le Gantt d'épargne | 12 mois | une ligne par projet ; la barre du frigo se remplit mois après mois | « déjà 1 567,60 », « encore 1 432,40 », « avril » | plan, panne |
| `p5n` L'année en tuiles | 12 mois | une tuile par mois : ce qui est de côté, la jauge, où vont les 300 | « Frigo en avril », la tuile cerclée | plan, panne |
| `p5o` Le socle sur l'année | 12 mois | la réserve est le socle, 300 par mois, un achat est une marche | la barre « frigo possible à 4 404,00 » | plan, panne |

Chaque dossier : `etat.html` (statique, classes préfixées), `NOTE.md`, `<id>-haut.png` et `<id>-page.png` (390), `<id>-1280.png`,
`<id>-flou.png`. Sources : `commun.mjs` (données en centimes, coquille), `dessins-*.mjs`, `notes.mjs`, `generer.mjs` (écrit pages et
notes), `capturer.mjs` (1280, flou, mesures).

## Les chiffres du plan d'épargne (règle dans `METIER.md` § 7)
Libre aujourd'hui 2 317,60 = 4 181,60 − dû 460,00 − réserve 1 404,00 (trois mois de charges fixes, exemple). Fermenteur mis de côté.
**Il peut mettre 1 567,60, il doit économiser 1 432,40 : à 300,00 par mois, frigo en avril** (en janvier, il faudrait 716,20 par mois).
Panne de 800,00 en février : frigo en juillet, fin octobre 1 367,60 au lieu de 2 167,60.

## Sorties décisives (rejouées sur les neuf après la dernière retouche)
- `verifier-page.mjs --min-images 0 --captures` : PAGE OK × 9 (390 px, sans erreur).
- `capturer.mjs` : MESURES OK × 9 — débord à 1280 : 0 ; étiquettes hors cadre : 0 ; étiquettes qui se chevauchent : 0 ; texte sous 12 px : 0 ; contenu qui dépasse l'écran : 0.
- `mots-premier-ecran.mjs --profil=sans-houblons --sans-donnees --sans-lignes --max=60` : 59, 58, 57, 60, 60, 59, 57, 54, 52 → MOTS OK.
- `controle-commun.mjs --profil=sans-houblons --sans=mots` : COMMUN OK (couleurs, survol, blocs, contraste, standard, parlant, brutes).
- Captures ouvertes et regardées (L12) : les `-haut.png` des six premiers, les `-1280.png` des sept concepts à deux états. Corrigé après
  les avoir vues : le zéro qui traversait les mots (p5i), les réponses sorties du bas de l'écran (p5j), une étiquette sur le bord du
  socle (p5g), des séparateurs dans un chiffre (p5h), 24 textes sous 4,5:1, trois écrans 12 mois trop ternes (une seule teinte franche).

LEÇON PROPOSÉE : un brief d'écran qui tient en un exemple (« puis-je acheter le frigo ? ») cache le métier ; avant de dessiner, écrire
en cinq lignes ce que l'écran doit faire décider, dans l'ordre (ici : voir venir, étaler, encaisser un coup dur), et le lui montrer.

## Ce qui reste ouvert, dit franchement
- **Deux hypothèses de rentrées, une par horizon** : « ventes attendues » (1 125,00, exemple) au 90 jours, « je dégage 300 par mois »
  (son chiffre) au 12 mois. Elles ne s'additionnent pas. Laquelle garder, ou comment les relier : son choix.
- **La réserve** (trois mois de charges fixes) est ma proposition : elle change « ce que je peux mettre » (sans elle 2 971,60, donc frigo en décembre).
- Seul le coup dur « d'un coup » est dessiné (panne). La charge qui augmente (fonds de rénovation) n'a que sa règle écrite (§ 8).
- L'ordre des projets (fermenteur avant frigo) est fixe dans les trois ; l'inverser donne frigo en février, fermenteur en avril.
- `p5n` n'est pas un Gantt ; `p5i` reste une liste dessinée ; `p5g` n'a pas le temps proportionnel ; `p5h` et `p5j` n'ont qu'un état.
- B6 en échec partout (5 tailles de texte) ; B2 jugé sur les captures nettes, `-flou.png` non regardés ; B5 et B13 non mesurés.
- Pas de passage au critique, pas de sous-agent, pas de panel publié. Rien dans `src/`, aucun commit, pas de `git stash`.

## Suite du 09.11 : la vue graphe refaite avec ses nouvelles informations (p5p à p5u)
Ses mots, après p5m, p5n, p5o : « Refait en avec ces nouvelles informations. J'aime beaucoup la vue type graph, celle de base ».
Lecture étroite (à confirmer) : « la vue type graph, celle de base » = le graphe de trésorerie dans le temps (l'escalier de p1b et
p4a, repris par p5g, et sur l'année par p5o) ; pas le Gantt (p5m), ni les tuiles (p5n). Les nouvelles informations : l'étalement à
300 CHF par mois (« combien je peux mettre », « combien je dois économiser ») et les coups durs, les trois genres dessinés cette fois.
La session neuve demandée par le hook n'a pas pu démarrer (Remote Control) : fait ici.

| Id | Ce que le graphe ajoute | États dessinés |
|---|---|---|
| `p5p` Déjà, encore | aujourd'hui en pile à gauche du graphe : réserve, fermenteur de côté, « déjà 1 567,60 », « encore 1 432,40 » | plan ; panne |
| `p5q` Avant, après | le plan en pointillé derrière l'année avec le coup dur ; le retard en trait rouge sur la barre du frigo | panne ; contrôle d'électricité |
| `p5r` Trois petits graphes | les trois genres de coup dur à la même échelle ; à droite le mois du frigo, le retard, le reste | les trois, un écran |
| `p5s` L'escalier qui monte | une marche de 300 par mois, une grande marche par achat ; la pile à gauche | plan ; fonds de rénovation |
| `p5t` La cagnotte et l'éventail | une pente par mensualité : 716,20 → janvier, 300,00 → avril, 200,00 → juillet, 150,00 → septembre | éventail ; panne |
| `p5u` L'un sous l'autre | l'année prévue en haut, la même avec les coups durs en bas | les trois ensemble ; panne |

Chiffres (table complète dans `METIER.md` § 9, calculés par `plan2()` de `dessins-pu.mjs`) : panne 800,00 en février → juillet,
1 367,60 ; contrôle d'électricité 350,00 en mars → mai, 1 817,60 ; fonds de rénovation + 50,00 par mois dès janvier → mai, 1 667,60 ;
les trois → septembre, 517,60, réserve au plus bas 504,00. Les montants et les mois des coups durs sont mes exemples.

Contrôles rejoués sur les six après la dernière retouche : PAGE OK × 6 ; MESURES OK × 6 (débord 0, aucune étiquette hors cadre ni
chevauchée, 0 texte sous 12 px) ; MOTS 48, 49, 58, 48, 54, 46 ; COMMUN OK. Captures `-1280.png` des six ouvertes ; corrigé après les
avoir vues : les étiquettes de coup dur barrées par une marche voisine (elles passent à gauche si la place manque), « libre » sur la
ligne de fin d'année, un écran à deux teintes seulement (p5t).
Reste ouvert : le poids de la réserve (ma proposition) ; l'ordre des projets, fixe ; la date d'un coup dur ne se règle pas dans la
maquette ; petits graphes de p5r et p5u sans montants sur chaque marche ; `-flou.png` non regardés ; pas de critique ni de panel.

## État de reprise (09.11, session Fable 5.2 close à 508 k de contexte)
- Objectif : Prévisions, mini maquettes statiques ; fait pour le 90 jours (p5g à p5l) et le 12 mois (p5m à p5o).
- Décisions prises ici : deux lignes « sans vente / avec les ventes » au 90 jours ; plan d'épargne à 300,00 par mois, réserve de trois
  mois de charges, coup dur payé sur la réserve au 12 mois (règles : `METIER.md` § 3, § 7, § 8).
- Pour régénérer : `node work/missions/2026-11-09-compta-prix/p4/f52/generer.mjs`, puis `verifier-page.mjs` par id et `capturer.mjs`.
- En attente du brasseur : la base de l'année (p5m Gantt ou p5o socle) ; garder ou non les ventes attendues ; la réserve.
- Prochaine action (pilote, session neuve) : verser ses quatre messages dans SPEC, passer les neuf au critique, publier le panel,
  puis dessiner sur la base choisie la charge qui augmente et l'ordre des projets inversé.

Ids faits : p5g, p5h, p5i, p5j, p5k, p5l, p5m, p5n, p5o, p5p, p5q, p5r, p5s, p5t, p5u.
