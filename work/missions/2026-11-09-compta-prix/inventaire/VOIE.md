# Voie i1 — captures des écrans comptabilité et prix tels qu'ils sont aujourd'hui

Agent : executant (Haiku), plafond 45 tours. Captures seulement ; aucun changement dans `src/`. Écris RESULTAT.md tôt et complète-le.

## Servir l'app
Le serveur Vite de ce worktree tourne déjà sur http://localhost:3000 (ne le relance pas, ne l'arrête pas). Ouvre
`http://localhost:3000/?dev-local&finance-demo` : données de démonstration en mémoire seulement (`src/dev/financeDemo.ts`), aucun jeton,
aucune donnée réelle. Recharge DUR après avoir posé la taille (piège `useCoarsePointer` lu au montage : taille d'abord, puis chargement).

Outil : copie `work/missions/2026-10-31-ecran-fermentescibles/inventaire/capturer-fermentescibles.mjs` dans ce dossier sous le nom
`capturer-compta.mjs` (puppeteer-core, Chrome du poste) et adapte-le. Navigation : barre du bas (Finances, Clients), sous-onglets par leur
texte (`Synthèse`, `Situation`, `Coûts`, `Opérations`, `Prévisions`, `Projets de matériel`, `Annuel`, `Impôt bière`, `Prix et marges`).

## Fixture complémentaire (mémoire seule)
La démo n'a ni client, ni tarif, ni bière conditionnée. Après le chargement, dans la page, pose-les avec
`const { FirestoreRepo } = await import('/src/services/firestoreRepo.ts')` puis `FirestoreRepo.put(<collection>, <id>, <objet>)` (cache
mémoire seul, voir `cerveau/agents/verification-locale.md`). Trouve les noms de collection et les formes par grep dans `src/types/index.ts`
et `src/components/tabs/ClientsTab.tsx` (clients, tarifs, lots conditionnés). Pose : 2 clients (« Café du Bourg », Pro ; « Martin Rey »,
Privé), 3 tarifs (Pale Ale 33 cl, Pale Ale 50 cl, fût 20 L) avec un coût, et si possible un lot conditionné de la « Pale Ale de septembre »
(27 L). Si une forme résiste après 3 essais, écris-le et passe.

## Captures (`captures/`), à 390 × 844 (isMobile, hasTouch), thème clair
1. `synthese-situation.png`, 2. `synthese-couts.png`, 3. `operations.png`, 4. `previsions-echeances.png`, 5. `previsions-projets.png`,
6. `annuel.png`, 7. `budget-brassin.png` (Synthèse › Coûts › toucher « Pale Ale de septembre »), 8. `clients-liste.png`,
9. `impot-biere.png`, 10. `prix-marges.png`, 11. `prix-marges-tarif.png` (un tarif ouvert), 12. `facturer.png` (fiche d'un client ›
« Facturer », la feuille ouverte ; ne télécharge aucun PDF), 13. `facturer-rempli.png` (un produit choisi, quantité 24).
Chaque capture en page entière (fullPage), puis le premier écran seul en `-haut.png`.
À 1280 × 900 : `synthese-1280.png`, `previsions-1280.png`, `prix-marges-1280.png`.
Ouvre chaque capture (L12) et décris-la en une ligne dans RESULTAT.md (ce qu'on voit, chiffres principaux).

## Possède
`work/missions/2026-11-09-compta-prix/inventaire/`. Rien dans `src/`. N'écris aucun code par heredoc ni par `node -e`. Pas de `git stash`,
aucun commit. Ne télécharge rien. Rends une ligne : nombre de captures faites / 16, et les manques.
