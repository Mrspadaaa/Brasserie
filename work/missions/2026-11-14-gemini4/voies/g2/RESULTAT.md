ECHEC — passes comparatives : HTTP 429 « monthly spending cap » (plafond du projet Google) dès la 1re cellule candidate ; banc, grille et tests livrés, seul le témoin 3.8@low (4 cas) est mesuré

## Ce qui est livré (14.11, rien dans `src/` ni `functions/src/`, aucun déploiement)
- `scripts/banc-compagnon.ts` (neuf) : option du BANC, pas de la production. Une cellule = modèle@réflexion par rôle (`analysis=gemini-4-argon@low;review=gemini-4-hydrogen@medium`, `prod` = rien de changé). Le rôle se reconnaît comme `eval-brewer.mjs` (outil web = recherche, schéma `approved` = relecture, le reste = analyse). Niveaux refusés net s'ils ne sont pas ceux du modèle (réutilise `parseFort` de g1 : « minimal » n'existe pas). Le transport remplace modèle et `thinkingLevel`, monte le plafond de sortie (analyse 8 000, relecture et recherche 5 000) quand la réflexion dépasse « low », journalise UNE ligne par appel dans le journal commun (colonne variante `g2:<rôle>`), relit la somme du journal avant chaque appel (g1 y écrit aussi), s'arrête avant l'appel au plafond de la mission, de g2 ou de la passe, et à la première 429 « spending cap ». Coût relu des jetons (réflexion et requêtes web comptées) ; coût inconnu = réserve, jamais 0. Le harnais réel `runBrewerHarness` tourne tel quel (mode `auto`). Sorties dans `voies/g2/sorties/<cellule>/<cas>.json`, un résultat déjà écrit n'est ni rejoué ni repayé.
- `scripts/banc-compagnon-grille.ts` (neuf) : la GRILLE (13 cas, faits attendus, chiffres, interdits, outils, proposition) écrite AVANT toute passe (`GRILLE.md`, produit par `--grille`), le second regard automatique, le dossier du juge à l'aveugle (identifiants = hachage de « cellule|cas », stables, ordre ne dit rien ; clé à part), les tableaux (qualité juge et auto, désaccords, inutilisables, coupées, HTTP, p50/p90 par question, coût et appels par question). Moitiés : positions impaires de `brewerCases.mjs` = choix, paires = jugement.
- `scripts/banc-compagnon-tableau.ts` (neuf) : `--grille`, `--dossier`, `--tableau` (hors ligne, sans appel).
- `tests/unit/banc-compagnon.test.ts` (neuf, 14 tests, Gemini simulé) : cellules, rôles, corps envoyé, coût (réflexion, web, inconnu), journal et somme, trois plafonds, 429 qui arrête tout, cas joué de bout en bout par le vrai harnais avec transport fabriqué, grille, anonymisation.
- `voies/g2/sonde.mjs` : sonde d'un mot (clé lue, jamais affichée) ; `voies/g2/GRILLE.md`.

## Critères
- Tests : `vitest run brewerHarness brewerFlashLimits banc-lecture-modeles banc-compagnon` → 4 fichiers, 88 tests verts (`tests.txt`).
- `npx tsc --noEmit -p .` racine : 0 erreur ; `functions/` : 0 erreur (sortie vide).
- `--simuler` (2 cellules × 3 cas, harnais réel, transport fabriqué) : 6 cas rendus, 0 CHF journalisé.
- Journal : g2 = **0,3693 CHF** (18 lignes `g2:`), mission = **5,1339 CHF** sur 10 (g1 inclus). Limites respectées (g2 ≤ 3,5).

## Mesures (réelles, un tirage, 4 cas du témoin)
Témoin `prod` = 3.8@low partout (production). La sonde Argon@low de 18:07 (200, « prêt. », 8,5 s) a passé ; à 18:14, 429 sur Hydrogen@low, puis la sonde 3.8@low a aussi reçu 429 : le plafond est celui du projet Google, pas celui de la mission (5,13 < 9,5).
| cas (moitié) | durée question | appels | CHF | auto | outils |
|---|---|---|---|---|---|
| edit-recipe (choix) | 9,6 s | 4 (2 analyses, 2 relectures) | 0,0991 | 1,00 | propose_changes ; alpha 5,2 à valider |
| low-ph (choix) | 9,1 s | 4 | 0,0592 | 1,00 | check_ph ; « aucun acide », pas de base sans essai |
| ro (choix) | 7,8 s | 3 | 0,0549 | 1,00 | simulate_water, plan_recipe_water |
| power (jugement) | 8,8 s | 3 | 0,0513 | 0,92 | heating_power ; 25,4 min |
Témoin : p50 ≈ 9,0 s (p90 9,6 s), 0,066 CHF par question en moyenne, 3 à 4 appels, 4/4 utilisables. Lecture du juge (moi, sur le texte, non à l'aveugle faute de concurrent) : 4 réponses justes et dans le ton ; seul défaut : low-ph classé « urgent » sans raison ; power dit « 26 minutes » en action (arrondi de 25,4). Second regard : « nombres hors preuves » signale 19 (ancien IBU, vrai dans le calcul), 26 et 15 (« 10 à 15 minutes » demandé à l'utilisateur) : le détecteur est bruyant, à lire par un humain, pas un verdict.
Données partielles d'Hydrogen@low (avant le 429, cas non écrits) : analyse low-ph 2,0 s (10 880 → 122 jetons, 0,0215 CHF) ; analyse edit-recipe 11,8 s (23 417 → 472 jetons, 0,0483 CHF). Anecdotiques : aucune qualité jugée.

