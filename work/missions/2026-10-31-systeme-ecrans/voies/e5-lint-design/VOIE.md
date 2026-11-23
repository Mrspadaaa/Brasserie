# Voie e5-lint-design — le lint de DESIGN.md

Agent : auteur (Sonnet). Un outil de contrôle. Écris RESULTAT.md tôt.

## Accord de l'utilisateur (31.10)
« Pour le lint de DESIGN.md, dis-moi aussi si tu acceptes l'installation du paquet. Oui ok met tout en place ».
Le paquet : `@google/design.md` **0.4.0** (npm, publié le 27.07.2026, dépôt `google-labs-code/design.md`, Apache-2.0 selon notre rapport ;
vérifie la licence dans le paquet installé).

## Ce qui est demandé
1. Installer l'outil **dans son propre dossier**, jamais dans le `node_modules` partagé :
   - `tools/design-lint/package.json`, avec `@google/design.md` épinglé à `0.4.0` (version exacte) ;
   - puis `npm install --prefix tools/design-lint --no-audit --no-fund` ;
   - `tools/design-lint/node_modules` est ignoré par git (ajoute la ligne à `.gitignore`) ; le `package-lock.json` du dossier est gardé.
   Lis le README et `--help` de l'outil installé avant de le lancer.
2. Un script `npm run lint:design`, à ajouter au `package.json` racine (seulement la ligne `scripts`). Il lance l'outil sur `DESIGN.md`, et
   sur `docs/ui-compacte.md` si l'outil l'accepte.
3. Lancer, puis trier ce qu'il signale, en trois parts :
   - **erreurs réelles** (une référence cassée, un token manquant) : corrige-les dans DESIGN.md seulement si c'est mécanique (un lien, une
     ancre, un nom), en le disant ligne par ligne ;
   - **désaccords de format** (notre ordre de sections en français) : ni correction ni contournement, la liste suffit ;
   - **questions de fond** (contraste, une règle qui se contredit) : une liste pour le pilote, sans rien changer.
   Ne modifie aucune règle de DESIGN.md.
4. Proposer, sans l'écrire, comment le brancher : dans `scripts/agents/systeme.mjs`, dans les GATES d'une voie d'interface, ou à la main.

## Critères
- `npm run lint:design` tourne, avec un code de sortie et une sortie lisible ; garde la sortie complète dans ta voie.
- `git status` : seuls `tools/design-lint/package.json`, son lock, `.gitignore`, la ligne de `package.json`, ta voie, et DESIGN.md pour une
  correction mécanique.
- Rien de neuf dans `node_modules` à la racine. Vérifie-le : la liste de `node_modules/@google` est la même avant et après.

## Possède
- `tools/design-lint/`, la ligne `lint:design` de `package.json`, `.gitignore`.
- DESIGN.md : corrections mécaniques seulement.
- `work/missions/2026-10-31-systeme-ecrans/voies/e5-lint-design/`.

N'écris aucun code par heredoc ni par `node -e`. Pas de `git stash`, aucun commit. Rends une ligne.
