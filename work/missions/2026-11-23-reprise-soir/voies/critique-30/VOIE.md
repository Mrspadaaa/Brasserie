# Voie critique-30 — test d écran en ligne du tour 30 (Carnet, constats T28)

- Agent : critique ; Modèle : opus (Fable interdit) ; Niveau : jugement ; Plafond : 60 tours.
- Lis DOSSIER.md (même dossier) À LA PLACE des sources brutes ; ouvre seulement les images de référence qu'il cite.
- Possède : work/missions/2026-11-23-reprise-soir/voies/critique-30/ (captures, RESULTAT.md) ; lignes neuves en fin de work/missions/BUGS.md (préfixe T30-) ; lignes T28-1..15 et T28-17 de BUGS.md (état seulement) ; ia-journal.jsonl (ajouts).

## Économie
- Mécanique : aucune — chaque capture se juge à l'œil, le geste et le jugement ne se séparent pas.
- Gestes : un script puppeteer par lien (coller, attendre chaque étape, capture à chaque étape, ouvrir la fiche, capture), sorties filtrées ; captures à 390 pleine échelle pour le jugement, demi-échelle pour les états intermédiaires.

## À faire
1. Jouer TOUT ce que liste DOSSIER.md, sur le carnet « ZZ TEST — tour 30 » que tu crées, chaque actionneur touché (Escalader, Déplacer, Retirer, ouvrir la fiche, replier, rouvrir).
2. Chaque état des étapes capturé à 390 et posé côte à côte avec l'image de sa maquette choisie (planche PNG) ; captures ouvertes.
3. Verdict : « combien et quels problèmes ? », liste numérotée (D344), gravité B/m/D. Chaque problème versé à work/missions/BUGS.md (T30-n, format des lignes T26) ; T28-1..15 et T28-17 : état mis à jour (corrigé en ligne tour 30, ou présent) avec la capture.
4. Retirer le carnet ZZ et tout ZZ ; noter le compte des carnets avant/après. `node scripts/agents/controle-bugs.mjs` → BUGS OK.

## Tenue
- RESULTAT.md tenu au fil (une limite de tours ne doit rien perdre) : une ligne par lien joué (fait, captures, problèmes).
- Tests : aucun test unitaire ici ; la ligne « Tests » de RESULTAT.md dit « sans objet (test d'écran) », et la sortie du contrôle du registre va dans un fichier (`node scripts/agents/controle-bugs.mjs > voies/critique-30/bugs.log`, l'équivalent du --reporter=dot).
- Captures : 390, ouvertes avant tout verdict.
- Fin : une ligne « RESULTAT critique : N problèmes (B x, m y, D z) — captures — BUGS OK ».
