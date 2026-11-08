OK partiel — voie d (Stocks) : règles d'inventaire, suppression, seuil, durabilité, listes ; reste = fichiers d'autres voies et choix de goût

Branche worktree-agent-a9b7872fd8f0dd80d. Commits : 8c1490eb (règles + service + fiches), 9c5b20d5 (fût, catégories, champs fautifs, index houblon), puis le commit « comparaison lisible » (voir `git log`).
Tests : tests/unit/stock/defautsStocks.test.ts (22) et tests/integration/defautsStocksEcrans.test.tsx (11) neufs ; rejeu de 30 fichiers de stock, 729 tests verts ; `tsc` sans erreur nouvelle (seedData, pdfjs, zxing, firebase-admin manquent dans cette copie, hors voie).
Règles neuves, une seule maison : `src/domain/stock/regles.ts` (motifs d'inventaire, liens d'un article, fiche à enregistrer, seuil, durabilité, virgule, quantités lisibles, résumé d'index).
Fichiers hors « Possède » touchés, par nécessité (fusionner avec soin) : EntityList.tsx, Combobox.tsx, QuantityStepper.tsx, KegBoard.tsx, EquipmentSheet.tsx, InventoryCorrectionSheet.tsx, IngredientPicker.tsx, hopIndex/{HopIndexPanel,HopIngredientPicker,HopTastingsPanel,HopKnowledgePanel}.tsx.

id | verdict
---|---
TE-23 | corrigé (8c1490eb/9c5b20d5) : `refAffichable` cache `FICHE-…%3A…`, virgule suisse, « α » ; HopIngredientPicker et IngredientPicker
AM-36 | déjà corrigé (preuve : test « AM-36 » de defautsStocks.test.ts — annulé ⇒ `pendingStockSummary`=0, `allocatedBatches`=[], `shortfall`=0 ; les ajouts restants ne sont jamais déduits du physique, donc rien à rendre). Reste : le texte de `batchTransitions.ts` l. 73 (« ne sont pas libérés automatiquement ») est faux ⇒ reste (fichier d'une autre voie : voie b)
AM-54 | corrigé (8c1490eb) : `motifsAdmis`/`verifierCorrection`, motifs de perte éteints si compté > théorique, service refuse (null) ; test
AM-55 | corrigé (8c1490eb) : `liensArticle` (brassins réservant, recettes citant par réf. ou nom), bouton éteint + phrase, `deleteStockItem` refuse ; test
AM-56 | corrigé en partie (8c1490eb) : champ « À utiliser avant (DDM) » (`yeastLot.expiresOn`) sur la fiche Levure, « Périmé depuis N j » dans la fiche et la ligne. Reste : l'alerte au moment de brasser (BrewWizard / `brewStockConsumption.ts`) — `statutDurabilite` est prête ⇒ reste (fichier d'une autre voie)
TE-45 | corrigé (9c5b20d5) : bouton « Ajouter un fût » dans la barre de la liste (la création FAB existait). Contraste du segment « Tous · 4 » sélectionné : non traité (défaut n° 1, thème) ⇒ reste
TE-46 | corrigé (8c1490eb) : référence automatique EQ-<uuid> cachée dans la fiche matériel
TE-47 | corrigé (8c1490eb) : prix ≥ 0, message, Enregistrer éteint ; test
TE-49 | goût (premier plan de la fiche Nelson Sauvin : quoi garder, quoi replier, quels mots — à montrer en mini maquettes)
TE-51 | corrigé (9c5b20d5) : « Nouvelle variété » ne préremplit plus un nom qui existe (nom ou alias) ; le « premier clic sans effet » n'a pas été reproduit en test (non vérifié dans Chrome)
TE-53 | goût (bandeau de l'atelier V5.5 : prose de développeur, à réécrire avec le brasseur) ; fichiers hopIndex V5.5 ⇒ aussi reste
TE-54 | goût (idem TE-53)
BR-69 / BE-89 | corrigé (8c1490eb) : la ligne ne change de place qu'1,2 s après le dernier appui (EntityList), l'étoile change tout de suite ; `toggleFavorite` écrit en fusion (ne touche plus la quantité) ; test
BR-92 | corrigé (9c5b20d5) : Combobox bornée au conteneur défilant (plus sous l'en-tête de la feuille) ; vu en jsdom seulement, pas en Chrome
BR-96 / BE-49 | reste (fichier d'une autre voie : QuickActionModal.tsx « Préparer un brassin », volume 99999 L) ; `plafond` à brancher
BR-107 | corrigé (dernier commit) : les ajouts de référentiels disent « N fiche(s) ajoutée(s) » ou « Rien à ajouter » (le message existait mais pas pour « conventions », ni à 0)
GE-NOTE-1 | goût (décision à confirmer par le brasseur : seuil exact ⇒ « À commander » avec « à définir »)
AM-NOTE-3 | non reproduit tel quel : `AddStockItemModal`/`EditStockItemModal` ne sont importés nulle part (code mort, comme dit) ; `EditBatchModal` idem ; rien supprimé (interdit sans accord) ⇒ reste : suppression à valider
AM-53 | corrigé (8c1490eb) : `saveStockItemFiche` + `ficheAEnregistrer` (fusion à trois : seuls les champs changés ; kg→g convertit le stock VIVANT). Limite : écriture du document entier avec la quantité du moment (fenêtre de quelques ms, pas une transaction) ; le brouillon se rebase déjà sur les mises à jour (`useSyncedDraft`)
MV-43 | corrigé (8c1490eb) : `verifierSeuil`, plafond 1 000 kg / 1 000 000 g, message sur le champ ; test
TE-41 | reste (fichier d'une autre voie : BatchDetailSheet.tsx, bandeau de stock répété)
TE-48 | non reproduit : la feuille « Matériel déjà possédé » s'ouvre sans message (test defautsStocksEcrans)
TE-50 | corrigé (9c5b20d5) : « 136 références · aucun lot » (`resumeIndexHoublon`) ; test
TE-52 | goût (vocabulaire de développeur de « Sources et modèles » : quels mots, quoi replier)
BR-27 | reste (fichier d'une autre voie : assistant de brassin, budget)
BR-70 / BE-90 | corrigé (8c1490eb) : la liste remonte en haut au changement de filtre ou de recherche (`resetKey`) ; vu en jsdom seulement, « à confirmer » du registre reste
BR-71 / BE-91 | corrigé (8c1490eb + dernier commit) : « 3,5 EBC », « α 11,5 % », boutons du stepper « +0,5 / −0,5 » ; test sur la fiche
BR-72 / BE-92 | corrigé (dernier commit) : `quantiteLue` (123 g, 57 g, 4,12 kg) dans la comparaison de recette ; l'affichage seul est arrondi ; test
BR-73 / BE-93 | corrigé (9c5b20d5) : même cause que BR-92 (liste vers le haut). Le « texte tapé dans Nom ne filtre pas la liste » : attendu (champ distinct), non reproduit comme défaut
BR-74 / BE-94 | corrigé (8c1490eb) : message « Rien ne correspond » coupé (`break-words`, `overflow-wrap:anywhere`) ; test de classes seulement, mesure 390 px non faite
BR-75 / BE-95 | goût (« Stock » ou « Stocks » : nom de l'écran et du sous-onglet à choisir)
BR-76 / BE-96 | corrigé (8c1490eb) : même règle que MV-43 (99 999 kg refusé)
BR-94 | corrigé (8c1490eb) : date d'achat AAAA-MM-JJ lue dans le champ et dans le résumé ; test
BR-95 | corrigé (8c1490eb) : même cause que BR-74 (liste partagée)
BR-108 | corrigé (9c5b20d5) : champ marqué « Indique le nom de la variété », « Indique la bière dégustée », « Indique la date »
BR-109 / BE-80 | corrigé (9c5b20d5) : carte « Explorer le catalogue » réduite à un bouton d'une ligne ; hauteur non mesurée en Chrome
BR-110 | goût (titre « Index houblon » au 1280 seulement : un nom, un contenu pour les deux largeurs)

DÉCISION À PRENDRE : BR-75 (nom « Stock » / « Stocks »), GE-NOTE-1, TE-49/52/53/54/BR-110 (prose et premier plan des houblons) — à montrer en mini maquettes ; ma recommandation : « Stocks » partout, sous-onglet « Articles ».
CONNAISSANCE : un article « FICHE-<catégorie>%3A<nom> » est une fiche apprise à quantité 0, jamais une référence à montrer.
LEÇON PROPOSÉE : une règle de stock (motif, seuil, suppression) s'écrit une fois dans le domaine et le service d'écriture l'appelle aussi : l'écran seul laissait passer ce que le service acceptait.
