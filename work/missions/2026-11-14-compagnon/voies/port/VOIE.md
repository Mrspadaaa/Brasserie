# Voie port — p2a « Tout se lit sans lire » portée 1:1 dans le compagnon

- Mission : 2026-11-14-compagnon
- Agent : auteur
- Modèle : sonnet
- Niveau : jugement
- Plafond : 120 tours ; 3 essais par critère
- Dépend de : p2a (choisie par le brasseur le 15.11 : « Tout se lit sans lire / p2a · de s3b / Parfait »)
- Décideur en cas de doute : pilote

## Objectif
Le compagnon brasseur de l'app prend la forme de la maquette p2a, ses 12 vues, branché sur les vraies données, typé, testé, build vert, dans le worktree `C:/Users/mrspa/AppData/Local/Temp/compagnon-p2a` (branche `claude/compagnon-p2a`, base `en-ligne/2026-11-14-atelier-uv4`).

## Entrées
- `work/missions/2026-11-14-compagnon/voies/p2a/p2a/etat.html` — **la maquette choisie, la référence** (12 cadres `data-cadre`). Règle n° 1 : reprise telle quelle ; un port retire ce qu'elle n'a pas.
- `work/refonte-frontend/v4/outils/pages/2026-11-14-compagnon/img/p2a-<cadre>.png` et `p2a-<cadre>-cave.png` — ses captures, cadre par cadre.
- `work/missions/2026-11-14-compagnon/voies/p2a/VOIE.md` — sections « Données de la passe 2 » et « Exigences » (ce que chaque cadre doit dire).
- `work/missions/2026-11-14-compagnon/ANALYSE.md` — les 14 défauts de l'écran actuel, que le port corrige.
- Dans le worktree : `src/ui/BrewerChat.tsx` (ScopedChat, BrewerWorkCard, SupplierCards ; `SemanticCompanionChat` hors périmètre), `src/ui/brewer-chat.css`, `src/ui/BrewerProposalCard.tsx`, `src/ui/BrewerActivity.tsx` (« Mes conversations »), `src/ui/BrewerBudget.tsx` (budget mensuel en CHF, `setBrewerAiBudget`), `src/ui/BrewerNotifications.tsx`, `src/ui/finance/FinanceAssistant.tsx`, `functions/src/companionTypes.ts` (types, lecture seule), `docs/compagnon-brasseur.md`.
- `DESIGN.md` (jetons, « Deux régimes », « Cibles »), `.claude/rules/affinee-frontend.md`.

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- Dans le worktree `C:/Users/mrspa/AppData/Local/Temp/compagnon-p2a` : `src/ui/BrewerChat.tsx`, `src/ui/brewer-chat.css`, `src/ui/BrewerProposalCard.tsx`, `src/ui/BrewerActivity.tsx`, `src/ui/BrewerBudget.tsx`, `src/ui/BrewerNotifications.tsx`, `src/ui/finance/FinanceAssistant.tsx`, `src/ui/companion/` (nouveau, composants extraits), `tests/**/*brewer*`, `tests/**/*companion*` (nouveaux tests).
- `work/missions/2026-11-14-compagnon/voies/port/` (dépôt partagé : RESULTAT.md, INVENTAIRE.md, tests.txt).

