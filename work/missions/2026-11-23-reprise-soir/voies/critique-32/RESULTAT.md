RESULTAT critique-32 : 12 problèmes (B 2, m 8, D 2) — BUGS OK

OK — 12 problèmes, 2 bloquants

Version : index-C_UsO3yZ.js (curl et onglet neuf, chargé en 4,9 s ; commit fix29 9f407872e).
Tests : sans objet (test d'écran). Registre : `node scripts/agents/controle-bugs.mjs > bugs.log` → « BUGS OK : 2152 bugs, 506 ouverts, 202 sources ».
Écran : 390 × 844, toucher, Chrome de débug, onglet propre fermé (`page.close`), Chrome laissé ouvert. Thème clair seulement ; 1280 et sombre non capturés (téléphone surtout, 22.11).
Mise à jour de l'app : l'onglet déjà ouvert (FCCB0…) servait index-KxF0Bcaa.js au début du test. À la fin, il servait index-C_UsO3yZ.js, sans geste de ma part (délai exact non mesuré, moins de 40 min). Mon onglet s'est rechargé une fois au repos, entre deux menus (r1.mjs), et jamais pendant une saisie.

## Table
| capture | thème | largeur | état | problèmes | bloquants |
|---|---|---|---|---|---|
| R1-02, R1-03, R1-04 (période 4 ans, poignées) | clair | 390 | 4 ans, 2 ans ½, 22 mois, 8 ans | 1, 10 | 1 |
| R1-08, R1-09 (› puis ‹) | clair | 390 | période suivante, précédente | 1, 3, 5 | 1 |
| R4-2sem … R4-An, R8-00 (durées) | clair | 390 | 2 sem., 6 sem., 3 mois, 6 mois, An, 3 ans | 9, 10 | 0 |
| R2-01, R2-04, R2-05 (toucher une graduation) | clair | 390 | 1 sem., mars, Annuler | 0 | 0 |
| R3-00, R3-01 (échelle Jour) | clair | 390 | fin d'année → Jour | 1, 2 | 1 |
| R5-01 (« ‹ auj. ») | clair | 390 | déc. → aujourd'hui | 1 | 1 |
| R5-07 (cadre 2027–2031) | clair | 390 | rangées hors du cadre | 0 | 0 |
| R6-a (3 mois, +72 px) | clair | 390 | glisser, pendant, après | 12 | 0 |
| R7-c, R7-d (6 mois −150 px ; 6 sem. +60 px) | clair | 390 | glisser | 0 | 0 |
| R7-a, R8-03, R8-05 (barre tenue au bord) | clair | 390 | bord droit, bord gauche, Annuler | 6, 7, 11 | 1 |
| R9-00, R9-01 (renvois ZZ, fête « vi ») | clair | 390 | carte sur place | 0 | 0 |
| R10-Finances, R10-Brassins, R10-Materiel | clair | 390 | calendriers de section | 1, 8 | 1 |
| R11-00 … R11-04 (Bord › Agenda) | clair | 390 | nom, case, « Cette semaine » | 4 | 0 |
| R8-01-entete-zoom | clair | 390 | en-tête du solde | 5 | 0 |

## Règles jouées
- **CAL-ETAT-COHERENT** (r1b, r1c, r2, r3) : à chaque geste, le bouton de durée, l'étiquette du cadre et l'axe disent la même chose (4 ans / 1 janv. 2024 – 2 janv. 2028 / 2024…2028 ; 2 ans ½ ; 22 mois ; 8 ans ; 3 ans). « ‹ auj. » n'apparaît que hors du cadre. Les rangées ne sont pas vides quand des brassins sont dans le cadre. L'en-tête de période, lui, ne suit pas la frise (problème 1).
- **CAL-TOUCHER-GRADUATION** (r2) : OK. S50 → « 1 sem. · S50 2026 », « Cadre sur S50 · Annuler ». À l'An, une semaine de mars → « Cadre sur mars 2027 ». Annuler ramène la vue d'avant.
- **CAL-ETIQUETTE-GRAIN-AU-DESSUS** (r2) : OK. En jours : « S48 – S49 2026 », « S52 – S53 2026 » (ISO : 2026 a 53 semaines) ; en semaines, des dates.
- **CAL-GRADUATION-ROGNEE** (r2, r6) : rien de rogné ni de chevauché sur la bande (mesuré à chaque vue). À 3 ans : « 2025 2026 2027 2028 ». L'An reste sans année (problème 9).
- **T28-16** (r4) : corrigé. À 3 mois, glisser de 72 px à droite → 23 nov. → 14 déc., à la même échelle, à la date de l'étiquette.
- **CALP-5 / T29-5** (r4, r5) : corrigé pour la barre. L'étiquette cache encore le nom à 3 mois (problème 12).
- **T29-3** (r5) : corrigé. À 6 mois, glisser de 150 px à gauche → 14 déc. → 24 août ; la barre reste sous le doigt. Mon premier essai avait sorti le doigt de l'écran (x −52) ; il n'est pas compté.
- **Défilement au bord, T29-6** (r5, r6) : présent (problème 6).
- **Vues** : 2 sem., 6 sem., 3 mois, 6 mois, An (menu) ; 1 sem. (toucher) ; 5 sem., 22 mois, 2 ans ½, 3 ans, 4 ans, 4 ans ½, 8 ans (poignées et période). « 3 sem. » n'est pas atteint : la poignée passe de 2 à 5 sem. (doute).
- **Sections** (r7) : Finances › « Calendrier de l'argent » (Ventes, Achats, Travaux, Papiers) et Brassins › « Calendrier des brassins » (Brassins, Ventes) : OK. Stocks et Matériel : aucun lien (problème 8, CALP-13).
- **Renvois** (r6, r8) : la ZZ et la fête « vi » ouvrent leur carte sur place (Modifier, Lier, ⋯). Dans Bord › Agenda, le nom est un bouton et la case est à part : T29-4 corrigé. Le nom ouvre « Calendrier · Agenda », sans la chose touchée (problème 4).
- **Corrigés au tour 32** : T29-1, T29-3, T29-4, T29-5, T29-7, T29-9, T29-10, T29-11, T29-12, T28-16, CALP-5. **En partie** : T29-2. **Présents** : T29-6, T29-8, CALP-6, CALP-13.

## Problèmes
1. **B** — L'en-tête et la frise disent deux périodes. Après « ‹ auj. », la frise montre S48–S49 et l'en-tête « 14.12–27.12 ». Après l'échelle Jour, l'en-tête dit « 21.12.26–03.01.27 ». Dans le calendrier de l'argent, il dit « 27.07–06.09 » sur une frise du 23 nov. 2026 au 7 févr. 2027. Après les poignées (22 mois, 8 ans), l'en-tête garde 01.01.24–31.12.27, et régler à nouveau cette période ne recadre pas la frise. (T32-1 ; R5-01, R3-01, R10-Finances, R1-06)
2. **m** — Toucher Jour, Semaine ou Mois depuis la période 21.12.26–03.01.27 ramène le cadre à aujourd'hui (S48–S49). (T32-2 ; R3-00, R3-01)
3. **m** — › depuis 01.01.24–31.12.27 donne 24.11.27–23.11.31 : la frise suit et avance, mais les bornes du 1er janvier sont perdues, et cinq semaines sont communes avec la période d'avant. ‹ donne ensuite 24.11.23–23.11.27. (T32-3, T29-2 en partie ; R1-08, R1-09)
4. **m** — Dans Bord › Agenda, toucher le nom « ZZ TEST — barre » (Travaux, 31.08) ouvre « Calendrier · Agenda » sur 23 nov. – 7 févr., sans rangée Travaux : la chose touchée n'y est pas. (T32-4 ; R11-01)
5. **m** — « CHF à dépenser » passe sous le bouton « ± » (« dépense|r »). (T32-5 ; R8-01-entete-zoom)
6. **B** — Une barre tenue au bord ne fait pas défiler la frise : la frise s'élargit (6 → 16 sem. à droite, 6 → 11 sem. à gauche), et la barre quitte le doigt, sous le « + » puis hors de l'écran. Elle est posée hors du cadre et hors de vue : 10 août → 14 déc. pour un cadre qui finit le 15 nov., 31 août → 1 juin pour un cadre qui commence le 22 juin. (T29-6 présent ; R7-a-pendant, R7-a-apres, R8-03)
7. **m** — Sur la frise à 16 sem., la barre de la Hefe montre « H… » à côté de « −5 + à venir » : le nom est coupé, le montant reste. (T32-6 ; R7-a-apres)
8. **m** — Stocks et Stocks › Matériel n'ont toujours aucun calendrier de section. (CALP-13 présent ; R10-Materiel)
9. **m** — Sur l'An, la bande montre « S O N D J F M A M J J A S O N D J », sans année à janvier. (T29-8 présent ; R4-An)
10. **m** — À 3 et 4 ans, deux lignes identiques « Jhhh · coût à venir ». (CALP-6 présent ; R1-02, R8-00)
11. **D** — Annuler après une barre tenue au bord remet la date (1 juin → 31 août), mais la frise reste à 11 sem. (T32-7 ; R8-05)
12. **D** — À 3 mois, « S51 · 14 déc. · lâcher ici » cache le nom de la barre glissée (« ZZ TEST — b… »). (T32-8 ; R6-a-pendant)

## Doutes (non comptés)
- Poignée de fin tirée de 60 px depuis 2 sem. : 5 sem. d'un coup, si bien que « 3 sem. » est difficile à atteindre (R8-02).
- « Cette semaine au calendrier » (Bord) ouvre le zoom d'avant (11 sem., 23 nov. – 7 févr.), et non la semaine (R11-04).
- Période 01.01.24–31.12.27 → cadre jusqu'au 2 janv. 2028 (alignement à la semaine) ; idem 30 déc. 2024 pour 01.01.25.
- Avec la période « Tout », le cadre ne recule pas avant le 24 nov. 2025. Je n'ai pas vérifié s'il existe des choses avant cette date.
- Le menu des durées ne propose ni « 3 sem. » ni « 3 ans » ni « 4 ans » : ces vues ne s'atteignent que par les poignées ou la période.

## Données
- « ZZ TEST — barre » (Travaux) a été créé en S48, glissé 6 fois, coché puis décoché dans l'Agenda, puis supprimé (⋯ › Supprimer, « Supprimée : ZZ TEST — barre »). Il n'apparaît plus ni dans la frise ni dans l'Agenda.
- Vraies choses de la vue de départ (Tout, 6 sem., 23 nov. 2026 – 3 janv. 2027) : 14 avant, 14 après, aucune différence (avant.json, fin.mjs). Agenda : « vi » toujours « 12.10.2026 · en retard », Marché d'Automne toujours « Fait ». Seules des ZZ ont été touchées.
- Vue remise : Tout, 6 sem., 23 nov. 2026 – 3 janv. 2027 (Z-02-etat-final).
- BUGS.md : T32-1 à T32-8 ajoutés. États mis à jour avec captures : T29-1 à T29-12, T28-16, CALP-5, CALP-6, CALP-13 (vérifiés : commit 9f407872e).

LEÇON PROPOSÉE : un glisser simulé doit garder le doigt dans l'écran (0 ≤ x ≤ largeur). Sinon, il prend le défilement au bord pour un défaut (r4, x −52).
