# Onglet « effet sur mes finances » à la saisie — dossier de conception v0 (10.11)

Lu par les concepteurs à la place des sources. Pilote : Opus. Aucun code de l'app ; pages statiques seulement.

## Sa demande, mot pour mot (10.11)
« Quand j'entre une facture ou encaisse, je veux un Tab en bas, qui me montrer le changement dans mes finances type un peu
comme Lignes serrées / v6a / v5a à − 12 % ; « ✓ Payé » reste à 24 px, le minimum. / Mini maquettes / Avec les graph sans
les items et opération, c'est clair ? »

**Lecture du pilote** : pendant la saisie d'une dépense (écran Nouvelle dépense) ou d'un encaissement (Caisse de vente,
bouton « Encaisser … CHF »), un onglet en bas de l'écran, qu'il ouvre lui-même, montre l'effet de cette pièce sur ses
finances, avant → après. Forme : le graphe de v6a (piles du mois + rangée payé · à payer · dépensé), **sans** la liste des
catégories, des articles ni des opérations. La question de l'outil : **« qu'est-ce que cette pièce change à mon mois ? »**

## Les lectures possibles = axes de variantes (aucune n'est un contrôle bloquant, L13/D144)
1. **Forme de l'onglet** : poignée fine au-dessus du bouton d'enregistrement, qui monte en feuille ; onglet segmenté en bas
   (« Saisie | Finances ») ; ligne-résumé toujours visible (« Brassage +58,40 ») qui s'étire au toucher ; feuille mi-hauteur.
   Au repos il est **fermé ou réduit** : c'est lui qui l'ouvre (« un Tab »).
2. **Comment l'avant → après se voit** : la pièce posée sur sa pile en segment distinct (surligné, contour, lueur) ; une pile
   fantôme « avant » derrière la pile « après » ; deux graphes côte à côte avant | après (comme l'état v6a « Après ✓ Payé ») ;
   une bascule avant/après au doigt ; des pastilles d'écart (+58,40) sur la rangée payé · à payer · dépensé.
3. **Quels graphes** : les piles du mois seules (lecture étroite, sa référence) ; piles + le solde prévu (l'escalier des
   Prévisions de l'app sait déjà dessiner une sortie « fantôme ») ; piles + une jauge du solde.
4. **Payée ou à payer** : la pièce tombe pleine (payée) ou hachurée (à payer) ; un « ✓ Payé » de 24 px dans l'onglet bascule
   l'un vers l'autre et le graphe suit (greffe possible de v6a).
5. **Dépense ou encaissement** : même onglet ; l'encaissement fait monter la pile Ventes (+) ; une facture QR non encore
   payée reste hachurée « à encaisser ».

## La référence : v6a « Lignes serrées » (choisie « Bien », Finances › Opérations)
- Source HTML à reprendre (graphe, couleurs, typo, chiffres mono) :
  `C:/Users/mrspa/Documents/Brasserie/.claude/worktrees/jolly-mahavira-cc0cc2/work/missions/2026-11-09-compta-prix/p4/v6a/etat.html`
  (lecture seule, ne rien y écrire) et sa NOTE.md à côté.
- Captures : `…/jolly-mahavira-cc0cc2/work/refonte-frontend/v4/outils/pages/2026-11-09-compta-prix-p4/img/v6a-page.png`,
  `v6a-haut.png`, `v6a-etat.png` (l'état « Après ✓ Payé sur le loyer » : le même graphe, après le geste — c'est le plus proche
  de sa demande).
- Ce qu'il en garde (sa phrase) : la forme serrée de v6a (v5a à −12 %), et **« ✓ Payé » à 24 px, le minimum** : toute cible
  de geste dans l'onglet fait 24 px de haut au moins, jamais moins.
- Graphe v6a : une pile par catégorie (Ventes à gauche, en vert, signe +, séparée par un pointillé ; puis Fixes, Brassage,
  Nettoyage ; Matériel à part après un pointillé). Partie payée pleine, à payer hachurée. Montant mono au-dessus de chaque pile,
  nom court dessous. Rangée sous le graphe : `payé 325,40 · [hachure] à payer 400,00 · dépensé 696,80`. Fond crème arrondi.

## L'app (la base sous l'onglet)
- Captures de l'app actuelle (déployée) : `work/missions/2026-11-10-onglet-finances/captures/` et son INDEX.md (Nouvelle
  dépense, Caisse, Opérations, Prévisions ; 390 et 1280). L'écran de saisie se dessine **tel qu'il est** derrière l'onglet,
  simplifié au besoin (estompé), jamais réinventé : l'onglet est le seul sujet.
- Données que l'app calcule déjà (n'invente aucune autre grandeur) : `PeriodeSynthese` du mois — `entreCents` (ventes),
  `entreAEncaisserCents`, `postes[{categorie, cents, aPayerCents}]`, `materielCents` — et les lignes payé, à payer, dépensé ;
  côté Prévisions, le solde projeté jour par jour (escalier) avec une sortie « fantôme ». Catégories courtes : Ventes, Fixes,
  Brassage, Nettoyage, Autres, Matériel, Travaux, Apports.

