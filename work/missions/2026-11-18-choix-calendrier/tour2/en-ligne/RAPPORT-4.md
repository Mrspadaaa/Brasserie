# Test en ligne, passe 4 : 20.11, https://brasserie-l-affinee.web.app/ (tag en-ligne/2026-11-19-tour3, d95d69dfc, assets/index-DBAkqtjg.js)

Objet : rejouer en ligne chaque défaut passé « corrigé » ou « déployé » au registre depuis le tag tour2 (176 lignes, dont 175 avec un commit ancêtre du tag tour3 ; BE-66 a son commit 341363c8 hors du tag).

Méthode : même banc que la passe 3 (Claude in Chrome, session du brasseur, rien saisi ; iframe `srcdoc` de même origine servie depuis `/brew-alerts-sw.js`, taille changée sans recharger, thème par `localStorage['laffinee.theme']`). Clics réels par coordonnées (souris), saisies réelles au clavier ; captures regardées en zoom. Vérifié au chargement : le paquet servi est `index-DBAkqtjg.js`.

Limites du banc : pas de toucher émulé ; plein écran refusé dans la page pilotée ; une autre session créait en même temps ses propres « ZZ TEST » (achat « nom long », fête, loyer) : non touchés, sauf le lien de mon achat vers leur fête. Une feuille « Quand ajouter Cascade ? » n'a fermé ni par Annuler ni par × après un clic script sur l'onglet Paliers ; rechargée, le brouillon a repris : doute de banc, non compté.

## Couverture

| Écran | 390 clair | 390 sombre | 844×340 clair | 844×340 sombre | 1280 clair | 1280 sombre |
|---|---|---|---|---|---|---|
| Calendrier : frise, axe, chiffre clé, retards, menu période, Liste, Sans date | joué | joué | joué | joué | joué | joué |
| Calendrier : achat ZZ (poser, Plus de détails, Lier, glisser Semaine et Mois, annuler) | joué | — | — | — | — | — |
| Calendrier : menu + | joué | — | joué | — | — | — |
| Stocks : Courses, Houblons, Articles, ⌘K | joué | joué (Courses) | joué (Courses) | joué (Courses) | joué (Houblons) | — |
| Recette : fiche Milk Stout (lecture) | joué | — | — | — | — | — |
| Recette : éditeur (brouillon ZZ) Identité, Malts, Houblons, Paliers, Eau, Récap. | joué | — | joué (Identité) | — | joué (nom) | — |
| Brassins : liste, Volumes, Mesures (lecture) | joué | — | — | — | — | — |
| Vendre (panier sans encaisser) | joué | — | — | — | — | — |

## Combien et quels problèmes ? 13 (9 défauts « corrigés » encore faux, 4 neufs)

