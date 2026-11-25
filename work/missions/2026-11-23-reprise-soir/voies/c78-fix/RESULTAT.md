FIX 41/41 tsc OK d9f7e0735 (porte : c74bRegles R93 rouge, voir DÉCISION)

# RESULTAT c78-fix

## Plan (par règle, chaque endroit, son correctif)
- **R107 (R78-1, B)** `tableauRegles.ts` `nomAuTableau` : un nom qui commence par ses dimensions (« 1500 x 1200 mm - 2,6 m³ - groupe frigorifique inclus ») se lit par segments : les mesures (nombres + unités) sont du bruit, la désignation reste, précédée de la première mesure qui distingue les articles → « 1500 x 1200 mm - groupe frigorifique » (36 signes) ; « 1800 x 1500 mm - groupe frigorifique ». La coupe « avant la première dimension » reste pour « Cellule froide 1800 x … » (gardée seulement si elle garde un mot de la désignation et ne finit pas par « x »). Houblons inchangés.
- **R73-13** `Comparer.tsx` : le bouton Choisir de Comparer nomme le vendeur, à défaut son domaine (`chez`), même sans vendeur inscrit.
- **R73-9** `Choisir.tsx` : la borne de la réglette « Prix » qui est le prix de l'article lui-même ne le redit pas (« ‹ moins cher » sans « 2 698 CHF »).
- **R73-10** `Choisir.tsx` : prix en gros dans UN élément insécable (`Chiffres nowrap`) ; la carte de l'autre article met le nom court (`nomAuTableau`), nom entier en `title`.
- **R75-6** `insecable.tsx` (`Chiffres`) : seul le NOMBRE est en chasse fixe, l'unité et les mots en police normale. Appliqué : Choisir (prix, valeurs, réglette), Comparer (`Mesure`), fiche (`je prends`, `PrixMono`), « Part dans À venir » (texte brut), dates des anciennes notes (plus de chasse fixe).
- **R73-12** `TableauCarnet.tsx` (barres « Prix au m³ ») : plus de second rang « 1 » : le rang est celui du tableau (barres sans rang).
- **R75-3** : même correctif que R107 (tableau).
- **R77-6** `ArbreCarnets.tsx` `TextePas` + `carnets-liste.css` : un prix final de la ligne (« · à comparer · 2 697,74 CHF ») est son propre élément (`cn-nowrap cnl-pas-prix`, ne rétrécit pas) ; la coupe « … » ronge le texte, pas le prix.
- **R73-31** `ArbreCarnets.tsx` : « Anciennes notes de l'Atelier » seulement au pied de l'Arbre.
- **R77-7** un seul nom de vendeur, le court (« Brau »), nom entier en `title` : tableau, fiche (tête, offres, « Choisir · … », « Part dans À venir »), Choisir (bouton, carte), Comparer (en-tête). Garde le « Choisir chez … » à 28 signes de c77.
- **R73-15** `RubriqueQuand.tsx` : à l'ouverture de Quand, la feuille est amenée à l'écran (`scrollIntoView nearest`).
- **R73-18** `CarnetOuvert.tsx` : à l'ouverture, l'en-tête du carnet est amené en haut (`scrollIntoView start`).
- **R73-17 + R75-7** `FilCarnet.tsx` : un lien collé jamais lu dit « non lu · produit et prix inconnus » sous son domaine.
- **R73-23** `FilCarnet.tsx` : la ligne « À faire du … au … » recopiée dans la 1re bulle devient « jusqu'au <fin> » (le début est dit par Quand).
- **R75-8** `RubriqueQuand.tsx` : la réglette est posée sur la date que Quand dit (début du projet du Planning), pas sur la fin.
- **R73-24** `RubriqueQuand.tsx` + `CarnetOuvert.tsx` : un projet « Dans À venir » dont la date est passée dit « en retard · S22 », jamais « passé » (un seul état).
- **R78-2** `FicheArticle.tsx` : la ligne cochée de « je prends » dit son CHF/kg rendu dans sa colonne (« ≈73,8 »), plus « offre ↓ » ; le bloc Offre ne redit pas le CHF/kg (c77 R73-9 : une fois).
- **R78-3** `tableauRegles.ts` `venduPar` : « vendu par 50 g à 500 g » (les sachets sans prix lu comptent).
- **R78-4** `tableauRegles.ts` `nombreDifferentes` : une ligne égale à la variété près (« · variété ») ne compte pas parmi les « N différents » (elle reste affichée : c66 R55 tenu).
- **R78-5** `carnets-liste.css` + `CoupDOeil.tsx` : plus de coupe « … » sur `.cnl-case span`, puce non rétrécissable, le × de la puce active est un coin posé en CSS (aucune largeur de plus).
- **R78-6** `RubriqueQuand.tsx` `anneesSurLesMois` : l'année s'ajoute au premier mois hors de l'année en cours et à chaque passage d'année (« juin 2027 », « janv. 2027 »).
- **R78-7** `RubriqueQuand.tsx` `montantVu` : espace insécable ordinaire (U+00A0) dans les puces de prix ; `montant()` garde U+202F (tests carnetsLot2).

