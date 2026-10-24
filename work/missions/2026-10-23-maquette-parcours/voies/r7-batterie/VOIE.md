# Voie r7-batterie — la maquette commune après les six reprises : la batterie entière au vert

- Mission : 2026-10-23-maquette-parcours ; contrat commun des reprises : `../REPRISE-D124.md`
- Agent : concepteur
- Modèle : opus
- Niveau : conception (corrections sur les écrans qu'il verra)
- Plafond : 120 tours ; 3 essais par critère
- Dépend de : r1 à r6
- Décideur en cas de doute : pilote ; aucune question bloquante

## Objectif
Les six reprises D124 passent chacune leurs critères dans leur sortie. Construite ensemble (`prototypes/houblons-v4/maquettes/parcours`),
la batterie (`node prototypes/houblons-v4/parcours/outils/batterie.mjs`) rend **BATTERIE ECHEC 23/31** :
- `controle-commun … dryhopper` et `… levure` : FICHE ECHEC (l'appui long ou la fiche sur ces outils ; `ecrans/fiche/gestes.ts` a
  changé avec r1, `ecrans/dryhopper/fiche-sur-outil.tsx` l'emploie) ;
- `mots-premier-ecran … ma-biere --max=30 --sans-coquille --sans-donnees` : MOTS ECHEC (l'étape rendue de sa base a plus de mots ;
  la règle de la mission : les mots de l'étape au plus ceux de sa base + 6, hors en-tête de l'app ; mesure sa base et décide si le
  seuil de 30 de la batterie est à réécrire, preuve à l'appui, ou si l'étape a trop de mots) ;
- `controle-rail … ma-biere dryhopper --parcours` : RAIL ECHEC 1 problème ;
- `controle-retour` (routes et défaut) : RETOUR ECHEC, 1 manque ;
- `jouer-parcours --ponts` : « Comparer sans Idaho 7 : #/comparer?h=motueka,nelson-sauvin » ; `parcours-complet` : PARCOURS ECHEC (2).
  Décision du pilote : Suggérer reste q2b (ses propositions : Motueka, Nelson Sauvin) ; la question de Comparer reste la sienne,
  « Lequel pour ma stout : Cascade, Idaho 7 ou Galaxy ? » (20.10). Le parcours : depuis Suggérer, « Comparer (n) » ouvre Comparer
  avec les houblons cochés **et** ceux de sa question (Cascade, Idaho 7, Galaxy) si Comparer les tient déjà, ou bien le parcours
  ajoute Idaho 7 par le « + » de Comparer (colonne +), puis « Placer Idaho 7 › ». Choisis la lecture qui ne change rien à q2b ni à
  r6a, écris-la (`DÉCISION :`), et aligne `prototypes/houblons-v4/parcours/outils/parcours-complet.mjs` et `jouer-parcours.mjs`.

Rejoue d'abord la batterie, lis le détail de chaque échec, corrige à la source (l'écran, ou le script s'il teste une chose que ses
choix ont changée : preuve écrite), sans rien perdre de ce que r1 à r6 ont rendu : après chaque correction, rejoue aussi
`controle-etats.mjs prototypes/houblons-v4/maquettes/parcours` (tous les écrans), `controle-fonctions-rail.mjs`, `controle-geste-etape.mjs
--froid` et `controle-choix.mjs` sur la construction commune.

## Possède
- `prototypes/houblons-v4/parcours/src/**` (toutes les reprises sont rendues : tu es seul sur le code de la maquette)
- `prototypes/houblons-v4/parcours/outils/parcours-complet.mjs`, `…/jouer-parcours.mjs`, `…/batterie.mjs` (le seuil de mots
  seulement, avec sa preuve)
- `prototypes/houblons-v4/maquettes/parcours/**`
- `work/missions/2026-10-23-maquette-parcours/voies/r7-batterie/RESULTAT.md`

## Critères
Dans `GATES.md`. Réponse finale : une ligne.
