# Voie critique-cal — test d'écran en ligne du Calendrier, tour 29

- Agent : critique ; Modèle : opus (Fable interdit) ; Niveau : jugement ; Plafond : 100 tours.
- Lis DOSSIER.md (même dossier) À LA PLACE des sources brutes.
- Possède : work/missions/2026-11-23-reprise-soir/voies/critique-cal/ ; lignes neuves en fin de work/missions/BUGS.md (préfixe T29-) ; état des lignes T28-16, CALP-5, CALP-6, CALP-13 de BUGS.md.

## Économie
- Mécanique : aucune — chaque capture se juge à l'œil.
- Gestes : un script puppeteer par lot de gestes (par règle du DOSSIER), captures à chaque geste ; demi-échelle pour les intermédiaires, pleine échelle pour le jugement.

## À faire
1. Jouer tout ce que liste DOSSIER.md, chaque actionneur touché, sur des événements « ZZ TEST — … » que tu crées.
2. Verdict « combien et quels problèmes ? », liste numérotée, gravité B/m/D ; chaque problème versé à BUGS.md (T29-n, format des lignes T28) ; T28-16, CALP-5 : état mis à jour avec capture.
3. Retirer tout ZZ ; vérifier qu'aucune vraie donnée n'a bougé. `node scripts/agents/controle-bugs.mjs > voies/critique-cal/bugs.log` → BUGS OK.

## Tenue
- RESULTAT.md tenu au fil (une limite de tours ne doit rien perdre) : une ligne par règle jouée.
- Tests : aucun test unitaire ; ligne « Tests : sans objet (test d'écran) » ; contrôle du registre dans un fichier (équivalent --reporter=dot).
- Captures 390 ouvertes avant tout verdict. Fin : « RESULTAT critique-cal : N problèmes (B x, m y, D z) — BUGS OK ».
