OK — « + » de l'assistant flottant (rond 48 px, bas droite, à droite de « Suivant »), menu : étape d'abord

## Citation et maquettes
- Citation vérifiée : `SPEC-BRASSEUR.md` du commit 4e7d58ea (ligne 1741 ; absente de la copie du worktree, qui est en retard) : « b1r — Non mais certaines actions doivent toujours être possible, juste celle de l'écran actuel sont plus mis en avant. Et le bouton doit toujours être flottant.... » (lu : refus de b1r ; le + reste flottant, menu = communes + celles de l'écran en tête).
- Maquettes choisies ouvertes : r2 (Paliers) et w1b (Eau) : « + » rond noir en bas à droite, à droite de « Suivant », même ligne : un bouton flottant en bas à droite que la rangée laisse libre, pas un bouton dans la rangée. m2 (Récap) : « + » rond en bas à droite, détaché, sous la rangée d'enregistrement : flottant. Aucune maquette ne le met dans la rangée : pas d'exception, flottant partout.

## Fichiers écrits
- `src/ui/FloatingActions.tsx` : retour au suivi de case du tag (plus de `page-row`, plus de `hidden`/effacement) ; sur page sans case : rond 48 px, `right: var(--page-fab-right, .5rem)`, bas = pied + 1 rem ; registre `usePageFabActions` / `PageFabAction` (dernière page montée parle ; retiré au démontage) ; menu : groupe de la page en tête (1re ligne en gras), puis action d'onglet, puis les 5 communes (aucune retirée).
- `src/pages/BrewWizard.tsx` (pied) : case du Récap retirée (pied d'origine `flex justify-end`) ; `usePageFabActions` : étape → « Suivant — <étape> » (+ « Comparer les levures (n) » à Levure) ; Récap → « Enregistrer la recette », « Enregistrer et préparer un brassin ».
- `src/ui/water/workshop.css` : « + » plus docké en haut des Sels (règles `.floating-actions` top/right/40 px, padding 48/58/92 px retirés ; la pastille d'activité garde 52 px).
- `src/ui/water/eau.css` : commentaire seulement (règles du tag déjà ôtées en f726eee3).
- Tests : `tests/integration/assistantPiedPlus.test.tsx` réécrit (28 tests : « + » flottant et rond à 7 étapes, espace réservé 3,5 rem/1 rem/0,25 rem par étape, menu étape d'abord + communes à 7 étapes, « Suivant » du menu avance, retour aux communes, deux pages, `--page-fab-right`, titre en nœud inchangé) ; `eauW1b.test.tsx` (test l. 222) et `etapeHoublons.test.tsx` (l. 144) alignés sur le flottant.
- Banc : `capturer.mjs`, `captures/` (21 PNG + `journal.json`).

## HORS « Possède », nécessaire (à signaler)
- `src/pages/PageShell.tsx` : la rangée de fin n'a plus de case `page-row` ; elle laisse `paddingRight 3,5 rem` (48 + 8 px d'air), `paddingBottom 1 rem + zone sûre`, `paddingTop 0,25 rem` (rangée + dessous = 64 px, la hauteur du « + » + 16 px) ; la colonne n'ajoute plus `pb-3` quand il y a une rangée (sinon décalage de 12 px) ; publie `--page-fab-right` (bord droit de la colonne, ≥ 8 px) seulement pour les pages à rangée de fin, pour que le « + » reste à côté de « Suivant » à 1280 ; type `page-row` retiré.
- `src/ui/floating-actions.css` : bloc `@media (max-width: 639px) body[data-has-water-sels] …` retiré (il masquait la case d'en-tête et supprimait la réserve du bas au profit du dock en haut).

## Critères
- `assistantPiedPlus` 28/28 ; liés (12 fichiers, FloatingActions, fix114, floatingActionsShellLayout, etapeHoublons, eauW1b, rechargementAssistant…) : verts sauf 3 `eauW1b` « RC-1 » (« 45 % » attendu, « 40 % » reçu) : travail parallèle sur `src/domain/water/` (treatment.ts modifié, autre voie), sans lien avec le « + » ; le test du « + » de `eauW1b` est vert.
- `tsc --noEmit` : 0 erreur. `npm run build` : vert, DRAPEAUX OK.
- Captures 390 tactile (844) et 1280, clair et cave, **ouvertes** : Levure, Paliers, Eau (bas et milieu), Sels (bas, haut), Récap, bas de page. Mesures (`journal.json`) : en bas de défilement, « + » à 334–382 px, 8 px à droite de « Suivant » à Levure, Paliers, Eau, Sels (390) ; 12 px à 1280 (le « + » suit le bord droit de la colonne) ; 0 contrôle du main sous le « + » en bas de page, y compris « −33 » et « 5,9 mL » (Eau bas) ; Sels : plus aucun « + » en haut de la barre « 1. Eau / 2. Sels » ; menu ouvert (Paliers) : « Suivant — Eau et sels · Étape 5/7 : Paliers » en gras en tête, puis Compagnon, facture, Vendre, Créer une recette, Lancer un brassin ; Récap : « Enregistrer la recette », « …préparer un brassin », puis les 5 communes. Récap : « + » 739–787 px, au-dessus du pied (800 px), ne couvre aucun bouton. 0 erreur de page.

## Essais utilisés
Un par critère ; un test corrigé (« 2/6 » → « 2/7 », mon erreur d'attente).

## Doutes et limites
- Contenu court (Paliers 390) : la rangée « Retour · Suivant » suit le contenu et reste plus haut que le « + » (qui est au bas de l'écran), au lieu d'être alignée comme dans la maquette r2. Alignement exact = pousser la rangée au bas de la colonne (`min-h-full`, `mt-auto`) : non fait (touche la mise en page de toutes les étapes).
- En défilant, un flottant passe forcément sur du contenu (ex. « Rinçage » en haut des Sels) ; seule la fin de page est garantie libre.
- `brewer-chat-launch` reste masqué sur l'onglet Sels (règle d'avant, gardée, hors sujet) : à revoir si le compagnon manque à cet endroit.
- Le « + » de pages sans rangée de fin (fiche recette…) garde le coin de la fenêtre comme avant.

CONNAISSANCE : dans l'assistant le « + » flotte (b1r) ; la rangée de fin de `PageShell` lui laisse 3,5 rem à droite et 1 rem dessous (`--page-fab-right` pour le bord droit de la colonne) ; ses actions d'étape passent par `usePageFabActions`.
LEÇON PROPOSÉE : une règle explicite du brasseur (« toujours flottant ») se cite en tête de la voie et du commit ; un contrôle de rangée « dockée » avait validé l'inverse.
