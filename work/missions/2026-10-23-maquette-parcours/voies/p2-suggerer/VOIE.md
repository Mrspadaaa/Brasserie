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
