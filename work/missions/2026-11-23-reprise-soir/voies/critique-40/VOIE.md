# Voie critique-40 — test d'écran en ligne de toutes les écritures (tour 40 : écritures et Calendrier)

- Agent : critique ; Modèle : opus (Fable interdit) ; Niveau : jugement ; Plafond : 100 tours.
- Lis DOSSIER.md (même dossier) À LA PLACE des sources brutes ; ouvre les captures qu'il cite.
- Possède : work/missions/2026-11-23-reprise-soir/voies/critique-40/ ; lignes neuves en fin de work/missions/BUGS.md (préfixe E40-).

## Économie
- Mécanique : aucune — chaque capture se juge à l'œil.
- Gestes : un script puppeteer par sorte d'écriture (saisie, chaque actionneur, enregistrement, Calendrier, modification, suppression), captures à chaque geste ; demi-échelle pour les intermédiaires, pleine échelle pour le jugement.

## À faire
1. Relever les soldes avant ; jouer tout le DOSSIER sur des « ZZ TEST — … » ; tout supprimer ; soldes identiques après (sinon : bloquant, versé).
2. Verdict « combien et quels problèmes ? » ; matrice ; chaque problème versé à BUGS.md (E40-n).
3. `node scripts/agents/controle-bugs.mjs > voies/critique-40/bugs.log` → BUGS OK.

## Tenue
- RESULTAT.md écrit dès le début et tenu au fil (une limite de tours ne doit rien perdre) : une ligne par sorte jouée.
- Tests : aucun test unitaire ; ligne « Tests : sans objet (test d'écran) » ; contrôle du registre dans un fichier (équivalent --reporter=dot).
- Captures 390 ouvertes avant tout verdict. Fin : « RESULTAT critique-40 : N problèmes (B x, m y, D z) — soldes identiques oui/non — BUGS OK ».
