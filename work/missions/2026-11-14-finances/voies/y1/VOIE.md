# Voie y1 — Synthèse ramenée à g3a ; diagnostic Annuel

- Mission : 2026-11-14-finances
- Agent : auteur
- Modèle : sonnet
- Niveau : jugement
- Plafond : 120 tours ; 3 essais par critère
- Dépend de : —
- Décideur en cas de doute : pilote

## Objectif
Sur ses données (ventes 5 695,00 contre dépenses 265,40), la Synthèse reste g3a : l'écart du gain dessiné en pointillé vide (pas rempli de vert), chaque segment de dépense lisible avec son libellé entier (« Autres frais 250,20 » jamais coupé), la légende aux couleurs vues, le libellé de vente sur deux lignes au plus. Puis un diagnostic en lecture seule de l'Annuel.

## Entrées
- work/missions/2026-11-14-finances/ref/g3a/NOTE.md, ref/g3a/g3a-page.png, ref/g3a/etat.html — la cible
- work/missions/2026-11-14-finances/analyse/cap/syn-390-clair.png et syn-390-cave.png — l'app au banc
- work/missions/2026-11-14-finances/ANALYSE.md — problèmes 4 à 8
- src/ui/finance/synthese/Scene.tsx, synthese.css
- Le cas ventes ≫ dépenses se range dans l'état g3a (L03) : même grammaire, pas de composant neuf. Si un segment trop petit doit grandir, faire comme MM-1 (segment ≥ 10 px, montant exact écrit) et le dire.

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `src/ui/finance/synthese`
- `src/ui/finance/synthese.css`
- `work/missions/2026-11-14-finances/voies/y1`

## Consignes
1. Écrire `work/missions/2026-11-14-finances/voies/y1/controle-synthese.mjs <port>` : sur Synthèse au banc (390, clair et cave) : la zone du gain n'a pas de fond plein (fond transparent ou hachure, bord pointillé) ; chaque libellé de segment est entièrement dans sa colonne et dans la vue (aucun débord) ; chaque pastille de légende a la couleur d'un segment visible ; le libellé de vente tient en 2 lignes au plus. Imprime SYNTHESE OK ou SYNTHESE ECHEC et le détail.
2. Le lancer sur le code actuel : ECHEC attendu ; copier la sortie dans `temoin-head.txt`.
3. Corriger le code, puis le contrôle passe. Tests Vitest des fichiers touchés et voisins.
4. Captures 390 et 1280, clair et cave, dans `work/missions/2026-11-14-finances/voies/y1/cap/`, plus une planche côte à côte avec la maquette ; toutes ouvertes.

## Diagnostic Annuel (lecture seule, aucun code)
Au banc, Annuel montre « Local et travaux 5 500,00 » dans « Dépensé + usure » (perte −70,40), alors qu'Opérations le range « Matériel · à part ». Lis `src/domain/finance/annual.ts` et ses tests : un achat de matériel entre-t-il en charge entière, en usure (amortissement), ou selon qu'une fiche matériel existe ? Est-ce juste pour une comptabilité suisse simple (indépendant, amortissement linéaire) et conforme à g6 (`work/missions/2026-11-14-finances/ref/g6/NOTE.md`) ? Écris `DIAG-ANNUEL.md` : constat, règle du code (fichier:ligne), Verdict (juste / à corriger / à demander), correctif proposé. Ne corrige pas : le pilote décide.

## Exigences transversales et acquis (recopiés, L05, L06)
- Règle n° 1 : la maquette choisie est la base, reprise telle quelle ; un port retire ce qu'elle n'a pas (L03).
- Rien hors de « Possède » ; `git status --short` à la fin (L17). Ne touche ni la bande de période (`operations/Bande.tsx`, `PlageMois.tsx`) ni la Dépense, le Stock, les Brassins, le jour de brassage (autres sessions).
- Écritures, TVA, montants : aucune règle de calcul changée sans le dire dans RESULTAT.md ; aucune donnée réelle (banc `?dev-local&finance-demo=reel` seulement).
- Contrôle d'abord rouge sur le code actuel (sortie copiée dans `temoin-head.txt`), puis vert (L13). Vision d'abord (D343) : captures 390 tactile et 1280, clair (`localStorage['laffinee.theme']='clair'`) et cave (`'cave'`), côte à côte avec la maquette, toutes ouvertes.
- Pas de Fable, aucun sous-agent. Banc : serveur Vite déjà lancé sur http://localhost:3000 (ce worktree, HMR) ; sinon `PORT=3017 npx vite`.
- Puppeteer : `.claude/skills/webapp-testing/examples/_lanceur.mjs` (fonction `ouvrir`), modèle `work/missions/2026-11-14-finances/analyse/capturer2.mjs`.

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier. Lancer chaque `CHECK:` depuis la racine du dépôt.

## Rendre
- `RESULTAT.md` tenu au fil : fichiers changés, contrôle avant/après, tests, captures ouvertes, défauts restants.
- `npx vitest run src/ui/finance src/domain/finance --reporter=dot > work/missions/2026-11-14-finances/voies/y1/tests.txt`.
Réponse finale au pilote : une ligne.
