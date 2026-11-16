OK — Les 9 problèmes sont corrigés dans le code, tests, build, typage et V6A verts ; captures des 9 points à faire par l'exécutant

REPRISE : reste seulement la section « DEMANDE EXECUTANT » (captures 390 et 1280, clair et cave, ouvertes ; non faites par l'auteur, contexte plein). Aucune capture de cette voie n'a été prise ni ouverte : la validation visuelle est NON effectuée.

## Fichiers écrits
- Bloquant 1 : `src/ui/finance/budget/budget.css`. Cause : `operations.css` range `.ops` en grille 400 px + 1fr dès 900 px (bande à gauche, liste à droite) ; la feuille du budget (`.ops.bbx`, pied `.ops.bbx-pied`) y tombait et son contenu se serrait dans la colonne de droite. Règle de colonne unique pleine largeur, comme celle déjà posée pour `.ops.cpg`.
- Bloquant 2 : `src/ui/finance/BrewBudgetSheet.tsx`. « Enregistrer » n'était montré que si le budget était incomplet ; il est au pied de tout brassin à venir, à côté d'Expliquer et de Prévoir (m4bb-a : Expliquer, Enregistrer, Prévoir).
- Bloquant 3 : nouveau `src/ui/finance/profil/brassinProfil.ts` + `src/ui/finance/profil/ProfilEffets.tsx`. Cause : la démo n'a aucun brassin planifié, seulement un budget « brassage » (plan DEMO-BUDGET, instantané avec net saisi 27 L) ; Prévisions le compte, le profil cherchait seulement les brassins. Maintenant : brassin planifié d'abord, sinon le prochain budget de brassin prévu, recalculé avec la production du brouillon (`estimateBrewBudget`, mêmes entrées que la feuille). Sans brassin ni budget, « aucun brassin planifié » reste dit.
- 4 : nouveau `src/ui/finance/ChampMontant.tsx` (« 3 250,00 » au repos, nombre brut à la frappe, mêmes refus que `ChampNombre`, négatif permis pour le solde) ; branché sur Solde de départ et Production prévue (`ProfilEffets.tsx`), Prix d'achat et Valeur 1er janv. (`bien/BienCuve.tsx`).
- 5 : `src/ui/finance/FinanceAssistant.tsx` : la question du brasseur est la première ligne du champ du chat, la consigne du contexte vient après.
- 6 : `src/ui/finance/MovementSheet.tsx`, `mouvement/ApportPoches.tsx`, `mouvement/mouvement.css` : `required` retiré du motif ; sans motif, message sous le champ (« Dis à quoi sert cet apport (le motif) pour l'enregistrer. »), champ cerclé, focus dessus.
- 7 : `src/ui/finance/prevision/PlanSheetC.tsx` : l'étiquette du paiement se pose sous la marche, décalée de l'axe des francs.
- 8 : `ArchiveManagerSheet.tsx` (classe `arc-feuille`) + `operations/archives.css` : icône de boîte de m1ar-c devant « Les archives » (le titre de `Sheet` est une chaîne : masque CSS sur l'en-tête).
- 9 : `operations/paire.css` : statut entier ; « sans pièce » passe dessous.
- Tests : `tests/integration/brewBudgetSheet.test.tsx` (+2 : bloquants 1 et 2), `tests/integration/profilEffets.test.tsx` (+3 : bloquant 3, solde groupé ; 1 assertion réalignée sur « 2 500 »), `tests/integration/compagnonContexte.test.tsx` (1 assertion réalignée : la question d'abord).

## Critères
- G1 `vitest-lu.mjs tests.txt` : VITEST OK (profilEffets, brewBudgetSheet, compagnonContexte). Rejeu plus large (19 fichiers voisins) : 241 verts, 2 réalignés ci-dessus ; `financeAssistantContext.test.ts` échoue à l'import (`firebase-admin/firestore` introuvable depuis `functions/src/brewerFinanceContext.ts`), sans lien avec cette voie.
- G2 `lire.mjs build.txt "built in" BUILD` : BUILD OK.
- G3 `tsc.mjs` : TSC OK.
- G4 `controle-v6a.mjs 3000` : V6A OK.
- Essais : 1 par critère.

## Doutes et limites
- Aucune capture : le bloquant 1 (1280) est vérifié par la cause (règle CSS, test de texte) et non par le rendu ; à ouvrir avant de dire OK.
- Problème 6 : le test du message de motif n'est pas écrit (seuls les bloquants ont un test).
- Problème 3 : le litre du budget recalculé peut différer de la feuille si l'usure du registre change ; la démo doit afficher « ≈ 44 brassins de 27 L » avec 1 200 L/an et « Pale Ale ≥ 7,51/L » si le budget est complet (la maquette m4pf-c dit 67 pour 1 800 L).
- `git status --short` : seuls les chemins de « Possède » (src/ui/finance, 3 tests, voie t1) ; le dossier `…/28e87fb1/` non suivi vient du test d'écran.

## DEMANDE EXECUTANT
Banc `http://localhost:3000/?dev-local&finance-demo` (ne pas relancer). Dans `work/missions/2026-11-14-finances/voies/t1/cap/` :
1. `cp work/missions/2026-10-31-ecran-depense/avant-deploiement/28e87fb1/capturer.mjs work/missions/2026-11-14-finances/voies/t1/cap/capturer.mjs`, puis corriger l'import `_lanceur.mjs` (un `../` de plus : six niveaux) ; `OUT` est déjà le dossier du script. Copier aussi `apport.mjs` et `apport.json` s'ils servent.
2. `node capturer.mjs 3000 tout bb,pfd,pr,arc,dbl,ia,im` (voir les noms de scénarios dans le script ; budget `bb-repos`, profil `pfd-ouvert`, Prévoir une dépense `pr-rempli`, archives `arc-repos`, doublons `dbl-repos`, compagnon `ia-chat`, bien `im-ouvert`) puis `node apport.mjs` (apport sans motif).
3. Captures à produire et OUVRIR : bb-repos 390 et 1280 (clair, cave) ; pfd-ouvert 390 (clair, cave) ; im-ouvert 390 ; pr-rempli 390 et 1280 ; arc-repos 390 ; dbl-repos 390 ; ia-chat 390 ; apport-apres 390.
4. À vérifier en image : budget à 1280 pleine largeur, lisible, avec Expliquer · Enregistrer · Prévoir ; profil « ≈ N brassins de 27 L » et « Pale Ale … /L » ; montants « 3 250,00 », « 1 800,00 », « 1 440,00 » ; étiquette « −500,50 » lisible ; icône de boîte ; statut « ✓ payé aujourd'hui · banque » entier ; message de motif sous le champ ; question en première ligne du chat.
5. Rejouer : `node work/missions/2026-11-14-finances/voies/o1/controle-v6a.mjs 3000` (V6A OK) et `node work/missions/2026-11-14-finances/voies/f1/controle-frise.mjs 3000` (FRISE OK).

DÉCISION À PRENDRE : « Envoyer » du Compagnon doit-il lancer l'analyse (appel Gemini facturé) ? Aujourd'hui il ouvre le chat avec la question prête (« le chat ne démarre jamais seul »). L'envoi automatique demande un drapeau dans `BrewerChat` (hors de ma voie). Recommandation : garder la règle ; la question est maintenant la première ligne du champ.
CONNAISSANCE : `operations.css` met `.ops` en deux colonnes dès 900 px : toute feuille qui reprend `.ops` (Compagnon, Budget) doit la remettre en colonne ; revenu deux fois.
LEÇON PROPOSÉE : aucune
