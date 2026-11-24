# Voie critique-52 — test d'écran en ligne du tour 52 (C50, K51-1, PC-117, couleurs) sur son carnet et sur ZZ TEST, avec rejeu des corrigés

- Agent : critique ; Modèle : opus (Fable interdit) ; Niveau : jugement ; Plafond : 100 tours.
- Lis DOSSIER.md (même dossier) À LA PLACE des sources brutes ; ouvre les captures qu'il cite.
- Possède : work/missions/2026-11-23-reprise-soir/voies/critique-52/ ; lignes C50, K51-1, PC-117 et neuves (préfixe C52-) de work/missions/BUGS.md ; lignes ajoutées au journal work/missions/2026-11-23-carnet-en-ligne/ia-journal.jsonl.

## Économie
- Mécanique : aucune — chaque capture se juge à l'œil.
- Gestes : un script puppeteer par vue, captures à chaque geste ; demi-échelle pour les intermédiaires.

## À faire
1. Relever avant : son carnet « chambre froide » entier, « CHF à dépenser », soldes, période du Calendrier, nombre de carnets ; après : IDENTIQUES (sinon : bloquant, versé, en tête de RESULTAT).
2. Jouer le DOSSIER ; verdict « combien et quels problèmes ? » ; chaque corrigé « vérifié — en ligne index-CoUp1JRM.js » ou rouvert ; chaque problème neuf versé (C52-n).
3. node scripts/agents/controle-bugs.mjs > voies/critique-52/bugs.log → BUGS OK. N'écris dans BUGS.md que des lignes entières à toi (jamais l'en-tête).

## Tenue
- RESULTAT.md écrit dès le début et tenu au fil (une limite de tours ne doit rien perdre).
- Tests : aucun test unitaire ; ligne « Tests : sans objet (test d'écran) » ; contrôle du registre dans un fichier (équivalent --reporter=dot).
- Captures 390 ouvertes avant tout verdict. Fin : « RESULTAT critique-52 : N problèmes (B x, m y, D z) — corrigés rejoués a/b — carnet identique oui/non — BUGS OK ».
