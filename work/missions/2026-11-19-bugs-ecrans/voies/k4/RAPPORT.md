OK — 10 problèmes, 0 bloquants

# k4 : test d'écran après correctifs ct4a, ct4b et d20

Captures regardées, toutes ouvertes en image :
- ct4a : jourj-rappel ×2, mesures ×2, mesures-auj ×2, saisie ×2, recap-levure ×2, conduite-levure ×2.
- ct4b : apres-01-liste-1280-clair, apres-02-apercu-390-clair et 844-cave, apres-04-fiche-houblons-1280-clair, apres-10-wiz-1-bas-390-clair et 844-clair, apres-12-wiz-3-1280-clair et 390-cave, apres-13-wiz-4-390-cave, apres-14-wiz-5-844-cave, apres-16-wiz-7-1280-clair.
- d20 : te27-houblons-390-clair, bt2-bord-1280-cave et 390-clair.

Combien et quels problèmes ? 10, dont aucun bloquant.

## Les deux bloquants d'origine

- **CT4-B-2, réglé.** L'en-tête dit « LOT-041 · cuve · 29 L », comme la liste. C'est vrai en clair et en cave, à 390 et à 1280.
- **CT4-B-1, réglé comme valeur fausse, pas comme besoin.** Le « 1 sachet » a disparu. Mais la tuile dit seulement « cible 18 °C · dose à écrire », sans le nombre de sachets (voir le n° 1 ci-dessous).
  - La capture est un aperçu (`?preview=brew…levure=seche-sans-quantite`, New England IPA LOT-DEMO), pas LOT-042 avec l'American IPA.
  - La tuile n'apparaît pas sur la capture 390.

## Les autres constats

| Id | État à l'écran |
|---|---|
| B-3 | Réglé : « 56 % du besoin » dans le vrai Récap, cohérent avec Levure (« 11,5 g · sous le besoin, +9,0 g »). |
| B-5 | Réglé. |
| B-9 | Réglé. |
| B-10 | Réglé. |
| B-11 | Réglé : « FG 1,012–1,014 · plage de la levure », avec sa bande. |
| B-13 | Mieux, en lecture étroite. |
| B-14 | Réglé. |
| TE-27 | Réglé. |
| BT-2 | Réglé : plus aucune tâche de Planning sur le Bord. |
| B-4 | Partiel : n° 4 et 5. |
| B-8 | Partiel : n° 2 et 3. |
| B-15 | Partiel : n° 6. |
| B-7 | Non prouvé à l'écran : voir les Doutes. |

## Les deux écartés

- **CT4-B-6 : écart justifié.** Avec VITE_HOP_V4, l'étape Houblons (apres-12-wiz-3-1280-clair et -390-cave) montre dans l'ordre α en plage, rôle, arôme dominant (« agrumes 7/7 »), 12 pastilles, dose, puis l'IBU à droite. Aucune phrase de conseil au repos.
- **CT4-B-12 : écart justifié au bas de la page seulement.** À 390, « Système 30L · à adopter » est lisible (apres-10-wiz-1-bas-390-clair). Mais le + flottant couvre du texte ailleurs (n° 7).

## Problèmes

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
9. ct4a / CT4-B-8 / mesures-clair-1280 contre mesures-auj-clair-1280 / détail
   - L'alcool passe de « 6,4 % » à « 7 % » après le relevé : la décimale se perd, alors que (1,064 − 1,012) × 131 ≈ 6,8 %.
10. ct4b / CT4-B-5 / apres-04-fiche-houblons-1280-clair / détail
    - Un « 80 g » reste seul, à droite de « Détail des ajouts et IBU · Potentiel aromatique ». Aucun mot ne dit que c'est le total du dry hop.

## Doutes (non comptés)

- **B-7 n'est pas prouvé à l'écran.**
  - Les captures conduite-levure montrent seulement le haut de l'étape. L'alerte orange a bien disparu.
  - La section Conduite n'est ni défilée ni repliée. Le peu qui se voit (1280 cave) garde « Consignes °C · jours depuis J0 · touche un palier pour le régler » et « 1 point à vérifier ».
- **B-3 : la capture ct4a vient d'un banc** (`recap.html`), pas de l'app.
  - Elle montre une combinaison absurde : Hefeweizen 10A, SafAle US-05, et « Objectif : Girofle · épices ». L'US-05 ne donne pas de girofle.
  - C'est la fixture du banc, pas l'app. Le vrai Récap de ct4b (56 %) suffit comme preuve.
- **Fixture American IPA** : « OG retenue 1,066 · calculée 1,048 ».
  - 6,2 kg de Pilsner pour 30 L donnent bien environ 1,047. L'OG de 1,066 vient de la fixture, et l'IBU de 46 est calculé dessus.
  - Ce n'est pas un défaut des correctifs.
- **Houblons v4** : la frise affiche « levure ? », alors que la recette a la SafAle US-05 (marquée « à choisir » à l'étape Levure). Peut-être voulu.
- **CT4-B-4, ordre de la feuille** : le stock passe avant OG · IBU, comme dans r2a, son choix du 15.11 (ProductionTab.tsx:223).
  - r2a est absent de `choix/ecrans.json`.
  - La décision ouverte par ct4b (remonter OG · IBU) se montre en mini maquettes. Non compté.
- **TE-27** : les captures de d20 sont prises sans VITE_HOP_V4, donc sur le repli que le build n'affiche pas. Le chemin v4 de ct4b (apres-12) n'a pas d'atelier non plus.
- **Fiche brassin à 1280** : environ 300 px de blanc au-dessus de la feuille ancrée en bas. Antérieur, hors des ids.
- **Plage de FG** : 1,012–1,014 pour LOT-041 (Stout export) contre 1,012–1,015 sur la fiche de l'American IPA. Ce sont deux recettes : pas comparables.

## DEMANDE EXECUTANT

Les ports sont libres au moment du lancement. Les fixtures sont simulées, sans aucune donnée réelle.

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
3. **ct4b, cave à 1280, étapes 2 à 7** (l'essai avait échoué sur « Suivant introuvable »).
   - Commande : `SEUL=1280 THEME=cave node scripts/with_server.mjs --server "npm run dev" --port 3141 --env PORT=3141 --env VITE_HOP_V4=on -- node work/missions/2026-11-19-bugs-ecrans/voies/ct4b/banc.mjs k4`.
   - Captures attendues : `voies/ct4b/captures/k4-1{1..6}-wiz-*-1280-cave.png`.
   - Sortie attendue : 6 étapes capturées, aucun « introuvable ».
4. **Fiche brassin et saisie à 844×340** (ct4a n'en a pas pris).
   - Commande : `capturer.mjs mesures` et `capturer.mjs saisie`, en ajoutant le format 844×340 tactile.
   - Captures attendues : `voies/k4/captures/{mesures,saisie}-844-{clair,cave}.png`.
5. **Ouvrir en image** toutes les captures produites, puis me renvoyer leurs chemins.

LEÇON PROPOSÉE : une voie qui écarte un recouvrement le prouve dans chaque état de défilement et à chaque largeur (390, 844×340, 1280), pas seulement au bas de la page.
