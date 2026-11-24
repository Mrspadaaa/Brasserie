RESULTAT critique-38c : 4 problèmes (B 1, m 3, D 0) — BUGS OK

Version : en ligne, index-DU-8kJuj.js (vérifié au chargement de mon onglet ; le premier chargement servait encore index-r1awkHAF.js, puis le service worker a pris la nouvelle version).
Tests : sans objet (test d'écran). Contrôle du registre : `node scripts/agents/controle-bugs.mjs` → voies/critique-38c/bugs.log : « BUGS OK : 2171 bugs, 523 ouverts, 202 sources ».
Cadre : Chrome de débogage 127.0.0.1:9222, mon propre onglet (fenêtre à part), 390 × 844, thème clair, jamais fermé ; l'onglet de l'autre critique n'a pas été touché.

## Table

| capture | thème | largeur | état | problèmes | bloquants |
|---|---|---|---|---|---|
| C5-01-20mois-haut, C5-03-20mois-bas, C5-03g/d (bords) | clair | 390 | 20 mois, haut et bas | 0 | 0 |
| C6-cache-Achats | clair | 390 | Fêtes et Achats cachés (œil) | 0 | 0 |
| C2-01-haut | clair | 390 | An | 0 | 0 |
| C7-01-14mois, C18-01-2025, C18-02-axe | clair | 390 | 14 et 19 mois | 1 (n° 1) | 1 |
| C7-10-bord-droit-debut/pendant/apres | clair | 390 | barre tenue au bord droit | 2 (n° 2, 3) | 0 |
| C8-plus-Calendrier, C8-plus-Stocks, C8-plus-Finances, C9-plus-Bord-1 | clair | 390 | menu + ouvert | 0 | 0 |
| C11-00-forme, C12-01-rempli, C12-02-fin | clair | 390 | saisie de l'apport, carte de fin | 0 | 0 |
| C15-02-fiche-apport, C19-01-ventes-19mois | clair | 390 | apport au Calendrier, rangée Ventes | 1 (n° 4) | 0 |
| C16-01-periode-1412, C16-02-auj, C16-03-jour | clair | 390 | période 14.12–27.12, « ‹ auj. », Jour | 0 | 0 |

Toutes ces captures ont été ouvertes avant le verdict. Plaintes comparées côte à côte : 2327, 2332-calendrier, 2332-bord-droit, 2339, 2340-plus, 2336.

## Combien et quels problèmes ?

1. **B** — L'année sur l'axe est absente ou fausse selon la durée. À 19 mois (cadre avr. 2026 – nov. 2027), l'axe affiche « 2025 M J S N 2027 M M J S N 2028 » : « 2025 » est posé sur S52 (22 – 28 déc. 2025), et 2026 n'apparaît nulle part. À 14 et 16 mois, l'axe affiche « D J F M A M J J A S O N D J F M A M J », sans aucune année. À 20 mois et à l'An, c'est juste. Valeur fausse (C38-1 ; C18-01-2025, C18-02-axe, C7-01-14mois). Correction : poser l'année au passage de janvier, prise du mois de janvier et non du début de la semaine, à toute durée.
2. **m** — T29-6 toujours présent : une barre tenue au bord droit ne fait pas défiler la frise. La frise s'élargit (6 → 8 → 15 sem.) et la barre descend sous le doigt (y 674 → 738). Elle est posée le 22 mars, hors du cadre qui finit le 7 mars (C7-10-bord-droit-pendant, -apres).
3. **m** — Pendant ce même geste, l'étiquette annonce « S11 · 15 mars · lâcher ici », mais la barre est posée le 22 mars (S12 ; message « 23 nov. → 22 mars »). La date dite sous le doigt n'est pas la date posée (C38-2).
4. **m** — L'apport est compté et dessiné comme une vente. ZZ TEST — apport 1 CHF : la pastille de la rangée Ventes dit « +1 201 reçu » à 6 sem. (De ma poche 1 200 + ZZ 1), sans aucune vente. Le picto est la flèche montante des ventes, alors que la saisie lui donne une tirelire et que sa carte de fin dit « un apport n'est ni une vente ni une recette ». Il est bien visible et n'est pas compté « à encaisser » (C38-3 ; C15-02-fiche-apport, C12-02-fin). Ce que dirait le brasseur : « +1 201 reçu en ventes ? J'ai rien vendu. »

## Points du DOSSIER

- **1. Bords, 20 mois** : conforme. La frise va bord à bord (gris de x 0 à 390, recadrages C5-03g/d), et le contenu descend jusqu'à la barre du bas (bas du contenu 804 = haut de la barre 804). Les traits traversent les rangées vides (Travaux, Activités) et les rangées cachées à l'œil (C6-cache-Achats). Les bords vus dans 2332 ont disparu.
- **2. Menu +** sur Bord, Calendrier, Stocks et Finances : conforme. Le voile est entier (0,37 → 390,804), le panneau est entier et à sa place, avec un fondu (C8-*, C9-plus-Bord-1). Ce n'est plus la boîte grise tronquée de 2340.
- **3. Avis « Nouvelle version · Recharger »** : NON COUVERT. Aucun onglet ouvert avant le tour 38 n'était à moi : les autres sont celui de l'autre critique et un onglet tiers, que je n'ai pas touchés. Mon onglet a pris la nouvelle version au rechargement, sans feuille ouverte, donc sans avis. Forcer un faux service worker aurait rechargé l'onglet de l'autre critique. Lu au code seulement (BandeauMiseAJour, commit 307577f47) : l'avis se pose au-dessus de la barre la plus haute du bas, et la feuille réserve `--avis-maj`. Ce n'est pas vu à l'écran.
- **4. Apport au Calendrier** : il est visible dans la rangée Ventes et il n'est pas « à encaisser ». En revanche, il est compté dans « reçu » (problème 4).

## Constats rejoués

- **T29-6** : présent (problème 2). Ligne mise à jour.
- **T29-8** : vérifié. À l'An, l'axe affiche « O N D ’27 F … ’28 » (C2-01-haut ; commit 38ea8418f). L'année manque ou est fausse à d'autres durées : C38-1.
- **T32-1** : écarté, par décision du pilote (la période de l'app reste fixe). Après « ‹ auj. », l'en-tête reste 14.12–27.12 et la frise passe à S48 – S49 ; bouton, étiquette et axe disent la même chose (C16-02-auj).
- **CAL-ETAT-COHERENT** : bouton, étiquette et axe concordent à 6 sem. (23 nov. 2026 – 3 janv. 2027, S47–S1), à 15 sem. (23 nov. – 7 mars), à 2 sem. (S48 – S49, 21 → 9) et à 20 mois. Exception : l'année de l'axe à 14, 16 et 19 mois (problème 1).

## Doutes (non comptés)

- Sur Bord, un premier toucher du + est resté sans effet une fois (c8, juste après la navigation). Je ne l'ai pas reproduit (c9).
- « 14 mois » est affiché pour un cadre « janv. 2026 – avr. 2027 », que l'on lit comme 16 mois. C'est sans doute un arrondi à partir des dates exactes.
- Pendant le menu +, l'en-tête de l'app (0–37 px) reste hors du voile. C'est peut-être voulu.

## Données

- Créés puis retirés : ZZ TEST — barre (Travaux) et ZZ TEST — apport, 1 CHF. L'apport a été retiré par « Retirer cette écriture » ; l'app indique « Écriture annulée. Justificatif et historique conservés ». Deux apports ZZ (« voile », « croix ») ont été annulés par le bouton Annuler de la carte de fin : c'est mon script de navigation qui l'avait touché, pas un défaut de l'app. Contrôle : rien n'est compté, et aucun n'est resté dans les Opérations.
- Vraies données : 30 choses de la frise sont identiques avant et après, à la même vue de 19–20 mois (z6). Je n'ai touché aucune case de l'Agenda. Le « Marché d'Automne » était déjà coché avant mon passage (C8-plus-Bord).
- Vue rendue : période « Tout », 6 sem., aujourd'hui.
- BUGS.md : C38-1 à C38-3 ajoutés ; T29-6 (présent), T29-8 (vérifié, 38ea8418f) et T32-1 (écarté) mis à jour ; BUGS OK.

LEÇON PROPOSÉE : dans un script de banc, ne toucher la barre de navigation qu'après avoir prouvé qu'aucune feuille n'est ouverte. Le 23.11, `nav('Finances')` a touché, à travers la carte de fin, le bouton « Annuler » placé au même endroit, et deux écritures ZZ ont été annulées en silence : sans le contrôle des Opérations, on aurait pris cela pour un défaut de l'app.