## Consignes
Charger `boosters-ux`, `impeccable`, `senior-frontend`, `a11y-audit`.
1. **Inventaire d'abord** (`INVENTAIRE.md`) : pour chaque cadre de p2a, chaque élément visible (texte, forme, geste), la donnée réelle qui le nourrit (champ de `BrewerTurn`, `ClientBrewerJob`, budget, activité), et « absent du serveur » quand rien ne le nourrit. Un élément sans donnée réelle ne s'invente pas : il se retire ou se dérive honnêtement (dire comment).
2. Dérivations attendues : feu du niveau ← `advice.level` (info / attention / urgent) ; barres avant → après ← propositions (valeurs numériques avant/après ; un champ non numérique reste en texte) ; jauge de durée ← mode (Rapide, Auto 15–30 s, Approfondi 1–3 min) et borne serveur 220 s (3:40) ; étapes de l'attente ← `job.stage` ; « relu deux fois · calculs refaits · N sources » ← `reviewed`, `reviewModel` présent, nombre de preuves et de sources — **jamais le nom d'un modèle** ; budget ← `BrewerBudget` (monthly en CHF) ; « Au journal » ← `onKeep` existant (portée brassin) ; statuts de « Mes conversations » ← activité (`jobs` : prête, en cours, échec).
3. Le « Rappel 09:00 » de la réponse : brancher seulement si une capacité de rappel existe déjà côté client (chercher `src/services/brewNotifications.ts`) ; sinon le retirer et l'écrire dans RESULTAT.md (« retiré : aucune capacité de rappel »).
4. Aucun nom de modèle ni de fournisseur d'IA à l'écran (DESIGN.md) : modes, carte d'attente, détails, Finances (« Gemini reçoit… »), budget (« Appels Gemini », « facture Google »), plafond (« Ouvrir les dépenses Google » remplacé par « Régler les limites »). Les modèles restent enregistrés côté serveur, non affichés.
5. Garder tout le comportement : envoi, relance, reformuler, file, hors ligne (question gardée), remise à zéro, propositions (cases puis validation explicite, `applyBrewerProposal`), lecture assistée (`assistedAdvice`), portée brouillon, fournisseurs, notifications, « Échanges précédents ». Aucun appel serveur nouveau ; `functions/` intouché.
6. 1280 : la forme du cadre `bureau` de p2a.
7. Tests Vitest seulement pour les règles de calcul nouvelles (dérivation du feu, des barres, de la jauge, des libellés de relecture sans nom de modèle) ; mettre à jour les tests existants cassés par le changement de rendu, sans affaiblir ce qu'ils protègent.
8. Commits dans le worktree, par chemins, message en français finissant par `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Ni push, ni déploiement.
9. **S'arrêter à la preuve** : code, tests, build, `controle-port.mjs` vert. Les captures côte à côte et le test d'écran partent dans d'autres voies (executant, puis critique) : écrire à la fin de RESULTAT.md une section `DEMANDE EXECUTANT :` avec ce qu'il faut capturer (banc `work/missions/2026-11-14-compagnon/voies/b-banc/banc.mjs`, adapté au worktree et au nouveau rendu).

## Exigences transversales et acquis (recopiés, leçons L05 et L06)
- Règle n° 1 : la maquette choisie telle quelle, chaque état (L03) ; plancher : tout ce que la base faisait (L07).
- Premier plan léger, détail à un toucher ; chrome compact ; le mode n'est jamais affiché pendant la lecture d'une réponse ; verdict et geste d'abord ; nombres et unités collés (espace insécable) ; virgule décimale ; mono pour les mesures.
- Au doigt à 390 ; jamais `type="number"` ; saisie en pied de feuille en 16 px ; deux thèmes (clair et cave, jetons DESIGN.md) ; icônes lucide au trait.
- Gemini jamais réel dans un test (CLAUDE.md) ; rien sur les données réelles.
- Dossier partagé `C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie` : n'y écrire que dans `voies/port/` ; ni stash, ni checkout, ni reset.
- Sous Bash, un heredoc contenant une apostrophe droite échoue : écrire les fichiers avec Write.

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier. Lancer chaque `CHECK:` depuis la racine du dépôt partagé.

## Rendre
- `RESULTAT.md` tenu au fil (mis à jour tous les 5 éléments : une limite de tours ne perd rien) : fichiers touchés, commits, écarts à la maquette et leur raison, retraits.
- La ligne « Tests » écrite dans un fichier : `node work/missions/2026-11-14-compagnon/outils/controle-port.mjs tests > work/missions/2026-11-14-compagnon/voies/port/tests.txt`, et la suite entière des fichiers touchés ; rouges hors zone dits (comparer avec la base `en-ligne/2026-11-14-atelier-uv4`).
- Voie d'écran : les captures 390 tactile et 1280, clair et cave, côte à côte avec la maquette, viennent de la voie executant suivante (DEMANDE EXECUTANT).
Réponse finale au pilote : une ligne.
