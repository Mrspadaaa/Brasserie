# Vues et actions de l'app autour du calendrier · plan corrigé · 16.11

Ses mots (16.11) : « Ce que je voulais illustré c'est que le bouton+ dépend de son action principal en fonction de là où il est... On pourrait faire un calendrier pareil. Un général avec son Tab Mais aussi un spécifique aux thématiques, finance, stock, brassage ECT... ? » ; « Je veux pas perdre en fonctionnalités ni en données » ; « Dans l'application tout a un lien avec tout... ».

Portée (L01) : un seul composant, fb tel quel (choisi 16.11). Il vit dans l'onglet Calendrier général et dans chaque section, réglé sur elle par quatre paramètres : filtre de genres, chiffre clé, rangée « Maintenant », action principale du +. Rien d'autre ne change dans fb. Aucune donnée stockée en plus : projection en lecture (LIENS §3.1), chaque écriture par la porte de son propriétaire.

Corrections du contradicteur intégrées (13 points) et vérification élargie aux autres sections. Choix qui n'étaient pas au registre `ecrans-app.json` et que ce plan protège (SPEC 15.11 et 16.11) : fb, f1, t1b2, kh1r, kyh1, s2ap2 (plage), m3 (en-tête), d3p2 (menu et +), r3p2 (recherche), za3 (Matériel), d1b (feuille Brasser), kxc et kx2r1 (Tarifs, ventes), KegBoard, F2 et R1 (fûts), p2a (compagnon), et Finances : m1do-a, m1ar-c, m3pr-c, m3pm-d, m3im-c, m4bb-a, m4pf-c, m4ia-c. Inscrire ces choix au registre revient au pilote (DÉCISION ci-dessous).

Règles communes, tirées des corrections :
- Une chose de la frise ouvre sa vue choisie telle quelle ; le calendrier ne redessine aucune vue choisie (règle n° 1).
- Une seule période pour l'app : la plage « du … au » de s2ap2 (en-tête m3) ; les segments 6 sem. / 3 mois / 6 mois / An de fb en sont des raccourcis (correction 8).
- Chaque chose porte un nom court ou un picto, même petite (correction 9, Q21).
- Le réel est `data-ro` (pas de poignée, pas de curseur) ; le curseur de montant ne sert qu'au prévu (correction 10).
- Aucune étape refusée ne revient : pas de bouton « Accepter le devis » ; le scan de l'achat relie et compte seul (correction 12).
- Ce que le brasseur n'a pas choisi (place d'un sous-onglet, tête de section, liste en mode du calendrier) se montre en mini maquettes ; la page `page/index.html` en est la première.

## 1. Finances

Calendrier de section : fb réglé « argent » (capture `s-fin-repos`). Montre d'abord : Maintenant (échu, dû sous 7 j), À payer, Entrées, Récurrent, Achats et travaux, Brassins (coût seul). Chiffre clé : « à te permettre » de fb, inchangé. Action principale : un toucher sur + ouvre le scan (Nouvelle écriture, `NEW_TRANSACTION`) ; l'appui long ouvre le menu « Sur Finances » (correction 11).
m1, m2, m3 sont montrés à côté. Position du contradicteur reprise comme proposition : m1 comme base de contenu, refait sur fb ; m2 et m3 n'en donnent que des greffes (filtre d'argent de m2, « aller au plus serré » de m2 et m3), car ils remplacent les segments de fb (m2) ou la frise elle-même (m3) (correction 7).

