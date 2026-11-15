# Voie f1 — Port 1:1 de s2ap2 : la frise des jours dans Opérations

- Mission : 2026-11-14-finances
- Agent : auteur
- Modèle : sonnet
- Niveau : jugement
- Plafond : 120 tours ; 3 essais par critère
- Dépend de : o1 (rangées v6a, commité)
- Décideur en cas de doute : pilote

## Objectif
Opérations reçoit la plage du jour au jour de **s2ap2**, telle que dessinée, avec ses deux retouches : la frise dépliée **un peu plus compacte**, et **à l'ordinateur, deux champs « du … au … » toujours visibles** pour taper la plage. Branché, typé, testé, joué au banc.

## Ses mots (14.11, mot pour mot)
« Ça j'adore / Peut être juste un peu plus compact et toujours un endroit pour mettre des chiffres pour la version de l'ordinateur »
Avant (10.11) : « Toujours pas la bonne vue et je peux pas fitré pour une intervalles de temps précis » ; « Pourquoi je peux pas changer de mois ? Je veux !! ».

## Entrées
- `work/missions/2026-11-14-finances/voies/p2a/s2ap2/etat.html`, `NOTE.md`, images `s2ap2-repos.png`, `-glisser.png`, `-apres.png`, `-acheval.png` — **la maquette choisie, base du port** (règle n° 1 : inventaire de tout ce qu'elle montre, reprise telle quelle ; rien de plus).
- `work/missions/2026-11-14-finances/critique/SYNTHESE-P2.md` — ligne s2ap2 (défauts restants éventuels).
- `src/ui/finance/operations/Bande.tsx`, `Piles.tsx`, `src/ui/finance/PlageMois.tsx`, `src/ui/finance/TransactionJournal.tsx` (plage `du`/`au` aujourd'hui en `AAAA-MM`, l. 48, 118, 180, 303), `src/ui/finance/operations.css`.
- `src/ui/RatioSlider.tsx`, `src/ui/SliderField.tsx` — curseurs existants (motif `role="slider"` de l'app) à réemployer si possible.

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `src/ui/finance/operations`
- `src/ui/finance/PlageMois.tsx`
- `src/ui/finance/TransactionJournal.tsx`
- `src/ui/finance/operations.css`
- `tests/unit/operationsPlageJours.test.ts`
- `work/missions/2026-11-14-finances/voies/f1`

## Consignes
1. **Inventaire** (`f1/INVENTAIRE.md`) : chaque élément de s2ap2 dans ses 4 images (icône frise 14 px dans la pilule, frise repliée au repos, toucher « novembre » la déplie, barres = dépense du jour à l'échelle, point de vente sur l'axe, repères des lundis, poignées rondes 24 px bord 3 px zone 44 px, halo et bulle « 1er → 15 nov. » en tenue, pilule teintée « ‹ 1er → 15 nov. › » avec ×, ‹ › glissent la plage de sa durée, ligne « hors plage » sous sa catégorie avec montant gris, à cheval : poussée au bord la frise glisse sur le mois voisin, trait pointillé au 1er, « aucune opération saisie » pour les jours vides (inconnu ≠ 0), IA qui suit la plage).
2. **État de l'art** (L29) : plage à deux poignées = motif WAI-ARIA « multi-thumb slider » (deux `role="slider"`, flèches ±1 jour, Page ±7, Origine/Fin) ; réemployer le curseur de l'app s'il s'y prête, sinon pointer events standards ; pas de nouvelle dépendance (node_modules partagé). Champs ordinateur : `input type="date"` natifs. Filtre : clés ISO `AAAA-MM-JJ`, bornes incluses. Écrire la décision en tête de `RESULTAT.md`.
3. **Données** : la plage passe de `AAAA-MM` à `AAAA-MM-JJ` dans Opérations seulement ; la Synthèse garde sa plage de mois (`PlageMois` y sert : ne pas la casser, `grep` de tous ses lecteurs, L17). Un état ancien `AAAA-MM` stocké se lit encore (du 1er au dernier jour).
4. **Contrôle** `f1/controle-frise.mjs <port>` (banc local, données d'exemple qui ont plusieurs jours : choisir la fixture et le dire) : au repos, pilule v6a et aucune frise ; toucher « novembre » déplie la frise avec deux `role="slider"` ; poser une plage (clavier sur les poignées) filtre la liste, la pilule dit la plage, une opération hors plage reste en ligne « hors plage », payé · à payer · dépensé recalculés justes ; ‹ › décalent la plage de sa durée ; frise dépliée ≤ 56 px de haut (« plus compact ») ; à 1280, deux champs date visibles qui posent la plage tapée ; aucun `type="number"`. Rouge sur HEAD (`temoin-head.txt`), puis vert.
5. **Tests Vitest** (`tests/unit/operationsPlageJours.test.ts`) : une règle par test — filtre jour inclus, à cheval sur deux mois, glissement ‹ › de la durée, lecture d'un ancien `AAAA-MM`.
6. **Captures** dans `f1/cap/` : 390 tactile et 1280, clair et cave : repos, frise dépliée, après la plage, à cheval ; planche côte à côte avec les images de s2ap2 ; toutes ouvertes.

## Exigences transversales et acquis (recopiés, L05, L06)
- Règle n° 1 : s2ap2 et v6a reprises telles quelles ; un port retire ce qu'elles n'ont pas (L03) ; « ✓ Payé » 24 px ; rangées v6a d'o1 intactes (`node work/missions/2026-11-14-finances/voies/o1/controle-v6a.mjs 3000` reste V6A OK).
- Lignes-tâches filtrantes (« Confirmer les paiements », « Vérifier les pièces sans date ») gardées (acquis 10.11).
- Peu de texte au premier plan ; jamais `type="number"` ; inconnu ≠ 0 ; aucune donnée réelle (banc `?dev-local&finance-demo=…`).
- Rien hors de « Possède » ; `git status --short` à la fin. Ne touche ni Synthèse, ni Annuel, ni la Dépense, le Stock, les Brassins, le jour de brassage.
- Pas de Fable, aucun sous-agent. Banc : http://localhost:3000 (ce worktree, HMR). Puppeteer : `.claude/skills/webapp-testing/examples/_lanceur.mjs`, modèle `work/missions/2026-11-14-finances/analyse/capturer2.mjs`. Thème : `localStorage['laffinee.theme']` = `clair` ou `cave`. `npx tsc` échoue seulement sur `functions/` (firebase-admin absent du worktree) : ignorer ces deux erreurs.

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier. Lancer chaque `CHECK:` depuis la racine du dépôt.

## Rendre
- `RESULTAT.md` tenu au fil, mis à jour tous les 5 éléments : décision d'état de l'art, fichiers changés, contrôle avant/après, tests, captures ouvertes, défauts restants.
- `npx vitest run tests/unit/operationsPlageJours.test.ts tests/unit --reporter=dot > work/missions/2026-11-14-finances/voies/f1/tests.txt`.
Ne commite pas. Réponse finale au pilote : une ligne.
