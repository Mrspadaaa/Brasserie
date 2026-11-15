# Revue A (métier et fidélité) — plan de la voie us, port de g3a (Synthèse)

Relecteur sans mémoire, 09.11. Lu : us/VOIE.md, PLAN.md, DECISIONS.md ; uo/PLAN.md et DECISIONS.md (croisement) ; COMMUN.md ; `p2/g3a/` (NOTE.md, etat.html, g3a-page.png ouverte) ; `FinancesTab.tsx`, `FinanceOverview.tsx`, `ledger.ts`, `annual.ts`, `chaineLitre.ts`, `financeDemo.ts`, `tests/integration/soldeDepartVisible.test.tsx`. Gravité : B bloquant (corriger le plan avant le code), G grave (corriger ou trancher avant le code), D détail.

## Verdict : OK avec réserves — 1 B, 8 G, 5 D. Le plan est solide sur l'inventaire des éléments et des états de g3a, sur les centimes entiers, sur « inconnu ≠ 0 » et sur le sort de chaque bloc de l'ancien écran. Il ne doit pas partir au code tant que US-1 (le « dépensé » calculé deux fois) n'est pas tranché, et que les affirmations fausses sur l'Annuel (US-2) ne sont pas corrigées.

## B

**US-1 (B) — « Dépensé », « matériel à part » et « payé » existent en deux calculs, un par voie : le brasseur verra deux résultats sur la même donnée (problème 2 qu'on prétend corriger).**
- Preuve : us PLAN § 4.1 (l. 76-81) : pièces dont la date est dans le mois ; matériel = lignes `equipment` non passées en charge, ou catégorie `materiel`/`renovation` sans lignes ; « payé » = dépensé − hachuré (296,80 + 400,00 = 696,80, g3a NOTE « payé 296,80 + à payer 400,00 = dépensé 696,80 »). uo PLAN § 2.1/§ 3.1 (l. 53-55, 85-88) : `pilesDuMois` calcule à part ; matériel = catégories `materiel` et `renovation` (une ligne `kind==='equipment'` va en `materiel` même si `capitalTreatment==='expense'`) ; périmètre = mois **plus** les ouvertes non échues d'autres mois (uo § 2.3, l. 72) ; « payé » inclut le matériel (325,40 ; après ✓ Payé 725,40 pour « dépensé 696,80 »). us DECISIONS D2 place `periodeSynthese` dans `src/domain/finance/` pour le Bord et l'Annuel, mais uo/DECISIONS.md ne dit pas à uo de l'appeler.
- Écart concret sur la fixture de la démo, si une facture d'octobre non échue (ou une ligne matériel passée en charge) existe : Synthèse et Opérations n'affichent pas le même « dépensé ».
- Attendu : une seule fonction (`periodeSynthese` ou son prédicat « matériel à part » et sa règle de périmètre) appelée par les deux voies ; uo lit ses piles dans ses `postes`. Un test commun : Synthèse `depenseCents` = légende « dépensé » d'Opérations, sur la fixture de la maquette et sur un cas avec ouverte d'un autre mois. Écrire la décision dans les deux PLAN (le pilote tranche : périmètre mois strict, les ouvertes d'ailleurs restant listées mais hors piles).

## G

**US-2 (G) — Le plan dit « comme l'Annuel » pour le matériel ; c'est faux, et la contradiction P2 reste.**
- Preuve : us PLAN § 1 (ligne P2, l. 15), § 4.1 (l. 79 « même règle que `annual.ts:125-133` »), § 8 (l. 139 « comme l'Annuel »). `annual.ts:128` : sans ligne `equipment`, `capex` = somme du registre d'immobilisations (+ avoirs ajustés), pas la catégorie. La catégorie `materiel`/`renovation` sans lignes ne fait que produire l'alerte `annual.ts:134` (« confirmer charge ou immobilisation ») et reste une **charge**. Sur la démo (joints 28,60, catégorie `materiel`, sans lignes, aucun actif) : Synthèse « 28,60 à part », Annuel « 28,60 charge ». L'Annuel applique aussi `businessUsePct` (`annual.ts:116, 129`), le plan non.
- Attendu : réécrire les trois phrases (la règle de g3a, nombre de la maquette, est la catégorie ; l'Annuel ne la suit pas), lister l'écart pour le pilote (alignement futur par D2) et le dire dans « À vérifier » quand une pièce est rangée à part sans registre (comme `annual.ts:134`). Ajouter un test de non-régression nommant l'écart.

**US-3 (G) — Avoirs : la règle laisse la pile et l'en-tête se contredire, et le matériel et l'imputé ne sont pas traités.**
- Preuve : PLAN § 4.1 (l. 77) « un avoir ne dessine jamais de segment négatif, il diminue `depenseCents` » sans dire quel poste baisse ; T6 (l. 99) ne vérifie que `depenseCents=13000`. L'invariant « Σ postes + matériel = Σ montants » (l. 78, T1) casse dès qu'un avoir existe. L'Annuel impute l'avoir à la catégorie de la facture d'origine (`annual.ts:116-118`) et, si l'origine est du matériel, diminue le capex (`annual.ts:105-110`). Avoir imputé (`refundApplication==='offset'`) : `paymentState` réduit déjà le reste de la facture d'origine (`ledger.ts:93-106`) : risque de double réduction du hachuré. Avoir d'une facture d'un autre mois : aucune règle.
- Attendu : poste de l'origine (écrêté à 0), reliquat dans « À vérifier » ; avoir sur matériel réduit le matériel, pas le dépensé ; l'en-tête = Σ des segments dessinés ; tests T6b (hors période), T6c (matériel), T6d (imputé, hachuré non réduit deux fois), T6e (avoir client `out`).

**US-4 (G) — Colonne Entré : le libellé « Vente au marché » est le libellé d'une pièce ; aucune règle pour 0, 1 ou n ventes.**
- Preuve : PLAN § 2 E2a (« libellé de la pièce »), § 4.1 (`entre: {…, libelle}` sans règle). La maquette n'a qu'une vente. Un vrai mois en a plusieurs (g3a-page.png : une seule pile unie, un seul texte).
- Attendu : règle écrite (une vente → son libellé ; n ventes → « n ventes », sans empiler) et test ; même règle pour la partie hachurée « à encaisser » (S10) et sa légende (la légende ne mentionne aujourd'hui que « à payer »).

**US-5 (G) — Seule la perte à Entré = 0 est dessinée ; le cas courant « dépensé > entré, entré > 0 » n'a pas d'état.**
- Preuve : PLAN § 2 S2 (entré 0, « Perdu −28,00 ») ; § 4.2 `echelle()` : « écart minimum 10 px » sans dire sur quelle colonne l'écart se pose ni sa couleur ; T20 (l. 113) ne couvre pas entré < dépensé. g3a NOTE : annexe octobre seulement.
- Attendu : état S2b défini dans la langue de g3a (écart pointillé rouge, « Perdu −X » rouge, colonne la plus haute = échelle) ; gain nul (« 0,00 » : mot neutre, ni « gagnés » ni « Perdu ») ; T20 étendu : entré < dépensé, entré = 0, dépensé = 0, gain = 0. Le gabarit du « Pourquoi ? » (T17, `explication`) doit aussi dire quoi faire sans entré (division) et avec perte (barre de parts ≠ 100 % avec « gain »).

**US-6 (G) — La pile Dépensé : ordre mal décrit, pas de plancher de hauteur, pas de règle pour plusieurs impayés ni pour un impayé multi-catégories.**
- Preuve : PLAN § 2 E2b (« empilé du plus petit au plus gros (Nettoyage 42 · Brassage 186,80 · Électricité 68,00) ») : l'ordre réel de g3a (etat.html, `flex:42`, `186.8`, `68`, `400`) n'est pas trié par taille : les charges fixes (violet) sont adjacentes au loyer hachuré, en bas. Aucune règle pour un poste de 3,50 sur 700 dans 290 px (< 2 px : libellé illisible, segment bouton sous les 24 px de la règle B12), ni pour 2 à 3 pièces hachurées, ni pour la couleur d'une pièce hachurée à lignes mixtes (la maquette la prend au violet des charges fixes).
- Attendu : ordre = catégories groupées, charges fixes puis hachurés en bas ; hauteur plancher et regroupement « Autres » sous un seuil ; hachuré par pièce, couleur de sa catégorie dominante ; test T2 sur une fixture à ≥ 7 postes, capturé à 390.
- Fidélité (D1, accepté) : « Électricité 68,00 » devient « Charges fixes 68,00 » à l'écran. Écart visible avec la maquette choisie : le lister dans RESULTAT.md pour le brasseur (pas seulement dans le PLAN).

**US-7 (G) — « Tout » et « archives » : l'affirmation du plan est contredite par le code.**
- Preuve : PLAN § 8 (l. 144) « `active` seulement, comme avant ; les années archivées restent dans l'Annuel ». `isActiveTransaction` ne teste que `voidedAt` (`ledger.ts:64`) ; l'archivage est un autre drapeau (`archive.ts:14`). L'ancien « Tout l'historique » (`FinancesTab.tsx:81`) **inclut** donc les années archivées. Le « tout » de g3a les incluera aussi sauf test contraire.
- Attendu : choisir (inclure et le dire sous le titre, ou exclure) et le tester (T13 avec une pièce d'année archivée). Dire aussi que « tout » somme des années entières dans une seule colonne (« Entré 120 000 ») : le segment « tout » est le plus risqué pour la lisibilité.

**US-8 (G) — Seuil de TVA : une alerte réglementaire passe en ligne repliée, sans test.**
- Preuve : PLAN § 3 (l. 58) et § 4.8 (l. 88) rangent « Seuil TVA » dans « À vérifier · n », repliée. `FinanceOverview.tsx:46-52` : `role="alert"` quand « Seuil de TVA franchi ». T1 à T20 : aucun test TVA.
- Attendu : niveau `over` visible hors repli (la ligne « À vérifier » rouge, ouverte ou son texte en clair) ; niveau `soon` dans la ligne ; test T21 (`over` → `role=alert`, lien « Voir les ventes » → Opérations `recettes`).

**US-9 (G) — BE-72 : le test visé est mal cité, l'information de date disparaît.**
- Preuve : PLAN T10 (l. 103) « Solde saisi : 1 000,00 CHF, à confirmer (reprend `soldeDepartVisible`) ». `soldeDepartVisible.test.tsx:12-14` exige deux phrases : « Solde de départ saisi : …à confirmer » **et** « Solde saisi : … au 08.11.2026, pas encore confirmé ». Le plan garde une seule forme sans date, ce qui affaiblit le test (le plan dit « même assertion »).
- Attendu : garder montant + date + ce qu'il reste à faire sous « En caisse » (S7) ; conserver le test tel quel, adapté aux seules props ; « Solde de départ à renseigner » (2ᵉ `it`) aussi.

## D

**US-10 (D) — Plan et décision du pilote divergent sur FinancesTab et sur l'emplacement de `periodeSynthese`.** PLAN § 4.7 (l. 87) : « N'édite aucune autre branche (journal…) ». DECISIONS.md l. 6-7 : fournir à uo `onAddProof`, `onPay`, `assistant` et retirer `{financeAssistant}` après le journal (`FinancesTab.tsx:141`). PLAN § 4 titre (l. 73) place le calcul dans `src/ui/finance/synthese/calcul.ts`, DECISIONS D2 dans `src/domain/finance/periodeSynthese.ts` avec son test unitaire. Attendu : mettre PLAN à jour, ajouter un test de présence des trois props dans la branche journal.

**US-11 (D) — Le fil pointillé du gain est posé en coordonnées fixes dans g3a (`top:45px`, `left:25%`) ; la maquette elle-même note « à 1280, le pointillé relie mal la pastille » (NOTE.md l. 7).** Avec une échelle calculée (§ 4.2), le haut de l'écart bouge. Attendu : ancrer le fil sur le bord de l'écart calculé ; capture 390 et 1280 avec gain faible et gain fort ; ne pas reproduire le défaut connu.

**US-12 (D) — L'inconnu est dessiné « payé » sans le dire dans la légende.** PLAN § 4.1 (l. 80) : état `unknown` compté plein, nommé seulement dans « À vérifier ». Sur des données d'avant l'app, tout le mois apparaît en plein. uo, lui, prévoit une ligne « à confirmer » dans la légende (uo l. 88). Attendu : même règle des deux côtés (légende « n à confirmer » ou signe sur la pile).

**US-13 (D) — Le litre « 7,51 » : une seule source à prouver.** PLAN § 4.4 (l. 84) lit le dernier `brewEstimate` enregistré ; Prévisions (`brewForecast.ts:154-157, 226-228`) lit l'instantané du brassin. Risque de deux « CHF/L » différents sur deux onglets. Attendu : test d'égalité sur la fixture (même brassin, même litre), et « estimé » écrit comme dans g3a.

**US-14 (D) — « Ce que dit l'IA » : le Compagnon.** PLAN § 3 (l. 69) fait ouvrir `BrewerChat` depuis E7 sans dire qui compose la question (contexte de `FinanceAssistant` / `assistantContext.ts`, hors Possède). Attendu : réemployer `FinanceAssistant` (sa question préparée, jamais envoyée seule) plutôt qu'un second constructeur ; T18 le vérifie.

## Ce qui est correct (prouvé)
Numéros de ligne cités du plan sur `FinancesTab.tsx` (117-122, 83-86, 95, 125) et `FinanceOverview.tsx` (37-44, 85) : exacts. `annual.ts:125-129` : le capex est bien en 128 (mais sa règle est mal décrite, US-2). Appelant unique `FinancesTab` : confirmé. `tests/ux-mobile/**` hors `vitest.config.ts` (include l. 61-66) : vrai, le plan a raison de le noter. Gemini : aucun appel prévu. Fixtures : jamais la donnée réelle.

LEÇON PROPOSÉE : deux voies de port qui affichent le même nombre (ici « dépensé ») doivent partager une seule fonction de domaine, déclarée dans les deux PLAN avant le code ; un test d'égalité entre les deux écrans sur la fixture de la maquette.