| Id | Vue | Sort | Où vivent ses fonctions |
|---|---|---|---|
| FI1 | Calendrier de section (nouveau sous-onglet ; Synthèse · Calendrier · Opérations · Annuel) | adapter | fb réglé argent. Ordre des sous-onglets et vue d'ouverture : son choix, en mini maquettes. `finances_workspace` = forecast ou projects bascule sur Calendrier. |
| FI2 | Prévisions · frise (`FinanceForecastSummary`, horizons 30 j / 90 j / 12 mois) | fondre | Résumé → tête de fb (chiffre, courbe, rangée collée). Horizons → segments de fb, mémorisés dans `uiState`. Warnings → pastille sur la semaine. |
| FI3 | Comparer les mois (`FinanceComparisonChart`) | fondre | Segment An : un toucher sur un mois le sélectionne (`selectedForecastMonth`) et ouvre le tableau Mois / Sorties / Entrées / Solde ; graphique paresseux gardé (correction 6). |
| FI4 | Poche « sans date » (`undatedOutCents`, `undatedInCents`) | fondre | Poche « sans date » de fb, jamais à 0 ; un toucher liste les entrées et sorties sans date (correction 6). |
| FI5 | Paiements inconnus (`openJournal` filtre unknown) | garder | Pastille sur la poche « sans date » ; un toucher ouvre Opérations filtré unknown (correction 6). |
| FI6 | Prévoir une dépense (m3pr-c, choisi) | garder | Ouverte telle quelle par le + de la rangée Récurrent et par « Prévoir une dépense » du menu, pré-remplie de la semaine touchée (correction 3). |
| FI7 | Mes projets de matériel (m3pm-d, choisi), À venir kyh1 et graphe kh1r (choisis) | garder | La rangée Achats et travaux lit les projets (barre au mois ou au jour selon `datePrecision`) ; l'en-tête de rangée ouvre m3pm-d, kyh1 et kh1r tels quels, « sans le réduire » (correction 4). |
| FI8 | Bien amorti (m3im-c, choisi) | garder | Toujours atteint par l'étape « En service » de la fiche du projet ; la mise en service apparaît aussi comme instant sur la rangée Achats (correction 5). |
| FI9 | Budget d'un brassin (m4bb-a, choisi) | garder | Un toucher sur la barre d'un brassin ouvre m4bb-a tel quel ; aucun montant au doigt dans la fiche (correction 2). |
| FI10 | Solde et paramètres (m4pf-c, choisi) | garder | Un toucher sur le chiffre clé ouvre m4pf-c tel quel ; « à rafraîchir » si la caisse d'ouverture manque ou si le cache a plus de 30 jours (correction 1). |
| FI11 | Compagnon « Prévoir mes prochains paiements » (m4ia-c, choisi) | garder | Inchangé dans le Compagnon (« Partout » du +) ; il reçoit la plage du calendrier au lieu de `horizon` et `month`. Appel IA payant : jamais en test. |
| FI12 | Synthèse · Situation (`FinanceOverview`) | garder | Vue de chiffres. « à payer » et « en retard » ouvrent le calendrier filtré en retard. Même `ledger` que le chiffre clé : un seul calcul. |
| FI13 | Synthèse · Coûts (`CostComposition`, `MonthStepper`) | garder | Inchangée ; le mois touché au segment An peut y renvoyer. |
| FI14 | Opérations (journal, éditer, contre-écriture, archiver, pièce ; Doublons m1do-a et Archives m1ar-c, choisis) | garder | Inchangées, m1do-a et m1ar-c tels quels. Une écriture passée de la frise ouvre `TransactionDetails` ; une écriture avec `dueDate` ouvre la frise sur sa semaine. |
| FI15 | Annuel (`TaxWorkspace`, clôture, versions, immobilisations) | garder | Inchangé. TVA et clôture entrent sur la frise comme échéances datées (M6, C8) ; un toucher ouvre Annuel. |
| FI16 | Écran Dépense et scan (r2b provisoire, choix ouvert) | garder | Rien ne change ni n'en est tiré (D123). Il s'ouvre d'un toucher sur + ; sa `dueDate` pose l'échéance dans À payer. |
| FI17 | Feuilles de saisie (`ExpenseSheet`, `InvoiceSheet`, `FinanceForms`, `PaymentSheet`…) | adapter | Mêmes feuilles, mêmes portes ; ouvertes depuis la frise, la date de la semaine est proposée. `PaymentSheet` reste pour le paiement partiel (correction 6). |
| FI18 | Période (`Header`, `hidePeriod`, `FinancePeriodBar`) | adapter | Une plage partagée (s2ap2) ; les segments du calendrier l'écrivent ; Synthèse et Opérations la lisent (correction 8). |

