OK — Hydrogen en 3ᵉ lecture ; « Un doute ? Relire plus finement » (Argon) ; relecture dégradée refusée ; commit par chemins (hash dans le git log)

À redéployer : `aiTask` (seule fonction qui change de comportement ; les autres fonctions qui embarquent `models.ts` / `geminiCosts.ts` n'en changent pas : même liste de tarifs, `at` facultatif).

## Faits (reprise finale, 14.11)
- Points 1 à 3 : commit fffd62a6 (Hydrogen LOW 12 000 / 60 s, repli 3.8, `INVOICE_STRONG_MODEL`, tarif 1,50/7,50 $, banc aligné).
- Points 4, 5, 7 : serveur (`relecture:'argon'` valeur exacte seulement, tarif 2/10 $ puis 4/20 $ dès le 1.12.2026 selon la date du devis, budget propre, 3ᵉ lecture Argon forcée qui tranche, repli 3.8, double panne = erreur et lecture d'avant intacte) ; client (`aiClient`, `geminiScanner` : pièce relue en entier, jamais en morceaux) ; écran `RelireFin.tsx` sous le bloc de preuve de la vérification du justificatif (confirmation, attente, erreur, hors ligne, aucun nom de modèle).
- DÉCISION DU PILOTE appliquée (longues pièces) : bouton visible partout ; `src/ui/depense/comparerRelecture.ts` (`relectureGardee`) : si la relecture rend MOINS de lignes, ou un statut de revue PLUS MAUVAIS (checked < corrected < disputed < unavailable ; un statut absent = inconnu, ne joue pas), la lecture d'avant est gardée et l'écran dit « La relecture n’a pas fait mieux : lecture d’avant gardée. » (apostrophes typographiques de l'app ; `data-dp="relire-fin-pas-mieux"`, `role=status`). Branché dans `ExpenseSheet.relireFinement` avant tout effacement.
- Preuve L13 : `comparerRelecture.test.ts` (5) et 2 tests d'écran (moins de lignes, statut disputed) importent / exigent `relectureGardee`, absent de HEAD : rouges sur HEAD, verts après. Non rejoués sur un HEAD propre (pas de stash ni de worktree).

## Corrections de tests mortes depuis fffd62a6 (hors liste initiale, dans les tests de ma voie)
`tests/unit/depense/lecture-d/serveur.test.ts` (modèle du provisoire = `INVOICE_STRONG_MODEL`, plus `SCAN_MODEL` = 3.8) et `tests/unit/depense/rapprochement/lecture-coupee.test.ts` (Hydrogen en échec puis repli 3.8 = 4 appels, non 3) : 5 tests rouges sur HEAD, mis à jour ; le glob de VOIE.md ne les couvrait pas, le dossier `tests/unit/depense` si.

## Sorties décisives
- Tests : `npx vitest run tests/unit/invoice* tests/unit/banc-lecture* tests/unit/gemini* tests/unit/models* tests/integration/invoice* tests/integration/depenseRelireFin.test.tsx tests/unit/depense tests/integration/depense* tests/integration/expenseSheet*` → 246 fichiers passés, 1 ignoré ; 3 446 tests verts, 4 ignorés (`tests.txt`).
- `npx tsc --noEmit -p .` → 0 ; `npx tsc --noEmit -p functions` → 0 ; `npm --prefix functions run build` → sans erreur. `npm --prefix functions test` : script absent (non lancé).
- Captures (L12, ouvertes en image) : `work/missions/2026-11-14-gemini4/voies/h1/captures/{t390,pc1280}-{clair,cave}-{1-repos,2-confirmation,3-erreur}.png` (12) + `mesures.json` (sur disque, ignorées par Git comme les `.txt` de la voie), produites par `capturer.mjs` sur l'état simulé « 3 » (lecture 372765 SIMULÉE, build de développement servi sur localhost, tout autre hôte avorté : aucun Gemini, aucun réseau). Vu : bouton 234 × 28 px, secondaire, sous le bloc de preuve et au-dessus des pastilles TVA / Règlement, sans chevauchement ni débordement à 390 (x = 8) comme à 1280 (colonne de gauche), lisible clair et cave ; confirmation (« La nouvelle lecture remplace celle-ci, tes retouches comprises. » + Relire / Annuler) ; erreur « Service IA momentanément indisponible. » sous le bouton, la lecture d'avant (18 lignes) intacte. États non capturés : « en cours » et « pas fait mieux » (couverts par les tests d'écran seulement).
- `controle-choix.mjs` (`work/refonte-frontend/v4/tournoi/outils/`, registre `ecrans-app.json`, écran `depense`) : ECHEC, mais sans lien avec ce lot : `depense` est « ouvert » (r2b provisoire, rien à vérifier) et les erreurs listées sont celles d'autres écrans (levure…, mots absents de SPEC). Le lot n'ajoute qu'un bouton sous la preuve, sur demande explicite du brasseur (14.11).

## Doutes et limites
- Hors « Possède » (acceptés par le pilote) : `aiClient.ts`, `geminiScanner.ts`, `ExpenseSheet.tsx`, `controlesCroisesVue.tsx`.
- Le banc B2 (`banc-b2/scenes.mjs`) est périmé : le menu dit « Nouvelle écriture », non « Entrer une facture » ; `capturer.mjs` a son propre ouvreur, le banc n'est pas touché.
- Délais Hydrogen / Argon (60 s) non mesurés en ligne ; tarif 4/20 $ dès le 1.12 repris de VOIE.md, non revérifié à la source.
- Une relecture échouée marque son document de budget « failed » : un 2ᵉ essai sur la même pièce répond le message générique du budget ; la lecture d'avant reste.
- Retouches faites pendant l'attente : perdues au remplacement (dit dans la confirmation) ; si la relecture ne fait pas mieux, rien n'est remplacé, retouches comprises.
- `model` du résultat vaut Hydrogen même sans 3ᵉ lecture (comme avant avec la 3.8) ; non relevé côté client.
- Avertissements `act(...)` dans les tests d'écran (comme d'autres tests Dépense), sans échec.

CONNAISSANCE : le banc B2 ne trouve plus « Entrer une facture » (menu BX-4 : « Nouvelle écriture ») ; Bash perd les barres inverses même dans un heredoc entre guillemets : scripts à regex ou à `\'` par Write.
LEÇON PROPOSÉE : aucune
