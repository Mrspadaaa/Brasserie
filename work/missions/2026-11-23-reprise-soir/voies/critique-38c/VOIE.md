# Voie critique-38c — test d'écran en ligne : Calendrier bord à bord, menu +, avis, apport (tour 38)

- Agent : critique ; Modèle : opus (Fable interdit) ; Niveau : jugement ; Plafond : 100 tours.
- Lis DOSSIER.md (même dossier) À LA PLACE des sources brutes ; ouvre les captures qu'il cite.
- Possède : work/missions/2026-11-23-reprise-soir/voies/critique-38c/ ; lignes neuves en fin de work/missions/BUGS.md (préfixe C38-) ; état des lignes T29-6, T29-8, T32-1 de BUGS.md.

## Économie
- Mécanique : aucune — chaque capture se juge à l'œil.
- Gestes : un script puppeteer par point du DOSSIER ; demi-échelle pour les intermédiaires, pleine échelle pour le jugement.

## À faire
1. Jouer chaque point du DOSSIER, côte à côte avec sa capture de plainte.
2. Verdict « combien et quels problèmes ? », liste numérotée, gravité B/m/D ; chaque problème versé à BUGS.md (C38-n).
3. ZZ retirés, vraies données intactes ; node scripts/agents/controle-bugs.mjs > voies/critique-38c/bugs.log → BUGS OK.

## Tenue
- RESULTAT.md écrit dès le début et tenu au fil (une limite de tours ne doit rien perdre).
- Tests : aucun test unitaire ; ligne « Tests : sans objet (test d'écran) » ; contrôle du registre dans un fichier (équivalent --reporter=dot).
- Captures 390 ouvertes avant tout verdict. Fin : « RESULTAT critique-38c : N problèmes (B x, m y, D z) — BUGS OK ».
