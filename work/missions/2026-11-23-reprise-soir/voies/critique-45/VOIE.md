# Voie critique-45 — test d'écran en ligne du tour 45 (E44-1..3, erreurs en français)

- Agent : critique ; Modèle : opus (Fable interdit) ; Niveau : jugement ; Plafond : 100 tours.
- Lis DOSSIER.md (même dossier) À LA PLACE des sources brutes ; ouvre les captures qu'il cite.
- Possède : work/missions/2026-11-23-reprise-soir/voies/critique-45/ ; lignes E44 et neuves (préfixe E45-) de work/missions/BUGS.md.

## Économie
- Mécanique : aucune — chaque capture se juge à l'œil.
- Gestes : un script puppeteer par constat (saisie, carte de fin, Calendrier, Modifier, retrait), captures à chaque geste ; demi-échelle pour les intermédiaires.

## À faire
1. Relever les soldes avant et la période du Calendrier ; jouer le DOSSIER sur des « ZZ TEST — … » ; tout supprimer ; soldes et période identiques après (sinon : bloquant, versé).
2. Verdict « combien et quels problèmes ? » ; E44-1..3 marqués « vérifié — en ligne index-Ba6_cMq7.js » ou rouverts ; chaque problème neuf versé (E45-n).
3. node scripts/agents/controle-bugs.mjs > voies/critique-45/bugs.log → BUGS OK.

## Tenue
- RESULTAT.md écrit dès le début et tenu au fil (une limite de tours ne doit rien perdre).
- Tests : aucun test unitaire ; ligne « Tests : sans objet (test d'écran) » ; contrôle du registre dans un fichier (équivalent --reporter=dot).
- Captures 390 ouvertes avant tout verdict. Fin : « RESULTAT critique-45 : N problèmes (B x, m y, D z) — soldes identiques oui/non — BUGS OK ».
