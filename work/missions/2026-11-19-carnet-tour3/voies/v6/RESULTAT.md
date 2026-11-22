OK — 3 problèmes, 2 bloquants ; 6 des 7 corrigés, n° 6 présent en partie (écarté f7, choix en attente), aucune régression

# v6 — critique tour 3 (Opus), port-carnet 0b30c6775, Vite :5194 (arrêté)
Bancs : `rejeu.mjs` (copie f7 + état `n3e`), `rejeu2.mjs` (copie v5a + `cmp`, `tap` = clic à 1280). Journaux : `captures/journal-*.txt`.
Planches ouvertes : `captures/pl-r1` à `pl-r3` (rejeu), `pl-oa` à `pl-og` (ensemble), `zoom-choisir-390`. Geste Choisir et glissé au doigt : `fin.mjs`, `journal-v6-fin.txt`.

| n° | verdict | observé (≤ 25 mots) | capture | taille/thème |
|---|---|---|---|---|
| 1 | corrige | bulle G8 en 3 lignes, puce « Coller : exemple.invalid/hotte-… » dessous, entière ; à 1280 les deux sur une ligne | g8coller-390-clair, -390-sombre, -1280-clair | 390 clair/sombre, 1280 clair |
| 2 | corrige | une seule annonce « ✻ Déjà un carnet proche … → Ouvrir ce carnet » ; Entrée ouvre Ventilation ; liste : un seul Ventilation | n3-390-clair-a, n3e-390-clair-apres ; journal n3e-liste | 390, 1280, deux thèmes |
| 3 | corrige | rangée « Va dans [ZZ TEST — Frigo de garde…] [Ici] », « Façon » entière au bord ; nom abrégé dans la puce, entier en tête | n1-390-clair-a-frappe, n1-390-sombre-a-frappe | 390 clair/sombre |
| 4 | corrige | « votre lien : « https://exemple.invalid/hotte-140 » » ; « 1er sur 5 · tient 80 °C », plus de « oui » | n12-390-clair-c-apres, n12-390-sombre-c-apres, n12-1280-clair-c-apres | 390, 1280 |
| 5 | corrige | onglet À venir : « Choisis, pas encore planifiés · 2 » | ens-avenir-390-clair, ens-avenir-1280-sombre | 390 clair, 1280 sombre |
| 6 | present en partie (écarté f7) | genre dit une fois (plus de « Notes : ») ; destination deux fois : « ↓ va dans ZZ TEST — Frigo… » et « Va dans [Frigo…] » — choix en attente (f7, DÉCISION) | n1-390-clair-a-frappe | 390 clair/sombre |
| 7 | corrige | Ventilateur de plafond : « brasse la buée sans la sortir » une fois (pastille) ; l'article dit « écarté » seul | ens2-ventil-390-clair-bas, -sombre-bas | 390 clair/sombre |

Aucune régression vue sur les 7.

## Problèmes (combien et quels ?) — 3, dont 2 bloquants
1. Comparer, 390 tactile : un glissé du doigt sur le titre fait glisser toute la page de 67 px ; titre « TEST — Ventilation… » et « ompte tient 80 °C » coupés à gauche. Conteneur 433 px pour 366, overflow-x auto (doute 1 de v5a, confirmé). (fin-comparer-390-clair-glisse, comparer-390-sombre-droite ; journal-v6-fin « glisse titre : DIV 67 »)
2. **Bloquant, illisible** — Choisir, 390, liste sous la carte pointillée : rangée 2 « Hotte murale 100 cm » écrasée, un mot par ligne, et « sous votre minimum de 1 500 m³/h » écrit par-dessus « Gastro-Lüftung ». (fin-choisir-390-clair-a, zoom-choisir-390)
3. **Bloquant, valeur fausse** — après « Choisir chez Inox Broye », le carnet choisi dit « Critère : Moins de condensation au plafond : capter la buée » ; le choix s'est fait sur « tient 80 °C, puis le débit » (carte pointillée), et ce critère est celui « sans valeur à comparer ». (fin-choisir-390-clair-b-choisi, fin-choisir-1280-sombre-b-choisi)

Doutes, non comptés : captures pleines `realise-*` et `frigo-*` vides (banc, capture pleine page sur conteneur interne ; le texte est au journal) ; n° 6 attend son choix en mini maquettes (DÉCISION f7) ; doutes v5a non revus autrement (pastille « exemple », « Payé en entier » après « Payé », « 1er sur 2 ex aequo », « Archives › » sur Réalisés vide).
Rien à redire vu : liste 390/1280 haut et bas, À venir, Réalisés, Moulin créé, Pompe (2 liens, Comparer), Ventilation entière, G8 haut et bas, deux thèmes.

DÉCISION À PRENDRE : aucune neuve (n° 6 : voir f7).
CONNAISSANCE : aucune.
LEÇON PROPOSÉE : un doute de défilement latéral se tranche au doigt (touchscreen), pas au scrollLeft du script : v5a l'avait laissé en doute, le glissé l'a montré en un geste.

Tests : aucun lancé. Serveur 5194 arrêté, port libre (vérifié : Get-NetTCPConnection 5194, aucun écouteur).
