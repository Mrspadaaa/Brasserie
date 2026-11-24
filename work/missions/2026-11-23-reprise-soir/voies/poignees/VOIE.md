# Voie poignees — au bord de l'écran, ce qui se touche reste facile à attraper (sa plainte du 24.11)

- Agent : auteur ; Modèle : sonnet ; Niveau : jugement ; Plafond : 100 tours. Copie : C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie.
- Lis ../../COMMUN.md puis DOSSIER.md À LA PLACE des sources brutes ; ouvre sa capture.

## Économie
- Mécanique : aucune.
- Gestes : grep de TOUT ce qui se touche près d'un bord de la frise (poignées de barre, bords de fenêtre de l'en-tête, pastilles, marques) ; un script par lot ; tests dans un fichier.

## À faire
1. État de l'art en tête de RESULTAT.md (une ligne : cibles tactiles WCAG 2.5.8 / 2.5.5, 44 pt Apple, 48 dp Android ; zone du geste retour d'Android ~ 20 à 30 dp depuis chaque bord), puis la liste des actionneurs concernés (fichier:ligne).
2. Un test par actionneur AVANT le correctif, lancé rouge (sortie tests-rouge.log) : une cible touchable d'au moins 44 × 44 px, dont la zone utile se tient à au moins 24 px du bord de l'écran quand l'élément est au bord ; le rendu reste bord à bord (son choix : aucun bord autour du calendrier, traits continus).
3. Correctif : la zone de toucher s'étend vers l'intérieur (pseudo-élément ou élément transparent), jamais en rognant ou décalant le dessin ; puis vert.
4. Registre : une ligne neuve POI-1 à BUGS.md (format des lignes C55, source « sa plainte du 24.11 », capture plaintes/2026-11-24-poignee-bord.jpg) → « corrigé en local <hash> » ; node scripts/agents/controle-bugs.mjs → BUGS OK.

## Critères
- tsc : aucune erreur neuve (2 connues) ; tests touchés et tests calendrier verts ; npx vitest run tests/unit/proprietes vert ; BUGS OK ; commit par chemins ; fin « PRÊT À METTRE EN LIGNE <hash> ».

OWNS : src/ui/calendrier/frise/** ; src/ui/calendrier/entete/** (zones de toucher seulement) ; CSS de la frise ; tests/unit/ que tu crées ; ligne POI-1 de BUGS.md ; ton dossier de voie. Ne touche pas src/ui/calendrier/cadre (cœur de la frise) sauf le seul calcul de la zone de toucher, ni src/ui/carnets, src/domain/stock, src/ui/stock.

## Tenue
- RESULTAT.md tenu au fil (une limite de tours ne doit rien perdre).
- Tests : npx vitest run <fichiers> --reporter=dot > voies/poignees/tests.log 2>&1; tail -5 voies/poignees/tests.log
- Pas de captures locales : preuve en ligne par le pilote et le critique.
