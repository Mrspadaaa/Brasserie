# Test de l'app déployée — 07.11.2026

App : https://brasserie-l-affinee.web.app/ (vraies données, Chrome du brasseur, onglet dédié, fermé à la fin).
Critique : Fable. Thème : sombre (cave) puis clair, bascule par le bouton d'en-tête.

Largeurs : la fenêtre refuse 390 × 844 (Chrome plafonne la fenêtre à 500 px de large, 805 de haut) ; « 390 »
ci-dessous veut dire 500 × 805, tactile. `resize_window` 1280 × 800 répond « OK » mais la fenêtre reste à 500 × 805
(deux essais) : **1280 non vu**. Captures : chaque capture regardée en plein format ; le zoom CDP échoue souvent
(« renderer frozen »), le plein écran a servi de zoom.

## Problèmes (liste numérotée, sans plafond)

Gravité : B = bloquant (nombre faux ou donnée perdue), G = gênant, D = détail.

### Recettes — fiche et assistant

1. **B — L'OG change d'une étape à l'autre de l'assistant.** Mon super stout · v2, 390, sombre et clair : bandeau
   « OG 1,094 » aux étapes Identité, Malts/sucres, Houblons, Paliers, Récap ; « OG 1,085 » à l'étape Levure ; fiche
   « OG 1.085 » ; alerte de l'étape Malts/sucres « À 1.085, le moût sature ». Deux OG pour la même recette, au même
   écran (bandeau 1,094 au-dessus de l'alerte 1.085). Connu pour 1.081/1,080 : ici l'écart est de 9 points.
2. **B — FG de la fiche ≠ FG de l'assistant.** Même recette : fiche « FG 1.024 » ; étape Paliers « FG estimée 1,021 »
   (atténuation retenue 81 %). Ni 1,094 ni 1,085 à 81 % ne donnent 1,021.
3. **B — IBU de la liste ≠ IBU de la fiche.** Liste Recettes « 65 IBU » (Mon super stout · v2), fiche « IBU 57 ·
   65 annoncé » ; NEIPA Test multi-houblons : liste « 35 IBU », fiche « IBU à chaud 24 · 35 annoncé ». La liste montre
   l'annoncé, la fiche le calculé, sans le dire.
4. **B — L'assistant mélange l'état de la recette précédente dans la recette ouverte.** 390, sombre et clair.
   Nuage Banane — Hefeweisse NOLO, étape Houblons, ouvert juste après Mon super stout : « à la place de Nuget » au-dessus
   de Hallertauer Mittelfruh (Nuget est le houblon du stout), et le point levure « lallemand-munich-classic à la place
   de SafAle US-05 » (US-05 = levure du stout). NEIPA Test ouvert après : « à la place de Hallertauer Mittelfruh »
   au-dessus de Galaxy, « levure ? à la place de lallemand-munich-classic », et les houblons de la recette enregistrée
   marqués « nouveau ». Le brouillon « Nouvelle recette » ouvert ensuite : « à la place de Galaxy ». Rien n'a été
   touché ; on ne sait pas si ces « remplacements » s'écrivent à l'enregistrement (voir gestes à jouer).
5. **G — Moût avant ébullition : deux valeurs.** Mon super stout · v2 : Identité « ~31,1 L avant ébullition » ;
   Eau et sels « Moût avant ébullition · à froid 29,5 L ». Nuage Banane : Identité « ~29,8 L », fiche eau totale 33,6 L.
6. **G — Deux projections d'alcool NOLO au même écran.** Nuage Banane, Identité / Levure / Récap : barre « Alcool
   estimé 0,28–0,45 % vol. » et juste dessous « Recette actuelle : 0,18–0,32 % vol. » ; fiche « 0,18–0,32 % vol. ».
7. **G — OG en deux formats et deux précisions.** NOLO : champ « Densité initiale visée 1,0475 SG » et bandeau
   « OG 1,048 » ; « SG » (anglais) à côté de « OG ». Même bloc « Objectif NOLO » répété trois fois (Identité, Levure
   « Levure et conduite NOLO », Récap « Atelier NOLO »), formulaire identique.
8. **G — Point et virgule mêlés sur la même carte.** Fiche Mon super stout : « OG 1.085 · FG 1.024 · EBC 88.3 ·
   ABV 8.2 % · SRM 44.8 » contre « 7,8 L · 31,1 L · 38,9 L · 9,4 kg » ; Houblons « IBU à chaud · Tinseth 57,2 » et, trois
   lignes plus bas, « Nuget 57.2 IBU ». Fiche NOLO : « OG calculée 1,048 » et « EBC 9.1 » sur la même ligne. NEIPA :
   « 14.7 IBU · 14.2 % AA » contre « 2,7 g/L ». Liste : « 6,2 % » ; fiche « 6.2 % ».
9. **G — Houblon hors catalogue : α « ? », arômes vides, mais IBU calculé.** « Nuget » (Nugget) : « α ? usage ? »,
   barre d'arôme vide, profil « Au style » tout hachuré, pourtant « 57 IBU » et fiche « 75 min · 13 % AA ».
   « Hallertauer Mittelfruh » (Mittelfrüh) : même chose, « 11 IBU ». Le nom saisi ne retrouve pas la fiche catalogue ;
   l'écran ne dit pas pourquoi tout est vide.
10. **G — Malts proposés par l'app sans couleur ni PPG.** NEIPA Test : les trois malts viennent des pastilles de
    suggestion (« Pilsner Malz (Weyermann) », « Weizenmalz hell (Weyermann) », « Haferflocken (flocons d'avoine) ») ;
    fiche « Couleur EBC manquante sur … » ; assistant « 3 couleurs à renseigner », « PPG — · fiche », bandeau « OG — ·
    EBC — » alors que la fiche affiche OG 1.062 et ABV 6.2 %. Champ vide là où une valeur est attendue, par la faute
    des propositions de l'app.
11. **G — Carte d'en-tête de la fiche NEIPA cassée.** 390 sombre : la cellule EBC contient « renseigne la couleur
    des malts » sur 4 lignes, ABV « 6.2 % Cible conservée · projection indisponible » : du texte d'aide dans des
    cases de chiffres, grille déformée. La fiche n'a ni eau, ni temps et conduite, ni empâtage, ni fermentation
    (5 sections puis un grand vide), là où les deux autres fiches en ont 11.
12. **G — Même chose nommée de plusieurs façons.** Fermentation : fiche « 2 étapes », Récap « 2 paliers ».
    Empâtage : fiche « 1 paliers » (singulier faux), Récap « 1 palier », « Temps et conduite » montre 2 lignes
    (Saccharification + Mash-out) ; NOLO « 2 paliers » pour 3 lignes. Flocons d'avoine : « Flocons d'Avoine » dans
    la recette, « Haferflocken » en pastille, « Haferflocken (flocons d'avoine) » dans NEIPA. Pilsner : « Weyermann
    Pilsner » dans la recette et pastille « Pilsner Malz » proposée à côté. Dry hop : fiche « Citra + Galaxy + El
    Dorado », assistant « Citra Galaxy El Dorado ». Menu « + » : « Nouvelle recette » et « Créer une recette », deux
    entrées, même brouillon. « Atelier de recette » et « atelier Houblons V5.5 ». Trois noms de l'étape des grains :
    confirmé (« Malts/sucres », « Fermentescibles », « Grain »).
13. **G — Mots techniques ou faux.** « SG » (Levure : « Volume ? inconnu · SG ? inconnu » ; Bord : « SG 1,010 »,
    « SG non relevée ») ; « mash » (« estimation du mash ») ; « Non calculable », « Non comparable » en badges ;
    « levure ? » et « à la place de levure ? » sur la frise des houblons (clair) ; « lallemand-munich-classic »
    (identifiant) à la place de « LalBrew Munich Classic » ; « Nuget ».
14. **G — Étape Levure : volume et densité du moût « inconnus » alors que la recette les a.** « Volume ? inconnu ·
    SG ? inconnu » avec un bouton « Estimer depuis la recette » ; la recette dit 24 L et OG 1,085. Conseil « Non
    calculable » ; « Homonyme en stock non associé : Levure Safale US-05 · réf. MP-026 » : la levure est en stock, pas
    reliée, l'écran le dit sans la relier.
15. **G — Précision absurde.** « Épaisseur de maische 2,7021 L/kg » (Récap « 2,7 L/kg ») ; NEIPA « 3,5875 L/kg » ;
    NOLO « Après opérations 24,012 L » ; « Retrait de l'alcool 91,73 – 93,73 % ».
16. **G — Alerte d'eau sur une recette enregistrée.** Identité, Mon super stout et NOLO : en rouge « Le total d'eau
    saisi ne correspond pas au volume final et aux pertes du plan. Revois les volumes avant de lancer. » dès
    l'ouverture, sans geste ; « cuve 35 L » sous la barre et « Matériel : Royal Catering · cuve 45 L » juste dessous.
17. **G — Masses en formats mêlés.** Malts/sucres : « 7,2 kg · 0,60 kg · 1,0 kg · 0,50 kg » (1 ou 2 décimales) ;
    fiche « 600 g · 1 kg » ; bandeau « Grain 8 kg » (NEIPA) contre « 9,4 kg ». Parts : 63 + 19 + 19 = 101 %,
    60 + 25 + 9 + 4 + 3 = 101 %.
18. **G — « Fermer » inerte.** Deux boutons « Fermer » existent dans l'assistant (deux jeux d'onglets d'étapes dans
    l'arbre : l'assistant est monté deux fois) ; le premier ne ferme rien, le second ferme. Sur le brouillon, l'onglet
    « Identité » cliqué n'a pas changé d'étape. Clic sur « Finances » avec l'assistant ouvert : c'est « Ouvrir
    l'analyse de ma bière » qui s'est ouvert.
19. **G — « Nouvelle recette » rouvre un brouillon existant.** Menu « + » → Nouvelle recette et → Créer une recette :
    tous deux ouvrent un brouillon déjà là (Houblons 3/7, « Saaz (CZ) 12 g », « Grain 0 kg », bouton « Abandonner »),
    sans dire « brouillon repris ». Pas le mien : non touché, non abandonné. **Le test des gestes d'écriture sur une
    recette de test n'a donc pas pu être joué** (il faudrait abandonner ce brouillon : suppression, interdite).
20. **D — Pastilles de style blanches sur pastel** : confirmé en clair (liste Recettes, liste Brassins : « Imperial
    stout », « NEIPA hazy », « Lager » illisibles).
21. **D — FG et ABV sans chiffre** : confirmé sur la liste (« — % » pour neipa v3, Hefe, proble levure, stout amère,
    testlev ; « — IBU » testlev, Jhhh, Jj, Milk Stout). Mais « 0 % » pour Jhhh et Jj (Lager 30 L · 0 %) : « — » et
    « 0 » pour le même inconnu.
22. **D — « empâtage » peu lisible sur la ligne choisie en sombre** : confirmé (Malt Maris Otter sélectionné).
23. **D — Repère OG barrant son chiffre en sombre** : non revu nettement à 500 px (le bandeau IBU « 57 ▌» montre une
    barre collée au chiffre).
24. **D — Pluriels.** « 2 sachet », « 1 ajout(s) », « 1 paliers ».
25. **D — Sous-titre « Sucres et ajouts » : « 6 points de densité que la levure ne peut pas manger — ils restent
    dans la bière. »** : une phrase de pédagogie à la place d'un résumé (0,5 kg lactose).
26. **D — Lactose : « Lactose » puis pastille « Lactose »** à côté, et une barre « 0 % ferm. » qui ne règle rien.
27. **D — Potentiel aromatique NEIPA : « Calcul incomplet : Galaxy : durée d'ébullition · Citra : durée
    d'ébullition · Nelson Sauvin : durée d'ébullition »** alors que chaque ajout a sa durée (60 min, 20 min) ; « Plage
    du style non identifiée », IBU à chaud « — » sur une échelle 0…1 juste sous « IBU à chaud 24 ». Puis six
    sous-sections repliées (« Variétés à comparer », « 2 consignes de conduite », « Planning », « Méthode », « Analyses
    avancées », « Ouvrir l'atelier Houblons V5.5 ») : cockpit.
28. **D — Suggestions de houblon hors style.** Imperial stout : Motueka, Galaxy, Fantasia Blend « 12 g · 10′ ».
29. **D — « Rinçage à chaud : 13,9 L. 13,9 L dans le récipient principal. »** : phrase doublée.
30. **D — Nom tronqué dans le champ** : « Nuage Banane — Hefeweisse » (NOLO coupé) à 500 px.
31. **D — Le « + » flottant** couvre le chevron « › » de la rangée « PPG 37 · fiche » (Malts/sucres, avant
    défilement) et le chevron de « Levure LalBrew Munich Classic » sur la fiche NOLO ; en bas de page il ne couvre
    plus rien (B1 n° 7 tenu).
32. **D — « Mon super stout · v2 » porte « V2 » en pastille et « v2 » dans son nom.** Deux « Ttt » identiques
    (24 L · 2,2 % · 12 IBU). Données du brasseur, mais rien ne le signale.
33. **D — Date de brassin planifié dans le passé non signalée.** Bord et Brassins : « Prévu le 08.09.2026 »,
    09.09, 10.09, 21.09 (aujourd'hui 07.11), pastille « Planifié » sans alerte. « Milk Stout · Garde froide J+190 ».
34. **D — « — L en cuve »** sur LOT-002 et LOT-001 (Brassins, Bord n'affiche pas le volume) : vide là où une valeur
    est attendue ; « OG à renseigner » / « SG non relevée » : deux mots.

### Finances › Dépenses

35. **B — Facture comptée deux fois dans le journal.** Opérations, Toutes les dates, 27 avr. : « 27 opérations ·
    − 220,79 CHF ». La facture « Brau- und Rauchshop GmbH · 372765 » fait 110,40 CHF et ses 26 lignes (13,80 + 0,60 +
    2,40 + … + 15,00 = 110,40, vérifié) sont aussi des opérations. 110,40 + 110,40 = 220,80 (écart 1 ct). Le total
    du mois est doublé ; « 35 opérations · + 2 369,21 CHF » en hérite.
36. **B — Statuts contradictoires.** La fiche de cette facture dit « Soldé » ; ses 26 lignes dans le journal disent
    « Paiement à confirmer » (une seule « Payé », MA0221 Maris Otter).
37. **B — Changer l'unité efface le prix.** Nouvelle dépense (saisie de test, non enregistrée) : ligne « 2 pièce ×
    3,00 = 6,00 » ; toucher « Kg » : prix vidé (« prix à remplir »), montant 6,00 conservé, bande « 2 kg × — ».
    Kg → g → Kg : quantité « 2 » inchangée (pas de conversion), prix toujours vide.
38. **G — Détail des lignes > total, sans alerte.** « Détail : 18,50 CHF / 12,50 CHF » puis « 20012,30 CHF /
    12,50 CHF » (0,2 g × 99999 = 19999,80 accepté) : rien ne s'allume. « 20012,30 » sans séparateur de milliers,
    contre « 1 500,00 » dans le journal.
39. **G — TVA : « 99999 » CHF et taux « −1 » % acceptés** sans message (Référence et TVA du document). Aucune TVA
    visible sur les trois factures enregistrées (Brau-Rauchshop, sol brasserie, Plomberie + evier).
40. **G — Fermer la saisie remplie ne demande rien** : 12,50 CHF, fournisseur, deux lignes, TVA : tout perdu au
    « × », sans « abandonner ? ». (Vérifié : le journal reste à 35 opérations, rien d'écrit.)
41. **G — Bande de ligne : chevauchement.** « 0,2 g × 99999,0 » heurte « 19999,80 » sur la bande repliée.
42. **G — Unité en deux langues et deux casses.** Pastille « pièce », bande « 2 Stk » ; pastille « Kg », bande
    « 2 kg » ; factures : « 6 Kg », « 2 Stk », « 1 Pck », « 40 g ».
43. **G — Retrait d'une ligne : pas d'« Annuler »**, et la liste repasse en mode simple (« Articles … · 1 », plus
    de Plié/Déplié) : on ne voit plus la ligne 1 qui reste comptée.
44. **D — « Articles, stock et matériel · 1 » sans aucune ligne visible** avant « Ajouter une ligne » ; la ligne 1
    naît du champ « Pour quoi ? » avec le total.
45. **D — Filtres tronqués à 500 px** : « À compléter » coupé en « À com » ; le chevron de « Autres filtres »
    chevauche le mot.
46. **D — « Saisir sans justificatif »** : c'est l'entrée « à la main » ; elle ne passe pas par l'écran Dépense
    à bandes avec Garder/Retirer (réservé à la lecture d'un document). Les mots du brief (« Saisir à la main »,
    « Garder/Retirer », « Confirmer ») n'existent pas sur ce chemin.
47. **D — Fournisseur en deux noms** : « Brau- und Rauchshop GmbH » (facture) et « Cmd 686863 Brau-Rauchshop »
    (lignes) ; stock « Hallertau Blanc », facture « Hallertauer Blanc 9.5% CH ».
48. **D — Menu « + » : entrées sans nom accessible** (menuitem vides dans l'arbre), boutons de la barre du bas sans
    nom (sauf Stocks).

### Stocks, Bord

49. **G — Trois comptes pour « manque ».** Stocks : « À commander · 12 » ; Bord et badge : « 26 articles au seuil ou
    en dessous · 21 ruptures ».
50. **D — « Niveau inconnu » hachuré** sur Weizenmalz hell, Caramünch Typ 2, Gerstenglocken : seuil non fixé, rien
    ne propose de le fixer.

### Console

51. Aucun message capturé (filtre error|warn|exception|Firestore) sur toute la session ; le suivi commence après le
    premier chargement, donc les erreurs de chargement initial ne sont pas couvertes.

## Gestes à jouer sur une copie de test

- Abandonner le brouillon existant (« Saaz (CZ) 12 g ») puis créer « ZZ TEST — recette gestes » : chaque étape 1/7
  à 7/7, pastilles de moment (« empâtage ⌄ », « ébullition ⟳ »), curseurs, +/−, ×, corbeille, Annuler, double toucher,
  appui long, glisser, deux retraits de suite, valeurs absurdes (« Crystal 60 », « 0,2 », −1, 0, 99999, nom de
  90 caractères, virgule et point), rechargement en pleine saisie, Enregistrer : vérifier ce qui s'écrit.
- Enregistrer une recette ouverte après une autre : les « à la place de X » (n° 4) s'écrivent-ils ?
- Trois noms « Fermer » : lequel enregistre un brouillon ?
- Facture : « Enregistrer la dépense » avec Détail ≠ Total, TVA 99999 / −1, unité changée : ce qui part au stock et
  aux finances. Lecture d'un document (Gemini) pour atteindre l'écran à bandes : Garder/Retirer, Plié/Déplié,
  Confirmer.
- « Préparer un brassin », « Estimer le budget », « Copier la recette », « Faire relire la recette » (IA).
- Stocks : pastille d'épingle, « Suivre au stock », « Associer un lot de mon stock ».

## Données de test créées

Aucune donnée enregistrée. Saisies non enregistrées, perdues à la fermeture : dépense « ZZ TEST — dépense gestes »,
fournisseur « ZZ TEST — fournisseur », lignes « ZZ TEST — malt 60 … », « ZZ TEST — article 60 » (journal vérifié :
35 opérations avant et après). Aucune recette créée (n° 19). Rien à nettoyer.

## Couverture

Vu, 500 × 805 tactile :
- Recettes : liste (23) ; fiches Mon super stout · v2 (sombre), Nuage Banane — Hefeweisse NOLO (clair), NEIPA Test
  multi-houblons (sombre), sections Grain/Houblons/Levure/Potentiel aromatique dépliées ; assistant des trois, étapes
  1 à 7 (stout : toutes ; NOLO : 1, 2, 3, 4, 7 ; NEIPA : 2, 3, 5, 6). Stout aussi en clair (1, 2, 3).
- Finances › Opérations : journal toutes dates (sombre) ; fiches Brau-Rauchshop (26 lignes), sol brasserie,
  Plomberie + evier ; « Nouvelle dépense » saisie sans justificatif, gestes joués sur mes lignes (libellé 90 car.,
  0,2, 99999, −1, 0, Kg → g → Kg, +1, retrait ×2, Plié/Déplié vu), fermée sans enregistrer.
- Stocks (sombre et clair), Bord (sombre et clair), Brassins (9, clair).

Non vu :
- 1280 × 800 (redimensionnement sans effet) ; 390 réel (minimum 500).
- Écran Dépense à bandes (Garder/Retirer, Confirmer) : atteint seulement par lecture de document (interdit).
- Création d'une recette de test et ses gestes d'écriture (brouillon étranger en place, n° 19).
- Étapes 5 et 6 de NOLO, 1, 4, 7 de NEIPA ; thème clair sur Dépenses et Brassins en cours (vu en clair : liste).
- Rechargement en pleine saisie ; hors ligne ; console au chargement initial.