## 2. Brassins, recettes et fermentation

Calendrier de section en tête du sous-onglet Brassins (`s-bra-repos`). Montre d'abord : la rangée Brassins avec ses phases, les perles du starter, le manque daté, puis le reste replié. Chiffre clé : le prochain créneau (« S49 · cuve 2 libre · stock complet »), ou sa cause. Action principale : + « Brassin », qui ouvre la feuille Brasser d1b (choisie) telle quelle, posée au créneau.

| Id | Vue | Sort | Où vivent ses fonctions |
|---|---|---|---|
| BR1 | Brassins : liste par statut | adapter | Le calendrier se pose en tête ; la liste reste dessous et devient aussi son mode liste (fb9). Terminé et annulé : filtre d'état, jamais supprimés. Place : en mini maquettes. |
| BR2 | Fiche du brassin (`BatchDetailSheet`, journal, densités) | garder | Ouverte d'un toucher sur la barre ; gagne les dates réelles des étapes (M2). `plannedBrewDate` et `bottlingDate` se règlent aussi en glissant. |
| BR3 | Jour J (`brewday`, compagnon p2a, minuteurs) | garder | Ouvert d'un toucher sur la barre le jour même ou « Brasser aujourd'hui » ; inchangé. |
| BR4 | Fermentation (profil, scénarios, courbe) | adapter | Profil dans la recette ; dans un brassin, ses phases sont des segments de barre ; tirer un bord écrit `ajustementsPhases` (C3), recette figée intacte. |
| BR5 | Conflit de cuve (`fermenterConflict`, recommandation) | fondre | Pastille sur la barre, remontée dans Maintenant, « décaler en S50 » en un toucher ; mêmes fonctions de calcul, rien réécrit. |
| BR6 | Levure et starter (l5b, s5a, c6b, s7a choisis ; `yeastPreparation`) | garder | Écrans intouchés ; les étapes du starter deviennent des perles déplaçables avant la barre. |
| BR7 | Lot de levure qui expire (`expiresOn`) | fondre | Pastille sur le brassin qui s'en sert, jamais une barre de péremption (L27). La fiche du stock garde la donnée. |
| BR8 | Recettes (fiche, import, export) | garder | « Brasser » ouvre d1b au prochain créneau. Le + du sous-onglet reste Nouvelle recette. |
| BR9 | Assistant recette et Houblons (r4-a, s1, etape-houblons, q2b, cmc2k…) | garder | Intouchés ; le dry hop posé devient une perle de la barre. |
| BR10 | Atelier R&D (Matériel, Bières, Tarifs, Contacts, À faire) | adapter | À faire = genre tâche du calendrier (voir AT6). Bières (idées) : le carnet ; une idée datée apparaît sur la frise. Le + reste Nouvelle idée. |
| BR11 | Adapter les volumes (`scaler`) | garder | Inchangé ; le + Brassin propose le volume de la cuve et y renvoie si besoin. |

## 3. Besoins, achats et fournisseurs

Calendrier de section sous Stocks › Courses (`s-ach-repos`). Montre d'abord : À commander (un jalon « commander avant » par fournisseur), Commandé (fenêtre jusqu'à la livraison), Achats, À payer ; brassins en cause pâle. Chiffre clé : CHF de la prochaine commande due (variantes A montant, B jours, C articles : son choix ; défaut A). Action principale : « Commander · <fournisseur> » : copie la liste, marque commandé, pose la livraison ; Annuler 5 s.

