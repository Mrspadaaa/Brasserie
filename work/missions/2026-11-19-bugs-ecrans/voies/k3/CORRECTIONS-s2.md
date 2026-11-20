# Corrections s2, tour 2 (critique k3, 20.11)

Liste figée (L18) : chaque point est corrigé et prouvé seul (test si c'est une règle ; capture 390 et 1280, clair et cave, OUVERTE), ou écarté avec raison. Même contrat et même « Possède » que voies/s2/VOIE.md : COMMUN.md, test rouge d'abord, commit par chemins « Bugs tous (s2) k3 : … » terminé par « Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com> », jamais de déploiement, de données réelles ni de Gemini réel, jamais stash/reset/checkout. Interdits : src/ui/etapeLevure/** ; src/components/tabs/StocksTab.tsx, articleACreer.ts, stockArticleNeufE11.test.ts, wizardTour3Bw.test.tsx (travail non commité d'une autre session). Plafond : à 200 k de contexte, « ## Fait » à jour et rendre « REPRISE : … ».

## Problèmes (voies/k3/RAPPORT.md)
11. s2 / TL-10 / stocks-malts-clair-390.png / la pastille « EBC 2,5–4,5 » est posée sur la barre de stock du Pilsner Malz, en travers de la coupure « // » de l'échelle (barre et coupure passent dessous) / gênant
12. s2 / AM-56 / stocks-malts-clair-390.png / à 390, « Safale US-05 (tes… » et « périme dans 10 j · au… » coupés : l'échéance se perd / détail

## Doutes
- s2 / AM-56 / bord-* : la Safale périmée (2 sachets) n'entre pas dans « à commander » ; une levure périmée est-elle encore du stock utile ? Règle métier, non comptée.
- s2 / BT-2 (option b préparée) / bord-* : l'Agenda « 1 à faire » montre « Marché d'Automne de Villars-sur-Glâne · 10.10.2026 », date passée de 41 j sans mention de retard, avec une case à cocher alors que l'option est dite « lecture seule » ; on ne sait pas si cette ligne vient du Planning (cb027d551) ou d'un « à faire » existant. Si la case ne fait rien : geste sans effet.
- Point 11 : la pastille « EBC … » ne doit pas couvrir la barre ni sa coupure (la poser dans la rangée du texte, à 390 et 1280).

## Preuves demandées (à produire toi-même)
7. s2 : capture défilée à 390 tactile de Stocks › Levures (`stocks-levures-390-{clair,cave}-defile.png`) pour lever le doute du recouvrement ; et au Bord, toucher la case de « Marché d'Automne… » (`bord-agenda-case-1280-clair-{avant,apres}.png`) pour savoir si elle agit.

## Rendre
En bas de ce fichier, « ## Fait » : une ligne par point « n° | corrigé <sha> / écarté <raison> / ouvert <raison> | capture ». Mettre à jour voies/s2/RESULTAT.md si un verdict change, puis tests.txt ; `node work/missions/2026-11-19-bugs-ecrans/verdicts.mjs s2` et `--tests` OK. Réponse : une ligne.

## Fait
11 | corrigé 80c6a8c0b | stocks-malts-clair-390-avant.png (pastille pleine « EBC 2,5–4,5 » sur la barre et la coupure) puis stocks-malts-{clair,cave}-390-apres.png : à 390 le repère est dans la rangée du nom, sans fond (texte à halo, comme le nom), la barre et la coupure « // » se lisent dessous. Mesure puppeteer (capturer-k3.mjs) : avant, repère opaque + sur barre + sur coupure ; après, repère transparent (le cadre du repère « à compter » reste). À 1280 : inchangé (colonne propre, hors barre). Reste : le texte « EBC 2,5–4,5 » passe encore devant la coupure (sans la cacher) ; le placer hors de la barre demanderait de connaître sa fin en CSS.
12 | corrigé 80c6a8c0b | stocks-malts-clair-390-apres.png, stocks-levures-390-{clair,cave}-defile.png : le deuxième rang prend toute la largeur sous le nom : « périme dans 10 j · au seuil » entier (avant : « au… », coupé, mesure `rangDeuxCoupe` vrai puis faux). Le nom « Safale US-05 (tes… » reste coupé : le nom de la fixture (« Safale US-05 (test s2) ») est plus long que la colonne à côté de « DDM 10.2026 » ; un vrai nom de levure tient.
Preuve 7 (levures défilé) : stocks-levures-390-{clair,cave}-defile.png ouvertes : rien ne couvre les deux lignes de levures ; le « + » et l'infobulle « Compagnon hors connexion » sont sous la dernière ligne. Le recouvrement vu dans la capture pleine page venait de la hauteur de page (éléments fixes tombés au milieu), pas de la liste.
Preuve 7 (case du Bord) : bord-agenda-case-1280-clair-{avant,apres}.png : la case AGIT (« Marché d'Automne de Villars-sur-Glâne » passe « Fait », barré ; compteur « 1 à faire » → « 0 à faire »). Cette ligne n'est PAS du Planning (cb027d551 : lignes `data-testid=bord-planning`, sans case) mais un événement existant de l'Agenda (`toggleEvent`), geste d'avant s2 : case voulue, pas de geste sans effet.
Doute AM-56 (levure périmée et « à commander ») : règle métier non tranchée, aucun changement ; question au brasseur : une levure périmée compte-t-elle comme stock utile ? (Lalvin à 10 j reste dans « à commander » au seuil, Safale périmée n'y est pas : lecture actuelle = périmée ne compte pas dans la liste à commander.)
Doute BT-2 (date passée sans mention) : 10.10.2026, 41 j de retard, n'est pas dite en retard : fonction absente de la carte Agenda (hors défaut s2), noté pour le pilote ; aucun changement.
Tests : 36 fichiers passés (1 ignoré), 424 tests passés (tests.txt), VERDICTS OK et TESTS OK.
