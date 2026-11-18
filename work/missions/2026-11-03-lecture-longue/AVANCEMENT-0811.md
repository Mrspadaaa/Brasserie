# Avancement du 08.11 (voie lecture longue, auteur Opus)

Banc : copie privée (scratchpad de la session, `banc/`, `sync.sh`), Chrome sans écran, CSP de production. Un seul banc à la fois.

## Fait
- PDF de 1 à 4 pages lu entier : commité par le pilote (25072b2a).
- Graine 2, HEAD (F), rejoué juste après la base : 24 silencieuses, 1 signalée, 0 perdue, 0 rognée, médiane 1 646 ms. Base 202506bb : 3, 92, 0, médiane 918 ms.
- Graine 1, F : 43 silencieuses, 8 signalées, 82 perdues (h0065 : 37 lignes du BAS, totaux compris ; h0101 : 45 lignes du HAUT, en-tête
  compris), 2 rognées. Les pertes viennent du recadrage, à un bout de la pièce, jamais d'une coupe : la bande de contrôle ne peut pas les voir.
- (c) codé, non commité : `src/services/decoupe.ts` (`LIGNES_ENTIERES` = 35, `lignesDeTexte`, `decoupeAvant`, `PlanImage.haute`) ; test
  `tests/unit/depense/d381/photo-entiere.test.ts` : 4 rouges sur HEAD, verts après ; d380 + d381 : 111 verts.
- Harnais du banc : `avant` (déclencheur sans force), `lignesTexte`, simulation de la bande de contrôle (lecteur parfait), `controler.mjs` résume les deux.
- Vraies pièces, déclencheur « avant » avec (c) : seule doc5 (facture 3 pages en une image, 171 lignes estimées) est coupée (9 morceaux, comme HEAD).
  doc15 et doc16 (Bauhaus) : lues entières, mais l'estimation donne 1 ligne (profil encré d'un bout à l'autre) : non fiable sur ces photos.
  Les 4 `fixture-montage-0311-*` (montages fictifs de ~30 articles sur 2 lignes) : 3 coupés (57 à 100 lignes estimées), 1 non (estimation 1).

## (c) v1 sur la graine 2 (LIGNES_ENTIERES 35, compte sur la carte des coupes)
- 172/200 pièces encore coupées « avant » (le banc tire 40 à 300 articles) ; sur elles : 16 silencieuses, 1 signalée, 0 perdue, 0 rognée.
  28 lues entières, dont 26 non hautes (déjà lues entières sur HEAD) et 2 hautes : h0122 (162 lignes) et h0140 (269 lignes) comptées 18 et 14.
- Défaut trouvé : sur des rangées grisées, la carte des coupes fond plusieurs lignes en une série (pas de 450 px pour 32). Corrigé : le compte prend
  le plus petit pas connu, dont celui de l'encre nette (`Analyse.pas`), test ajouté (`photo-entiere.test.ts`, cas « zèbre »). v2 en cours.
- Bande de contrôle, lecteur parfait simulé, toutes coupes de la graine 2 : 12 lignes à montant tranchées, doublées attrapées 12/12, perdues
  attrapées 12/12 ; 13 lignes SANS montant tranchées (désignation, référence) : la bande ne peut pas les voir (elle compare des montants).
  Fausses alertes : 553 coupes justes sur 1 855 (30 %) : 31/264 (12 %) sur les tickets à une ligne par article, 522/1 591 (33 %) sur les
  articles de 2 ou 3 lignes (la bande de ± 2 lignes n'y voit souvent qu'un montant, d'un seul côté de la coupe : `jonctionConcorde` exige les deux).

## (c) v2 : fait (chiffres et diff (a) dans ETAT-DE-L-ART.md, sections 6 et 7)
- Graine 2 : 174/200 coupées, sur elles 18 silencieuses, 1 signalée, 0 perdue, 0 rognée ; aucune pièce haute du banc n'a 35 lignes ou moins.
- Graine 1 : 169/200 coupées, 43 silencieuses, 7 signalées, 45 perdues (h0101), 1 rognée. Fixes : 11/11 coupées, DÉCOUPE OK.
- Vraies pièces : seule doc5 coupée (9 morceaux, comme HEAD) ; doc15, doc16 lus entiers ; les 4 montages Bauhaus du 03.11 coupés.
- Tests : d380 + d381, 111 verts ; tsc : seules les 2 erreurs de modules absents du worktree (pdfjs-dist, zxing-wasm). Manifeste md5 21dd75b3.
- Bande (a), lecteur parfait : 39/39 montants perdus ou doublés attrapés ; 37 désignations tranchées invisibles ; ≈ 30 % de fausses alertes.

## Reste
- Rien de codé en attente. Décisions au pilote : voir le rapport.

