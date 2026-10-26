# Voie m8-radar-manque-partiel — rendre très visible la donnée manquante d'un houblon sur 3 (ou 2 sur 3)

Agent : concepteur (Opus). C'est ce que le brasseur verra : une page de choix, faite de mini maquettes dans **son vrai radar**. Rien ne change
dans l'app.

## Ses mots (26.10)
Sur la capture r2 du radar de Substituer, il a entouré les points de Lotus et de Solero près du centre, sur melon, noyau et pépins. Sa
capture : `voies/brasseur-radar-manque-partiel.jpg`. Ouvre-la. Il écrit : « Comment c'est affiché le donnée manquantes pour que 1 des 3 ? Ou
2 des 3... Ça doit être très visible » (D183).

Ses mots plus anciens sur ce radar, à respecter (`work/refonte-frontend/v4/SPEC-BRASSEUR.md`) :
- « C'est beaucoup mieux mais ça met pas assez en valeur les données manquantes » ;
- il a choisi « Secteurs hachurés rdg1 et Les inconnus regroupés rdg5 » ;
- « Il y a pas les traits haché comme demandé » (des tiretés là où le contour enjambe un inconnu, D147) ;
- et du jour : « si les traits haché traversew graph, ça enlève de la visibilité » (D180, corrigé par r2).

## Les deux cas qui se confondent aujourd'hui
1. **« Non décrit »** : le houblon a des fiches, mais aucune ne cite la famille. Son point est posé sur l'anneau « 0 ». C'est ce qu'il a
   entouré. Ce n'est pas un manque, mais ça en a l'air ; et l'absence d'un mot n'est pas la preuve de l'absence d'un arôme.
2. **L'inconnu propre à une série** : aucune fiche de ce houblon ne décrit la famille, alors qu'un autre houblon la décrit. Il n'y a pas de
   point, et le contour passe en tiretés (D147). C'est discret.

Le bloc « sans donnée » regroupé en bas (rdg5) ne vaut que quand **les trois** manquent.

## Ce qui est demandé : au moins 6 variantes diverses (L24, M13 en petit)
Base : son radar tel qu'il est dans l'app après r2 (le commit f5a53f99 et le correctif en cours de Comparer Absolu), dans Substituer, avec
Lotus contre deux remplaçants.
- **A, l'actuel**, en référence.
- Pour l'inconnu d'une série, au moins 3 façons très visibles :
  - un « ? » de la couleur de la série, posé sur l'axe ;
  - un secteur hachuré de la couleur de la série, sur cet axe seulement ;
  - un point creux en pointillés, à la place du point ;
  - un repère au bord, sur l'étiquette de la famille : « ? Lotus » ;
  - etc.
- Pour « non décrit », au moins 2 façons de le distinguer d'une valeur et d'un manque : un point plus petit au centre, un anneau gris, rien
  du tout, etc.
- Au moins une idée à toi.
- Les cas à montrer : 1 sur 3, 2 sur 3, et 3 sur 3, où le bloc regroupé reste.
- Les règles :
  - ne perds ni le contour de l'original au-dessus (D156), ni les tiretés le long du bord (r2) ;
  - « pas de cockpit » ([[pas-de-cockpit]]) ;
  - aucun texte sous 12 px.

## Méthode
- Si l'app ne donne pas le cas 1 sur 3 avec les fixtures, construis les données du cas. Écris-le sur la page : « cas construit ».
- Clone dans la page rendue de l'app, avec des classes préfixées `m8r-…`, retirées après la capture. Modèles : `voies/m6-suggerer-moment/capturer.mjs` et
  `voies/m5-dryhopper-froid/capturer.mjs`. Le contrôle `work/refonte-frontend/v4/tournoi/outils/controle-capture-fidele.mjs` doit passer.
- Écris une `DEMANDE EXECUTANT :` pour les séries de captures au-delà d'un premier essai (voir ta définition d'agent).

## Livrable
- `voies/m8-radar-manque-partiel/page.html` :
  - en-tête d'une phrase : « Comment voir qu'un houblon sur trois n'a pas de donnée ? » ;
  - A en référence, puis les vignettes ;
  - `node scripts/agents/verifier-page.mjs <page.html> --page-lot --captures <os.tmpdir()>/m8` doit rendre `PAGE OK`.
- `RESULTAT.md` : les variantes, les captures ouvertes, et ta préférence argumentée comme le brasseur la jugerait.
- Lis `.claude/rules/affinee-frontend.md`, DESIGN.md, `cerveau/sources/beermaverick-radar.md` et le portrait du critique
  (`work/refonte-frontend/v4/ecran-1/fils21-choisir/critique/PORTRAIT.md`).

## Possède
`work/missions/2026-10-25-integration-houblons/voies/m8-radar-manque-partiel/` seulement. Rien dans `src/`. N'écris aucun code par heredoc ni
par `node -e`. Retour en une ligne.