| Id | Vue | Sort | Où vivent ses fonctions |
|---|---|---|---|
| AC1 | Courses (liste par fournisseur, Copier) | adapter | Reste le sous-onglet ; devient aussi le mode liste du calendrier, trié par « commander avant ». Copier par fournisseur et Copier tout restent. Pastilles : même `criticalCount`. |
| AC2 | Filtre « À commander » de l'inventaire | garder | Inchangé ; un toucher sur un article ouvre son jalon daté, et le jalon ouvre l'article. |
| AC3 | À venir kyh1 et graphe kh1r (choisis) | garder | Tels quels. La frise n'en est qu'un lecteur : une fenêtre par projet ; étirer écrit le même plan par `financeService`. Sans date → poche « sans date ». |
| AC4 | Carnet de décision (da, dc, choix ouvert) | garder | Intouché (D123). « Besoin ou idée » du + le crée dans le carnet ; une idée avec budget apparaît en pointillé, hors total. |
| AC5 | Fournisseurs (pas d'écran ; fiche proposée L16) | adapter | Fiche neuve ouverte par un jalon : articles, derniers prix, délai appris, factures. Écran neuf : mini maquettes avant tout port ; aucune fusion de noms sans son accord. |
| AC6 | Dépense fournisseur (`ExpenseSheet`, r2b provisoire) | garder | Inchangée ; le scan pose l'échéance À payer, solde la commande, le projet et le besoin liés (L11). |

## 4. Atelier, matériel et entretien

Calendrier de section en tête de Stocks › Matériel (`s-ate-repos`), au-dessus de la liste za3, qui ne change pas. Montre d'abord : Maintenant (entretien dû, panne, METAS échue), Entretien, Cuves, Achats et travaux de matériel, Tâches. Chiffre clé : « 3 à traiter », rouge s'il y a un retard. Action principale : « Entretien fait » (axe à montrer contre « Nouveau matériel », son choix).
Correction : za3 est choisi (« Une date, pas un compteur », 15.11). La proposition « dans 12 j / en retard 3 j » sur chaque ligne est retirée : la ligne garde sa date.

| Id | Vue | Sort | Où vivent ses fonctions |
|---|---|---|---|
| AT1 | Matériel : inventaire (za3, choisi) | garder | Tel quel (une date, pas un compteur) ; le calendrier se pose au-dessus, place en mini maquettes. Recherche, catégories, tri et filtre restent. |
| AT2 | Fiche matériel (`EquipmentSheet`) | adapter | Ouverte d'un toucher sur une perle. Ajouts en options : rythme en puces, historique daté, panne `brokenSince`, « Retirer du service » daté avant Supprimer. Texte `maintenance` gardé en note. Champs à vérifier sur le dernier tag en ligne (L17). |
| AT3 | Brew system (source, calibration, thermique) | garder | Inchangé ; une cuve en panne ou retirée y est signalée et exclue des propositions. |
| AT4 | Alarmes du jour J (`BrewAlarmSettings`) | garder | Inchangées ; servent de modèle aux rappels par genre (Réglages, BO9). |
| AT5 | Projets de matériel (`UpgradeWorkspace`, côté Atelier) | adapter | Même donnée que FI7 : rangée Achats et travaux, deux thèmes ; l'en-tête ouvre m3pm-d tel quel. Réalisés et Archivés : filtre d'état. |
| AT6 | Atelier R&D › À faire (`creativeItems` event) | fondre | Rangée Tâches et poche « sans date » ; « fait » d'un toucher. L'onglet À faire ouvre le calendrier filtré Tâches (porte connue gardée). |
| AT7 | Planning (collection `planning`, sans écran) | fondre | Lu comme activités ou plages ; création par la rangée de pose Activité. Rien de migré de force. |
| AT8 | Échéances du Bord (texte en dur, `completedDeadlines`) | fondre | Échéances récurrentes datées (M6, C8) ; METAS au thème atelier ; OFDF, TVA, clôture à Finances et Ventes. Voir BO4. |

## 5. Stock et fûts

Un seul calendrier de section dans Stocks, préréglé par le sous-onglet d'où l'on vient (Articles → Manques, Livraisons, Fûts ; Courses → groupe 3 ; Matériel → groupe 4 ; Houblons → manques de houblons). Capture `s-stk-repos`. Chiffre clé : « 5 à commander » (besoins planifiés + seuils) ; l'écart avec la pastille « 24 » (seuil seul) se montre en variantes (Q21). Action principale : « Commander ce qui manque » ; puis Livrer un fût, Remplir des fûts.

| Id | Vue | Sort | Où vivent ses fonctions |
|---|---|---|---|
| ST1 | Articles : liste du stock | adapter | Inchangée au repos, sauf « manque S49 », lien d'un toucher vers le calendrier centré. Ajout montré en mini maquettes. |
| ST2 | Articles : filtre « À commander » | adapter | Liste et export gardés ; chaque ligne gagne sa date limite et le tri par date. Même donnée que la rangée Manques. |
| ST3 | Fiche article, mouvements, lot de levure | garder | Ouverte d'un toucher sur un point Manque ou Livraison ; historique jamais en barres sur la frise. |
| ST4 | Correction d'inventaire | garder | Inchangée ; le manque daté se recalcule seul. |
| ST5 | Fûts : KegBoard (choisi 15.11) | garder | Tel quel. Le temps des fûts (plein depuis, livré → reprise, à laver) passe au calendrier filtre Fûts. |
| ST6 | Fûts : fiche F2 et remplissage R1 (choisis) | garder | Tels quels ; R1 s'ouvre pré-rempli depuis « fûts à remplir » sur la fin de garde. Une ligne neuve dans F2 : variantes d'abord. |
| ST7 | Houblons : catalogue (choisi) | garder | Intouché ; seul le manque de houblon apparaît dans la rangée Manques. |
| ST8 | Pastille de l'onglet Stocks (`criticalStockCount`) | garder | Inchangée ; écart avec le chiffre clé montré en variantes. |

## 6. Ventes et clients

Calendrier de section « Agenda » dans Clients (`s-ven-repos`), en tête des sous-onglets (Agenda, Clients, Impôt bière, Prix et marges) ; variante B : bande repliable en tête du carnet. Montre d'abord : Maintenant (facture client échue, fût non rendu, livraison du jour, OFDF proche), Ventes et livraisons, Fêtes, Fûts dehors, À encaisser, Impôt bière ; brassins en fond « bière prête ». Chiffre clé : « à encaisser », part en retard en rouge. Action principale : « Vente ou livraison », sans clavier.

| Id | Vue | Sort | Où vivent ses fonctions |
|---|---|---|---|
| VE1 | Carnet clients (recherche, filtres) | adapter | Inchangé ; chaque ligne gagne au plus un repère daté (livraison S48, facture échue) qui ouvre l'Agenda filtré sur le client. En variantes. |
| VE2 | Fiche client | adapter | Coordonnées, Appeler, WhatsApp, Facturer gardés ; bloc « à venir » de 3 choses au plus. Délai de retour des fûts appris, sinon « inconnu ». |
| VE3 | Facturer (`InvoiceSheet`) | garder | Ouverte aussi d'un toucher sur une vente de la frise, pré-remplie ; son `dueDate` devient « à encaisser ». |
| VE4 | Saisie rapide de vente | garder | Dans « Partout » ; depuis une semaine, la date proposée est celle de la semaine. |
| VE5 | Impôt sur la bière (OFDF) | adapter | Calcul, copie, Taxas, directives gardés ; l'échéance devient une donnée datée et sourcée (M6, C8), montant en fourchette, jamais 0. |
| VE6 | Prix et marges (kxc, choisi) | garder | Tel quel ; le tarif nourrit les puces de prix de la vente. Une vente de la frise s'ouvre comme kx2r1 (choisi). |
| VE7 | Rangées Ventes et Fêtes de fb | fondre | Mêmes rangées, au premier plan dans l'Agenda ; le général garde ses rangées. |
| VE8 | Fûts chez les clients | garder | Vue du groupe 5 ; l'Agenda lit seulement `kegs`. |

## 7. Accueil, menu, recherche et réglages

Calendrier de section sur Bord, réglé « maintenant » (`s-bord-repos`). Montre d'abord : Maintenant toutes sections mêlées (dû, retard, conflit), les épinglés, puis 2 semaines. Chiffre clé : « 4 à faire aujourd'hui », « 2 en retard » ; le 173 reste au général (pas deux fois le même chiffre). Action principale : « Fait » sur la chose en tête ; Nouvelle écriture reste en tête de « Partout ». Fusion Bord + Calendrier, ou 6e onglet : son choix, en mini maquettes (SPEC 16.11).

| Id | Vue | Sort | Où vivent ses fonctions |
|---|---|---|---|
| BO1 | Calendrier de Bord « Maintenant » (nouveau) | adapter | fb réglé : filtre « attend un geste », 2 semaines, chiffre « à faire aujourd'hui ». Vide : une ligne « rien à faire aujourd'hui ». |
| BO2 | Cartes Brassins, Stocks, Finances | garder | Inchangées sous le calendrier ; une ligne datée ouvre le calendrier de sa section, centré. |
| BO3 | Carte Agenda (tâches) | fondre | Tâches dans Maintenant et la frise ; cocher = « fait » + Annuler. La carte ne part qu'une fois ce chemin en place. |
| BO4 | Échéances et démarches (texte en dur) | fondre | Échéances récurrentes ; « date à confirmer » tant que le régime n'est pas sûr ; le texte devient la fiche ; coches migrées sans perte. |
| BO5 | Barre du bas | adapter | Ajout de l'onglet Calendrier ; sa place est son choix. Tous les onglets restent. |
| BO6 | Période globale (en-tête m3, plage s2ap2) | adapter | Une seule plage ; tout calendrier la lit et l'écrit (correction 8). |
| BO7 | Recherche ⌘K (r3p2, choisie) | adapter | r3p2 telle quelle ; l'index s'étend aux choses datées ; un résultat daté ouvre le calendrier centré. |
| BO8 | Menu (m3, choisi) et + (d3p2, b1r) | garder | Tels quels ; le + garde « Partout » de d3p2, la partie de section change seule. |
| BO9 | Réglages | adapter | Ajout : rappels par genre ; le régime TVA/OFDF date les échéances. Rien retiré. |
| BO10 | Sauvegarde, Drive, audit | garder | Interface inchangée ; couvre les données neuves (fait datés, épingles, EXDATE, rappels). |
| BO11 | État de persistance | adapter | Indicateur gardé ; en plus, l'état en file ou refusé sur la chose (C5, K9). |
| BO12 | Notifications | adapter | Portent les rappels par genre ; actionnables (fait, décaler). |
| BO13 | Minuteurs J, Compagnon p2a, Activité, Plafonds IA, Saisie rapide, Nouvelle version, Connexion | garder | Inchangés ; la saisie rapide lancée d'une semaine prend sa date. |

## Actions adaptées

Finances
- Nouvelle écriture : un toucher sur + ouvre le scan ; date de la semaine si posée depuis la frise ; la `dueDate` lue pose l'échéance. Menu à l'appui long.
- Payer une facture : toucher l'échéance, « payé » daté du jour au montant restant : 2 gestes ; Annuler 5 s par contre-écriture. `PaymentSheet` pour le partiel.
- Modifier une échéance : glisser, `updateTransaction` avec `dueDate` seul ; le reste dans `TransactionDetails`.
- Prévoir une dépense : m3pr-c pré-remplie (+ de rangée Récurrent ou menu).
- Projet d'achat : en-tête de rangée Achats → m3pm-d ; glisser la barre écrit la fenêtre par `FinanceService` ; plus d'« Accepter le devis » : le scan relie.
- Budget d'un brassin : barre du brassin → m4bb-a.
- Comparer les mois : segment An, toucher un mois.
- Caisse d'ouverture : chiffre clé → m4pf-c.
- Clôture, TVA, immobilisations : Annuel ; échéances lues sur la frise.
- Hors ligne : écriture en file, état sur la chose ; cache de plus de 30 jours → « à rafraîchir », jamais 0.

Brassins
- Brassin (+ de section) : d1b au prochain créneau (cuve libre, stock complet) ; Annuler 5 s ; refus hors ligne affiché sur la barre (C5).
- Déplacer un brassin : glisser, aimant à la semaine, cascade en aperçu ; brassin commencé : `data-ro`.
- Changer de statut : « fait » sur la phase en cours, daté (M2) ; transitions arrière dans la fiche.
- Conditionner : « fait » sur la garde ouvre le conditionnement ; fûts propres d'un toucher ; R1 pour les fûts.
- Allonger la garde, décaler le dry hop : tirer le bord, glisser la perle (`ajustementsPhases`).
- Starter : glisser l'ensemencement visé ; toucher une étape la marque faite.
- Conflit de cuve : « décaler en S50 » d'un toucher.
- Densité : dans la fiche, valeur proposée.
- Dupliquer ou rendre récurrent : appui long ; série en puces (C6).
- Nouvelle recette, Nouvelle idée, import, export, volumes : inchangés dans leur sous-onglet.

Besoins et achats
- Commander · <fournisseur> : copie, « commandé » daté, livraison attendue ; Annuler 5 s.
- Livraison reçue : « reçu » ouvre le scan ; mouvements de stock, livraison close, échéance posée.
- Achat ou travaux : case de la rangée, lien collé, voix ; un seul plan (`mergeUpgradePlans`).
- Besoin ou idée : créé dans le carnet, daté de la case.
- Facture fournisseur : scan ; glisser l'échéance n'écrit que `dueDate`.
- Payer une facture échue : 2 gestes, contre-écriture pour annuler.
- Déplacer un brassin vu d'ici : permis ; un jalon calculé ne se déplace pas.
- Seuil et délai fournisseur : réglés une fois ; les jalons se recalculent.
- Veille de prix : reste au carnet ; sur la frise, pastille sur un achat déjà posé seulement (contradiction L6 / L17 signalée, lecture étroite).
- Fusion de noms de fournisseurs : aperçu, rien sans son accord.

Atelier et matériel
- Entretien fait : toucher la perle, daté du jour, Annuler 4 s ; échéance suivante recalculée.
- Reporter : glisser l'échéance pose un report pour cette fois seulement.
- Panne, puis Réparée : appui long ; plage « en panne depuis », conflits visibles.
- Nouveau matériel : + « Sur Matériel » ; proposé aussi quand un projet passe à Réalisé.
- Retirer : geste daté de la fiche ; supprimer reste derrière confirmation.
- Projet de matériel, tâche, activité ou chantier : rangées de pose ; puces ; clavier en dernier.
- Échéance réglementaire : « fait » d'un toucher, la suivante recréée.

Stock et fûts
- Commander ce qui manque : feuille pré-remplie, écrite par la porte du groupe 3 ; le manque passe à couvert.
- Recevoir une livraison : « reçu » → scan.
- Nouvel article, Nouveau fût, Nouvelle variété : inchangés dans leur sous-onglet.
- Corriger l'inventaire : fiche article.
- Remplir des fûts : pastille sur la fin de garde → R1 pré-rempli.
- Livrer un fût : + de rangée ou glisser ; vente pré-remplie, décochable ; reprise posée.
- Retour d'un fût, marquer propre, Tout marquer propre : un toucher ; Tout marquer propre reste dans KegBoard.
- Levure périmée : pastille sur le brassin.

Ventes et clients
- Vente ou livraison : bulle sans clavier ; prévue → livrée → facturée → payée, sans retaper.
- Livrer un fût, Facturer, Encaisser, Fête ou marché : comme ci-dessus, 2 gestes au plus pour payer.
- Nouveau client, Nouveau tarif : inchangés ; « autre… » seul ouvre le clavier ; retour à la bulle.
- OFDF : « déclaré » puis « payé » ; copie et Taxas restent dans Impôt bière.
- Appeler, WhatsApp : fiche client, et appui long sur une vente de la frise.
- Relancer un client dormant : proposition acceptée d'un toucher.

Accueil et transversal
- + de Bord : Nouvelle écriture en tête de « Partout » ; « Sur Bord » : poser aujourd'hui.
- Cocher une tâche ou une démarche : « fait » daté ; migration des coches.
- Rechercher : r3p2, puces d'abord.
- Période : une plage, écrite par l'en-tête et les segments.
- Épingler, étoile, filtrer : appui long ; épingles visibles sur Bord et au général.
- Résoudre un conflit : « décaler » d'un toucher, cascade, Annuler.
- Notification : actionnable.
- Sauvegarder, restaurer : couvrent les données neuves.

## Aucune perte

| Fonction retirée ou déplacée | Sa nouvelle place |
|---|---|
| Frise `FinanceForecastSummary` | Tête de fb (chiffre, courbe, rangée collée) dans Finances › Calendrier |
| Horizons 30 j / 90 j / 12 mois | Segments 6 sem. / 3 mois / 6 mois / An, raccourcis de la plage s2ap2 |
| Comparer les mois (`FinanceComparisonChart`) | Segment An, toucher un mois, même tableau |
| Bascule timeline / projets (`finances_workspace`) | Sous-onglet Calendrier ; ancienne valeur basculée, aucune perte |
| Liste des projets (`UpgradeWorkspace`) | Rangée Achats et travaux, et m3pm-d tel quel par l'en-tête de rangée |
| Warnings de prévision | Pastille sur la semaine |
| Compte des sans-date | Poche « sans date » |
| Lien vers les paiements inconnus | Pastille de la poche, Opérations filtré unknown |
| « Ajouter une prévision » | + de rangée Récurrent → m3pr-c |
| « Budget d'un brassin » (lien du hub) | Barre du brassin → m4bb-a |
| « Solde et paramètres » (lien du hub) | Chiffre clé → m4pf-c ; aussi dans Finances |
| Formulaire de date de planification (`saveBatchSchedule`) | Glisser la barre, ou d1b au créneau |
| Liste des brassins planifiés en tête de Brassins | Rangée Brassins ; mode liste |
| Messages de conflit de cuve dispersés | Pastille sur la barre et Maintenant |
| Liste figée de Courses | Mode liste du calendrier ; Copier gardé |
| Intention `copyShoppingList` du + | « Commander · <fournisseur> » ; Copier tout au menu du mode liste |
| Filtre « À traiter » de Matériel | Maintenant et filtre d'état ; liste za3 inchangée |
| Frise À faire de l'Atelier | Rangée Tâches ; l'onglet À faire ouvre le calendrier filtré |
| Collection `planning` (sans écran) | Rangée Activité |
| Carte « Échéances et démarches » (texte en dur) | Échéances récurrentes ; texte dans leur fiche ; coches migrées |
| Carte Agenda de Bord | Maintenant de Bord et calendrier de l'Atelier |
| « Dernière vente » figée de la fiche client | Gardée ; le passé se lit aussi sur la frise |
| Champ `maintenance` en texte libre | Gardé en note dans la fiche |
| `PaymentSheet` au cas courant | « payé » d'un toucher ; la feuille reste pour le partiel |

Aucune collection n'est supprimée ; aucune vue choisie n'est retirée ni redessinée.

## DÉCISION À PRENDRE (pilote)
- Inscrire au registre les choix listés en tête (Finances 8 vues, fb, f1, t1b2, kh1r, kyh1, s2ap2, m3, d3p2, r3p2, za3, d1b, kxc, kx2r1, KegBoard, F2, R1, p2a), puis rejouer `controle-choix`.
- Les places (sous-onglet, tête de section, fusion Bord), le chiffre clé des Courses (A, B, C), l'action de Matériel (Entretien fait ou Nouveau matériel) et l'écart 5 / 24 des Stocks : à lui, en mini maquettes.
