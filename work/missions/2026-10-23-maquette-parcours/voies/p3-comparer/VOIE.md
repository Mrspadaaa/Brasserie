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

## Reprise D107 (23.10, soir) — comparer aux étapes, à la manière de x3b, avec une référence

Agent : concepteur (Opus), plafond 120 tours. Dépend de : p9-controle-etapes (le contrôle ; il s'écrit en même temps,
contre le même contrat de marqueurs, recopié plus bas). Cette section prime sur les consignes ci-dessus là où elles
diffèrent (le moment fixé « après, 3 j » de la consigne 1 tombe).

### Ses mots, mot pour mot
- Sur la maquette publiée : « Ah mais comparé est que le dryhopping ??? C'est pas ce que je voulais je voulais comparé
  au moins : les étapes 60' 10' dryhopping ect comme la maquette de base. Et aussi le houblon de base ou bière de base.
  Est-ce que cela est clair ? »
- Puis, sur le Comparer de la base v4.10, barré : « Non pas cette version, une version du dryhopping, dans un des top.
  Montrait vraiment l'état du moment de l'ajout facile, je l'avais juste fait noté !! »
- Sa note du 20.10 sur cette version, **x3b** (lot 21, une des 5 meilleures) : « La x3b est aussi interessant mais dur à
  lire. mais ça peut être interessant de l'utiliser jsute pour de la comparaison entre ma bière de base -> 1 dry hop,
  2 dry hop: levure ».
- SPEC-BRASSEUR § 1, « Comparer aux étapes, avec une référence » ; DEFAUTS-RECURRENTS, D107.

### Ce qu'il veut
1. **La forme reste r6a** (règle n° 1) : titre en question, ligne de contexte, radar r2, une colonne par houblon avec
   ses têtes, la colonne « Ta stout », les rangées par famille, Chimie et vraies valeurs, panel OSU, « Placer ».
2. **Les étapes, ensemble** : chaque houblon comparé à 60′, 10′ et au dry hop au moins (whirlpool, dry hop actif et
   après si la place le permet), à dose égale (4 g/L, comme r6a), calculés en direct par le moteur :
   `comparer(recette, cles, { quand })` de `src/moteur` accepte un moment (le moteur simule l'arôme à 60′, 10′,
   whirlpool, dry hop actif et après ; l'IBU à toute minute par `ibuAjout`). Les étapes se montrent **ensemble, au
   repos** ; ce n'est pas un second curseur ni un sélecteur : le houblon reste le seul facteur libre (L10,
   `controle-une-question` doit rendre « 1 groupe libre : houblon »).
3. **À la manière de x3b** : l'état de la bière au moment de chaque ajout, lisible d'un coup d'œil. Dans x3b, la bière
   de base est en pointillé et chaque famille monte à l'étape où le houblon entre (bandes en marches, « J4 ~ dans la
   cuve »). Ici l'axe va des étapes du brassin (60′ → 10′ → whirlpool → dry hop) au lieu des jours. Sa réserve sur x3b :
   « dur à lire » : prendre l'idée (le pointillé de la bière de base, la marche à l'étape), pas sa densité.
4. **Une référence aux mêmes étapes** : la bière de base (ta stout, le pointillé de x3b ; r6a a déjà sa colonne) ou
   le houblon de base de la recette (Nugget). Elle porte ses valeurs aux mêmes étapes.
5. Ce qui n'y entre pas : le Comparer de la base v4.10 (barré : « Non pas cette version »), la dose équivalente, le
   remplacement (c'est Substituer), la levure comme facteur (c'est Levure ; « 2 dry hop: levure » se lit comme la suite
   de la frise, pas comme un sélecteur ici).

### Contrat de marqueurs (le même que la voie p9 ; ne pas l'élargir sans le dire au pilote)
Page `<dossier>/comparer/etat.html`, au repos (aucun toucher), à 390 × 844 tactile et à 1280 × 800 :
- chaque houblon comparé : `[data-houblon-compare="<clé>"]` (clé du moteur) ;
- valeur à une étape : `[data-etape="<code>"][data-houblon="<clé>"]`, codes `b60`, `b10`, `b5`, `wp`, `dryActive`,
  `dryPost` ; texte : un nombre (« ~ » devant s'il est simulé) ou « ? » ; un `[data-inconnu]` ne montre jamais « 0 » ;
- exigé pour chaque houblon comparé et pour la référence : `b60`, `b10`, et `dryActive` ou `dryPost` ;
- visibles ensemble : non cachées, non couvertes (le dock « Placer » ne les couvre pas), dans la largeur, et toutes
  dans **un seul écran** (écart vertical entre la plus haute et la plus basse ≤ 844 au téléphone, ≤ 800 à l'ordinateur) ;
- le texte visible nomme « 60′ », « 10′ » et « dry hop » (ou « à froid ») ;
- la référence : `[data-reference="biere"]`, ou `[data-reference="houblon"][data-houblon="<clé d'un houblon de la
  recette>"]`, visible au repos, avec ses `[data-etape]` aux mêmes étapes (dedans, ou `data-houblon` = sa clé).

### Garder
- Les marqueurs du parcours : `[role="radio"][data-col="<clé>"]` par colonne, `svg[data-radar] [data-serie]`,
  `[data-role="pont-…"]`, `data-ecran="comparer"`, `data-element`, `data-acquis` ; « Placer <retenu> » ouvre Dryhopper.
- L'inventaire `inventaire-comparer.json` a maintenant 52 éléments : trois nouveaux, `d107-etapes`,
  `d107-etat-au-moment`, `d107-reference` (variante x3b). La NOTE (`## Reprise`) les classe ; ils sont **repris**, pas
  écartés. Revoir aussi `x3b-cuve-jour-apres-jour` (classé « en pont » : son idée entre maintenant dans Comparer).
- Les exigences transversales ci-dessus (au style, inconnu ≠ 0, « ~ », 80 mots au premier écran, légendes derrière « ? »).

### Entrées en plus
- x3b : `work/refonte-frontend/v4/ecran-1/fils21-choisir/captures/x3b-390.png`, `x3b-plans-390.png`, `x3b-haut-390.png`,
  `x3b-geste-1-tenir.png` ; son générateur `work/refonte-frontend/v4/ecran-1/fils21-choisir/x3b/generateur-x3b.mjs`.
- r6a : `work/refonte-frontend/v4/ecran-1/fils22-comparer/captures/r6a-premier-ecran.png`.
- La version rejetée (construction d332792c, publiée) : `prototypes/houblons-v4/maquettes/parcours-d332792c/comparer/etat.html`.
- Le registre : `work/refonte-frontend/v4/choix/ecrans.json` (écran comparer, ses « complements »).

### Possède en plus
- Dans `prototypes/houblons-v4/parcours/outils/parcours-complet.mjs`, les seules étapes de Comparer, si un marqueur
  qu'elles lisent change (dire lequel dans RESULTAT.md). Rien d'autre hors de `src/ecrans/comparer/**`, de la sortie
  `maquettes/parcours-p3/` et de RESULTAT.md. Un besoin dans `src/moteur` se demande au pilote.

### Se juger
Captures à 390 puis à 1280, ouvertes en image (L12), **côte à côte avec r6a et avec x3b** (règle n° 1) : il doit
retrouver r6a, avec les étapes lisibles comme dans x3b. Dans RESULTAT.md, une section `## Reprise D107` : ce qui est
fait, les captures ouvertes (nommées), les nombres aux étapes pour Idaho 7 et Cascade (floral et IBU à 60′, 10′, dry
hop), ce qui reste au brasseur.
