# Voie critique-47 — test d'écran en ligne du tour 47 (E45-1..3, lecture des liens D449)

- Agent : critique ; Modèle : opus (Fable interdit) ; Niveau : jugement ; Plafond : 100 tours.
- Lis DOSSIER.md (même dossier) À LA PLACE des sources brutes ; ouvre les captures qu'il cite.
- Possède : work/missions/2026-11-23-reprise-soir/voies/critique-47/ ; lignes E45 et neuves (préfixe E47-) de work/missions/BUGS.md ; lignes ajoutées au journal work/missions/2026-11-23-carnet-en-ligne/ia-journal.jsonl.

## Économie
- Mécanique : aucune — chaque capture se juge à l'œil.
- Gestes : un script puppeteer par constat, captures à chaque geste ; demi-échelle pour les intermédiaires.

## À faire
1. Relever soldes, « Mon mois », période du Calendrier et nombre de carnets avant ; jouer le DOSSIER sur des « ZZ TEST — … » ; tout retirer ; identiques après (sinon : bloquant, versé).
2. Verdict « combien et quels problèmes ? » ; E45-1..3 « vérifié — en ligne index-BxvQ1J-z.js » ou rouverts ; chaque problème neuf versé (E47-n).
3. node scripts/agents/controle-bugs.mjs > voies/critique-47/bugs.log → BUGS OK. N'écris dans BUGS.md que des lignes entières à toi (jamais l'en-tête).

## Tenue
- RESULTAT.md écrit dès le début et tenu au fil (une limite de tours ne doit rien perdre).
- Tests : aucun test unitaire ; ligne « Tests : sans objet (test d'écran) » ; contrôle du registre dans un fichier (équivalent --reporter=dot).
- Captures 390 ouvertes avant tout verdict. Fin : « RESULTAT critique-47 : N problèmes (B x, m y, D z) — soldes identiques oui/non — BUGS OK ».
