# Voie critique-57 — test d'écran en ligne du tour 57 (poignées au bord, vitesse du défilement au bord) dans le Calendrier

- Agent : critique ; Modèle : opus (Fable interdit) ; Niveau : jugement ; Plafond : 80 tours.
- Lis DOSSIER.md (même dossier) À LA PLACE des sources brutes ; ouvre sa capture.
- Possède : work/missions/2026-11-23-reprise-soir/voies/critique-57/ ; lignes POI-1, Q4-1 et neuves (préfixe K57-) de work/missions/BUGS.md.

## Économie
- Mécanique : aucune — chaque capture se juge à l'œil.
- Gestes : un script puppeteer par geste, captures à chaque geste ; demi-échelle pour les intermédiaires.

## À faire
1. Relever avant : soldes, « CHF à dépenser », période du Calendrier ; après : IDENTIQUES (sinon : bloquant, versé). Aucune donnée réelle modifiée : gestes sur des « ZZ TEST — … » créés puis retirés ; ses barres réelles : seulement toucher sans relâcher un changement (annuler / remettre).
2. Verdict « combien et quels problèmes ? » ; POI-1, Q4-1 « vérifié — en ligne index-JrS2YtfY.js » ou rouverts ; chaque problème neuf versé (K57-n).
3. node scripts/agents/controle-bugs.mjs > voies/critique-57/bugs.log → BUGS OK. N'écris dans BUGS.md que des lignes entières à toi.

## Tenue
- RESULTAT.md écrit dès le début et tenu au fil (une limite de tours ne doit rien perdre).
- Tests : aucun test unitaire ; ligne « Tests : sans objet (test d'écran) » ; contrôle du registre dans un fichier (équivalent --reporter=dot).
- Captures 390 ouvertes avant tout verdict. Fin : « RESULTAT critique-57 : N problèmes (B x, m y, D z) — soldes identiques oui/non — BUGS OK ».
