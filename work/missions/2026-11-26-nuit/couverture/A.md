# Couverture, tranche A (finances, saisies rapides, clients) : 27.11

Banc : Chrome 9222, 390 × 844 tactile, `lib.mjs`. Local = http://localhost:3131/?dev-local avec fixtures « ZZ TEST — … » (5 écritures, 2 clients, 2 tarifs, 1 stock ; `fixtures.js`). En ligne = https://brasserie-l-affinee.web.app/, lecture seule (ouvrir, défiler, mesurer, capturer ; aucun Enregistrer, aucune saisie dans un vrai enregistrement ; aucun fichier choisi ; aucune lecture IA).
Dossier : `C:\Users\mrspa\AppData\Local\Temp\claude\b544ff255d45c8a5\b8d55cb5-6273-4076-b363-d67bfb7c3518\scratchpad\couverture-A\` (captures dans `ligne\`, `ligne2\`, `ligne3\`, `local\`, `local4\` ; scripts `scen.mjs`, `fixtures.js`, `sc*.json`). Aucun nom de client, téléphone, e-mail ni IBAN dans ce fichier.
Les captures citées ont été ouvertes en image.

## 1) Tableau

| écran (id) | banc | gestes joués | constats | statut |
|---|---|---|---|---|
| onglet-finances | en ligne + local | ouvrir, 4 sous-vues, repos/milieu/fin, + flottant | 2, 4, 5 | partiel : sélecteur de période et recherche non joués |
| finances-synthese | en ligne + local | repos/fin ; « Revoir le mois » (30 j, 90 j, 12 mois, Caisse) ; « Pourquoi ? » ; novembre fixture | 4, 5 | fait |
| finances-operations | en ligne + local | repos/fin ; ouvrir une ligne (feuille de pièce) ; Filtres ; Par date ; Archives | 3 | partiel : édition d'une ligne, avoir, doublons non joués (écriture réelle) |
| finances-previsions | en ligne | repos/fin ; 30 j / 90 j / 12 mois ; Calendrier de l'argent ; « achats de matériel pas comptés » ; « + Vente » | 5 | partiel : édition d'un projet de matériel non jouée ; assistant IA non appelé |
| finances-annuel | en ligne + local | repos/fin ; Mois par mois ; TVA ; Impôts Fribourg (étape 8/9) ; Continuer cliqué (capture non regardée) | 1, 5 | partiel : clôture, inventaire, archives non jouées (écrivent) |
| rapide-menu | en ligne + local | ouvrir depuis Bord et Finances ; Écriture, Facture, Vente, Brassin | 6 (doute) | fait |
| rapide-depense | en ligne + local | ouvrir ; local : Achat, lettres puis « 12,5 » dans Montant, Échap | doute 2, 3 | fait |
| rapide-vente | en ligne + local | ouvrir ; client choisi ; 33 cl ; bascule Facture QR | doute 7 | partiel : ni quantité ni encaissement joués |
| rapide-scan | en ligne | « Facture » du menu : ouvert seulement (Documents / Photographier / PDF / Saisir sans justificatif) | aucun | fait (ouvert seulement, aucun fichier choisi) |
| rapide-brassin | en ligne + local | ouvrir (22 recettes, tri « Prêtes d'abord ») ; local sans recette | doute 8 | partiel : « Brasser » non joué (crée un brassin) |
| feuille-facture | en ligne + local | « Facturer » depuis le carnet : Vendre en Facture QR, échéances 10 j / 30 j, aperçu de la facture | aucun | partiel : adresse, quantité, Enregistrer non joués |
| feuille-tarif | local + en ligne | « Changer le prix » : champs, « 4,2 » dans Prix HT, Échap ; en ligne ancien tarif et « Fixer le prix » ouverts | 2, doute 2, 9 | fait |
| clients-tarifs | en ligne + local | repos/fin ; formats 33 cl / 75 cl / fût ; anciens tarifs ; Fixer / Changer le prix | 2 | fait |
| clients-impot-biere | en ligne | repos/fin ; feuille d'un brassin (barème, formats) | aucun | partiel : « Noter les litres » non joué |
| onglet-clients | en ligne + local | 3 sous-vues, repos/fin | 2 | fait |
| clients-carnet | en ligne + local | repos/fin ; local : Modifier (téléphone avec lettres, Échap) ; Facturer | doute 4 | partiel : création / archivage de client non joués |

Chevauchements mesurés par `chevauchements()` à chaque écran (repos, milieu, fin) ; `editions()` : 0 `type=number`, 0 valeur « ? » ou NaN dans un champ, 0 champ coupé, sur toutes les feuilles ouvertes.

## 2) Constats prouvés (5)

1. **Finances > Annuel · repos et fin, 390 px · les montants de la colonne « Dépensé + usure » sont rognés** · observé : chaque segment est coupé à 88–92 px, le nombre perd ses derniers chiffres et change de sens : « 4 000,00 » se lit « 4 0 », « 1 500,00 » se lit « 1 », « 23,00 » → « 23,0 », « 110,40 » → « 110,4 ». Mesure : `button.ann-s` clientWidth 88 / scrollWidth 142 et 150, `div.ann-s` 92 / 109 et 110, overflow hidden. Reproduit en local avec les fixtures (« 25,30 » et « 113,38 » rognés, 92 / 108–111) · attendu : montant entier lisible (retour à la ligne, colonne plus large ou police réduite), jamais un nombre tronqué · capture : `ligne\05-Fin-Annuel-repos.png`, `ligne\05-Fin-Annuel-fin.png` (la repro locale, mesurée seulement : `local\scen-tout.json`, capture non ouverte) · fichier : `src/ui/finance/annuel/Tete.tsx` (classe `ann-s`, colonnes de la pile) et la feuille de style de l'annuel.
2. **Clients > Prix · repos et fin · le « + » couvre la fin du bouton principal « Fixer le prix » (local : « Changer le prix »)** · observé : le bouton va de x = 123 à 378, le « + » (x = 322 à 378) pose sur ses 56 derniers px ; mesuré par le banc, 644 px² au repos et au bout du défilement (en ligne, même cas sur le bouton « Fixer le prix »). Le libellé reste lisible, mais 22 % du bouton se touche sur le « + » · attendu : bouton entier libre, ou « + » absent de cette vue qui a déjà son action · capture : `ligne\07-Clients-Prix-fin.png`, `local\06-cl-prix-repos.png` · fichier : `src/components/tabs/ClientsTab.tsx` (`prx-pri`), `src/ui/finance/CreativePricing.tsx`, barre `floating-actions`.
3. **Finances > Opérations · fin de défilement · le « + » couvre l'extrémité droite de la puce « Apport ou prélèvement privé »** · observé : mesure 884 px² (local) ; la puce passe sous le « + » sur ses ~20 derniers px, et la puce « Par date » est elle aussi frôlée au repos (272 px²) · attendu : marge basse égale à la hauteur du « + » + 6 px à la fin de la page · capture : `local\02-fin-operations-fin.png`, `ligne\03-Fin-Operations-fin.png` · fichier : `src/ui/finance/TransactionJournal.tsx` (rangée `ops-pu`), marge basse de la page (`data-floating-actions-gap`).
4. **Finances > Synthèse > Revoir le mois · fin de défilement · le « + » recouvre le texte « 2 opérations »** · observé : le bouton `ana-ops` est coupé en « 2 opéra… » (1 456 px²) ; le bouton « 3 projets de matériel, sans date » est aussi touché par le haut du « + » (710 px²) · attendu : texte entier lisible, page prolongée sous le « + » · capture : `ligne3\01-syn-revoir-fin.png` · fichier : `src/ui/finance/` (classes `ana-ops`, `ana-tache` ; feuille « Revoir le mois »).
5. **Rangées pleine largeur en bas de page · le « + » couvre leur extrémité droite** · observé : Prévisions « Prévoir mes prochains paiements » (3 099 px²), Synthèse « Fournisseurs, matériel » (913 px²) et « Comprendre mes dépenses » (439 px²), Annuel « Dossier et archives » (1 172 px², au repos et au bout). Le chevron reste visible, le reste de la rangée se touche · attendu : même marge basse que le constat 3 · capture : `ligne\04-Fin-Previsions-fin.png`, `ligne\05-Fin-Annuel-fin.png`, `local\01-fin-synthese-fin.png` · fichier : `src/ui/finance/FinanceOverview.tsx`, `FinanceForecastSummary.tsx`, `annuel/` (rangée `ann-row`), `finance.css`.
Pas de constat de classe b prouvé : toute saisie jouée en local tient (champs décimaux, lettres refusées dans Montant, « 4,2 » devient « 4,20 » à la sortie, NPA numérique, e-mail et téléphone avec le bon clavier).

## 3) Doutes et non joué

Doutes :
1. Menu rapide : `etiquette-coupee` « Compagnon » 74 / 77 px mesuré en local ; la capture en ligne du menu (`menu-bord.png`) montre « Compagnon » entier. Probablement 3 px de marge sans effet.
2. Échap dans les feuilles « Saisir à la main » et « Changer le prix » : la feuille reste ouverte, la valeur est gardée ; dans le tarif la saisie « 4,2 » est reformatée « 4,20 ». Clavier physique seulement ; le brasseur au téléphone n'a pas d'Échap. À trancher : Échap devrait-il fermer ?
3. « Saisir à la main » : pendant la saisie, le montant affiche « −12,5 » alors que le pied dit « −12,50 » (`local4\01-g-ecriture-repos.png`). Même valeur, format différent tant que le champ a le focus.
4. Modifier un client : le champ téléphone (`inputMode=tel`) accepte des lettres tapées au clavier (« 07912abc » gardé). Pas d'effet au toucher.
5. Impôts Fribourg (annuel, étape 8/9) : le banc mesure un recouvrement entre le bouton « Copier » (grisé) et le bouton « ? » / « Classer le matériel » (873 px², deux fois) ; la capture `ligne3\04-ann-impots-repos.png` n'en montre aucun effet visible.
6. Revoir le mois, en ligne : deux chiffres « prévu » voisins sur le même écran (texte « prévu −625,28 », cellule « Prévu −657,28 », écart 32,00) ; origines différentes possibles, non recoupées. De même « En caisse 1 145,00 CHF » ne se retrouve pas par 1 200,00 encaissé − 265,40 payé = 934,60 (un solde de départ de 210,40 l'expliquerait, non vu). Le libellé « rien noté / 29.10 → » de la zone hachurée est en partie sous la bulle du paiement (`ligne3\01-syn-revoir-fin.png`).
7. Vendre : « 75 cl · tarif à corriger · 759,33 CHF le litre » vient d'un ancien tarif (569,50 pour 0,75 L) ; l'écran le signale déjà « à corriger », donc pas de défaut d'affichage, mais un chiffre absurde reste en premier plan de la caisse.
8. Nouveau brassin (en ligne) s'ouvre en thème sombre (cadre doré) alors que le reste de l'app est clair (`ligne2\01-menu-brassin-repos.png`). À comparer à la maquette choisie (registre des écrans) ; je n'ai pas vérifié.
9. « Changer le prix » d'un ancien tarif (« Lager 50L ») : le champ Bière est prérempli « Pale Ale », ni la bière du tarif ni celle choisie dans la vue (`ligne3\08-cl-ancien-repos.png`). Origine du préremplissage non lue dans `src/ui/TarifSheet.tsx` ; risque d'enregistrer un tarif sous une mauvaise bière.

Non joué : lecture IA du justificatif (rapide-scan : ouvert seulement) ; Enregistrer, Supprimer, Brasser, Noter les litres, Continuer la clôture, archives, avoir, doublons (écritures) ; sélecteur de période du bandeau ; clavier visible (pas de vrai clavier virtuel sur le banc : tests de saisie au clavier de l'ordinateur, tactile pour les touchers) ; thème sombre ; 1280 px ; création de client.
