ECHEC — voie incomplète (plafond de tours) : tableau houblons et matériel, « pour 1 kg », Selon la quantité, Arômes, Prix au m³ livrés (1481a7518) ; cartes Articles, fiche, Comparer non portés.

## Inventaire (maquettes2/v01 contre l'app, captures actuel-* / apres-*, banc de fixture 390)

| Écran | La maquette a | L'app avait | Écart | État |
|---|---|---|---|---|
| Carnet houblons | tableau article · α · récolte · CHF/kg ; « pour 1 kg ▾ » ; Selon la quantité (1, 5, 20 kg) ; Arômes en couleurs ; ⚠ dispo ? ; note « rattachée à … » | rang · article · α · CHF au prix du sachet (≈4), ligne du nom très longue | colonnes, CHF/kg selon la quantité, deux blocs, pastilles Articles / Comparer / pour | **porté** (sauf la note rattachée : fil, voie probleme) |
| Chambre froide | tableau m³ · m² sol · CHF, Prix au m³ en barres, Compromis, Écartés · n, « 4 lignes diffèrent » | 1 mesure + CHF | 2 mesures, barres du prix au m³ | **porté en partie** : 2 mesures et barres ; Compromis, Écartés en ligne, « n lignes diffèrent », ligne de contexte non portés |
| Articles (cartes) | cartes α · dispo · conditionnement · prix, glisser à gauche : Déplacer / Retirer, table « Conditionnement de Brau », « Coller un lien » | feuille en bas (CarteClassee) ; ⋯ Déplacer / Retirer | tout | **non porté** |
| Fiche | photo minuscule dans l'en-tête, α en gros, arômes, tableau « je prends · prix · CHF/kg rendu », grille récolte / forme / origine / dispo, note citée, Choisir · vendeur, 1 kg | bandeau photo, Offre, Caractéristiques | tout | **non porté** |
| Comparer avec critère | barres « Prix au kilo, rendu », Côte à côte coché, Selon la quantité, Compromis, Choisir · X, 1 kg | tableau articles en colonnes, Classé par | blocs et libellés | **non porté** |
| Comparer sans critère | « L'IA propose : … · Poser », « 5 diffèrent », « 18 identiques ▸ » repliés, barres en complément, Écartés repliés | idem | repli des identiques, barres | **non porté** (règles écrites et testées : `departager`, `ditDiffèrent`, `ditIdentiques`, `largeursBarres`) |

## Fichiers écrits
src/ui/carnets/tableauRegles.ts (neuf), TableauCarnet.tsx, ArticlesCarnet.tsx, carnets-decider.css ; tests/unit/carnetsGreffeP2Regles.test.ts (21 tests) ; assertions D451 n° 7 dans c52Regles, c53Regles, c64Regles (3 fichiers, 4 assertions, commentaire `// D451 disparaît n° 7`) ; banc Vite et captures dans ce dossier (`banc/`, `cap/`).

## Critères
- tsc : 2 erreurs, les 2 connues (seedData, virtual:pwa-register), aucune neuve.
- Tests : c48..c64Regles, carnets*, lot3CarnetOuvert : 62 fichiers verts avant ; après, 4 assertions rouges (toutes sur le tableau n° 7), corrigées ; relance des 4 fichiers touchés (c52, c53, c64, carnetsGreffeP2Regles) : 204 / 204 verts. La suite entière n'a pas été rejouée après la correction.
- `npm run build` : **non rejoué, impossible sur ce poste** : `vite-plugin-pwa` n'est installé ni ici ni dans le dépôt principal (le serveur de dev ne démarre pas non plus avec vite.config.ts). Le banc utilise `banc/vite.banc.config.mjs`, sans ce plugin.
- Vision : 390 seulement, clair. Ouvertes : actuel-carnet, actuel-articles, actuel-fiche, actuel-comparer, actuel-comparer-critere, actuel-carnet-froid-critere, apres-carnet, apres-carnet-froid. Les autres (apres-articles, apres-fiche, apres-comparer*, apres-carnet-froid-critere) sont prises, non ouvertes. Pas de 1280, pas de sombre. Pas de gestes joués (glisser, Choisir, Escalader, Relire inchangés par construction : leurs fichiers ne sont pas touchés).

## Ce qui a été fait, pour un brasseur
- Houblons : α · récolte · CHF/kg, le meilleur en vert, « ? » quand la page ne dit pas la récolte ; le prix au kilo suit « pour 1 / 5 / 20 kg » (offres publiées, palier du vendeur, TVA d'import et cours via `prixRendu`, « ≈ » quand estimé) ; Selon la quantité (1, 5, 20 kg, le meilleur par ligne) ; Arômes lus sur les pages, colorés par famille (`jetonArome`).
- Matériel : jusqu'à 2 mesures (celles qui classent, puis celles qui distinguent) avant le prix ; « Prix au m³ » en barres, calculé ici et marqué « calculé » (jamais « proposé par l'IA »).
- ⚠ dispo ? : affiché si l'article porte un doute D450 sur la disponibilité (« à vérifier » sinon).

## Doutes et limites
1. « Pour 1 kg » est un réglage de lecture tenu en mémoire par carnet (clé : le titre), perdu au rechargement ; il ne s'écrit pas dans le carnet. Comparer ne le lit pas encore.
2. Les arômes viennent des pages des vendeurs, pas du catalogue (la maquette dit « catalogue Citra ») : le libellé dit « lus sur les pages ». « fruits tropicaux » reste gris : `familleArome` (src/domain/levure/couleurs.ts, hors Possède) ne reconnaît que « tropical ».
3. Une chambre froide longue dans le nom wrap sur 4 lignes ; la maquette montre « 4,06 m³ » seul : nom court non porté.
4. La 2e mesure choisie sur la fixture est « Dimensions intérieures » (rang de décision), non « m² sol » comme la maquette : `rangDeDecision` départage.
5. Le bloc « Prix au m³ » se calcule sur une mesure qui s'additionne (m³, m², L, kg…) ; le critère « Prix au m³ » du carnet (IA) n'est pas lu par le domaine, qui ne classe pas par m³ (la maquette parle de « rang : prix au m³ ») : le rang reste celui du domaine (prix CHF).
6. Comparer ne reçoit pas les articles (offres, paliers) : le prix au kilo à une quantité y demande une prop `articles` facultative que `ecransCarnet.tsx` (voie liste) devrait passer.

DÉCISION À PRENDRE : la suite (cartes Articles avec glissé, fiche, Comparer) tient dans une voie de plus, sans nouveau cadrage ; relancer greffe-p2 bis sur ces trois écrans, avec `articles` passé à Comparer par la voie liste. Recommandation : oui, juste après la lecture de apres-carnet et apres-carnet-froid par le pilote.

## Essais
Une passe de tests par fichier ; 1 correction de test (une attente fausse de ma part sur un sachet de 500 g acheté 2 fois à 1 kg). Plafond de tours atteint avant les cartes, la fiche et Comparer.

CONNAISSANCE : `vite-plugin-pwa` manque dans node_modules (poste worktree) : `npm run dev` et `npm run build` échouent ; banc de rendu possible avec une config sans plugin (`banc/vite.banc.config.mjs`) et `optimizeDeps.entries` limité à la page du banc, sinon le scan lit prototypes/houblons-v4 et échoue.
LEÇON PROPOSÉE : aucune.
