# Compris : voie p2-correctifs (mission 2026-10-31-ecran-identite)

## Objectif
Corriger dans l'app les 11 écarts relevés par le critique, pour que l'étape Identité garde la forme de r4-a même après un changement : alertes redites retirées du premier plan, source sur une ligne, dépli du fermenteur, bandeau sur une ligne à 1280, focus des nombres, « Abandonner » sur la ligne du titre, etc. Chaque état doit ressembler à sa capture r4-a, à 390 et à 1280. Avant toute correction, je dois ajouter des contrôles Chrome qui échouent sur la version actuelle et copier leur ligne `IDENTITE ECHEC n` dans RESULTAT.md, sous « TEMOIN AVANT ».

## Écrit dans
- `src/pages/BrewWizard.tsx`
- `src/pages/recipe-wizard.css`
- `src/ui/identite/`
- `tests/unit/identite/`
- `work/missions/2026-10-31-ecran-identite/voies/p2-correctifs/`

## Fini quand
- G1 : `npm run build` affiche `built in`.
- G2 : `npx vitest run tests/unit/identite --maxWorkers=2` passe, et la commande affiche `TESTS IDENTITE OK`.
- G3 : la série Chrome (`capturer-identite.mjs`, copié dans ma voie, sortie dans `voies/p2-correctifs/captures/r3/`) affiche `IDENTITE OK`. Ses contrôles couvrent les 11 écarts à 390 et à 1280 : une seule ligne de statut entre Volume et Ébullition au plus ; Repères ouverts avec une seule ligne de source et aucun bouton pleine largeur ; fermenteur ouvert avec « Fermenteur [N] L » et « ↺ profil » visibles, « Volumes et matériel » replié au repos ; bandeau sur une ligne à 1280 ; focus d'un nombre sans bordure ni fond blanc, avec un trait plein de 2 px. Je dois ouvrir les captures en image (vide, clavier après, repères ouverts, fermenteur 60, profil rendu, repos 1280, côte à côte avec r4-a) avant de dire OK.
- G4 : `RESULTAT.md` contient « TEMOIN AVANT : IDENTITE ECHEC », « baseline » et « Rien ne se perd » (commande `systeme.mjs note`).
- G5 : `controle-choix.mjs --registre --registre=…/ecrans-app.json` affiche `REGISTRE OK`.
- Les 11 écarts sont traités dans l'ordre du verdict. Les autres étapes sont comparées à la baseline ; chaque écart nouveau est nommé dans RESULTAT.md avec sa cause. Aucune référence n'est reprise (`--prendre` interdit).

## Ne fait pas
- Pas de push, pas de commit, pas de `git stash`.
- Pas de modification de VOIE.md ni de GATES.md.
- Aucune écriture dans `ecrans.json`, `ecrans-app.json`, `functions/`, `.codex/`, `source4-portable-bundle-manifest-01.json`, ni `voies/p1-port/`. Je ne lis pas `functions/.env`.
- Pas de cockpit, pas de texte sous 12 px, jamais `type="number"`, rien retiré ailleurs dans l'app.
- Pas de données réelles, pas d'appel hors localhost, pas de Gemini. Hors ligne, fixtures seulement.
- Pas de code écrit par heredoc ni par `node -e`.
- Pas de serveur dans `C:/Users/mrspa/Documents/Brasserie`.
- Pas de reprise de référence (`--prendre`) : c'est le pilote qui le fera après avoir regardé.

## Doutes
- Je n'ai pas ouvert `critique/VERDICT-port.md`, `p1-port/RESULTAT.md` ni `r4-a/` : je ne connais donc les 11 écarts que par la liste de VOIE.md. Le détail (captures, mesures exactes) reste à lire pendant l'exécution.
- Le composant du bandeau de l'assistant : je ne sais pas s'il vit dans `BrewWizard.tsx`. Si c'est un autre fichier, VOIE.md ne dit pas clairement si je peux l'écrire ou seulement le nommer.
- n° 6 (largeur de colonne) : la règle est conditionnelle, je ne connais pas encore la largeur réelle des autres étapes.
- n° 1 : la place du rinçage (une ligne au plus ou tuile Matériel) n'est pas tranchée.
- n° 10 : le format exact du volume (« 60 › », un chiffre tous les 60 min au-delà de 180 min) reste à confirmer sur la capture r4-a.
- n° 5 : les valeurs exactes du focus (fond, épaisseur) viennent de la retouche B de r4-a ; je ne les ai pas encore lues.
- G4 : je ne sais pas si la virgule dans `--contient` veut dire « et » ou une liste de choix.
- Dépendance : VOIE.md dit « relance 2, IDENTITE OK » pour p1-port ; je ne l'ai pas vérifié.
