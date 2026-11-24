# Voie critique-48 — test d'écran en ligne sur SON carnet « chambre froide » (tour 48)

- Agent : critique ; Modèle : opus (Fable interdit) ; Niveau : jugement ; Plafond : 100 tours.
- Lis DOSSIER.md (même dossier) À LA PLACE des sources brutes ; ouvre les captures qu'il cite.
- Possède : work/missions/2026-11-23-reprise-soir/voies/critique-48/ ; lignes C46 et neuves (préfixe C48-) de work/missions/BUGS.md.

## Économie
- Mécanique : aucune — chaque capture se juge à l'œil.
- Gestes : un script puppeteer par vue du carnet, captures à chaque geste ; demi-échelle pour les intermédiaires.

## À faire
1. Relever avant : le carnet « chambre froide » entier (titre, domaine, critères, articles, prix, choix, Quand, notes, plan), « CHF à dépenser », période du Calendrier ; après : IDENTIQUE (sinon : bloquant, versé, et le dire en tête de RESULTAT).
2. Jouer le DOSSIER ; verdict « combien et quels problèmes ? » ; C46-1..4, C46-6 « vérifié — en ligne <paquet> » ou rouverts ; chaque problème neuf versé (C48-n).
3. node scripts/agents/controle-bugs.mjs > voies/critique-48/bugs.log → BUGS OK. N'écris dans BUGS.md que des lignes entières à toi (jamais l'en-tête).

## Tenue
- RESULTAT.md écrit dès le début et tenu au fil (une limite de tours ne doit rien perdre).
- Tests : aucun test unitaire ; ligne « Tests : sans objet (test d'écran) » ; contrôle du registre dans un fichier (équivalent --reporter=dot).
- Captures 390 ouvertes avant tout verdict. Fin : « RESULTAT critique-48 : N problèmes (B x, m y, D z) — carnet identique oui/non — BUGS OK ».
