# Voie critique-46 — test d'écran en ligne du Carnet (tour 46 : Q-1 A, Q-1b B, Q-2 C, Q-5 A, Q-6 A, domaines D437)

- Agent : critique ; Modèle : opus (Fable interdit) ; Niveau : jugement ; Plafond : 100 tours.
- Lis DOSSIER.md (même dossier) À LA PLACE des sources brutes ; ouvre les pages et captures qu'il cite.
- Possède : work/missions/2026-11-23-reprise-soir/voies/critique-46/ ; lignes neuves (préfixe C46-) et lignes citées de work/missions/BUGS.md ; lignes ajoutées à work/missions/2026-11-23-carnet-en-ligne/ia-journal.jsonl.

## Économie
- Mécanique : aucune.
- Gestes : un script puppeteer par choix porté, captures à chaque geste ; demi-échelle pour les intermédiaires.

## À faire
1. Relever le nombre de carnets et leurs domaines avant ; jouer le DOSSIER sur des carnets « ZZ TEST — … » ; tout retirer ; même nombre après (sinon : bloquant, versé).
2. Verdict « combien et quels problèmes ? » ; chaque choix porté comparé côte à côte à sa variante choisie ; mesure du domaine posé par l'IA (justes / total).
3. node scripts/agents/controle-bugs.mjs > voies/critique-46/bugs.log → BUGS OK.

## Tenue
- RESULTAT.md écrit dès le début et tenu au fil (une limite de tours ne doit rien perdre).
- Tests : aucun test unitaire ; ligne « Tests : sans objet (test d'écran) » ; contrôle du registre dans un fichier (équivalent --reporter=dot).
- Captures 390 ouvertes avant tout verdict. Fin : « RESULTAT critique-46 : N problèmes (B x, m y, D z) — domaine juste a/b — carnets identiques oui/non — BUGS OK ».
