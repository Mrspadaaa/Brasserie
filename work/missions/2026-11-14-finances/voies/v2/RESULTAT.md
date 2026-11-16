OK — Frise « Tout » couvre l'historique, pastille de plage entière, avis effacé après annulation ; 5 critères verts

## Fichiers écrits
- `src/components/periode/ChoixPlage.tsx` (module de la période, n° 33 et 1) : en « Tout », la frise reçoit l'étendue réelle (`etendue` : première → dernière opération active) comme plage ; `key` distinct pour « Tout », la fenêtre large ne survit pas à un retour sur « Ce mois ».
- `src/components/periode/periode.css` (n° 2) : `.pr-pill>button.pr-ce:has(.pr-long){max-width:none;text-overflow:clip}` : la plage longue n'est plus plafonnée à 108 px.
- `src/ui/finance/operations/Frise.tsx` : « × mois entier » masqué quand la ligne de compte est une période (« Tout ») ; `ROUTE_MAX` 400 → 1500 (sinon aucune barre sur 908 jours) ; colonnes `minmax(0, 1fr)` (les barres de 2 px minimum, sur 908 colonnes, faisaient déborder la grille hors de la frise, vu en capture).
- `src/ui/finance/operations/plage.ts` : `etiquettesAxe`, au-delà de 366 jours seulement : bornes « juin 2024 » / « nov. 2026 », axe marqué à chaque 1er janvier (« 2025 », « 2026 »), plus de « 1er févr. » sans année ni de « 25 » nu. Sous 366 jours : inchangé.
- `src/components/tabs/FinancesTab.tsx` (n° 3) : l'avis « Mouvement enregistré. » / « Opération mise à jour. » est retiré quand le nombre d'écritures annulées augmente (effet sur `transactions`). Les autres avis (Tendance, archives) restent.
- Tests neufs : `tests/integration/friseToutHistorique.test.tsx` (3), `tests/integration/avisApresAnnulation.test.tsx` (1), `tests/unit/pastillePlageEntiere.test.ts` (1).
- Voie : `capturer.mjs` (copie de v1, + mesures : jours dessinés, poignées, axe, largeur de pastille, avis), `cap/` (24 captures), `j-33.log`, `j-33b.log`, `j-20.log`, `tests.txt`, `tests-liste.txt`, `build.txt`, `emulateur.txt`.
- `Header.tsx` : non touché (la pastille vit dans `PastillePeriode`/`periode.css`).

## Rouge avant correction
- 1 : `friseToutHistorique` rouge sur HEAD : poignée « Début » à 9801 (1er nov. 2026) au lieu de 8918 (1er juin 2024).
- 3 : `avisApresAnnulation` rouge sur HEAD : « Mouvement enregistré. » encore affiché après « Écriture annulée ».
- 2 : le test lit la règle CSS (jsdom ne mesure pas la mise en page) ; rouge sur HEAD par absence de la règle, non rejoué. La preuve de rendu est la mesure en Chrome ci-dessous. Le test d'axe (`etiquettesAxe` long) a été ajouté après le premier vert du 1 : non rejoué sur HEAD.

## Critères
- G1 `VITEST OK` : 31 fichiers, 315 tests (suites qui importent Frise, plage, ChoixPlage, PastillePeriode, periode, FinancesTab, Header, + 3 neuves).
- G2 `BUILD OK` (`npx vite build`). G3 `TSC OK`. G4 `V6A OK` ; `FRISE OK` aussi. G5 `EMULATEUR OK`.
- Essais : un par critère.

## Captures ouvertes (cap/, 390 et 1280, clair et cave)
- Ouvertes en plein format : `33-390-clair-tout`, `33-1280-cave-tout`, `33-1280-clair-entete`, `20-390-clair-liste`, `20-1280-cave-liste`. Les autres combinaisons (clair/cave de chacune) : couvertes par le journal seul, mesures identiques aux 4 configurations.
- 1 : en « Tout », poignées « 1er juin 2024 → 25 nov. 2026 », 908 jours dessinés, axe « juin 2024 · 2025 · 2026 · nov. 2026 », barres et voile des mois sans saisie (démo : trous de 2024-2025 visibles). Plus de grille qui déborde.
- 2 : mesure `scrollWidth = clientWidth = 120` à 1280 (« 18 oct. → 16 nov. » entier, clair et cave) ; 390 : « 18.10–16.11 » 69/69.
- 3 : `j-20.log` : « avis encore là false » aux 4 configurations ; liste sans bandeau après l'annulation, totaux inchangés.

## Doutes et limites
- La ligne grise sous la frise de « Tout » dit « du 1er juil. au 31 août ; du 1er oct. au 30 nov. … » sans année : ambigüe sur 2,5 ans. `texteInconnu` n'a pas été touché (hors de ce qui était demandé) ; à dire au pilote.
- `ROUTE_MAX` 1500 : au-delà (~4 ans) la frise redevient sans barres. Mesure : ouverture de « Tout » 115 ms sur le jeu démo (peu d'opérations) ; sur un grand livre réel non mesuré (périodeJour par jour, mis en cache).
- Une barre fait 2 px minimum : sur 900 jours, des barres voisines se touchent ; la frise se lit comme un profil d'activité, pas comme une dépense par jour.
- Le point 3 retire l'avis sur toute annulation, y compris celle d'une autre écriture ; c'est voulu (l'avis ne parle plus d'un état exact).

DÉCISION À PRENDRE : aucune.
CONNAISSANCE : une grille CSS `repeat(n, 1fr)` contenant des enfants à largeur minimale (barre de 2 px, point de 3 px) déborde dès que n × minimum dépasse la piste ; `minmax(0, 1fr)` la tient.
LEÇON PROPOSÉE : aucune
