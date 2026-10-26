ECHEC — rejeté : non déployable tel quel ; deux défauts bloquants, bon marché à corriger (la liste saute de 38 px sous le doigt à l'arrivée de l'IA ; le titre garde l'ordre du moteur quand la liste est classée par l'IA). L'IA elle-même (puce, phrase, chiffres) est juste et il la prendrait.

Critique Fable, 26.10, calibrée sur `fils21-choisir/critique/PORTRAIT.md` (version 2). Captures ouvertes une à une :
`reel-1` à `reel-5`, `simule-1` à `simule-6`, et son choix `fils11-substitution/captures/u4-vue-390.png`.

## 0. Règle n° 1 : u4 est-il intact ?

Côte à côte avec u4 : en-tête, segments des moments, titre « X, 65 sans inconnue », échelle 50–100 ou tableau 16D, « Comparer › »,
« Face à face », α, arômes, radar, β. Sans IA (`reel-1`, `reel-2`, `simule-1`, `simule-2`) l'écran est celui d'avant la voie : rien
retiré, rien déplacé. Avec IA, trois ajouts seulement : la puce, la phrase « IA … » dans la bande du remplaçant, une ligne de
« Lire ces scores ». Règle n° 1 respectée. Ce que je juge, c'est donc seulement les trois ajouts et ce qu'ils font bouger.

## 1. Ce qu'il dirait

**La puce « ✦ classé par l'IA »** (`reel-3`, `simule-3`). En trois secondes : oui, on comprend, et elle répond mot pour mot à sa
question « Est-ce que l'ia est bien présente pour la substitution ? ». Sa phrase prédite : « Ok, l'IA est là, bien. » Puis le
« mais » : « mais pourquoi ça saute quand elle arrive ??? » (voir le décalage). La version tiretée « ✦ ordre IA prêt »
(`simule-6`) se comprend aussi, mais ne dit pas qu'un toucher l'applique : il la lira comme un état, pas comme un bouton
(« et je fais quoi avec ça ? »). Pas un refus, une retouche.

**La phrase « IA … » dans le face à face** (`reel-4`, `simule-4`). Elle n'est pas au premier plan, elle arrive à un toucher,
là où il a déjà le détail : c'est exactement sa règle (« les info sont des actionnable », le reste à un toucher). Elle dit ce qui
rapproche et ce qui sépare, en chiffres de brasseur (huiles), pas en généralités. Sa phrase prédite : « pas mal, ça dit vraiment
pourquoi. Mais c'est petit. » Il la garderait. Réserve sur Cashmere : « apporte une complexité fruitée intéressante » est du
remplissage, il dirait « inutile ce texte » devant l'adjectif ; la seconde moitié (« humulène comparable, mais diverge sur le vin
blanc ») est la bonne.

**Le décalage de 38 px.** C'est là qu'il se fâche. La puce arrive 2 à 3 s après l'ouverture (2,6 s mesuré, 3,0 s à froid), au
moment où il lit déjà la liste ou vise un « + ». Tout descend de 38 px, presque la moitié d'une rangée (88 px) : un doigt parti
sur Cashmere touche Hallertau. C'est le genre de chose qu'il a refusé trois fois : « Les ajouter déjà présent saute à droite »
(D64), « Header qui change ??? » (D119), « La transition est toujours très très mauvaise » (25.10, D149). Sa phrase prédite :
« Ça saute quand l'IA arrive ??? C'est clancky. » L'alternative proposée (réserver la ligne dès l'ouverture) rejoue un autre
refus, le même jour : « Trop de blanc inutil, d'espace pour rien » (D149), à chaque ouverture en ligne, et pour rien quand l'appel
échoue. Les deux options du RESULTAT sont donc deux refus connus ; il y en a une troisième, voir § 3.

**Les scores non monotones** (`reel-3` : 65, 55, 61, 57, 57 ; `simule-3` : 57, 60, 65, 61, 58). Ses chiffres lui parlent quand
ils répondent à « lequel ». Ici la colonne dit une chose et l'ordre une autre. Il demandera « pourquoi le 55 est devant le
61 ? » ; la puce répond en partie, « Lire ces scores » répond en entier mais fermé. Mitigé, pas rejeté : les chiffres sont honnêtes
(ceux du moteur, pas inventés), et il préfère voir le vrai score que rien.

## 2. Défauts à corriger avant de déployer

### Bloquants

