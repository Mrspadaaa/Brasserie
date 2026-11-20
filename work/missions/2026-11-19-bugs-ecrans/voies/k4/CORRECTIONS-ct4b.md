# Corrections ct4b, tour 2 (critique k4, 20.11)

Liste figée (L18) : chaque point corrigé et prouvé seul (test si règle ; captures 390, 844×340 si concerné, et 1280, clair et cave, OUVERTES), ou écarté avec raison. Même contrat et « Possède » que voies/ct4b/VOIE.md (avec les ajouts ci-dessous) : COMMUN.md, test rouge d'abord, commit par chemins « Bugs tour 4 (ct4b) k4 : … » terminé par « Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com> », jamais de déploiement, de données réelles ni de Gemini réel, jamais stash/reset/checkout. Interdits : src/components/tabs/StocksTab.tsx, articleACreer.ts, stockArticleNeufE11.test.ts, wizardTour3Bw.test.tsx. git status de chaque fichier avant : modifié par une autre session → n'y écris pas. Plafond : à 200 k, « ## Fait » à jour et « REPRISE : … ».

## Problèmes (voies/k4/RAPPORT.md)
4. ct4b / CT4-B-4 / apres-02-apercu-390-clair / gênant
   - On lit « Stock à vérifier », puis cinq lignes « pas au stock ».
   - La liste dit pourtant « À vérifier · stock inconnu · 5 à vérifier ».
   - Deux messages contraires restent donc : « pas au stock » affirme une absence que l'app ne connaît pas. Il faudrait « non relié » ou « ? ».
5. ct4b / CT4-B-4 / apres-02-apercu-844-cave / gênant
   - À 844×340, la ligne « OG 1,066 · 46 IBU » reste invisible sous les boutons, et « SafAle US-05 11,5 g » est coupée.
   - Le RESULTAT de ct4b dit que la ligne remonte : la capture montre le contraire.
6. ct4b / CT4-B-15 / apres-16-wiz-7-1280-clair (et recap-levure-cave-1280 de ct4a) / gênant
   - Au Récap, la liste fait encore 560 px sous un bandeau de 872 px. Le contenu saute donc toujours entre Houblons (872 px) et Récap.
   - ct4b le reconnaît lui-même : c'est hors de sa zone (`recap.css`).
7. ct4b / CT4-B-12 / apres-10-wiz-1-844-clair, apres-12-wiz-3-390-cave / gênant
   - Le + flottant couvre « 0 L libre, plein » à 844×340, et le cadre du bouton « Absolu » à 390 en cave.
   - L'écart n'est prouvé qu'au bas de la page, alors que le recouvrement existe en cours de défilement.
8. d20 / BT-2 / d20-bt2-bord-1280-cave, d20-bt2-bord-390-clair / gênant
   - L'Agenda dit « 1 à faire » sous « Cette semaine au calendrier · rien de posé ».
   - La seule ligne est « Marché d'Automne de Villars-sur-Glâne 10.10.2026 », passé depuis 41 jours, sans mention « en retard ».
   - Phrase prédite : « c'est passé, pourquoi c'est à faire cette semaine ? »
   - Ce défaut est peut-être antérieur à BT-2 : à vérifier sur HEAD^.
10. ct4b / CT4-B-5 / apres-04-fiche-houblons-1280-clair / détail
    - Un « 80 g » reste seul, à droite de « Détail des ajouts et IBU · Potentiel aromatique ». Aucun mot ne dit que c'est le total du dry hop.

## Consignes du pilote
- Point 4 : « pas au stock » devient « non relié » (ou « ? ») quand l'app ne sait pas ; une seule formule partout.
- Point 6 : tu peux écrire src/ui/recap/recap.css (et le fichier de la liste du Récap) : même cadre que les autres étapes.
- Point 7 (CT4-B-12 rouvert) : gouttière du + (src/ui/floating-actions.css) prouvée à chaque état de défilement, 390, 844×340, 1280.
- Point 8 (BT-2, Bord) : tu peux écrire src/components/tabs/Dashboard* et le composant de l'Agenda du Bord : un événement passé non fait dit « en retard · N j » (ou ne compte pas « cette semaine ») ; vérifie d'abord sur HEAD^ de 920773e97 s'il est antérieur (sinon c'est le retrait du Planning qui l'a causé). Même constat que BK3-2 au registre : verdict commun.

## Preuves demandées (à produire toi-même)
3. **ct4b, cave à 1280, étapes 2 à 7** (l'essai avait échoué sur « Suivant introuvable »).
   - Commande : `SEUL=1280 THEME=cave node scripts/with_server.mjs --server "npm run dev" --port 3141 --env PORT=3141 --env VITE_HOP_V4=on -- node work/missions/2026-11-19-bugs-ecrans/voies/ct4b/banc.mjs k4`.
   - Captures attendues : `voies/ct4b/captures/k4-1{1..6}-wiz-*-1280-cave.png`.
   - Sortie attendue : 6 étapes capturées, aucun « introuvable ».

## Rendre
En bas de ce fichier, « ## Fait » : une ligne par point « n° | corrigé <sha> / écarté <raison> | capture ». Mettre à jour voies/ct4b/RESULTAT.md (verdict CT4-B-n changé si besoin ; pour le point 8, une ligne « - BK3-2 | … » ajoutée à voies/ct4b/RESULTAT.md n'est PAS attendue : écris le verdict de BT-2/BK3-2 dans le « ## Fait »), tests.txt ; `node work/missions/2026-11-19-bugs-ecrans/verdicts.mjs ct4b` et `--tests` OK. Réponse : une ligne.
