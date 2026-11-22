ECHEC — rejeté : p2a (Brassin 31 donné à deux bières, curseur du plafond faux) et p2b (densité « vers 1,020 à J+4 » alors que 1,012 est relevée à J+4) ; p2c ACCEPT

- **p2a** (s3b, feu et barres avant → après) — REJET : deux valeurs fausses. D'abord « Brassin 31 · Blonde de garde » à côté du Brassin 31 New England IPA (« Sens métier, avant le visuel » ; L14 bis). Ensuite le libellé « 20 CHF » du curseur de plafond, placé à 27,5 CHF. Phrase prédite : « Le Brassin 31, c'est ma NEIPA, pas une blonde. » Correction : « Brassin 30 » et libellés du curseur à leur valeur. Ce sont des retouches courtes, à relancer dans la voie p2a.
- **p2b** (s2a, la base et le temps de l'IA) — REJET : absurdité métier dans le cadre erreur à J+4. La réponse info dit « Densité à J+4 : vers 1,020 » et « le Citra de J+2 se fait pendant cette activité », alors que l'accueil et le journal donnent DF 1,012 à J+4 et Citra fait (« Sens métier » ; L14 bis). S'y ajoutent Brassin 31 donné à deux bières, la pile du bureau coupée (« Galax », « Mos ») et « pH visé 5,3 » en fermentation. Phrase prédite : « J'ai déjà 1,012 à J+4 et il me dit vers 1,020 ? » Correction : reprendre la décision J+1 et Brassin 30 de p2c, pile pleine largeur au bureau, retirer le pH. À relancer dans la voie p2b.
- **p2c** (s2d, la frise du brassin) — ACCEPTÉ : 8 défauts mineurs, détaillés dans VERDICT-P2.md. Les principaux sont les doubles gestes par ligne de l'urgent et la question des finances trop étroite. Phrase prédite : « Je vois mon brassin et quand agir d'un coup d'œil ; l'urgent ne se rate pas. »

## Images ouvertes
- p2a : 12 cadres clairs en plein format ; en cave, reponse, urgent, erreur et bureau.
- p2b : 12 cadres clairs en plein format ; en cave, reponse, urgent, erreur et bureau.
- p2c : 12 cadres clairs en plein format ; en cave, reponse, urgent, erreur et bureau.

## Critères
- G1 : `node work/missions/2026-11-14-compagnon/outils/controle-verdict.mjs` → `VERDICT OK`.
- Tests : `node work/missions/2026-11-14-compagnon/outils/controle-verdict.mjs > work/missions/2026-11-14-compagnon/critique/tests-c2.txt`. Lancé sur la sortie standard : tests-c2.txt est hors de mes deux fichiers, le pilote l'écrit.

## Doute commun, signalé au pilote
En cave, le bouton principal en paille (le `button-primary` de DESIGN.md) a le même jaune que le niveau Attention, dans les trois candidates. Le niveau ne se lit donc plus seul. C'est un arbitrage de DESIGN.md, pas un rejet.

LEÇON PROPOSÉE : quand une voie corrige une donnée contradictoire du contrat commun et que le pilote l'accepte (ici J+1 et Brassin 30 par p2c), le pilote doit la reporter aussitôt dans le contrat des voies sœurs. Sinon, les sœurs livrent l'absurdité et sont rejetées pour une faute venue du brief.
