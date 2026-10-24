OK — 24 notes versées au cerveau ; G1 à G3 tenus.

**Fichiers écrits** (racine : `C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/`) :
- `cerveau/brasseur/` : penser-brasseur.md, le-brasseur-choisit.md, pas-de-cockpit.md, rien-de-fige.md, fil-de-fer-d-abord.md, methode-ui-v3.md, exploration-v0-libre.md, micro-correctifs.md
- `cerveau/metier/` : modele-brassage.md, chimie-eau.md
- `cerveau/produit/` : saisie-mobile.md, import-recette.md, export-et-ia.md, design-system-historique.md, socle-v01.md, page-partagee.md
- `cerveau/sources/` : moneaudebrassage.md
- `cerveau/agents/` : agents-sans-openai.md, autonomie-decisions.md, fermeture-et-quota.md, gemini-tests-reels.md, verification-locale.md, poste-windows-msix.md, monkey-testing.md
- `work/missions/2026-10-22-essai-voies/voies/a-cerveau-memoire/RESULTAT.md` (ce fichier)

**Critères** (chaque CHECK lancé depuis la racine, une passe chacun) :
- G1 : `EXISTENT OK 24`, exit 0.
- G2 : `CERVEAU OK (28 notes, 20 leçons)`, exit 0. Avertissements (mode voie, non bloquants) : les 24 notes ne figurent pas encore dans la carte de `cerveau/INDEX.md`, que le pilote écrit.
- G3 : `NOTE OK`, exit 0.

**Contrôle complémentaire** (hors GATES, script dans le scratchpad) : chaque citation « » et chaque nombre des 24 sources doit apparaître dans la note de destination. Première passe : 51 éléments absents (citations et nombres perdus en condensant chimie-eau et design-system). Après réintégration : 0 absent sur 170 citations et 403 nombres distincts. C'est une présence de chaîne, pas une comparaison d'occurrences.

**Essais** : G1 à G3 au premier passage. Le contrôle complémentaire a demandé deux passes de correction, sur chimie-eau, design-system-historique et quatre retouches ponctuelles (modele-brassage, moneaudebrassage, gemini-tests-reels, verification-locale).

**Ce qui reste douteux** :
- Entrées `INDEX.md` : à ajouter par le pilote (24 notes).
- Chemins cités absents de ce worktree, marqués « absent de ce worktree » dans le champ `sources` : `tournoi/outils/planche.mjs`, `veille/STOP`, `gemini-journal.md`, `veille/relance-releve.ps1`, `veille/lancer-veille.ps1`, `veille-orchestrateur.ps1`. `src/domain/water.ts` est devenu le dossier `src/domain/water/` (marqué de même).
- Compression : chimie-eau (source de 352 lignes) et design-system-historique (source de 333 lignes) tiennent en 49 et 33 lignes de corps, grâce à des puces longues. Règles, chiffres et citations sont gardés ; les anecdotes et les récits sont coupés. Une seule note par source était imposée ; le pilote juge si cette densité convient.
- Descriptions ajustées à la lecture du corps (rien-de-fige, exploration-v0-libre, fil-de-fer-d-abord, chimie-eau, design-system-historique).
- Hors de ma voie, apparus pendant le travail : `cerveau/metier/descripteurs-hors-familles.md` (le lien de LECONS L14 et d'outils-houblons résout désormais) et `cerveau/decisions/2026-10-22-carte-outils-houblons.md`. Non touchés.

**CONNAISSANCE** : le hook `cerveau.mjs` contrôle après chaque écriture. Pendant un lot de notes qui se citent, il signale les liens vers les notes pas encore écrites ; ces erreurs sont transitoires, et le contrôle final (`node scripts/agents/systeme.mjs cerveau`) fait foi.

**LEÇON PROPOSÉE** : Erreur : 51 citations et nombres perdus à la première condensation de deux sources de 330 à 350 lignes. Cause : limite de 50 lignes sans règle de découpage, et aucune liste des éléments à garder avant d'écrire. Règle : lister les « » et les nombres d'une source avant de la condenser, puis vérifier par script après écriture. Au pilote : prévoir plusieurs notes pour une source de plus de 150 lignes, plutôt qu'une seule note de 50 lignes.
