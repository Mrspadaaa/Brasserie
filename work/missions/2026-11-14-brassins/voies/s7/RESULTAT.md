OK — G4 : 3 mini maquettes (Dryhopper pur, trois questions, affiche), 9 captures

## Variantes
- `s7a` (froide) : titre « Dry hop demain · Citra + Mosaic », onglets de moment p4b2f, colonnes houblon cmc2k, densité comme repère (fenêtre actif / bande après). Geste : dry hop ajouté → « Garde dès que stable ». Cave et 1280 (poste en trois colonnes).
- `s7b` (tiède) : quatre questions en blocs de couleur (Dry hop ? Elle finit ? Garde ? Cuve ?), réponses en gros. Geste : densité au curseur m2. Liste « 3 décisions ».
- `s7c` (chaude, G4 × G2) : affiche, tuile dry hop en aplats de familles, trois cadrans. Geste : °C de cuve 19,2.

## Fichiers écrits (tous dans voies/s7/)
`faire.mjs` (assemble le sprite des 12 pictos de `planche.html` par split/join, puis capture) ; par variante `source.html`, `etat.html`, `NOTE.md`, PNG ; `tests.txt`.

## Critères (tests.txt)
G1 SERIE OK · G2 ETATS OK · G3 HORS OK. Les cibles mesurées sous 44 px : 0 sur les 9 captures (sortie de `faire.mjs`).

## Captures
- `s7a/s7a-repos-390-clair.png` (ouverte), `s7a-geste-390-clair.png` (ouverte), `s7a-repos-1280-clair.png` (ouverte), `s7a-repos-390-cave.png` (**non ouverte**)
- `s7b/s7b-repos-390-clair.png` (ouverte), `s7b-geste-390-clair.png` (ouverte), `s7b-liste-390-clair.png` (**non ouverte**)
- `s7c/s7c-repos-390-clair.png` (ouverte), `s7c-geste-390-clair.png` (ouverte)
- Dernières retouches non revues à l'image : espace « Dry hop fait · », chip « stable 0/3 » (s7a geste) ; toast en haut et tuiles resserrées (s7c, hauteur 857 au geste) ; « Jour par jour » à 1280 ; rangées houblon de s7b.

## Prédiction
« Là je comprends direct : demain dry hop, Citra et Mosaic avec leurs couleurs » ; il prendra s7a ou s7c, et trouvera le bloc « Cuve ? » de s7b trop vide.

DEMANDE EXECUTANT : contexte de l'agent au plafond (≈ 190 k), série mécanique restante.
1. `node work/missions/2026-11-14-brassins/voies/s7/faire.mjs "s7a repos 390 cave; s7b liste 390 clair; s7a geste 390 clair; s7a repos 1280 clair; s7c geste 390 clair; s7b repos 390 clair"` → 6 PNG, « cibles<44 0 » sur chaque ligne.
2. `node work/refonte-frontend/v4/tournoi/outils/controle-panel.mjs work/missions/2026-11-14-brassins/voies/s7/s7*/*.png` → PANEL OK attendu ; sortie à recopier dans chaque NOTE.md.
3. `controle-commun --sans=mots` sur les trois `etat.html` (même dossier d'outils) → sortie dans les NOTE.
4. Captures à ouvrir et juger : les six ci-dessus (cave, liste, et les retouches listées). Points à regarder : chevauchement du grand « 1,018 » de s7c avec la barre dry hop ; vide bas du 1280 ; chip « stable » de s7a geste.

DÉCISION À PRENDRE : aucune.
CONNAISSANCE : Citra α 10–16 %, Mosaic α 10–15 % (`hopDatabaseBootstrap.json`, kasperg3) ; rôle « dual » des deux (`hopBeerMaverickFiches.json`) ; critère « stable » = 2 à 3 jours à 0,001 près dans la bande (jury-brassins/fiche.md J14).
LEÇON PROPOSÉE : charger trois skills longs (impeccable, ui-design-system, boosters-ux) en tête d'une voie de 3 maquettes coûte ~40 k de contexte ; pour une v0, n'en charger qu'un (boosters-ux) et citer les autres.
