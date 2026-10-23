# Voie p2-suggerer — Suggérer (q2b), jouable

- Mission : 2026-10-23-maquette-parcours (lire `../../MISSION.md` d'abord)
- Agent : concepteur
- Modèle : opus
- Niveau : conception
- Plafond : 100 tours ; 3 essais par critère
- Dépend de : p0-socle (le socle, son `ARCHITECTURE.md` et son « ## Contrat d'un écran »)
- Décideur en cas de doute : brasseur, par ses mots et ses choix connus ; aucune question bloquante (option
  prudente, écrite dans la NOTE)

## Objectif
L'écran Suggérer de la maquette jouable, « Quel houblon ajouter à ma bière ? », est **q2b**, son choix : q2
(« cella là », 19.10, 14 h 34), puis q2b (« C'est effectivement qb2 reprise le mieux », 19.10, soir).
- Il part de q2b tel qu'intégré dans la base v4.10 (`base/consolide`), sur laquelle les baselines l5b et l8 ont été
  bâties.
- Il est porté en React dans le socle et calculé en direct pour la visée « Plus floral ».
- Il se termine par « Comparer les 3 », qui ouvre Comparer avec les houblons choisis.

## Entrées
- `prototypes/houblons-v4/parcours/ARCHITECTURE.md` : le contrat d'un écran, les crochets, l'adaptateur du moteur
  (« suggérer pour une visée »), les composants communs.
- `work/refonte-frontend/v4/ecran-1/fils15-s5-complexe/q2b/` : `NOTE.md`, `etat-b.html` (la page à porter),
  `generateur-q2b.mjs` (d'où viennent ses nombres), et ses captures (`fils15-s5-complexe/captures/q2b-*.png`) à
  ouvrir d'abord.
- `work/refonte-frontend/v4/ecran-1/base/consolide/index.html` et `suggestions-radar.html` : q2b dans la base
  v4.10. Captures : `base/captures/consolide-*.png`.
- `work/refonte-frontend/v4/DEFAUTS-COURT.md`, lignes D78 à D82 et D52 bis : ses remarques sur le lot 15. Voir les
  consignes.
- `work/refonte-frontend/v4/ecran-1/fils22-carte/suggerer/etat.html` : la place de Suggérer dans la carte (question,
  facteur libre, contexte, pont).
- `cerveau/produit/acquis-valides.md` (q2b, barres l5b, piste d'objectif, « + » vers Comparer).
- `DESIGN.md`, `docs/ui-compacte.md`, `.claude/rules/affinee-frontend.md`.
- Les en-têtes des contrôles de tes GATES (`work/refonte-frontend/v4/tournoi/outils/<contrôle>.mjs`), et celui de
  `controle-usage-intensite.mjs` (D80), dont tu vérifies la règle en direct dans `jeu.mjs`.

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `prototypes/houblons-v4/parcours/src/ecrans/suggerer/**`
- sortie de construction : `prototypes/houblons-v4/maquettes/parcours-p2/` (ignorée par git)
- `work/missions/2026-10-23-maquette-parcours/voies/p2-suggerer/RESULTAT.md`
- Un besoin dans le socle se demande au pilote dans RESULTAT.md. Ne pas écrire dans `src/commun/`, `src/etat/` ni
  `src/moteur/`.

## Consignes
1. **q2b d'abord** : sa liste de voies (une par candidat), sa densité, sa piste l5b sous l'objectif. Un seul facteur
   libre : le houblon (L10). La base, la dose, le moment et la levure sont fixés sur la ligne de contexte du socle.
2. **Ses remarques du lot 15**, toutes tenues :
   - D78 : un « + » qui ajoute le houblon à la comparaison, à la place du panier. Dry hop, biotransformation et
     levure passent par Dryhopper et l'étape Levure, selon la carte : pas de réglage ici ;
   - D79 : pas d'en-tête « ma bière » qui ne sert à rien ;
   - D80 : l'intensité de chaque saveur, et l'usage de chaque houblon (amérisant, aromatique, mixte) en mini picto,
     sans surcharge ;
   - D81 : aucun signe dont le sens ne se donne qu'au survol ;
   - D82 : pas de gros blocs teintés.
3. Chaque candidat montre :
   - son nom, son α et son usage ;
   - sa barre dans la famille visée, au style, sur la piste de l'objectif (zone du style, visée) ;
   - son effet sur le résineux (déjà hors style) et ses extras hors objectif ;
   - le stock en icône ;
   - son « + ».
   On en choisit trois, puis « Comparer les 3 ». Les candidats viennent du moteur, en direct.
4. L'appui long sur un nom ouvre la fiche (le composant de la voie p1, importé de `src/ecrans/fiche/`). S'il n'est pas
   encore là, le signaler dans RESULTAT.md, sans le recopier.
5. **`jeu.mjs`** :
   - choisir trois candidats ; « Comparer les 3 » ouvre Comparer avec ces trois-là dans l'état ;
   - un « + » seul ajoute un houblon à la comparaison ;
   - D80, en direct (la règle de `controle-usage-intensite.mjs`, sur ce format) :
     - chaque famille qu'un candidat fait bouger d'au moins 0,5 point montre son intensité (`data-famille` et
       `data-crans`), à 0,6 cran au plus du moteur ;
     - chaque houblon montre son usage (`data-usage`, `data-source`), comme `hopRole`.
6. NOTE.md : `## Base` (q2b, base v4.10, les captures regardées), `## Idées reprises`, `## Écarts`, `## Pour l'app`, et
   les contrôles écartés avec leur raison (MISSION, table des voies).
7. Te juger sur tes captures à 390 puis à 1280 px, ouvertes en image (L12), à côté de celles de q2b.

## Exigences transversales et acquis (recopiés, leçons L05 et L06)
- Au style, l'absolu en option ; inconnu ≠ 0 ; simulé marqué « ~ » ; 80 mots au plus au premier écran ; légendes
  derrière « ? » ; stock en icône seule ; penser en brasseur (α, rôle, arômes, moment, puis l'IBU).
- Code couleur des arômes (la table commune) ; barres l5b ; q2b et le « + » vers Comparer ; picto « épicé » f1.
- L26 : préfixer les classes propres à l'écran ; aucun `String.replace` avec une chaîne qui contient `$`.

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier. Lancer chaque `CHECK:` depuis la racine du dépôt.

## Rendre
`RESULTAT.md` :
- ce qui est fait ;
- les captures ouvertes (nommées) ;
- les écarts aux nombres de q2b et leur cause ;
- les besoins dans le socle ;
- `LEÇON PROPOSÉE : …` s'il y a lieu.

Réponse finale au pilote : une ligne.

## Reprise D105 (23.10, soir) : q2b tel qu'il l'a choisi

Le brasseur : « Je confirme que "Bière" et "Suggérer" divergent nettement du design choisi. Oui c'est quoi ce
bordel ??? ». Sur la capture de q2b : « Ça oui, c'est effectivement l'un de mes choix ». La faute est au pilote : la
carte (`fils22-carte/suggerer`) et la règle « un facteur libre » ont pris le pas sur q2b. **La carte n'est pas une
base** : elle ne donne que les ponts.

Ce que tu reprends, tel qu'il l'a vu (`fils15-s5-complexe/captures/q2b-b-390.png`, et `fils18-baseline/captures/l8b-haut-390.png`
pour la disposition l8 qu'il aime), avec le moteur en direct. Inventaire :
`work/refonte-frontend/v4/ecran-1/fils15-s5-complexe/donnees/inventaire-q2b.json` (12 éléments).
- En tête : les onglets (`Onglets` commun, actif="suggerer"), puis Au style / Absolu et Barres / Radar.
- Les trois cartes d'objectif de la dégustation, avec leur verdict en un mot : « Aucune voie houblon · Hors houblon › »,
  « Approche », « Atteint ». La piste l5b est dans la carte (D92).
- **Les voies du moteur, groupées par effet** (« = même effet sur tes objectifs · 10 g · 10′ ») :
  - ajouter ;
  - **assembler 5 + 5 g** ;
  - **remplacer Nugget à 60′** (dose à IBU égal).
  Elles viennent de `proposer(recette, direction)`, nouvelle fonction de l'adaptateur (`src/moteur/index.ts`), qui
  appelle `proposeVoies` du moteur. Mesuré sur le cas : 14 voies, 128 ms à froid, mémoïsé. Ce sont déjà celles de
  q2b : Golding, Motueka, Aurum, East Kent Goldings, Columbus, Motueka + Citra cryo, Citra cryo, Motueka + Nelson
  Sauvin.
- Chaque voie a sa ligne : nom, usage en mot (D90), stock en icône, familles en pictos avec l'intensité (D80). Elle a
  son « + » ou son ✓ (D78), branché sur la liste de comparaison du socle (`useComparaison`, `basculerComparaison`).
- En bas, la barre « Comparer (n) » ouvre Comparer avec la liste.
- La bande « ‹ visée | visée » est écartée : sa raison est son mot « Ça c'est inutile » (D91).
- La règle « un facteur libre » (L10) vaut pour les réglages de l'écran. Les voies proposées par le moteur (moment et
  dose compris) sont des propositions, pas des réglages libres. `controle-une-question` doit rester vert (un groupe
  libre : le choix du houblon).
- NOTE : une section « ## Reprise », une ligne par élément de l'inventaire, et le marqueur `data-element` à l'écran
  (en-tête de `controle-reprise.mjs`).
- Te juger côte à côte : ta capture à 390 à côté de q2b-b-390.png. Il doit reconnaître son écran.
