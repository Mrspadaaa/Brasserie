# Critique calibrée — c7-catalogue-branche (26.10)

OK — accepté sur ce qui est montré (Krush trouvé, astérisque d'origine conforme à sa règle) ; pas déployable comme clos :
la marque « peu de données » n'a pas de capture, et la fluidité « après » (critère bloquant de VOIE.md) n'est pas mesurée.

Captures ouvertes en image : `img/01-recherche-krush.png`, `img/02-asterisque-cascade-che.png` (390 × 844, banc
`?dev-local&etape=houblons`). Code lu : `fiche/MarquesVue.tsx`, câblage dans `Ajouter.tsx` l. 156, `Carte.tsx` l. 182,
`FicheHoublon.tsx` l. 187. Catalogue : 163 des 188 ajouts portent `peuDeDonnees: true`.

## 1. Les plaintes sont-elles corrigées ?

- **« Il doit manquer quelques houblons aussi... » / « Il faut tout mettre ?? »** : **oui** sur la capture. « krush » tapé,
  une ligne : Krush, α 10–14,1 %, double, icône « à acheter », 10 g +4 IBU, bande d'arômes, 10′ en pointillé, cœur. L'ordre
  est celui du brasseur (nom, α, rôle, arômes, dose, puis IBU : L04, D87). Sa phrase : « ok il est là ».
- **Règle du 26.10 (« Lié sa fiche à un cascade le plus proche et mettre une info avec Astérix »)** : **oui**. « Cascade α 5,5 %
  aromatique [stock] * » ; touché, « * fiche de Cascade (US) ; origine CHE non répertoriée » sur sa ligne. L'α affiché est
  celui de son lot (5,5), la fiche celle de Cascade. Rien au premier plan sauf l'astérisque : conforme à D1 à D3.
  Sa phrase : « c'est ça, mais l'astérisque devrait être collé au nom ».
- **« Il faudrait pas que l'algo trie trop ou exclue trop tôt »** (D175) : rien d'exclu, seul un tri à égalité ; mordant des
  tests vérifié par la voie. Pas jugeable en capture.
- **« Attention au délais ajouter, la Responsive, réactivité »** : **non prouvé**. L'« après » n'est pas mesuré
  (RESULTAT, l. 24 : « NON MESURÉ »). Le premier rendu se fait sur 317 puis se recalcule à l'arrivée des 505 : un saut de
  propositions sous le doigt est possible et n'est ni mesuré ni capturé.

## 2. Un acquis est-il perdu ?

- La ligne d'ajout (nom, α, rôle, bande d'arômes, dose, IBU, pastille 10′, cœur) : inchangée, Krush y entre tel quel.
- La carte du rail (Nugget) : inchangée.
- Étape Houblons : l'écran n'est pas une maquette choisie du registre ; rien à comparer côte à côte. Pas de perte visible.
- Signal : la ligne affiche « Cascade » et non le nom de son article « Cascade CHE ». S'il a deux Cascade en stock (US et
  CHE), seul l'astérisque les distingue. Non bloquant, à lui montrer.

## 3. Défauts bloquants ?

- Chevauchement : sur `02`, le bouton « + » flottant recouvre les barres Épicé et Végétal. C'est le bouton fixe sur un
  contenu défilé, pas la voie ; déjà là avant. À noter pour p6, pas pour c7.
- Texte trop petit : l'astérisque est un `*` 16 px dans une cible 24 px, en fin de rangée, loin du nom ; la note ouverte est
  en 14 px sur deux lignes. Lisible. La marque « peu de données » est en `text-xs` italique gris (`text-cave-400`) :
  **non capturée**, je ne la juge pas (L12). Avec 163 variétés marquées, elle paraîtra sur une bonne part des lignes
  d'ajout : à voir en vrai avant de dire qu'elle est discrète et lisible.
- Cockpit : non. Deux lignes dans la liste, pas de texte explicatif au repos.
- Marque illisible : non jugeable sans capture.

## 4. Déployable ?

- Le visible (recherche, astérisque) : **oui** en l'état.
- La voie comme clôture : **non**, pour trois raisons, toutes déjà dans son RESULTAT :
  1. fluidité « après » non mesurée (critère bloquant de VOIE.md ; sa demande d'exécutant n° 1 et 2) ;
  2. B5 160,6 ko > 160 (0,35 ko de c7 ; décision du pilote : relever à 162 ou alléger f2) ;
  3. marque « peu de données » sans capture.

## DEMANDE EXECUTANT (en plus de celle de la voie)

1. Même serveur que `capturer.mjs` (port 5281, `VITE_HOP_V4=on`), étape Houblons, 390 × 844 : taper dans « Ajouter —
   houblon… » le nom d'une variété marquée (prendre la première de
   `node -e "const c=require('./src/data/hopV4/catalogue-ajouts.json');..."` avec `peuDeDonnees: true`, ou « Dolcita », « Elani »,
   « Superdelic » si elles sont marquées) ; capturer la ligne → `img/03-peu-de-donnees-ajouter.png`.
2. L'ajouter, capturer la carte du rail → `img/04-peu-de-donnees-carte.png` ; appui long, capturer la fiche →
   `img/05-peu-de-donnees-fiche.png`.
3. À ouvrir en image : les trois. Dire si « peu de données » tient sur la ligne sans renvoi, et combien de lignes de la
   liste au repos (sans recherche) la portent.

## Verdict

- **01-recherche-krush** — ACCEPTÉ. « ok il est là ».
- **02-asterisque-cascade-che** — ACCEPTÉ. « c'est ça, mais l'astérisque devrait être collé au nom ». Retouche souhaitable :
  l'astérisque juste après le nom (avant l'α), même cible de 24 px.
- **marque « peu de données »** — NON JUGÉE : aucune capture. Capture demandée ci-dessus.

LEÇON PROPOSÉE : aucune.
