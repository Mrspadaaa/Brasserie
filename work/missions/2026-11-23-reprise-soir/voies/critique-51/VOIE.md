# Voie critique-51 — test d'écran en ligne du tour 51 (centimes dans le Calendrier, C46-5)

- Agent : critique ; Modèle : opus (Fable interdit) ; Niveau : jugement ; Plafond : 60 tours.
- Lis DOSSIER.md (même dossier) À LA PLACE des sources brutes.
- Possède : work/missions/2026-11-23-reprise-soir/voies/critique-51/ ; ligne C46-5 et lignes neuves (préfixe K51-) de work/missions/BUGS.md.

## Économie
- Mécanique : aucune — chaque capture se juge à l'œil.
- Gestes : un script puppeteer ; captures de chaque endroit qui écrit un montant.

## À faire
1. Relever soldes, « Mon mois », période du Calendrier avant ; jouer le DOSSIER sur des « ZZ TEST — … » ; tout retirer ; identiques après (sinon : bloquant, versé).
2. Verdict « combien et quels problèmes ? » ; C46-5 « vérifié — en ligne index-Br_hbvJ9.js » ou rouvert ; chaque problème neuf versé (K51-n).
3. node scripts/agents/controle-bugs.mjs > voies/critique-51/bugs.log → BUGS OK. N'écris dans BUGS.md que des lignes entières à toi.

## Tenue
- RESULTAT.md écrit dès le début et tenu au fil (une limite de tours ne doit rien perdre).
- Tests : aucun test unitaire ; ligne « Tests : sans objet (test d'écran) » ; contrôle du registre dans un fichier (équivalent --reporter=dot).
- Captures 390 ouvertes avant tout verdict. Fin : « RESULTAT critique-51 : N problèmes (B x, m y, D z) — soldes identiques oui/non — BUGS OK ».
