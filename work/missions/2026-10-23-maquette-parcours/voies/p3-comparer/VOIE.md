# Voie p3-comparer — Comparer (r6a, avec les petites améliorations des autres), jouable

- Mission : 2026-10-23-maquette-parcours (lire `../../MISSION.md` d'abord)
- Agent : concepteur
- Modèle : opus
- Niveau : conception
- Plafond : 120 tours ; 3 essais par critère
- Dépend de : p0-socle (le socle, son `ARCHITECTURE.md` et son « ## Contrat d'un écran »)
- Décideur en cas de doute : brasseur, par ses mots et ses choix connus ; aucune question bloquante (option
  prudente, écrite dans la NOTE)

## Objectif
L'écran Comparer de la maquette jouable : « Cascade, Idaho 7 ou Galaxy pour ma stout ? ». C'est **r6a**, son choix
redit le 23.10 : « r6a reste le meilleur, tu peux ajouter ça, dans la vue interactive. Avec les quelques petites
améliorations des autres versions ».
- r6a est portée en React dans le socle, calculée en direct.
- On lui ajoute les petites améliorations de r6n1, r6n2 et r6p1 à r6p4, sans changer ce qui fait r6a.
- Les houblons viennent de Suggérer ou de l'adresse.
- « Placer <gagnant> » ouvre Dryhopper avec ce houblon en brouillon.

## Entrées
- `prototypes/houblons-v4/parcours/ARCHITECTURE.md` : le contrat d'un écran, les crochets, l'adaptateur du moteur
  (« comparer N houblons à dose, moment et levure fixés »), les composants communs.
- `work/refonte-frontend/v4/ecran-1/fils22-comparer/r6a/` : `etat.html` (la page à porter), `NOTE.md` (ses choix :
  radar r2, dose égale, pas de porte, descripteurs A), `generer.mjs` (d'où viennent ses nombres). Ses captures
  (`fils22-comparer/captures/r6a-*.png`) sont à ouvrir d'abord.
- Les autres versions, d'où viennent les petites améliorations : `fils22-comparer/r6n1/`, `r6n2/`, `r6p1/` à
  `r6p4/` (NOTE.md et captures `captures/r6n*-*.png`, `captures/r6p*-*.png`) ; `fils22-comparer/BRIEF-R6P.md`.
- `work/refonte-frontend/v4/ecran-1/fils22-comparer/donnees/elements-notes.json` : les 37 éléments qu'il a notés
  ailleurs.
- `cerveau/produit/acquis-valides.md` ; `DESIGN.md`, `docs/ui-compacte.md`, `.claude/rules/affinee-frontend.md`.
- Les en-têtes des contrôles de tes GATES (`work/refonte-frontend/v4/tournoi/outils/<contrôle>.mjs`).

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `prototypes/houblons-v4/parcours/src/ecrans/comparer/**`
- sortie de construction : `prototypes/houblons-v4/maquettes/parcours-p3/` (ignorée par git)
- `work/missions/2026-10-23-maquette-parcours/voies/p3-comparer/RESULTAT.md`
- Un besoin dans le socle se demande au pilote dans RESULTAT.md. Ne pas écrire dans `src/commun/`, `src/etat/` ni
  `src/moteur/`.

## Consignes
1. **r6a d'abord**. Son premier écran reste le sien :
   - les trois colonnes côte à côte, plus la colonne « Ta stout » et sa dégustation ;
   - les rangées de barres l5b par famille ;
   - le radar r2 ;
   - l'α et le rôle en tête de colonne ;
   - la réponse face à ta stout.
   Un seul facteur libre : le houblon. Un toucher sur une colonne la retient.
2. **Les petites améliorations des autres versions** : celles qui ne changent pas la forme de r6a.
   - Exemples à juger sur captures :
     - le radar qui ne sature plus (flèche au bout de l'axe), de r6n1 et r6n2 ;
     - le « + » pour une 4ᵉ colonne (p4) ;
     - la ligne de réponse « Idaho 7 devant Cascade, ~0,4 cran » de r6n2 ;
     - « contre ★ » chiffré, de r6p2 ;
     - les deux pistes du défi, de r6p3 ;
     - « on gagne / on paie », de r6p4 ;
     - la fiche avec une vraie valeur sourcée, de r6p1 ;
     - les corrections du critique relevées dans les NOTE.
   - Prendre peu, et le meilleur. Ce qui chargerait le premier écran va derrière un toucher (un dock sous le pouce,
     comme r6n2), ou n'est pas pris.
   - Chaque amélioration prise est nommée dans la NOTE avec sa version d'origine (`## Idées reprises`), et chaque
     amélioration laissée de côté aussi, avec sa raison.
3. **Calcul en direct** : les nombres viennent de l'adaptateur à chaque changement de houblons, pas d'une grille
   figée. Ils doivent rejoindre ceux de r6a pour Cascade, Idaho 7 et Galaxy, aux arrondis près. Les écarts et leur
   cause vont dans la NOTE.
4. **Défaut connu de r6a, à corriger** : D95 (`controle-simulation`, S2), rouge sur r6a le 23.10. Aucun réglage
   (`data-role="reglage"`) ne fait bouger le simulé. Par exemple, la dose, le défi ou « Égaler » changent une
   valeur simulée visible ; une vraie valeur (`data-nature="mesure"`) se tient à côté.
5. **Ponts** :
   - « Placer <gagnant> » → Dryhopper, avec le houblon retenu en brouillon dans l'état ;
   - Substituer arrive ici avec un houblon épinglé en colonne 1 (route `#/comparer?…&pin=`) ; c'est à prévoir
     avec la voie p1, par l'état ;
   - l'appui long sur un nom ouvre la fiche, composant de la voie p1 importé de `src/ecrans/fiche/`. S'il n'est pas
     encore là, le signaler dans RESULTAT.md.
6. **Reprise (D104)** : la NOTE a une section `## Reprise`, une ligne par élément de `elements-notes.json` : repris,
   en contexte, en pont, ou écarté avec sa raison (par exemple « écarté : r6a gardée sobre, son choix du 23.10 »). Les
   éléments repris portent leur marqueur `data-element` à l'écran, et les acquis leur `data-acquis` (comme r6a et
   r6n2).
7. `jeu.mjs` : retenir une colonne, ajouter une 4ᵉ par « + », changer un réglage qui fait bouger le simulé ;
   « Placer » ouvre Dryhopper avec le bon houblon.
8. NOTE.md : `## Base`, `## Idées reprises`, `## Écarts`, `## Pour l'app`, `## Reprise`.
9. Te juger sur tes captures à 390 puis à 1280 px, ouvertes en image (L12), à côté de celles de r6a : le brasseur
   doit retrouver l'écran qu'il préfère, à peine amélioré.

## Exigences transversales et acquis (recopiés, leçons L05 et L06)
- Au style, l'absolu en option ; inconnu ≠ 0 ; simulé marqué « ~ » ; 80 mots au plus au premier écran ; légendes
  derrière « ? » ; stock en icône seule.
- Comparer variante 3 (barres et radar), avec l'intervalle de confiance et le style ; panel OSU de y3 ; manière de
  w2 ; vraies valeurs de v1 ; radar m4 et h4 sans légende écrite ; code couleur des arômes ; picto « épicé » f1.
- L26 : préfixer les classes propres à l'écran ; aucun `String.replace` avec une chaîne qui contient `$`.

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier. Lancer chaque `CHECK:` depuis la racine du dépôt.

## Rendre
`RESULTAT.md` :
- ce qui est fait ;
- les captures ouvertes (nommées) ;
- les améliorations prises et laissées, avec leur version d'origine ;
- les écarts aux nombres de r6a et leur cause ;
- les besoins dans le socle ;
- `LEÇON PROPOSÉE : …` s'il y a lieu.

Réponse finale au pilote : une ligne.
