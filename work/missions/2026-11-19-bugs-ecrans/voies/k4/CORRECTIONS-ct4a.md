# Corrections ct4a, tour 2 (critique k4, 20.11)

Liste figée (L18) : chaque point corrigé et prouvé seul (test si règle ; captures 390, 844×340 si concerné, et 1280, clair et cave, OUVERTES), ou écarté avec raison. Même contrat et « Possède » que voies/ct4a/VOIE.md (avec les ajouts ci-dessous) : COMMUN.md, test rouge d'abord, commit par chemins « Bugs tour 4 (ct4a) k4 : … » terminé par « Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com> », jamais de déploiement, de données réelles ni de Gemini réel, jamais stash/reset/checkout. Interdits : src/components/tabs/StocksTab.tsx, articleACreer.ts, stockArticleNeufE11.test.ts, wizardTour3Bw.test.tsx. git status de chaque fichier avant : modifié par une autre session → n'y écris pas. Plafond : à 200 k, « ## Fait » à jour et « REPRISE : … ».

## Problèmes (voies/k4/RAPPORT.md)
1. ct4a / CT4-B-1 / jourj-rappel-clair-1280 (et -390) / gênant
   - La tuile Ensemencement dit « dose à écrire », sans le besoin.
   - L'étape Levure de l'app le calcule pourtant sans fiche liée (« besoin 1,2 sachet », « Mettre 2 sachets »).
   - La correction demandée (« 2–3 sachets · à écrire ») n'est visible sur aucune capture.
   - À 390, la tuile et la ligne « Sortir la levure » ne sont pas capturées.
   - Phrase prédite : « dose à écrire, d'accord, mais combien ? »
2. ct4a / CT4-B-8 / mesures-auj-clair-1280 / gênant
   - Après le relevé, le pointillé droit de la colonne « auj. » traverse le « 2 » de « 1,012 ».
   - C'est le même défaut que la critique avait vu à 390, revenu à 1280.
3. ct4a / CT4-B-8 / mesures-clair-390, mesures-cave-390, mesures-auj-clair-390, saisie-clair-390 / gênant
   - Le mot « consigne » se pose sur « Fermenter 19 °C », dans les deux thèmes.
   - Les deux textes deviennent illisibles. ct4a l'a noté en doute, sans le corriger.
9. ct4a / CT4-B-8 / mesures-clair-1280 contre mesures-auj-clair-1280 / détail
   - L'alcool passe de « 6,4 % » à « 7 % » après le relevé : la décimale se perd, alors que (1,064 − 1,012) × 131 ≈ 6,8 %.

## Consignes du pilote
- Point 1 : la tuile dit le besoin chiffré calculé comme l'étape Levure (même fonction, jamais un second calcul), avec « à écrire » ; « 2–3 sachets » si fiche liée.
- Point 9 : l'alcool garde sa décimale (6,8 %), même formule que la fiche.
- Doute B-7 : prouve la section Conduite défilée, repliée et dépliée.

## Preuves demandées (à produire toi-même)
1. **Jour J, besoin de levure (n° 1).**
   - Commande : `node scripts/with_server.mjs --server "npm run dev" --port 3110 --env PORT=3110 -- node work/missions/2026-11-19-bugs-ecrans/voies/ct4a/banc/capturer.mjs jourj`.
   - À ajouter avant, dans une copie à `voies/k4/banc/`, pas dans le fichier de ct4a : une prise défilée jusqu'à la tuile Ensemencement et la ligne « Sortir la levure », à 390, 844×340 et 1280, en clair et en cave.
   - Captures attendues : `voies/k4/captures/jourj-ensemencement-{390,844,1280}-{clair,cave}.png`.
   - Sortie attendue : la tuile dit un besoin chiffré (« … sachets · à écrire » ou « besoin … »), jamais « 1 sachet ».
   - Si possible, refaire aussi la prise avec une levure liée à une fiche (US-05 avec hopIndexId) : « 2–3 sachets · à écrire » attendu.
2. **B-7, Conduite.**
   - Commande : `node scripts/with_server.mjs --server "npm run dev" --port 3110 --env PORT=3110 --timeout 120 -- node work/missions/2026-11-19-bugs-ecrans/voies/ct4a/banc/capturer-b37.mjs`, avec une copie à `voies/k4/banc/`.
   - Prises : défiler jusqu'à « Conduite · température × jours », puis une capture repliée et une capture avec les deux plis ouverts, à 390 et à 1280, en clair et en cave.
   - Captures attendues : `voies/k4/captures/conduite-{replie,deplie}-{390,1280}-{clair,cave}.png`.
   - Sortie attendue : au repos, aucun « Vide = inconnu », « Pas une fin de fermentation attestée » ni « Jours de début suivants vs brouillon ».
4. **Fiche brassin et saisie à 844×340** (ct4a n'en a pas pris).
   - Commande : `capturer.mjs mesures` et `capturer.mjs saisie`, en ajoutant le format 844×340 tactile.
   - Captures attendues : `voies/k4/captures/{mesures,saisie}-844-{clair,cave}.png`.

## Rendre
En bas de ce fichier, « ## Fait » : une ligne par point « n° | corrigé <sha> / écarté <raison> | capture ». Mettre à jour voies/ct4a/RESULTAT.md (verdict CT4-B-n changé si besoin), tests.txt ; `node work/missions/2026-11-19-bugs-ecrans/verdicts.mjs ct4a` et `--tests` OK. Réponse : une ligne.

## Fait
- 1 | corrigé a82d1b99a (CT4-B-1) | voies/k4/captures/jourj-ensemencement-{390,844,1280}-{clair,cave}.png, jourj-sortir-… : « cible 18 °C · besoin 1,4 sachet · à écrire » (même fonction que l'étape Levure) ; fiche liée « 2–3 sachets · à écrire » prouvée par test (pas de banc avec hopIndexId)
- 2 | corrigé a82d1b99a (CT4-B-8) | voies/k4/captures/mesures-auj-clair-1280.png : « 1,012 » centré au-dessus du point, hors pointillé
- 3 | corrigé a82d1b99a (CT4-B-8) | voies/k4/captures/mesures-{clair,cave}-390.png, mesures-auj-clair-390.png, saisie-clair-390.png : « consigne » passe à la légende « °C cuve · tirets : consigne » ; « Fermenter 19 °C » seul
- 9 | corrigé a82d1b99a (CT4-B-9) | voies/k4/captures/mesures-auj-clair-1280.png : « alc. 7,0 % » ; la formule de la fiche donne 6,96 % (pas 6,8 %), seule la décimale « ,0 » se perdait
- B-7 | prouvé | voies/k4/captures/conduite-{replie,deplie}-{390,1280}-{clair,cave}.png : repos sans les trois textes techniques, plis lisibles dépliés
- 844×340 | pris | voies/k4/captures/{mesures,saisie}-844-{clair,cave}.png (+ mesures-auj-…-844)
- en plus | corrigé a82d1b99a | BatchDetailSheet : hook après retour anticipé (« Rendered fewer hooks » à la fermeture), cache WeakMap ; test bugs-ct4a-t2-hooks