Rien n'est conclu sur les modèles 4 pour le compagnon : ni gain, ni perte. Aucun diff de `models.ts` n'est proposé (aucun gain mesuré ; 3.8@low reste la production).

## Ce qui reste (à faire quand le plafond Google est relevé, geste du brasseur)
Coût mesuré sur le témoin : 0,05 à 0,10 CHF par question (l'analyse relit 10 à 23 k jetons de contexte à chaque tour). Une cellule sur les 13 cas coûte donc ≈ 1 CHF, un modèle 4 ≈ +30 %. Il reste 3,13 CHF pour g2. Plan chiffré :
1. Phase A (≈ 0,9 CHF) : choix, 3 cas (edit-recipe, low-ph, ro) × Hydrogen@low, Argon@low, Carbon@low, Argon@medium (le témoin est fait).
2. Phase B (≈ 1,3 CHF) : jugement, 6 cas × témoin + 2 finalistes ; juge à l'aveugle (`--dossier --moitie jugement`, notes dans `notes-juge-jugement.json`) puis `--tableau`.
3. Relecture et recherche (≈ 0,6 CHF) : relecture sur les corps déjà enregistrés (`reviewBodies` des sorties) avec défauts plantés ; recherche sur `supplier-followup` seul (3 chercheurs, requêtes web facturées 0,0175 CHF pièce). Module de rejeu de relecture non écrit (pas de budget pour le prouver).

DEMANDE EXECUTANT (après relèvement du plafond Google ; un échec ne se relance pas, le dire ; arrêt si 429) :
```
G=work/missions/2026-11-14-gemini4/voies/g2
RUN="npx vite-node --config vitest.config.ts scripts/banc-compagnon.ts -- --payant --confirm-paid-ai --workers 3"
node $G/sonde.mjs gemini-3.8-flash low     # attendu : "status":200 ; sinon s'arrêter
$RUN --cellule "analysis=gemini-4-hydrogen@low" --cellule "analysis=gemini-4-argon@low" --cellule "analysis=gemini-4-carbon@low" --cellule "analysis=gemini-4-argon@medium" --cas edit-recipe,low-ph,ro --plafond-passe 1.1
```
Sortie attendue : « Passe terminée : 12 cas joués » (4 déjà faits pour prod). Puis rendre au pilote `sorties/`, la fin du journal et le cumul ; l'auteur juge (dossier à l'aveugle), choisit les finalistes pour la phase B.

## Doutes et limites
- Un seul tirage par cellule : le bruit d'une même cellule n'est pas mesuré ; 3 cas de choix sur 7 prévus, supplier-followup, fermentation, grassy et injection non joués.
- Le coût du banc est le coût provisionné (1,25 CHF/USD), pas une facture ; Argon et Carbon doublent le 1.12.2026.
- Le détecteur de nombres et les motifs de la grille sont des règles ; ils ne remplacent pas le juge. Le juge est l'auteur, pas le brasseur (L27).
- Les cellules à réflexion haute ont un plafond de sortie plus grand que la production (8 000 contre 4 000 pour l'analyse) : à dire dans toute recommandation.

DÉCISION À PRENDRE : relever le plafond de dépense du projet Google (geste de compte du brasseur) pour que g1 et g2 puissent finir. Recommandation : le relever d'au moins 4 CHF (g2 ≈ 3 CHF, reprise de g1 ≈ 1 CHF) ; sinon rester en 3.8@low partout, qui répond en 9 s pour 0,07 CHF, juste sur 4 cas sur 4.
CONNAISSANCE : une question du compagnon coûte 0,05 à 0,10 CHF en 3.8@low (3 à 4 appels, contexte de 10 à 23 k jetons relu à chaque tour d'analyse), p50 ≈ 9 s sur 4 cas ; le plafond de dépense mensuel du projet Google (429) a de nouveau coupé à ≈ 5,1 CHF de journal commun.
LEÇON PROPOSÉE : aucune
