# Voie n2-ecran — « 19 L » grisé (PageShell), pied et « + » communs à l'assistant

Agent : auteur (Sonnet), plafond 120 tours.
Dépôt de travail : `C:/Users/mrspa/Documents/Brasserie/.claude/worktrees/epic-banach-4c4f89/` (branche `claude/nuit-recette-1611b` du worktree epic-banach, parti du tag `en-ligne/2026-11-15-recette3`, qui est en ligne). Tout le code s'écrit ici. Les documents de la mission d'origine sont à lire, sans y écrire, dans `C:/Users/mrspa/Documents/Brasserie/.claude/worktrees/epic-banach-4c4f89/work/missions/2026-11-14-recette/` (MISSION.md, BUGS dans `C:/Users/mrspa/Documents/Brasserie/.claude/worktrees/epic-banach-4c4f89/work/missions/BUGS.md`, RESULTAT des voies port-*).
Carte blanche du brasseur pour la nuit (relayée) : aucune question. Fable interdit. Stock, jour de brassage, Brassins et Finances ne se touchent pas. Ne jamais toucher `.codex/hooks.json`, `functions/.env`, `firestore.rules`, `.firebaserc`. Aucun déploiement, aucun commit (le pilote commite par chemins), pas de `git stash`, aucun code par heredoc ni `node -e`.

## Faire
1. **« 19 L » grisé** dans l'en-tête de la page de la recette, comme la maquette r1 (`C:/Users/mrspa/Documents/Brasserie/.claude/worktrees/epic-banach-4c4f89/work/missions/2026-11-14-recette/v0/recette/r1/r1-repos-haut.png`) : `src/ui/PageShell.tsx` (ou son nom réel) accepte `title: React.ReactNode` avec une chaîne pour l'`aria-label` ; tous les appelants restent identiques ; test.
2. **Pied et « + » communs à l'assistant** (Identité à Récap) : les maquettes choisies (Paliers r2 `C:/Users/mrspa/Documents/Brasserie/.claude/worktrees/epic-banach-4c4f89/work/missions/2026-11-14-recette/v0/paliers/r2/r2-repos-page.png`, Eau w1b `C:/Users/mrspa/Documents/Brasserie/.claude/worktrees/epic-banach-4c4f89/work/missions/2026-11-14-recette/v3/eau-onglet/w1b/w1b-repos-page.png`) posent « Retour · Suivant — <étape> » en fin de contenu, et le « + » rond à droite de « Suivant », sur la même ligne, sans chevauchement (8 px), à 390 et 1280. Lis comment l'onglet Eau l'a fait dans ce dépôt (`src/ui/water/`, bloc eau de `src/pages/BrewWizard.tsx`, RESULTAT de port-eau) et généralise-le à toutes les étapes de l'assistant, sans rien perdre : le lanceur « + » garde son menu et ses gestes. Le Récap garde ses boutons d'enregistrement.
3. Tests : un test d'intégration qui, pour chaque étape, vérifie que le « + » est dans le pied à droite de Suivant (rouge avant, vert après) ; tests existants de l'assistant rejoués (`recipeEditing` a 6 échecs déjà présents sur le tag : ne pas les compter, les vérifier identiques).
4. Captures au banc local (`?dev-local&etape=<étape>`, serveur `node scripts/with_server.mjs --server "npm run dev -- --port 5185 --strictPort" --port 5185 --env VITE_HOP_V4=on -- node <script>`) : chaque étape à 390 tactile (vues défilées 390 × 844) et 1280, clair et cave, ouvertes ; écarts corrigés.

## Critères
- tsc 0 erreur ; `npm run build` vert (DRAPEAUX OK) ; tests verts sauf les échecs connus du tag.
- Captures ouvertes, « + » jamais posé sur un contrôle.

## Tenue
- RESULTAT.md tenu au fil (une limite de tours ne doit rien perdre) : `C:/Users/mrspa/Documents/Brasserie/.claude/worktrees/epic-banach-4c4f89/work/missions/2026-11-16-nuit-recette/voies/n2-ecran/RESULTAT.md`.
- Tests : `npx vitest run <fichiers> --reporter=dot > C:/Users/mrspa/Documents/Brasserie/.claude/worktrees/epic-banach-4c4f89/work/missions/2026-11-16-nuit-recette/voies/n2-ecran/tests.txt` ; jamais la sortie entière dans le contexte.
- À 180 k de contexte : l'état dans RESULTAT, puis « REPRISE : <fichier> ».

## Possède
`src/ui/PageShell.tsx` (et ses appelants si le type l'exige, sans changer leur rendu), le pied et le lanceur de l'assistant (`src/pages/BrewWizard.tsx` : pied seulement ; le composant du lanceur « + »), `src/pages/RecipePage.tsx` (titre seulement), tests neufs, `work/missions/2026-11-16-nuit-recette/voies/n2-ecran/`. Pas `src/domain/water/` (autre voie). Rends une ligne.
