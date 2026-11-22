# Voie f4-enrichir — après « Confirmer », la fiche de chaque nouvel article se remplit en arrière-plan, sans doublon de fiche (D276)

Agent : `auteur`, modèle **opus** (la voie fixe une architecture que d'autres suivront). Plafond : 40 tours pour le plan, 120 pour le code.
Pilote : Opus. **Deux temps** (COMMUN.md) : `PLAN.md` puis `PLAN PRÊT — <n> défauts` ; le pilote fait relire et t'envoie la revue triée ; tu
codes. Aucun commit, aucun déploiement, aucun appel Gemini réel. Relire `work/missions/2026-10-31-ecran-depense/voies/COMMUN.md`.

## Ses mots (SPEC-BRASSEUR, mot pour mot)
- 31.10 : « Aussi je sais pas comment on peut résoudre ce problème. Peut être à la fin quand on valide la facture, en arrière plan. SI
  j'ajoute des malt, houblons, levure ou autre sans fiche en db. Une procédure de recherche pour remplir la fiche du nouveau produit est
  lancé. » ; « Attention au mapping, on veut pas de retrouver avec plein de fiche du même produit ».
- 01.11, nuit : « Une fois produits ajouter, vue fermé et tout, ça créé une procédure pour enrichir le nouveau produit du stock btw, comme
  demandé il y a un moment ».
- 01.11, nuit (D277) : trois niveaux pour tout — sûr : rien ; repris sans certitude : jaune, il contrôle ; inconnu : rouge.
- 05.09 (note `cerveau/produit/export-et-ia.md`) : « Je veux aussi que quand l'IA va chercher une info elle soit sauvegardée et
  réutilisable. L'EBC d'un malt ne changera jamais. » ; on ne comble que les trous, jamais une valeur saisie ou lue n'est écrasée.

## Ce qui existe (à lire, ne rien refaire en parallèle, L11)
- Voie s6-fiche (`work/missions/2026-10-31-ecran-depense/voies/s6-fiche/RESULTAT.md`) : à la création d'un article, une fiche est posée
  depuis les catalogues du dépôt, houblons (index, `chargerCataloguePlein`, `varieteDe`) et fermentescibles (`slugBeerAnalytics`) ;
  levures et autres : aucune. `StockItem.fiche = { id, approchee }`, `StockItem.origin` (`src/types/index.ts`). `src/domain/stock/fiche.ts`,
  `donnees.ts`, `articleNeuf.ts` ; `src/services/purchaseEntry.ts` (`newStockItem`, `articlesNeufsDe`, `cataloguesPour`).
- Les fiches IA du stock : `learnIngredient` (`src/App.tsx`) → `updateStockItem`, et la tâche d'aiTask qui cherche les données d'un
  ingrédient (lire `functions/src/prompts.ts` et `src/services/geminiScanner.ts` ou le client d'aiTask pour son nom et sa forme), déjà en
  production pour l'assistant de brassage.
- Les catalogues du dépôt : `src/data/yeastCatalogueBootstrap.json`, `yeastCatalogueLibrary.json`, `src/data/fermentables/`, l'index des
  houblons (`src/domain/hopIndex/v4/`).
- La file persistante d'arrière-plan après « Confirmer » (Drive) : `src/services/proofQueue.ts`, `proofQueueStore.ts`, `proofUploadStatus.ts`,
  `src/ui/finance/ProofUploadNotice.tsx` (voie d3c-drive-code) : le modèle à suivre (hors ligne, reprise, échec durable, notification).

## Le plan doit trancher
1. **Quand** : après l'enregistrement réussi et la feuille fermée ; jamais bloquant ; hors ligne : en attente, repris au retour du réseau.
2. **Pour qui** : chaque article créé par la dépense (malt, houblon, levure, sucre, additif, et « autres » utiles), sans fiche ou avec une
   fiche « approchée » ; un article existant n'est jamais touché, sauf ses trous si le plan le justifie (dire lesquels).
3. **Le rapprochement d'abord (« Attention au mapping »)** : avant toute recherche, chercher la fiche du produit dans les catalogues du
   dépôt (levures comprises, ce que s6 ne fait pas) et dans les fiches déjà retenues ; une clé de produit (nom propre, fabricant, type,
   origine) qui fait qu'un même produit n'a jamais deux fiches ; un nom proche mais pas sûr → une seule fiche « à contrôler » (jaune), pas
   deux fiches.
4. **La recherche** : la tâche IA existante si elle convient (sinon dire pourquoi et ce qu'il faudrait) ; ce qu'elle remplit par type
   (malt : EBC, potentiel, type, part max ; houblon : α, β, huiles, arômes, origine ; levure : laboratoire, souche, forme, atténuation,
   température, floculation, tolérance ; autres : ce qui sert) ; chaque valeur trouvée marquée « trouvée en ligne » avec sa source, niveau
   `repris` (jaune) tant qu'il ne l'a pas vue ; on ne comble que les trous. Le coût par article (jetons, CHF), un plafond par jour.
   **Gemini réel jamais dans la voie** : simulé dans les tests et sur les émulateurs. En production, un interrupteur éteint par défaut
   (`ENRICHISSEMENT_IA` ou de même forme) que seul l'accord de l'utilisateur allumera ; le rapprochement aux catalogues, lui, marche sans IA.
5. **Où c'est gardé** : sur l'article (`StockItem.fiche`, champs existants) et, si une collection de fiches partagées est nécessaire, dire
   laquelle, ses règles Firestore, et pourquoi : un champ ou une collection neuve est un **accord** de l'utilisateur (schéma) ; le plan
   propose la plus petite forme, facultative, et ce qui marche sans elle.
6. **Ce qu'il voit** : un retour discret quand une fiche est remplie (« 3 fiches remplies, 1 à contrôler »), et l'endroit où il contrôle
   (le stock, la fiche de l'article) ; aucune maquette ici : décrire le besoin, la voie d'interface viendra après (L25).
7. **Risques** : double clic, deux dépenses du même produit le même jour, hors ligne, échec de la tâche, catalogue pas encore chargé,
   données existantes.

## Critères
- Temps 1 : `PLAN.md` au format de `.claude/skills/voies/references/sans-memoire.md` § 2 ; réponse `PLAN PRÊT — <n> défauts`.
- Temps 2 (après la revue triée) : tests `tests/unit/depense/enrichir/**` rouges d'abord puis verts ; `npx tsc --noEmit -p tsconfig.json` ;
  `npx vitest run tests/unit/depense --maxWorkers=2` ; un parcours sur émulateurs (dépense confirmée avec un nouveau malt, une nouvelle
  levure et un nouveau houblon → fiches posées par le catalogue, une seule fiche par produit sur deux dépenses, la recherche simulée pour
  le produit absent des catalogues) ; `git status --short` dans « Possède ».

## Possède
Temps 1 : `work/missions/2026-10-31-ecran-depense/voies/f4-enrichir/**`. Temps 2 : ce que le plan relu attribue (fichiers neufs
`src/services/enrichissement*.ts`, `src/domain/stock/fiche*.ts`, tests `tests/unit/depense/enrichir/**`) ; `ExpenseSheet.tsx`,
`purchaseEntry.ts` et `App.tsx` restent au pilote (un seul point d'appel, qu'il branchera) sauf accord écrit dans la revue triée.

## Rendre
`RESULTAT.md` selon COMMUN.md. Réponse au pilote : une ligne.
