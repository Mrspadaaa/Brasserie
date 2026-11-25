# Voie reel-77 — test d'écran en ligne du tour 73 (C56, C50-5, K57) sur son carnet, le Calendrier et ZZ TEST, avec rejeu des corrigés

- Agent : critique ; Modèle : opus (Fable interdit) ; Niveau : jugement ; Plafond : 100 tours.
- Lis DOSSIER.md (même dossier) À LA PLACE des sources brutes ; ouvre les captures qu'il cite.
- Possède : work/missions/2026-11-23-reprise-soir/voies/reel-77/ ; lignes C61, C59-6, C59-8, LE-1, BD-1, PX-1..3 et neuves (préfixe R77-) de work/missions/BUGS.md ; lignes ajoutées au journal work/missions/2026-11-23-carnet-en-ligne/ia-journal.jsonl.

## Économie
- Mécanique : aucune — chaque capture se juge à l'œil.
- Gestes : un script puppeteer par vue, captures à chaque geste ; demi-échelle pour les intermédiaires.

## À faire
1. Relever avant : son carnet « chambre froide » entier, ses barres de la frise (16 choses), soldes, « CHF à dépenser », période du Calendrier, nombre de carnets ; après : IDENTIQUES (sinon : bloquant, versé, en tête de RESULTAT). Tes scripts ne finissent JAMAIS un geste sur une de ses choses : vérifie la cible (préfixe « ZZ TEST ») avant chaque relâcher.
2. Jouer le DOSSIER ; verdict « combien et quels problèmes ? » ; chaque corrigé « vérifié — en ligne index-SSQ_J86L.js » ou rouvert ; chaque problème neuf versé (R77-n).
3. node scripts/agents/controle-bugs.mjs > voies/reel-77/bugs.log → BUGS OK. N'écris dans BUGS.md que des lignes entières à toi (jamais l'en-tête).

## Tenue
- RESULTAT.md écrit dès le début et tenu au fil (une limite de tours ne doit rien perdre).
- Tests : aucun test unitaire ; ligne « Tests : sans objet (test d'écran) » ; contrôle du registre dans un fichier (équivalent --reporter=dot).
- Captures 390 ouvertes avant tout verdict. Fin : « RESULTAT reel-77 : N problèmes (B x, m y, D z) — corrigés rejoués a/b — carnet identique oui/non — BUGS OK ».
