OK — passe 2 : 16 mini maquettes m1 corrigées (défauts du critique), MINIS OK

## Fichiers écrits (tous dans voies/m1)
- `_gen/commun.mjs` (socle v6a : jetons, bande, lignes, pied, préfixe `~-` → `<id>-` par split/join, L26), `_gen/fi.mjs`, `_gen/do.mjs`,
  `_gen/ar.mjs`, `_gen/ap.mjs`, `_gen/gen.mjs` (écrit etat.html et NOTE.md, capture 390 px échelle 2, page entière, réseau coupé).
- `<id>/etat.html`, `<id>/<id>.png`, `<id>/NOTE.md` pour les 16 ids ; `fonts/` (Source Sans 3, IBM Plex Mono, copiées de voies/p2b ; aucun appel réseau).
- `tests.txt` : `MINIS OK (16 maquettes, 4 vues)`.

## Critère
- G1 : `node work/missions/2026-11-14-finances/outils/controle-minis.mjs work/missions/2026-11-14-finances/voies/m1 m1fi-a,…,m1ap-d` → `MINIS OK (16 maquettes, 4 vues)`.
- Capture : `bloquees 0 erreurs 0`.

## Variantes (id, genre, image ouverte)
| id | genre | idée | image ouverte |
|---|---|---|---|
| m1fi-a | a tiède | panneau sable v6a à libellés, catégories en puces carrées, bascule Annulées | oui (après retouche des libellés : non rouverte) |
| m1fi-b | b froide | menu ancré sur Filtres : 4 lectures en rangées de 44 px, « Plus de filtres › » | oui (1re version ; retouche ancrage non rouverte) |
| m1fi-c | c chaude | barre de ce qui attend (hachure à payer, pointe rouge retard, pointillé sans pièce), carrés de catégorie, aperçu 7 → 2 | oui (1re version ; chevauchement corrigé, non rouvert) |
| m1fi-d | d libre | les pastilles des lignes sont les filtres, barre noire du filtre actif | oui |
| m1do-a | a tiède | la paire en lignes v6a dans un cadre, « Annuler celle-ci », état annulée barrée | oui (défaut vu : « Annuler celle-ci » passe sur deux lignes à la 2e pièce, à corriger au port ou en passe 2) |
| m1do-b | b froide | une question « Deux fois la même facture ? », deux réponses de 44 px | non |
| m1do-c | c chaude | jauge 6/7, champ par champ = / ≠, effet sur Brassage d'octobre | oui |
| m1do-d | d libre | deux tickets agrafés, glisser gauche / droite, tampon ÉCARTÉ | oui (1re version ; tickets et tampon corrigés, non rouverts) |
| m1ar-a | a tiède | feuille allégée, année finie cerclée, confirmation dans sa carte | oui |
| m1ar-b | b froide | portée Archives : ‹ 2024 ›, une ligne par catégorie, « 2025 est finie · Ranger » | oui |
| m1ar-c | c chaude | frise des années, poignée « rangé jusqu'à », 449 → 208 pièces | oui (étiquette 60,00 remontée, non rouverte) |
| m1ar-d | d libre | l'étagère : cartons par année, 60,00 « dehors », Fermer / Rouvrir | oui |
| m1ap-a | a tiède | sens en deux cartes ↘ / ↗, puces date et compte, motif suggéré | non |
| m1ap-b | b froide | un montant signé + / −, résumés préremplis, clavier décimal dessiné | oui |
| m1ap-c | c chaude | Ta poche → La brasserie, caisse +500,00, ventes − dépenses +23,20 inchangé | oui |
| m1ap-d | d libre | « Payé de ma poche » : cocher les achats, l'apport se calcule (70,60) | oui |

Captures : `work/missions/2026-11-14-finances/voies/m1/<id>/<id>.png`.

## Données
v6a telle quelle (novembre : payé 325,40, à payer 400,00, dépensé 696,80, retard 2025 60,00). Ajouts dits dans chaque NOTE : une paire de
doublons d'octobre (Hopfen & Co, 94,50, même référence QR) et un groupe Cmd 5512 (m1do-d) ; années 2024 (268 pièces, archivée), 2025 (241, 1 à suivre),
2026 (208) ; Brassage d'octobre 683,60 (m1do-c) ; totaux 2024 (m1ar-a, b).

## Prédiction
« Les étagères et les tickets agrafés, ça me parle ; les filtres a et d sont ce que je veux garder, le reste est trop de texte. »

DEMANDE EXECUTANT : rouvrir sans rien changer les 7 images non rouvertes après retouche, et les rendre au concepteur pour jugement :
`m1fi-a`, `m1fi-b`, `m1fi-c`, `m1do-b`, `m1do-d`, `m1ar-c`, `m1ap-a` (`voies/m1/<id>/<id>.png`). Pour régénérer après une retouche :
`node work/missions/2026-11-14-finances/voies/m1/_gen/gen.mjs fi,do,ar,ap` (sortie attendue `bloquees 0 erreurs 0`), puis la ligne G1 (`MINIS OK`).
Motif : budget de contexte de l'agent atteint (hook à 200 k) ; le dessin est fini, seul le regard final manque sur ces 7 images.

DÉCISION À PRENDRE : m1ap-d suppose de relier un apport aux achats payés de la poche du brasseur (moyen « privé ») : au modèle de données, si retenue.
CONNAISSANCE : aucune
LEÇON PROPOSÉE : aucune


## Passe 2 (14.11)
- Corrigé dans _gen/fi.mjs, ap.mjs, ar.mjs, do.mjs, chaque défaut « | m1… » de critique/sv/SYNTHESE.md ; même genre, aucune greffe ; régénéré par _gen/gen.mjs (bloquees 0 erreurs 0).
- Données v6a gardées ; 2024 : dépensé hors Matériel 13 056,40 (m1ar-a, m1ar-b), payé 14 368,40 garde le Matériel 1 312,00 ; m1ap-d : Malt 186,80 payé par la banque (comme m2fo).
- Chaque NOTE.md : ligne « Passe 2 : défauts corrigés » (9 lignes au plus).
- Tests (ligne du VOIE.md) : tests.txt → MINIS OK (16 maquettes, 4 vues), sortie 0.
- Images rouvertes après retouche : m1fi-a, b, c, d ; m1do-a, b, c, d ; m1ar-a, c, d ; m1ap-b, d. Non rouvertes (retouches de texte seules, budget de contexte) : m1ap-a, m1ap-c, m1ar-b.
- Vu et corrigé au regard : m1fi-b menu passé sous le pied (la liste filtrée reste visible) ; m1do-d tickets côte à côte sans chevauchement ; « @@END » parasite retiré (m1ar-a, c, d).
- Prédiction : « Là c est plus propre, moins de phrases ; les tickets et l étagère se lisent. »

DEMANDE EXECUTANT : ouvrir sans rien changer m1ap-a/m1ap-a.png, m1ap-c/m1ap-c.png, m1ar-b/m1ar-b.png et les rendre au concepteur ; si retouche : node work/missions/2026-11-14-finances/voies/m1/_gen/gen.mjs ap,ar (bloquees 0 erreurs 0) puis la ligne Tests (MINIS OK).
