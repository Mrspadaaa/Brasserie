CONTROLE KO 12/13 mesures (R113 mots coupés 8, R114 54/54 feuilles ⋯ cachées, R115 10/11) — scripts/controle-mise-en-page-carnet.mjs

# RESULTAT c80-tests

Le DOSSIER prime sur le VOIE : pas de `tests/unit/c80Regles.test.tsx` (jsdom ne mesure rien), un contrôle Chrome à la place. Aucun fichier de `src/` ni `functions/` modifié par la voie (le `M src/ui/finance/UpgradeWorkspace.tsx` du `git status` est d'une autre session, déjà là au départ).

## Fichiers écrits
- `scripts/controle-mise-en-page-carnet.mjs` : le contrôle (puppeteer-core, 127.0.0.1:9222, onglet à soi, `page.close()` puis `disconnect`, jamais `browser.close()` ; 390 × 844 mobile ; sortie « MISE-EN-PAGE OK » ou « MISE-EN-PAGE KO … », code 1). Options : `--captures <dossier>`, `--seulement R113,R114,R115`.
- Banc : `work/missions/2026-11-23-reprise-soir/voies/c80-tests/banc/` (`banc.tsx`, `index.html`, `vite.banc.config.mjs`, port 3080). CarnetsVue RÉEL, magasin mémoire, IA simulée, rien d'écrit. Le décor imite l'écran Matériel de l'app (StocksTab l. 715 et 930) : en-tête collé 40 px, rangée Matériel · Carnets 44 px (z 20), CarnetsVue `min-h-0 flex-1` dans un écran de hauteur `100dvh − en-tête − barre − 1rem`, marge de 12 px, barre du bas fixe. Zone visible = 88 → 732 px. Banc ignoré par `.gitignore` (`/work/missions/**`) : versé avec `git add -f`.
- `tests/fixtures/c80/zz-fenetre-reconstruit.json` : seul document RECONSTRUIT (marqué `_releve.reconstruit`), d'après reel-80 n° 23 : un message de création « liste » égal au titre, `FilCarnet.tsx` l. 188 le retire et le jour reste. Tous les autres documents sont les vrais : `c78/chambre-froide-releve.json`, `c79/*` (12 ZZ), `c75/*` (Houblons citra, Embouteillage, ZZ malt, ZZ pompe).
- Sortie rouge : `sortie-ko.log` ; captures : `cap/` (ouvertes, voir plus bas).

## Sortie du contrôle sur le code actuel (sortie-ko.log, code 1)
```
KO R113 — 8 mot(s) coupé(s) sur 72 [mm, frigorifique] ; 4 bloc(s) de plus de 2 lignes sur 40 [« 1500 x 1200 mm - groupe frigorifique » 6 lignes ; « 1800 x 1500 mm - groupe frigorifique » 6 lignes ; …]
KO R114 — 54 feuille(s) ⋯ pas entière(s) ou pas touchable(s) sur 54 ouvertes, 6 carnets ; ex. 79-09 bulle 1/6 center : « Modifier » y -1 hors zone non touchable (sous : div.), « Changer en façon » y 51 hors zone non touchable, « Fermer » y 259 non touchable (sous : div.cnp-b) (zone 88–732)
KO R80-2 — 2 cercle(s) de rang vide(s) au carnet, 2 dans Comparer
KO R73-8 — vide entre le bas du texte du prix et le haut du crayon ou d'Ouvrir : 21 px (attendu : même ligne, donc ≤ 0, ou ≤ 8 px)
KO R73-14 — photo absente : bandeau 360×104 px, pictogramme 92×104 px = 26 % du bandeau (attendu : bandeau ≤ 64 px ou pictogramme ≥ 35 %)
ok R75-6 — chasse des valeurs de Caractéristiques : Source Sans 3×16 (attendu : une seule)
KO R73-10 — nom de l'article dans Choisir : 0 mot coupé, 1 nom sur plus de 2 lignes [« 1500 x 1200 mm - 2,6 m³ - groupe fri » 3 lignes]
KO R75-6b — chasse des valeurs dans Choisir : Source Sans 3×14 + IBM Plex Mono×2 (attendu : une seule)
KO R80-1 — Quand de « Embouteillage » dit « Quand · 1 mai 2027 · 2 500 CHF estimé Prix » (attendu : « dès … » ou « avant … » comme À faire)
KO R80-4 — 2 lignes de la liste citent un lien brut : « ZZ TEST — inspection électrique, fusible Je cherche · « https://www.br » (au repos et sous « je cherche »)
KO R77-6 — 2 lignes : [repos] « Fermentation 1 Chambre froide · à comparer · 2 697,74 CHF » (coupé) ; [filtre] « Chambre froide Je cherche · à comparer · 2 697,74 CHF » (collé : ·|à compare, omparer ·…|2 697,74)
KO R75-8 — le même montant du Planning est dit « budget » et « estimé » (liste : « … · Dans À venir · budget 2 500 CHF » ; Quand : « … · 1 mai 2027 · 2 500 CHF estimé Prix »)
KO R80-3 — 1 jour(s) du fil sans bulle sur 18 carnets : 80-01 (24 nov.)
MISE-EN-PAGE KO 12/13 mesures : R113, R114, R80-2, R73-8, R73-14, R73-10, R75-6b, R80-1, R80-4, R77-6, R75-8, R80-3
```
(12 KO sur 13 mesures : R113 1, R114 1, R115 11 dont une verte, R75-6.)

## Ce que chaque règle mesure (seuils fixés par la règle, pas par l'état actuel)
- R113 (R75-3) : chaque mot (suite de signes sans espace, ni trait d'union) du tableau est un `Range` ; ses rectangles par ligne (`getClientRects`) disent s'il est coupé ; les lignes cachées par une ellipse (`-webkit-line-clamp`) ne comptent pas. Tout bloc de texte d'une cellule : 2 lignes au plus, ou ellipse.
- R114 (EXA-1) : 6 carnets c79 (écoulement, vapeur, assurance, fusible, CO2, soufre), 3 bulles (première, milieu, dernière) × 3 positions de défilement (`center`, `end`, `start`) = 54 feuilles. Chaque entrée : boîte entre le bas de la rangée Matériel (88 px) et le haut du champ (732 px), et `elementFromPoint` au centre = l'entrée. Cause probable (lue dans le CSS, non éprouvée) : en fil (`.cnp-fil`), `.cn-feuille-ancre` n'est pas posée (`position: relative` n'existe que sous `.cn-notes`, carnets.css l. 262), donc la feuille se cale en haut du défilement, y −1, sous la rangée, et « Fermer » est recouvert par la bulle suivante (`div.cnp-b`).
- R115 : R80-2 cercles de rang sans chiffre (carnet et Comparer) ; R73-8 vide sous le prix (fiche d'article) ; R73-14 photo absente (bandeau gris) ; R75-6 / R75-6b chasse des valeurs (Caractéristiques, Choisir) ; R73-10 nom dans Choisir ; R80-1 Quand dit « dès » ou « avant » ; R75-8 un seul mot (budget / estimé) pour le même montant ; R80-4 pas de lien brut dans la liste ; R77-6 montant entier et blanc devant lui (liste au repos et sous « je cherche ») ; R80-3 aucun jour du fil sans bulle, sur les 18 carnets des fixtures.
- Vérifié : les regex tournent dans Node sur des cas OK et KO (« dès le 1 mai 2027 » → vrai ; « 1 mai 2027 · 2 500 CHF estimé » → faux ; « 2697,74 CHF » vs « 2 697,74 CHF »).

## Captures ouvertes (cap/)
- `R113-tableau.png` : « 1500 x 1200 m m - groupe frigorifiq ue en stock · TTC », 6 à 7 lignes, cercles de rang vides au bloc Prix au m³ (R75-3, R80-2).
- `R114-feuille-79-03-center.png` et `-79-09-center.png` : la feuille ⋯ monte sous la rangée ; seuls « Changer en critère », « Déplacer », « Supprimer » se voient ; « Modifier » et « Changer en façon » sont cachés (EXA-1).
- `R115-comparer.png` (ronds vides « En barres »), `R115-fiche.png` (bloc Offre à vide, bandeau gris avec pictogramme étroit), `R115-choisir.png` (nom sur 3 lignes, « 2,6 m³ » et « 230 V » en chasse fixe, « 550 Watt » non), `R115-quand.png` (« 1 mai 2027 · 2 500 CHF estimé » contre « Budget 2 500 CHF » au-dessus), `R115-liste.png` (« ·à compar…2697,74 CHF » sous « je cherche », « https://www.brewt… »).

## Essais, doutes et limites
- R114 : les carnets Résolu (pompe, malt) ne sont pas retenus : leur fil replié n'ouvre pas de feuille au banc (clic sur ⋯ sans effet) ; à voir avec le correctif, car c'est peut-être un défaut en soi (non compté).
- R80-3 : reproduit seulement sur le document RECONSTRUIT (pas de document réel de « fenêtre qui ferme mal » dans les fixtures). La partie « sous-titre de la liste qui redit le titre » n'est pas mesurée.
- R73-8 : le seuil de 8 px est un choix (le DOSSIER cite ≈ 40 px de vide, mesuré 21 px entre le texte et le crayon).
- R75-6 : verte sur la fiche (une seule police) ; la règle tombe dans Choisir (R75-6b).
- R80-1 mesure le mot « dès / avant / jusqu… » du Quand ; elle ne dit pas lequel le correctif choisira.
- Un banc remplace l'en-tête et la barre du bas par deux cadres vides : le contrôle de l'app déployée reste à jouer par le pilote.
- Durée du contrôle complet : ≈ 3 min (18 chargements de carnet pour R80-3, 6 × 9 feuilles pour R114).
- Non fait : `tests/unit/c80Regles.test.tsx` et le `.skip` du cas R4 de c48Regles (le DOSSIER remplace ces deux points).
- Essais : 1 par critère jusqu'à la sortie KO ; ajustements : liste de carnets de R114 (Résolu écartés), recherche du bon décor (feuille posée sous la rangée = bug de l'app, trouvé au 1er essai), mesure du « collé » de R77-6.

## DÉCISION À PRENDRE
aucune.

CONNAISSANCE (à vérifier par le correcteur) : `.cn-feuille-ancre` n'est positionnée (relative, hauteur 0, z 6) que sous `.cn-notes` ; dans `.cnp-fil` elle ne l'est pas, d'où y −1 sur toutes les notes (EXA-1) et « Fermer » recouvert par la bulle suivante.
LEÇON PROPOSÉE : aucune
