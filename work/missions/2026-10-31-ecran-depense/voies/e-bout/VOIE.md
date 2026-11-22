# Voie e-bout — le parcours bout en bout sur émulateurs, sur l'écran p3c et ses vraies pièces (D264)

Agent : `auteur` (Sonnet). Plafond : 110 tours. Pilote : Opus. Aucun appel à Gemini, aucun déploiement, aucun commit.

## Ses mots (SPEC, 01.11 nuit)
« Fait bien à la fin les test d'intégration bout en bout. Et les tests sur la VRAI app avec les VRAIS donnés. Est-ce que le stock de met
bien à jour ? Les factures aussi, tout suit ... » ; « Il faut testé aussi avec les autres pièces de test btw pas juste celle-ci... ».

## Pourquoi
Le banc JUS-0 `scripts/check-invoice-journey-emulator.mjs` (vraie app sur émulateurs, lectures réelles rejouées, Drive factice) ne tourne
plus depuis le port p3c (6bb83d4a) : tous les cas s'arrêtent sur `waitForSelector('section[aria-label="Justificatif de la dépense"]')`
(`openInvoiceEntry`, ligne ~507). Dernier rejeu : `work/missions/2026-10-31-ecran-depense/voies/e-emulateur/final4/` (2 OK, 6 KO, ARRÊT
etats, doc5, doc6). Un contrôle ne garde que s'il tourne sur le format actuel (L13) : l'adapter, sans affaiblir un critère.

## À faire
1. Lire l'écran actuel (`src/ui/finance/ExpenseSheet.tsx`, `src/ui/depense/*` : crochets `data-dp-*`, `data-purchase-*`) et adapter chaque
   sélecteur et geste du banc qui visait l'ancien écran. Chaque critère garde son sens ; un critère devenu sans objet est écrit tel dans le
   RESULTAT, avec la raison, jamais supprimé en silence.
2. **Ajouter sa pièce du 01.11 au soir** (cas `doc14`, D261) : image `work/finalisation-tickets-2026-10-08/H13-reels/doc14-commande-brau-ecran.jpg`,
   lecture rejouée = le résultat final de C★v8+N de `H13-reels/banc-k6-AC/results.json` (production), dans une copie du manifeste
   `H13-reels/jus0/rejeu.json` (hors Git : `H13-reels/jus0/rejeu-k6.json`). Critères du cas, chacun jugé sur l'écran servi contre la vérité
   `H13-reels/cas-5.json` : (a) aucun nom de ligne ne double sa variante (D261a) ; (b) aucune pastille « Total » pour un total arrondi à
   5 centimes (D261b) ; (c) aucune pastille TVA sur une TVA juste par taux (D262a) — si le correctif serveur n'est pas en jeu, dire lequel
   des deux côtés la lève ; (d) le port compte dans le total, jamais comme une ligne (D249) ; (e) la famille de chaque ligne (levure, malt,
   houblon ; le reste en « autres » tant que les bandes neuves ne sont pas choisies) ; (f) confirmer → la dépense est au journal, chaque ligne
   de stock a son mouvement (quantité, unité, article), l'article est à jour, le justificatif se rouvre (octets identiques), la dépense est
   dans l'export annuel. Rien de ses valeurs dans le code ni le RESULTAT : comptes, codes et oui/non.
3. Ajouter un critère **doublon** (D264a) si le correctif de `duplicateMatch` est posé (voie k6-correctifs) : ressaisir la même pièce après
   un achat semé sous la forme historique de l'audit (`voies/e-reel/AUDIT.md`) → avertissement « déjà enregistré ».
4. Jouer tous les cas aux deux largeurs : copie de `voies/e-emulateur/rejouer.sh` avec `OUT=…/e-emulateur/final5`, manifeste `rejeu-k6.json`,
   un groupe de plus pour `doc14` (et le doublon). La garde mémoire peut arrêter un groupe : le script reprend jusqu'à 4 fois.
5. Ouvrir en image les captures de `doc14` à 390 (repos, lignes, après confirmation) et les juger (L12).

## Contrôles
- `bilan.txt` de `final5` : chaque groupe a fini (« exit 0 »), aucun « ARRÊT » dans les `console.log`.
- Chaque constat KO restant est classé dans le RESULTAT : défaut de l'app (cause `chemin:ligne`), ou défaut du banc corrigé et rejoué.
- `git status --short` à la fin, dans le RESULTAT.

## Possède
`scripts/check-invoice-journey-emulator.mjs`, `work/missions/2026-10-31-ecran-depense/voies/e-bout/` (RESULTAT.md, scripts),
`work/missions/2026-10-31-ecran-depense/voies/e-emulateur/final5/`, `work/finalisation-tickets-2026-10-08/H13-reels/jus0/rejeu-k6.json`.
Rien d'autre : un défaut de l'app se signale, il ne se corrige pas ici. Ne touche jamais `.codex/hooks.json`,
`source4-portable-bundle-manifest-01.json`, `functions/.env`, `functions/.secret.local`, `firebase.json`, `.firebaserc`, `firestore.rules`,
`firestore.indexes.json`. Pas de serveur de dev dans `C:/Users/mrspa/Documents/Brasserie` (le banc tourne depuis ce worktree, comme avant).
Retour en une ligne : `E-BOUT OK — <n> OK, <n> KO (<n> défauts de l'app) — <chemin du RESULTAT>`.
