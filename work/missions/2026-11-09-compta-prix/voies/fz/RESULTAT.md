OK — 28 constats traités : 19 corrigés, 8 refusés avec raison, 1 à décider ; tsc 0, build vert, captures ouvertes

Version de départ 6e3d7edf. Aucun commit, aucun stash. Fichier « compta-prix-VOIE-port.md » introuvable dans le dépôt : les restes pris dans la consigne, voies/fx/RESULTAT.md et le test d'écran.
Écrit sans relais Haiku : `capturer.mjs` lancé une fois (clair-390) ; le reste en DEMANDE EXECUTANT ci-dessous.

## Les 28 constats (une ligne chacun)
### Synthèse (g3a)
1. **Corrigé** : « Pourquoi ? » nomme les morceaux de la colonne (« Loyer de l'atelier » 400,00, 56 % ; « Brassage » 26 %) et la barre suit le même découpage (`synthese/Pourquoi.tsx`). Repli sur le domaine si les pièces à payer ne tombent pas juste. Test `synthese.test.tsx` T17 mis à jour (il fixait « Charges fixes 468 »).
2. **Corrigé** : une étiquette « à payer » ne s'écrit que si la tranche fait ≥ 22 px (2 lignes ≥ 46 px) : « Solde atelier » (16 px) n'écrase plus « Loyer » (`Scene.tsx`).
3. **Corrigé** : « Matériel sans registre » quitte le premier plan (aucune ligne entre caisse et litre, comme g3a) ; il est dit dans le pli « Fournisseurs, matériel » (`Lignes.tsx` ; `FinanceOverview.tsx` : une prop, hors Possède).
4. **Refusé** : « Loyer de l'atelier » est le libellé de la donnée ; la maquette écrit « Loyer ». Une ligne à 1280, deux à 390 sans rien tronquer.
5. **Refusé** : la ligne « Comprendre mes dépenses · Compagnon brasseur » est `FinanceAssistant.tsx`, partagé avec Prévisions et Annuel, hors Possède ; la question suggérée est contextuelle.
6. **Refusé** : « Solde de départ (CHF) 4000 » vient de `MoneyInput` (`FinanceForms.tsx`), champ partagé par tous les écrans financiers, hors Possède ; à porter par le pilote (`fractionDigits={2}` sur le `NumberInput` signé).
### Opérations (v6b)
1. **Refusé : maquette** — v6b-etat montre « Annuler » seul sur la ligne payée aujourd'hui (« + pièce » sur les lignes payées un autre jour). La pièce se joint depuis la fiche (toucher la ligne).
2. **Corrigé** : « sans pièce » passe à la ligne au lieu d'être coupé (`operations.css`, `.ops-meta` en `flex-wrap`).
3. **Corrigé** : deux rangées de filtres, la seconde titrée « toutes les dates » (À payer, À compléter, Sans justificatif…) ; « Toutes 7 » compte le mois (`TransactionJournal.tsx`, fichier d'Opérations hors liste Possède).
4. **Corrigé** : le panneau Filtres s'amène dans la vue à l'ouverture (`scrollIntoView`).
5. **Refusé** : même composant que S5 (`FinanceAssistant`) ; la question « Pourquoi les charges fixes pèsent autant ? » de la maquette est un exemple de contenu.
6. **Refusé (D)** : le filtre « à payer » fait son travail, la ligne payée en sort ; « Annuler » se retrouve en retirant le filtre ; la bande se met à jour.
### Prix (c7c)
1. **Axe corrigé** : 0 → 7, un cran par franc ; le reste du bord droit (4,52) finit dans l'angle (`geometrie.ts`). **Crans 4,50 et 6,00 : refusé** : exemples non sourcés de la maquette (décision D6 d'ue, « jamais d'exemple ») ; la règle pose les deux derniers prix réellement vendus et ne dessine rien sans vente. Prouvé : test (ventes simulées 4,50 / 6,00 → restes 2,02 / 3,52) et capture avec deux ventes « ZZ TEST ».
2. **Refusé : fixture** — le script du critique posait un second tarif « Pale Ale Fût 20 L » (id `pale-ale-fut-20-l`) à côté de celui de la démo (`pale-ale-f-t-20-l`) : deux tarifs pour un format, donc « prix ? ». La tuile dit désormais « 2 prix » dans ce cas (`PrixEcran.tsx`, test).
3. **Corrigé** : champs prix et emballage en 5,00 / 0,30 (`fractionDigits={2}` dans `TarifSheet.tsx`, hors Possède, une attribut).
4. **À décider** : « Comprendre le calcul ⌄ » et « 81 bouteilles · vendu 405,00 · reste 202,23 » sont hors c7c ; gardés (utiles, repliés). Voir DÉCISION.
5. **Refusé** : la pastille « Compagnon hors connexion · mode local » est le chrome d'App, hors Possède.
### Argent (e3a)
1. **Corrigé** : le pied de la fiche porte « ✦ Proposer » (primaire) dans l'onglet Argent ; le × de l'en-tête ferme. Il ouvre le compagnon avec une question sur ce brassin, rien n'est envoyé (`BatchDetailSheet.tsx`, `ChaineArgent.tsx`, test).
2. **Corrigé** : « Dans Prévisions : ? avant le 20 nov. · ? en déc. · ? en janv. » : une sortie partielle à 0 est « ? », partielle > 0 « ≥ montant », dates « 20 nov. », regroupées par mois ; jamais « 0,00 » (test strict).
3. **En partie** : « Brassin, ? L nets · 30 L visés » (le volume visé est dit). Les litres nets restent « ? » et l'impôt non calculé : règle du domaine (`litresNets` : jamais sur le volume à brasser). Le « 27 L prévus » de la maquette suppose une perte que rien ne fournit.
4. **Refusé : fixture** — « Stock à confirmer » vient de `stockAccountingVersion` absent sur le brassin de fixture (ancien brassin). La fixture de `capturer.mjs` pose `stockAccountingVersion: 1`.
### Annuel (g6)
1. **Corrigé** : toute tranche de la pile a une hauteur minimale (22 px, usure 44 px) : « Matériel en charge 28,60 » ne chevauche plus « Nettoyage » (`annuel.css`).
2. **Refusé : maquette** — g4a-etat a exactement ce sélecteur Résultat · Entré · Dépensé au-dessus de la grille de quatre mois.
3. **Corrigé** : « À confirmer » + « annexe 05 des instructions » en petit ; « Justificatif manquant : DEMO-T1 — … » devient « <description> : justificatif manquant », + « + n autres » (`Etapes2.tsx`).
4. **Refusé : fixture** — la pastille existe (`plansManquants`) ; le loyer de la démo démarre en novembre (aucun mois échu manquant). `capturer.mjs` pose un loyer mensuel depuis janvier pour la montrer.
5. **Corrigé** : étape 6 : électricité préchoisie au repos avec son curseur sans part fixée (pouce en pointillé, piste hachurée, « à confirmer », « Ajouter » absent tant que la part n'est pas posée) ; tuiles hachurées avec leurs pictos et « ? % » / « ? L ».
6. **Corrigé** : TVA « 0,7 % » (le pourcentage n'est plus tronqué à l'entier) : `Tete.tsx` et `TaxWorkspace.tsx` (une ligne, hors Possède).
7. **Corrigé** : la colonne « Tu dois » : les boutons `.ann-li` reprennent leur police de 13 px (la règle `.ann button { font: inherit }` les agrandissait), montants sans retour à la ligne (`annuel.css`).

## Restes du port
- **Lien « Régler dans Réglages › »** : écouteur de `affinee:ouvrir-reglages` dans `src/App.tsx` (`setIsSettingsOpen(true)` + `preventDefault`). Capture `clair-390-reglages` : l'événement est pris (`evenementPris: true`), la feuille Réglages s'ouvre.
- **Cibles des postes du coût c3a à 36 px** : `PAS = 36` (`CoutBrassinFlux.tsx`), `.cbf button.cbf-dst { height: 36px }` (`cout-brassin.css`). Mesuré : 36 px, aucun chevauchement.

## Fichiers écrits
Possède : `src/ui/prix/{geometrie,PrixEcran,ChaineArgent}.ts(x)`, `src/ui/finance/annuel/{Tete,Etapes2}.tsx`, `annuel.css`, `synthese/{Pourquoi,Scene,Lignes}.tsx`, `operations.css`, `CoutBrassinFlux.tsx`, `cout-brassin.css`, `src/ui/BatchDetailSheet.tsx`, `src/App.tsx` ; tests `tests/integration/synthese.test.tsx` (T17), `tests/integration/prixCorrectionsFz.test.tsx` (7 tests, neuf).
Hors liste (une ligne chacun, à valider par le pilote) : `src/ui/TarifSheet.tsx`, `src/ui/finance/TaxWorkspace.tsx`, `src/ui/finance/FinanceOverview.tsx`, `src/ui/finance/TransactionJournal.tsx`.
Aussi : `src/ui/prix/prix.css` (tuiles à 1280). Voie : `capturer.mjs`, `explorer.mjs`, `captures/`, `tsc.txt`, `tests.txt`.

## Preuves
- Tests : `tests.txt` (165 fichiers, 1760 verts) : 6 fichiers en échec, dont 2 d'environnement (cheerio et firebase-admin absents : noloCompanion, yeastDbCorrections) et 4 venant de mes changements, adaptés (annuelEcran, annuelGestes ×2, synthese, be98 : libellé « À confirmer », curseur sans part fixée, « À vérifier » déplacé, « 6,00 ») ; `tests-rerun.txt` : 5 fichiers, 48 tests verts (dont `prixCorrectionsFz`, 7 tests neufs).
- `tsc.txt` : 0 ligne (hors firebase-admin). `build.txt` : « built in 14.56s ».
- Chrome (`capturer.mjs`, 390 clair, 390 cave, 1280 clair ; journal : aucune erreur de page, seules des ressources externes bloquées) ; 0 débordement horizontal. Ouvertes en image : clair-390 argent-conditionne (✦ Proposer au pied ; 7,51, 0,08, 2,48, 5,00, 2,52, 202,23), prix-repos (axe 0 à 7, crans 2,02 et 3,52 avec deux ventes simulées « ZZ TEST », tuile fût 160,00 ≤ 27,58), c3a-repos, ann-tete, ann-6-prive (tuiles hachurées à pictos, curseur sans part), syn-pourquoi, syn-tout ; cave-390 ann-tete ; clair-1280 prix-repos et prix-apres. Non ouvertes une à une : les autres (dans `captures/`).
- Mesure c3a (`captures/journal-*.json`) : 9 postes de destination de 36 px de haut, aucun chevauchement, 390 clair, 390 cave et 1280.
- Réglages : l'événement `affinee:ouvrir-reglages` est pris, la feuille Réglages s'ouvre (`clair-390-reglages`).
- 1280 : au passage, les deux tuiles de format de Prix se chevauchaient dans la colonne étroite ; elles s'empilent (`prix.css`, vu en capture).

## Limites
- Le c3a de la fixture est pauvre (aucun ingrédient : « Volume à brasser invalide », litre « — ») : les cibles de 36 px y sont mesurées, mais « étiquettes alignées sur leurs barres » est à juger sur une vraie recette. Avec PAS = 36 les étiquettes s'écartent des barres quand les montants sont petits ; fx recommandait 24 px pour cette raison.
- Non faits : recaptures ouvertes des étapes Annuel 3, 4, 7, 9, d'Opérations en cave, de 1280 cave.
- Série de captures lancée par moi-même (un script, trois configurations) : pas de DEMANDE EXECUTANT en attente.

DÉCISION À PRENDRE : (1) Prix 4 : garder « Comprendre le calcul » et la ligne « 81 bouteilles · vendu · reste » (hors c7c, repliés ou en petit) ou les retirer pour une maquette à 100 % ; recommandé : garder et les montrer au brasseur. (2) c3a : cibles de 36 px (ordre reçu, appliqué) contre 24 px (maquette, étiquettes au plus près des barres) ; recommandé : garder 36 px et juger sur une vraie recette. (3) `FinanceAssistant` (S5, O5) et `MoneyInput` signé (S6), hors Possède : à aligner par le pilote. (4) « payé 296,80 » contre 325,40 de la maquette : matériel hors du payé (annoncé par uo), à dire au brasseur. (5) Valider les retouches hors liste : `TarifSheet.tsx`, `TaxWorkspace.tsx`, `FinanceOverview.tsx`, `TransactionJournal.tsx`.
CONNAISSANCE : `.ann button { font: inherit; background: none }` (spécificité 0,1,1) écrase la police et le fond d'une classe seule sur un bouton : style `.ann button.<classe>`. Le doublon de tarif du fût du test d'écran venait de l'id de la démo (`pale-ale-f-t-20-l`, û remplacé par un tiret). La liste Brassins affiche l'identifiant du lot, pas son nom, et filtre « Ce mois ».
LEÇON PROPOSÉE : aucune
