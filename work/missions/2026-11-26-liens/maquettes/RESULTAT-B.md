OK — B corrigées : choix neutre, prix livré, dates et heures justes, rappel ✦ remis

## Fichiers
- `maquettes/B-things.html` — B1 « Things 3 » : listes calmes, prochaines actions en tête, une action par ligne.
- `maquettes/B-cockpit.html` — B2 « cockpit de brassage » : 3 instruments, voyants d'état, grands chiffres, échelle de prix, jauge, journal.
- `maquettes/B-decision.html` — B3 « cartes de décision » : une question par carte, options côte à côte, liste classée par ce qui attend.
- Écrans : `?e=1` liste en arbre, `?e=2` écoulement, `?e=2&ia=1` ✦ ouvert, `?e=3` 600 bouteilles, `?e=4` assurance.

## Passe de correction (26.11, CRITIQUE-STYLE.md B1 à B3 et communs)
Communs, dans les trois :
- 600 bouteilles neutre : plus de « Choisir » pré-marqué ni de verdict ; trois boutons égaux (Verallia, Fourn. B, Occasion) sous
  « ✦ Choisir une offre · av. le 15 ». « Qui gagne quoi » : chaque offre gagne sa ligne (moins cher 400 max : Occasion 0,20 ;
  moins cher 1200 min : Verallia 0,42 ; 600 pile livré : B 0,68). Ligne ✦ « Livrée / bt » 0,42 · 0,68 · 0,20, calcul posé
  `(0,55 × 600 + 80) ÷ 600 = 0,68`, « livraison pas notée » pour Verallia et l'occasion. Totaux à quantité dite (504/1200, 410/600, 80/400), plus aucun gagnant.
- « Sous la dalle » reste « pas trouvée » (plus jamais « écartée ») ; compteurs « 1 trouvée · 1 pas trouvée ».
- Soufre : la date de l'IA s'affiche « ✦ 23 nov. passée », en gris, jamais en ambre ; CO2 « ✦ ≈ 1 déc. » (sa note : dans une semaine).
- Heures en heure suisse : 21:18, 21:22, 21:26, 21:31 ; 13:22 et 13:59 le 25.11.
- Rappel ✦ « fin novembre » (tâche IA 30.11, fixture assurance) remis : « dans 4 jours ».
B1 (9 problèmes) : en plus, technicien et « Sentir à nouveau » marqués ✦ ; état visible par ligne (anneau pointillé ambre = cherche,
demi-plein = décide, plein rouge = urgent) avec le mot ; Bar du Centre rangé en Ventes, Levure récoltée en Essais ; boutons
44 px (Fait, Reçu, Garder) ; bas vide comblé par Suivi (événements réels de la fixture) ; ✦ ouvert : suggestion avec ×, texte entier.
B2 (11) : instruments sans coupure au milieu ; liste en arbre (retrait, traits) ; voyant coloré et mot d'état par ligne, urgent
teinté ; « attendu » n'est plus un chiffre de 40 px (Devis « — », attendu en petit) ; suggestions à leur place (option sous les
chiffres, démarche dans la check-list) avec × ; « — CHF » → « coût pas noté » ; tuiles = prix livré (plus de doublon), bandeau
verdict retiré ; jauge d'aujourd'hui au 31.12 avec repère ✦ du rappel ; pièces sans numéro, journal renvoie à « check 01 » ;
plus de majuscules ; « réglé » en vert.
B3 (8) : trois « Choisir » égaux, en bas au pouce ; « gagne 2 » retiré ; urgent avec ses mots (« Technicien ? n° sur
l'autocollant ») ; « ✦ rangés par ce qui attend » dit en tête ; « pas trouvée » ; rappel ✦ ; « Renouveler chez qui » sans cartes
« — CHF » ; pièces en liste à cocher (plus de mots coupés) ; « Tes notes » 4 lignes sur 4 (6 sur 6 pour l'écoulement) ; prochaine
action poussée en bas sur les écrans de détail ; × des suggestions.

## Captures (390 × 844, DPR 2, puppeteer-core sur Chrome 9222, onglet propre fermé, disconnect ; 15, toutes ouvertes)
`maquettes/cap/B-{things,cockpit,decision}-{liste,probleme,probleme-ia,achat,echeance}.png`.
Mesure au rendu : aucun débordement (marge basse 8 à 180 px), aucun texte coupé hors points de suspension voulus.

## Données
- Notes telles quelles : fixtures c79 (écoulement, assurance, soufre, CO2 et les autres) et `cas-fictifs.json`.
- ✦ marque ce que l'IA ajoute : piste « Changer le joint » et « Demander si le joint suffit » (`reponse-reelle-ecoulement.json`),
  prix livré et totaux, tri de l'arbre B3, tâche « Renouveler » et son rappel du 30.11, date « Sentir à nouveau » du 23.11, « ≈ 1 déc. ».
- « demain 7h », « lundi », « avant le 15 » restent comme il les a écrits ; aujourd'hui = 26.11.2026.

## Prédiction
« Là je peux comparer : 0,68 contre 0,42, et c'est moi qui choisis. » B3 reste la plus parlante, B1 n'a plus l'air vide.

## Réserves
- B2 garde un bas vide de 105 à 180 px sur l'écoulement et l'assurance (genre cockpit, peu de données).
- « urgent » de la chaudière et « 3 offres » restent des repères de lecture, pas un état de la fixture (cas fictif sans suivi).

DÉCISION À PRENDRE : aucune
CONNAISSANCE : aucune
LEÇON PROPOSÉE : aucune
