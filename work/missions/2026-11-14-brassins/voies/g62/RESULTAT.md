OK — g6a et g6b corrigées (revue 15.11 n° 12 à 15), 9 images régénérées et ouvertes

## Points
- [x] g6a n° 12 : étiquettes courtes de e6a (NEIPA, APA) ; plus de « NEIPA New England IPA » ; la puce « Tous 5 » revient.
- [x] g6a n° 13 : une seule rangée de puces (Tous, avancement, Terminés, ★ Favoris, puis styles, au défilement avec fondu) ; première carte à y ≈ 308 sur 844, au tiers comme e6a. À 1280, colonne groupée (Avancement, Style).
- [x] g6a n° 14 : un seul mot, celui de l'app (`src/domain/batchStatus.ts` : « Terminé ») : puce « Terminés », carte et liste repliée « Terminée » ; « Tout voir 5 × » retiré (« Tous 5 », juste après le filtre posé, ramène tout ; la période reste) ; bouton filtres en icône à pastille comme e6a.
- [x] g6b n° 15a : à vide, la ligne du haut ne montre que les filtres posés (« à brasser × et ★ × ») et « 0 sur 5 » ; les autres termes passent en 14 px avec « +n » (ce qu'ils ajouteraient) : plus de « 1 en cuve » en grand.
- [x] g6b n° 15b : « Retire un mot » remplacé par deux boutons qui disent ce qu'on verra : « Voir la Pale Ale — sans l'étoile », « Voir la NEIPA — sans « à brasser » ».
- [x] g6b n° ux1 : phrase sur deux lignes, 22 px (« 2 en cuve · 1 à brasser ») puis 14 px (« 1 conditionnée · 1 terminée · 1 ★ »).
- [x] g6b n° ux2 : indice de toucher sous chaque terme : fond pâle de la couleur de son état, bord fin, trait de 3 px dessous.
- [x] g6b n° ux3 : « Nov. + en cours » dans la rangée du tri (« À suivre d'abord » | « Nov. + en cours »).
- [x] g6b n° ux4 : styles visibles sous la phrase (NEIPA, APA, Pilsner, Stout, Saison), chacun compte avec les filtres posés (0 estompé).
- [x] g6b n° 14bis : même mot « terminée » ; étiquettes NEIPA, APA de e6a ; « pas encore brassée » de e6a.

Non fait, et pourquoi :
- g6a n° 13, 2e moitié (les puces répètent « 2 en cuve / 1 à brasser ») : gardé, c'est e6a telle qu'il l'a choisie (tête et puces chiffrées) ; règle n° 1. g6b est la lecture sans cette redite.
- « NEIPA [NEIPA] » et « Stout [Stout] » sur la carte : gardés, c'est e6a (nom et style identiques dans les données).

## Fichiers écrits
- `work/missions/2026-11-14-brassins/voies/g6/g6a/etat.html`, `NOTE.md`, 5 PNG (repos 390 clair et cave, geste, vide, repos 1280).
- `work/missions/2026-11-14-brassins/voies/g6/g6b/etat.html`, `NOTE.md`, 4 PNG (repos 390 clair et cave, geste, vide).
- `work/missions/2026-11-14-brassins/voies/g62/RESULTAT.md`, `tests.txt`. Rien dans `src/`. g6c intacte.

## Critères
Sorties dans `tests.txt` (G1 COCHE OK, G2 IMAGES OK, G3 IDENTITE OK 2/2, G4 NOTE OK 2).
Tests : aucune suite Vitest (rien dans `src/`).

## Captures (toutes ouvertes)
`work/missions/2026-11-14-brassins/voies/g6/g6a/g6a-{repos-390-clair,geste-390-clair,vide-390-clair,repos-390-cave,repos-1280-clair}.png`,
`work/missions/2026-11-14-brassins/voies/g6/g6b/g6b-{repos-390-clair,geste-390-clair,vide-390-clair,repos-390-cave}.png`.
Au repos à 390, elles se distinguent : g6a = tête 28 px sur deux lignes et puces grises à point ; g6b = phrase en termes teintés à toucher, puis rangée de styles à trait de couleur.

Prédiction : « g6a c'est ma liste, ok ; g6b la phrase qui filtre, c'est plus direct. »

DÉCISION À PRENDRE : le contrôle d'identité ne reconnaît pas les teintes id-style lime, jaune, violet, orange (5 étiquettes en aplat suffisent à passer 5 %) ; à corriger dans `controle-identite.mjs` (hors Possède). g6b porte donc la couleur du style en trait.
CONNAISSANCE : l'app dit « Terminé » pour un brassin fini (`src/domain/batchStatus.ts`) ; « Écoulée » des maquettes e6 n'est pas son mot.
LEÇON PROPOSÉE : aucune