## Fixtures « ZZ » (simulées, les mêmes pour tout le lot)
- Le mois (= v6a, novembre) **avant** : Ventes +720,00 ; Fixes 468,00 dont 400,00 à payer (hachuré) ; Brassage 186,80 ;
  Nettoyage 42,00 ; Matériel à part 28,60 ; payé 325,40 · à payer 400,00 · dépensé 696,80.
- **Dépense** en saisie : « ZZ Malt Pilsner 25 kg » · Comptoir du brasseur · Brassage · 58,40 · payée aujourd'hui.
  Après : Brassage 245,20 ; payé 383,80 · à payer 400,00 · dépensé 755,20. (Si à payer : Brassage 245,20 dont 58,40 hachuré ;
  payé 325,40 · à payer 458,40 · dépensé 755,20.)
- **Encaissement** : « ZZ Vente caisse · 12 × 33 cl » · 54,00 · encaissé. Après : Ventes +774,00 (rien d'autre ne bouge).
- Solde (si une variante le montre) : aujourd'hui 4 210,00 → 4 151,60 après la dépense ; 4 264,00 après l'encaissement.
  Ces chiffres sont des fixtures : la page le dit en petit (« exemple »).

## Obligatoire, et rien d'autre
- **La baseline v6a** comme vocabulaire : piles et leurs couleurs de catégorie, hachure « à payer », chiffres mono, rangée
  payé · à payer · dépensé. Plancher à enrichir (L07), pas un gabarit : chaque concept a sa composition.
- **Sans les items ni les opérations** : aucune liste de lignes, d'articles ni d'opérations dans l'onglet. Le seul texte : noms
  courts des piles, montants, et au plus un titre de 6 mots.
- Honnêteté : seulement les grandeurs ci-dessus ; un écart affiché = après − avant, exact au centime.
- Au doigt à 390 px : cibles ≥ 24 px de haut (sa règle) ; l'onglet fermé ne cache ni le total ni le bouton d'enregistrement ;
  ouvert, il laisse voir que l'on est toujours dans la saisie.
- Peu de texte au premier plan ([[pas-de-cockpit]]) ; représentation moderne (feuilles et poignées des normes actuelles).
- Deux thèmes par jetons sur `:root` (clair et cave sombre, `prefers-color-scheme` et `[data-theme]`) ; mise en page qui tient
  à 1280 (l'onglet devient un panneau latéral ou reste en bas, au choix argumenté).
- Interdits : pas de bibliothèque externe, pas d'image distante, polices système ou celles de v6a ; classes préfixées par
  l'identifiant de la variante (L26) ; script dans une fonction immédiate.

## Indicatif
- DESIGN.md : « Deux régimes » (l. 437), « Dimensions compactes » (l. 501), « Cibles » (l. 531), « palette des catégories
  financières » (l. 358). docs/ui-compacte.md pour les contrôles.
- Le brasseur aime : la réponse d'abord, un geste pour le détail, des représentations à la place des phrases.
