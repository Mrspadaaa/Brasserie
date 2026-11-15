# Voie a1 — Annuel : une pièce non classée n'est plus une perte ferme

- Mission : 2026-11-14-finances
- Agent : auteur
- Modèle : sonnet
- Niveau : jugement
- Plafond : 120 tours ; 3 essais par critère
- Dépend de : y1 (diagnostic)
- Décideur en cas de doute : pilote

## Objectif
Dans Annuel (g6), tant qu'une pièce de capital est non classée (`piecesNonClassees(report)`), son montant sort du « Dépensé + usure » ferme et se pose en segment **hachuré « à classer »** (la grammaire hachurée de g6 pour l'inconnu), et la tête ne dit plus « −70,40 CHF perdus » ferme : elle dit que le résultat attend ce classement, avec un **renvoi** au toucher vers le geste qui classe la pièce (étape de clôture « matériel » ou la pièce elle-même). UI seule : `src/domain/finance/annual.ts` est juste, on n'y touche pas.

## Entrées
- `work/missions/2026-11-14-finances/voies/y1/DIAG-ANNUEL.md` — constat, règles du code (fichier:ligne), correctif 1 et 2 proposés.
- `work/missions/2026-11-14-finances/ref/g6/NOTE.md`, `ref/g6/g6-page.png`, `ref/g6/g6-4-materiel.png` — la maquette choisie : hachures, étape 4 matériel.
- `work/missions/2026-11-14-finances/analyse/cap/ann-390-clair.png` — l'app au banc.
- `src/ui/finance/annuel/calculs.ts`, `Tete.tsx` — où naît le −70,40.

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `src/ui/finance/annuel`
- `work/missions/2026-11-14-finances/voies/a1`

## Consignes
1. Écrire `work/missions/2026-11-14-finances/voies/a1/controle-annuel.mjs <port>` : sur Annuel au banc (390, clair), la tête n'affiche pas un montant de perte ou de gain ferme sans marque d'attente quand une pièce est non classée ; « Local et travaux 5 500,00 » n'est pas dans un segment plein de « Dépensé + usure » mais dans un segment hachuré marqué « à classer » ; un renvoi touchable (bouton ou lien) mène au classement. Imprime ANNUEL OK ou ANNUEL ECHEC et le détail.
2. Le lancer sur le code actuel : ECHEC attendu ; sortie dans `temoin-head.txt`.
3. Corriger, rester dans l'état g6 (aucun composant neuf, L03) ; mots courts, au style. Le renvoi ouvre ce qui existe déjà (étape de clôture matériel ou la feuille de la pièce) : lis le code avant d'en inventer un.
4. Tests Vitest de `calculs.ts` (une règle : pièce non classée → segment « à classer », tête en attente) ; captures 390 et 1280, clair et cave, dans `cap/`, planche côte à côte avec g6 ; toutes ouvertes.

## Exigences transversales et acquis (recopiés, L05, L06)
- Règle n° 1 : g6 reprise telle quelle ; un cas neuf se range dans un état de g6.
- Rien hors de « Possède » ; `git status --short` à la fin (L17). Ne touche ni Synthèse (y1 fini), ni Opérations, ni le domaine, ni la Dépense, le Stock, les Brassins.
- Montants : aucune règle de calcul du domaine changée ; inconnu ≠ 0 ; aucune donnée réelle (banc `?dev-local&finance-demo=reel`).
- Renvois : « Pas de renvoi ??? / Bref il en manque plein... » (10.11, sur Annuel) — chaque manque visible mène à son geste.
- Pas de Fable, aucun sous-agent. Banc : http://localhost:3000 (ce worktree, HMR). Puppeteer : `.claude/skills/webapp-testing/examples/_lanceur.mjs`, modèle `work/missions/2026-11-14-finances/analyse/capturer2.mjs`. Thème : `localStorage['laffinee.theme']` = `clair` ou `cave`.

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier. Lancer chaque `CHECK:` depuis la racine du dépôt.

## Rendre
- `RESULTAT.md` tenu au fil : fichiers changés, contrôle avant/après, tests, captures ouvertes, défauts restants.
- `npx vitest run src/ui/finance src/domain/finance --reporter=dot > work/missions/2026-11-14-finances/voies/a1/tests.txt`.
Réponse finale au pilote : une ligne.
