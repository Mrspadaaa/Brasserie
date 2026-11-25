OK — c74bRegles 50/50 ; porte 13 971 verts sur 13 972 (1 rouge hors périmètre : stock/murDonnees) ; LISTE OK ; commit 41a3acaa3

FIX 50/50 ; LISTE OK (89 % de 651 px, 15 lignes entières) ; tsc OK (racine : 2 connues seulement, functions : 0) ; commit de code 41a3acaa3 (registre BUGS dans le commit suivant).

## Plan par règle (endroit -> correctif)
- Décision 1 (Alpha sort de la grille) : FicheArticle.tsx, `sansAlpha` filtre Alpha de « Caractéristiques » pour un houblon (la tête dit « α 13,6 % » / « α 10–15 % » une fois). Tests mis à jour avec le commentaire « D-25.11 sa plainte : valeur dite une fois » : c53 (`attendreHoublon(..., alphaEnTete)`), c59 R38, c61 R45, carnetsFix28Fiche.
- Décision 2 (Offre) : carnets.css `.cn-offres .cn-offre-corps { flex: 1 1 14rem }` (plus 100 %) ; le prix reste à droite du corps, crayon et Ouvrir suivent sur la même ligne, dessous seulement si la carte est trop étroite. c58 R34 (C58-6) mis à jour : `placeDuPrix` accepte le corps qui grandit depuis une base fixe.
- Décision 3 (« essayé ») : filRegles.ficheResolu ne cite que les options écartées (`etatOption === 'ecartee'` ou écartée au moins une fois) ; une piste ou une veille n'est jamais « essayé ». c67 C67-10 mis à jour (A écartée par lui ; B simple piste absente de la ligne « essayé »).
- R95 fil ancien : nouveau domaine/carnets/filAncien.ts (`propositionFilAncien` pure : « Autre X : » = option, geste fini en dernière bulle = Résolu proposé, « à + infinitif » = tâche ; `rangerFilAncien` : une écriture annulable, appelée seulement par « Ranger ») + ui/carnets/FilAncienARanger.tsx (carte « Ranger ce fil ? » : section.cnp-options, cases d'options, case Résolu cochée, tâches, Ranger / Laisser) branchée dans CarnetOuvert, `RappelsSuivi.onRangerFil`, actionsCarnet. À l'ouverture : aucune écriture (test « garde » vert).
- R96 : « … Résolu. » tapé dans un problème ouvert pose la carte « résolu ? » (OK : passer à Résolu / Non) dans rangementCarnets.avecJetons, jamais passé seul. Import du Planning : CriteresCarnet range « Budget du Planning : n CHF » hors de la ligne Critère (« Budget 850 CHF · du Planning ») ; RubriqueQuand dit le jour du Planning (« 1 mai 2027 », tant que la date est celle de l'import) et « 850 CHF · budget » au lieu de « prix ? » ; tachesDe porte `debutPlanning`, quandDite dit « dès le 1 mai 2027 ». Aucune donnée réécrite : tout se lit à l'affichage.
- C73-2 : envoiRegles.calculerDestination garde dans le problème une phrase « solution + prix » (plus de carnet neuf) ; rangementCarnets.etiquettesDuRepli lie aussi le jeton « devis » à l'option.
- C73-6 : CarnetsVue retire l'avis « Hors ligne : rangé sur l'appareil » du retour affiché quand le réseau revient (« Ranger maintenant » reste).

## Fichiers écrits
src/ui/carnets : FicheArticle.tsx, carnets.css, carnets-fil.css, filRegles.ts, envoiRegles.ts, rangementCarnets.ts, CarnetsVue.tsx, CarnetOuvert.tsx, carnetOuvertTypes.ts, actionsCarnet.ts, FilCarnet.tsx, CriteresCarnet.tsx, RubriqueQuand.tsx, afaireRegles.ts, FilAncienARanger.tsx (neuf). src/domain/carnets : filAncien.ts (neuf), taches.ts. Tests mis à jour : c53, c58, c59, c61, c67, carnetsFix28Fiche (chaque changement commenté « D-25.11 »). work/missions/BUGS.md (18 lignes C73-1 à 6, R73-1 à 10, R73-16 et 17 : corrigé en local 41a3acaa3).

## Critères
- c74bRegles : 50 passed (50). Essais : la voie a été conduite par lots ; aucun critère n'a dépassé 3 essais.
- Porte : tests/unit/c48..c74bRegles, carnets*, noteRegles, c70RangementIA, c68Realises, lot3CarnetOuvert, virgule-transversale, proprietes, stocksMaterielUneRangee : 1 022 fichiers verts sur 1 023 (le filtre par préfixe a pris tout tests/unit/c5*, c6*, c7*), 13 971 tests verts, 1 rouge : tests/unit/stock/murDonnees.test.ts « pastilles vides » (ordre « Fumé, Sucres » au lieu de « Sucres, Fumé »). Stock n'est pas dans ma voie, aucun fichier stock modifié par moi (git status vide pour src/domain/stock, src/ui/stock, tests/unit/stock) ; hors périmètre, à router.
- `node scripts/controle-liste-compacte.mjs` : LISTE OK sans-filtre 89 % de 651 px, 15 lignes entières ; filtre-cherche 90 %.
- tsc racine : 2 erreurs connues (seedData GanttTask, virtual:pwa-register) ; functions : 0. BUGS OK (2420 bugs).
- Journaux : tests.log, tests-a.log, tests-b.log, tests-porte.log dans ce dossier.

## Doutes et limites
- Aucune capture : preuve en ligne par le pilote et le critique (voie sans captures locales). À voir en ligne à 390 px : le bloc Offre (gestes sur la ligne du prix), la carte « Ranger ce fil ? » d'un carnet ancien, la ligne « Budget 850 CHF » et Quand « 1 mai 2027 » d'un carnet du Planning.
- La détection du fil ancien est volontairement étroite (3 bulles `brut` au moins, aucun jeton, aucune option, aucun genre posé) : un fil qui ne dit aucun motif ne propose rien. Les trois motifs (étiquette « Autre X : », participe passé d'un geste fini en dernière bulle, « à + infinitif ») sont des heuristiques de texte, à confronter à ses vrais fils.
- Quand dit le jour du Planning seulement tant que la date du carnet est celle de l'import (lundi de ce jour) et future ; sinon la lecture d'avant.
- Les 2 variantes d'un « Résolu » tapé : la carte part avec le message ; sans carnet « problème » ouvert, rien.

DÉCISION À PRENDRE : tests/unit/stock/murDonnees.test.ts est rouge (ordre des pastilles vides Fumé/Sucres), hors de mes fichiers. Options : le router vers la voie stock, ou vérifier si un changement stock non commité (git status) en est la cause. Recommandation : voie stock.
CONNAISSANCE : aucune
LEÇON PROPOSÉE : un filtre vitest par préfixe (tests/unit/c5) ramasse bien plus que la liste voulue (1 025 fichiers au lieu de ~90) : passer des chemins complets.