1. T3B-1 (PC-4) : Calendrier 844×340, menu + : « Vente » et « Fête » sont coupés en haut de l'écran (haut à −25 px, bas à 15 px), sans défilement : à moitié hors écran.
2. T3B-2 (PC-62) : Calendrier 844×340, Liste, au repos (clair et sombre) : le + cache le montant « −5 » de Hefe et mord « −13 » de Ssr. À 390, rien n'est caché.
3. T3B-3 (PC-63) : Calendrier 390, 6 sem. : une étiquette d'achat longue se coupe en deux lignes (« ZZ TEST — passe » / « 4 achat −7 » posé en S49 ; « ZZ TEST — achat calendrier » / « en ligne nom long −12 ») alors que la place à droite est libre jusqu'au bord.
4. T3B-4 (TE-52) : Stocks › Houblons › Sources (390) : 17 boutons techniques à plat, dont « Ajouter HopDatabase », « Ajouter hops-json », « Ajouter Beer Maverick », « Enregistrer le modèle expérimental modifiable », « Lire la synthèse de recherche sur la fermentation » : renommés, toujours un cockpit de jargon.
5. T3B-5 (TE-49) : fiche Nelson Sauvin (390) : « Forme non précisée » est parti, mais le premier plan dit « Familles déclarées sur houblon brut », « Descripteurs de la fiche (langue source) : White wine, fruity, grape, gooseberry », « Classe thiols Hopsteiner : forte », « Référence variété · Confiance faible ».
6. T3B-6 (TL-27) : fiche Milk Stout › Simuler › Viser des IBU : « À compléter pour calculer : durée d'ébullition de la recette » alors que la même fiche affiche « Ébullition 60′ ». Le « Calcul incomplet » n'est plus répété par houblon.
7. T3B-7 (TE-15) : éditeur, Identité, NOLO allumé (390) : 3 champs (Procédé, Consigne d'alcool, Levure), mais 7 dépliants et un « Appliquer à la recette » grisé s'ouvrent au premier plan.
8. T3B-8 (MV-8) : éditeur, Malts/sucres : « coriandre » propose « Créer « coriandre » · grain : à l'empâtage ». (« miel » et « Dextrose » vont bien en sucre à l'ébullition.)
9. T3B-9 (BR-19) : éditeur, Malts/sucres : la famille reste une bascule « Grain ⇄ ••••• » : 5 points, aucun nom des autres valeurs avant de toucher.
10. T3B-10 (neuf) : Finances › Prévisions (390, ouvert depuis « Ouvrir dans Finances » d'un achat) : la bulle « TEST −9, 25.12 » est posée sur l'étiquette « −703,68 », illisible.
11. T3B-11 (neuf) : recette Milk Stout : la feuille dit « Milk Stout · 30 L · brassée 1 fois » et la liste Brassins montre LOT-001 Milk Stout (J+203), mais la fiche dit « Brassins : aucun brassin ».
12. T3B-12 (neuf) : fiche Milk Stout : Lactose 300 g et Whirlfloc 1 g sont rangés sous Houblons (« α ? », amérisant / aromatique) ; l'IBU affiche « — » (« ajouts de houblon à vérifier ») alors que Target 35 g α 11,3 et East Kent Goldings 20 g α 5,5 sont posés à 60′. Noms de malts abîmés dans la même recette : « Rstgerste (orge torrfie) », « Caramnch Typ 2 ».
13. T3B-13 (neuf) : Vendre (390) : la tuile « 75 cl » affiche « 569,50 CHF » pour une bouteille (à côté de « 33 cl · 3,00 CHF »).

Réserve (T3B-NOTE-1) : non rejoués, voir plus bas ; T3-12, BR-117 et BE-88 lus au code seulement.

## Défauts « corrigés » rejoués et justes (passent « vérifié »)

- Calendrier (390, 844, 1280, clair et sombre) : PC-2 (aucun « J0 / 0 »), PC-5 (paysage : quatre brassins visibles), PC-7, PC-8, PC-9, PC-10 (1280 : trois mouvements nommés, aucun répété), PC-11, PC-13 et PC-79 (rien sous le + au repos ni en fin de défilement, 390, 844 et 1280), PC-12 (« Poser un brassin S47 · prête le 18 déc. »), PC-18 (An : mois sur une ligne), PC-21 (« Le creux de S47 : ses causes », sources, Solde et réglages), PC-22 et PC-135 (toucher S50 : « S50 7–13 déc. · toucher pour replier », jours L…D), PC-25 et PC-60 (retards datés, sans montant), PC-35 et PC-142 (Sans date : Poser, Fait, Supprimer), PC-46 et PC-54 (semaines et dates justes : S47 16–22 nov., S37 8 sept., S18 1 mai, S4 30 janv.), PC-47 (« lié à … » tient dans la fiche à 390), PC-51, PC-57 (pas brassée → « En retard »), PC-58, PC-65, PC-66 (prête = aujourd'hui + durée), PC-70 et PC-73 (« S43 ’27 »), PC-74 (paysage : « Idée en S47, dans le carnet »), PC-75 (6 mois à 390 lisible), PC-103 (« +5 estimé · hors courbe »), PC-113 (An : pictos nommés), PC-123, PC-124, PC-127, PC-139 (6 mois et Mois gardés au rechargement), PC-140 (3 mois = S47 à S6), T2-10 (« Période : 16 nov. → 27 déc. », aucun double point).
- Achat ZZ (390) : PC-133 (puces de semaine 28 × 48 px), PC-122 (« Plus de détails » garde libellé et 7,00), PC-53 (rangé dans Achats, pas Papiers), PC-120 (icône d'un jour), PC-141 (« Date 23 nov. »), PC-129 (« Fêtes et activités » en tête de Lier), PC-121 et PC-130 (lié à une fête, « lié à ZZ TEST — fête calendrier », Délier), PC-136 et PC-134 (glissé en Semaine : 23 → 30 nov., +7 j), PC-116 (« à dépenser reste −810 · S48 : −711 → −704 »), PC-137 (glissé en Mois : 30 nov. → 30 déc.), PC-138 et PC-55 (« Achat annulé · S53 : −720 → −713 · Finances › · Annuler », entier ; l'achat quitte la rangée), PC-114 (« Ouvrir dans Finances » mène à Prévisions, pas à un écran vide).
- Stocks : T3-10 (Courses : rien sous le + au repos ni en fin, 390 et 844, deux thèmes), BR-110 (titre « Houblons » à 390 et 1280), BR-75 et BE-95 (un seul nom, « Stocks »), LR1-11 et LR3-8 (aucun « Stk », houblons en g), LR2-NOTE-3 (frappe réelle « 17,50 » dans ⌘K à 390 : l'écriture ZZ est trouvée), LR1-NOTE-5 (Cascade : écriture et article trouvés).
- Recette, fiche Milk Stout : TE-12 et PD-8 (FG 1,018 · ABV 5,8 % cible), PD-9 (ni « SRM » ni point décimal), BR-99 et BE-52 (onglet choisi « Bilan » : 10,3:1), BR-103, BE-56 et TL-31 (le + vit dans la barre « Préparer un brassin »).
- Recette, éditeur (brouillon ZZ) : TL-30 (1280 : nom entier, 528/528 px), T3-10 (« Suivant » et + côte à côte à 390 ; pas de + à 844), TE-14 (« Données manquantes · Compléter les points signalés », le point dit dans « Ajouter les fermentescibles du moût »), BR-11 (plus de Carapils ; « Dextrose » → sucre), MV-7 (« miel » → sucre), TL-26 (Lactose, pastille « Sucre de lait », « ne fermente pas »), TL-17 (parts 96 % + 4 % = 100 %), M-4 (Caramünch 100 % : alerte « Aucun malt de base dans la maische »), SU-NOTE-2 (« 0,2 » Entrée après création → 0,20 kg), TE-29 (« Palier 2 · 67 °C 30 min »), TE-33 (récap « Paliers »), BR-28 (Texte, Relire, Plus libres), BR-89 et BE-13 (« Acide lactique 80 % — à l'empâtage · rien à corriger » lisible).
- Brassins › Volumes : AM-47 (« 30 L ne tiennent pas dans Royal Catering · cuve 45 L · prend 24 L au plus »).
- Vendre : TE-56 (clients en pastilles, bières en tuiles, plus de texte libre).

## Non rejoués (motif)

- Calendrier : PC-1, PC-30, PC-37, PC-76, PC-87 (glisser ou tirer un brassin : aucun brassin ZZ, un brassin réel ne se déplace pas) ; PC-3, PC-31, PC-32, PC-33, PC-91 (menu et détail d'un brassin, mêmes raisons) ; PC-23, PC-27, PC-28, PC-50, PC-92, PC-106 (poignée, lecture le long de la courbe, appui long et mode graph : pas d'appui long au banc) ; PC-26 (plein écran refusé au banc) ; PC-42 et PC-69 (`/?dev-local` : sans objet en ligne) ; PC-6, PC-19, PC-34, PC-38, PC-39, PC-41, PC-43, PC-44, PC-45, PC-48, PC-56 (aucun loyer), PC-59, PC-61, PC-67, PC-68, PC-71, PC-77, PC-89, PC-104, PC-131, PC-132 (cas absents des données ou non atteints dans le temps du banc).
- Carnet : PCN-156 à PCN-180 (lecture IA : aucun envoi IA permis ; PCN-156 « IA éteinte » est l'état voulu).
- Recette : TL-12, BR-4 (les cartes n'affichent plus d'IBU), BR-5 (OG et FG « — » à cause du malt ZZ sans fiche), BR-6 (la dose est un pas −/+, plus de champ texte), BR-67, BE-21 (style froment non posé), BR-98 (liste « Houblon pour ce style » non trouvée : l'outil est un menu), PI-1, AM-33, TE-39.
- Brassins : BR-114, BE-85, BR-115, BE-86 (feuille Mesures d'un brassin réel : saisie enregistrée ; vu seulement la FG bornée 1,000–1,020) ; T3-12, BR-117, BE-88 (aucun brassin ZZ ; au code du tag : « Supprimer ce brassin » passe par SuppressionLiee, sans lien suppression directe avec « Annuler », `src/ui/BatchDetailSheet.tsx:534`, `:755`, `:766`) ; TE-44, RL-13.
- Ventes, clients, finances, dépense : AM-68 (quantité « 1 × 33 cl » oui ; lot non vérifiable, « aucune bière conditionnée »), AM-69 (3,00 déjà rond), AM-66, RL-15, AM-73, BE-66 (commit hors du tag), BR-123, BR-124, LT-6 (lecture IA de pièce).
- Tailles : hors Calendrier, surtout 390 clair ; 1280 sombre des autres écrans non joué.

## Données ZZ TEST

- Dépense prévue « ZZ TEST — passe 4 achat » (7 CHF, Achats, S48) : posée par le + de la rangée Achats, liée à « ZZ TEST — fête calendrier » (d'une autre session), glissée au 30 nov. puis au 30 déc., puis « Annuler l'achat » : elle quitte le calendrier (une prévision annulée peut rester listée « Annulée » dans Prévisions, voir PC-NOTE-22).
- Brouillon « ZZ TEST — Nuage Banane — Hefeweisse passe 4 » (Lactose, Caramünch, « ZZ malt », Cascade, Palier 2, NOLO) : jamais enregistré, abandonné (« Supprimer ce brouillon ? » › Abandonner) ; Recettes 23.
- Panier Vendre (1 × 33 cl) : jamais encaissé, abandonné (« Le panier sera perdu » › fermer).
- Aucune donnée réelle modifiée : fiche Milk Stout, Nelson Sauvin, Mesures de NEIPA Test LOT-002 lues seulement. Aucun envoi IA, aucune suppression définitive. Thème laissé à « clair ». Onglet Chrome fermé.