## Fichiers écrits
`src/ui/carnets/` : tableauRegles.ts, insecable.tsx, Choisir.tsx, Comparer.tsx, FicheArticle.tsx, TableauCarnet.tsx, ArbreCarnets.tsx, AnciennesNotes.tsx, CoupDOeil.tsx, FilCarnet.tsx, RubriqueQuand.tsx, CarnetOuvert.tsx, carnets-liste.css, carnets-decider.css, carnets.css. Dossier de voie : RESULTAT.md, tests.log, porte.log, ed*.mjs (scripts d'édition).

## Sorties décisives
- `npx vitest run tests/unit/c78Regles.test.tsx` : 41 passed (41) (34 rouges au départ).
- c66Regles, c77Regles, carnetsLot2, carnetsProblemeEcran, carnetsProblemeRegles (rouges après un 1er jet) : verts, 209 passed.
- `npx tsc --noEmit` : 2 erreurs connues (seedData GanttTask, virtual:pwa-register) ; `functions/` : 0.
- Porte complète : voir `porte.log` (carnets*, c48..c78, noteRegles, c70RangementIA, c68Realises, lot3CarnetOuvert, virgule-transversale, proprietes, stocksMaterielUneRangee).

## Doutes, limites
1. **Rendu non vu** : aucune capture (consigne : preuve en ligne par le pilote). À regarder à 390 px : nom court des deux articles de Chambre froide ; Choisir (prix en gros insécable, carte de l'autre article) ; barres « Prix au m³ » (une pastille vide en tête de ligne, `cn-rang-vide`, à juger : retirer la colonne ?) ; liste filtrée (4 puces entières, × en coin) ; prix final de la ligne de liste ; réglette des mois avec année (« juin 2027 » peut être plus large que le mois seul).
2. **Calendrier non touché** : l'année sur la réglette est ajoutée par `anneesSurLesMois` (texte du `small` de `DureeFenetre`, rejoué par MutationObserver), faute de pouvoir ajouter un paramètre à `src/ui/calendrier/frise/DureeFenetre.tsx`. DÉCISION À PRENDRE : un paramètre `libelleMois` dans `DureeFenetre` serait plus propre ; recommandation : le faire dans une voie qui possède le Calendrier, puis retirer `anneesSurLesMois`.
3. **R73-17 « Relire »** : le lien jamais lu dit « non lu » mais n'a pas de bouton Relire dans la bulle (aucun geste de relecture n'existe pour un message sans article). Le test accepte « non lu » ; un vrai Relire demande de brancher `rappels` (hors de cette voie).
4. **R73-24** : seule la contradiction « passé / Dans À venir » est levée (« en retard »). La pastille « Idée · 3 sept. » et le compte « 0 décidés » du constat ne sont pas dans le test c78 : non traités.
5. **R77-7** : le nom entier d'un vendeur n'est plus qu'en infobulle (`title`) sur la fiche, Choisir et Comparer ; il reste au tableau des offres si `domaine`.
6. **R78-4** : la ligne Arômes (égale à la variété près) reste affichée parmi les lignes qui diffèrent, mais n'est plus comptée (c66 R55 exige « 2 identiques »).
7. Un test qui me paraît fragile : R78-5 « largeur estimée » compte 18 px pour `.cnl-case-x` ; j'ai retiré l'élément du DOM (× en CSS) pour tenir 358 px. Le vrai rendu est à voir.

CONNAISSANCE : aucune
LEÇON PROPOSÉE : un correctif de règle rouverte se garde par la suite des tests des lots précédents : sur 7 règles du lot, 5 reculaient un test c66/c77/carnets* (nettoyer « variété », espace fine de `montant`, long nom de vendeur, bulle de note). Rejouer les tests voisins après chaque règle, pas à la fin.