- **B1 — La liste saute de 38 px sous le doigt** (`reel-2` → `reel-3` : « Au dry hop, l'arôme… » passe de y = 124 à y = 162 en
  CSS ; les rangées aussi). Règle : D64, D119, D149 (transitions et sauts refusés). Correction : la puce hors du flux de la
  liste, à une place déjà libre. La meilleure est **l'en-tête, à droite du titre « Nelson Sauvin »** : vide dans l'app, et
  c'est là que son u4 porte sa petite mention « remplaçants à 60′ » (coin haut droit de `u4-vue-390.png`). Zéro décalage,
  même forme que son choix, visible à l'ouverture et pendant tout le défilement (l'en-tête est fixe : la bascule reste sous le
  pouce quand il est dans le face à face). Repli : la tête de colonne « score » devient « score ✦ IA » ; ou la puce à gauche
  de « Comparer › », ligne qui existe déjà.
- **B2 — Le titre contredit la liste quand l'IA est appliquée** (`simule-3` : première rangée Solero 57, en bleu ; le titre
  dit « Hallertau Blanc, 65 sans inconnue. Hallertau Blanc ne garde aucune de ses familles », Hallertau étant 3e). Le RESULTAT
  le dit : le titre et les replis gardent l'ordre du moteur. Deux ordres sur un écran, c'est « ce qui sort de nulle part »
  (PORTRAIT § 4) et « un choix sur un endroit, semble pas toujours être reporté partout » (D139). Sur `reel-3` ça coïncide
  par chance (Hallertau reste 1er) ; la vraie IA peut mettre Nectaron en tête demain. Correction : quand `data-ia="appliquee"`,
  le titre nomme le premier de la liste affichée, et sa seconde ligne reprend la phrase IA de ce houblon (« Solero, classé 1er
  par l'IA : remonté en tête, ses mots fruités… ») ; la puce touchée rend le titre du moteur. Même chose pour le pied
  « 10 g de … » : vérifier qu'il suit la rangée verte, ce que `simule-3` montre (Sládek), donc déjà juste.

### À corriger, non bloquants

- **C1 — Texte sous le plancher.** Phrase IA à 13 px (`.pq-substituer-ia-phrase`) : c'est du « contenu à lire », DESIGN.md le
  met à 14 px. L'étiquette « IA » à 11 px : libellé compact, plancher 12 px. Correction : 14 px et 12 px. La puce à 13 px est
  une commande (12–13 px admis) : à laisser, mais il la trouvera petite à côté des segments de 16 px ; 14 px ne coûte rien.
- **C2 — « ordre IA prêt » ne dit pas qu'on peut l'appliquer.** Correction : « ✦ appliquer l'ordre IA » ou « ordre IA prêt › ».
- **C3 — Les scores désordonnés.** Correction minimale : un petit rang « 1 · 2 · 3 » gris devant le nom quand l'IA est
  appliquée, ou les scores des remontés en gris (`#767676`) ; la colonne reste, elle ne commande plus l'ordre. Pas de texte.
- **C4 — « Lire ces scores », ligne IA : aucune capture ne la montre ouverte** (L12 : non regardée, elle ne compte pas). Le
  texte lu dans `index.tsx` (ligne 903) est juste, mais 42 mots en un paragraphe : D3 veut 2 lignes au plus par bloc. Couper en
  deux phrases courtes ; capture de l'état ouvert à fournir.
- **C5 — L'invite laisse passer l'adjectif** (« complexité fruitée intéressante »). Ajouter à l'invite : « sans adjectif
  d'appréciation ; ce qui rapproche, ce qui sépare, rien d'autre ». Les 25 mots sont tenus.

### Vérifié, sans défaut

- **Chevauchement** : aucun sur les 11 captures (puce, phrase, bande « lui seul », tableau 16D, pied).
- **Cockpit** : la puce est le seul élément ajouté au premier écran ; pas de légende, pas d'explication au repos. D1 et D3
  tenus au premier plan ; D2 (tailles distinctes ≤ 3) déjà dépassé avant la voie par u4 lui-même, la puce n'y change rien si
  elle prend 14 px comme le texte courant.
- **Phrases IA contre les fiches de la même capture** (`reel-4`) :
  - « Hallertau Blanc partage la groseille et le vin blanc » : `tagsFr` de Hallertau Blanc = ananas, groseille à maquereau,
    vin blanc, raisin… ; de Nelson Sauvin = vin blanc, groseille à maquereau, raisin, sauvignon blanc. Vrai. La bande noire
    « lui seul : café, concombre, coing » ne les montre pas parce qu'elle ne liste que ce qui n'est pas partagé : cohérent, et le
    tableau « hors familles » de `reel-2` met bien le point de Hallertau sur « groseille à … ».
  - « son myrcène est plus haut et l'humulène plus bas » : myrcène 50–75 % contre 20–45 % ; humulène 0–3 % contre 25–37 %.
    Vrai, et ces plages sont dans la feuille des huiles juste au-dessus de la capture.
  - « Cashmere […] taux d'humulène comparable, mais diverge sur les arômes de vin blanc » : humulène 26–29 % contre 25–37 % ;
    aucun mot de vin dans Cashmere (citron, pêche, melon, noix de coco…). Vrai.
  - Aucune phrase n'affirme une donnée absente : Solero (huiles toutes `null`) n'a reçu une phrase qu'en simulé ; l'invite dit
    « inconnu » et interdit de le lire comme zéro. À surveiller en production sur un houblon aux huiles inconnues : un test du
    callable qui refuse une phrase citant une huile `null` serait le bon contrôle.
- **Honnêteté** : les scores restent ceux du moteur, jamais un score IA inventé ; hors ligne ou échec, rien ne s'affiche.
- **Geste** : un toucher sur la puce rend l'ordre du moteur (`reel-5`, `simule-5`), et la phrase disparaît avec. Juste.

## 3. Faut-il lui montrer décalage contre ligne réservée en mini maquettes ?

Oui, mais pas ces deux-là seules : les deux rejouent un refus explicite (le saut, D64/D119/D149 ; le blanc réservé, D149).
Une page de choix à deux variantes déjà refusées n'est pas un choix (D126 : variantes côte à côte avec sa référence). La page
doit montrer, avec `reel-2` en référence :
1. la puce dans l'en-tête, à droite du titre (comme « remplaçants à 60′ » de u4) ;
2. « score ✦ IA » en tête de colonne ;
3. la puce à gauche de « Comparer › » ;
4. la ligne sous les moments, telle quelle (le décalage, montré comme deux images avant/après) ;
5. la ligne réservée.
Et ne pas attendre sa réponse pour déployer (« N'attende jamais sur mon feedback pour continuer ») : déployer avec la variante 1,
réversible et sans saut, et lui montrer la page ; s'il en préfère une autre, c'est un déplacement de CSS.

`minInstances: 1` : d'accord avec la recommandation, non. 3,0 s à froid donne « ordre IA prêt », ce qui est un état propre une
fois C2 corrigé ; une instance payée pour gagner une seconde sur le premier appel du jour, il ne le demanderait pas.

## Lignes de verdict

- **puce** (« classé par l'IA » / « ordre IA prêt ») — REJET : saute le contenu de 38 px à 2–3 s de l'ouverture (D64, D119,
  D149). Phrase prédite : « Ça saute quand l'IA arrive ??? ». Correction : la puce dans l'en-tête à droite du titre, zéro
  décalage ; « ordre IA prêt » → « appliquer l'ordre IA ».
- **titre et liste** (ordre IA appliqué) — REJET : titre à l'ordre du moteur, liste à l'ordre de l'IA (`simule-3`) (D139,
  PORTRAIT § 4). Phrase prédite : « Pourquoi Hallertau en titre alors que c'est Solero en premier ??? ». Correction : titre et
  seconde ligne suivent le premier de la liste affichée.
- **phrase IA dans le face à face** — ACCEPTÉ. Phrase prédite : « pas mal, ça dit vraiment pourquoi. Mais c'est petit. »
  Correction attendue : 14 px, « IA » à 12 px, invite sans adjectif.
- **ligne « Lire ces scores »** — ACCEPTÉ sous réserve d'une capture ouverte (L12) et d'une coupe en deux phrases (D3).
- **scores non monotones** — ACCEPTÉ (mitigé). Phrase prédite : « pourquoi le 55 est devant le 61 ? ». Correction : rang
  gris ou score des remontés en gris, sans texte.

LEÇON PROPOSÉE : une voie qui ajoute un élément à un écran choisi mesure et capture le mouvement qu'il impose au reste (avant
/ après, en px, et le délai), et propose d'abord la place qui ne fait rien bouger ; les deux options du RESULTAT étaient deux
refus déjà inscrits dans DEFAUTS (D64, D119, D149), ce que le pilote aurait vu en les y cherchant avant de poser la question.
