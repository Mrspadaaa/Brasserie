# Dossier fix28-serveur (extraits ; lire à la place des sources)

## Constats (BUGS.md, tour 28 en ligne, mot pour mot)
 T28-5 | Stocks › Matériel › Carnets › carnet « ZZ TEST — tour 28 » ouvert (390 px, en ligne index-CoXAhg_q.js) | Lien mort brewtools → observé : « adresse introuvable : le site n’existe plus » ; le site brewtools.com répond (HTTP 200), seule la page manque ; attendu : « la page n’existe plus (erreur 404) » comme base-echec | D 
 T28-7 | Stocks › Matériel › Carnets › carnet « ZZ TEST — tour 28 » ouvert (390 px, en ligne index-CoXAhg_q.js) | Fiche gastro-held ECO 400 → observé : « Non publié par le vendeur : Poids » sous « Poids net en kg 82 » ; colonne Poids « – » dans la comparaison ; attendu : poids 82 kg repris, aucune mention | D 
 T28-8 | Stocks › Matériel › Carnets › carnet « Armoire de rangement malte » (390 px, en ligne index-CoXAhg_q.js) | Article landi Schwerlastregal 180 × 160 × 60 cm → observé : « Largeur 61 cm · Longueur 162 cm · Hauteur 6 cm », « Matériau Stahl, MDF » ; attendu : hauteur 180 cm, largeur 160, profondeur 60, libellés et valeurs en français | B 
 T28-9 | Stocks › Matériel › Carnets › carnet « ZZ TEST — tour 28 » ouvert (390 px, en ligne index-CoXAhg_q.js) | Étapes de lecture (sios, hopfenmarkt, landi, gastro-held) → observé : « 72.5 CHF (schema.org) », « microdata », « JSON-LD », « 3 · dont 2 du HTML, 0 de données embarquées », « port 4.9 CHF », « 913.9 CHF » ; attendu : valeurs dites en brasseur, virgule décimale, comme v03-2 (« 1 690 EUR + port 95 EUR ≈ 1 680 CHF ») | D 
 T28-12 | Stocks › Matériel › Carnets › carnet « ZZ TEST — tour 28 » ouvert (390 px, en ligne index-CoXAhg_q.js) | Fiches brouwland et hopfenmarkt Mosaic → observé : libellés anglais « Full volume », « Height with extension legs », « Top opening », « Dump valve size », « Fermentable volume », « Size of valve », « Diameter at the top », « Total oil », « Farnesene », « Caryophyllene », « Myrcene », « Humulene », « Beta » ; attendu : libellés en français | D 
 T28-13 | Stocks › Matériel › Carnets › carnet « ZZ TEST — tour 28 » ouvert (390 px, en ligne index-CoXAhg_q.js) | Fiches galaxus, hopfenmarkt, gastro-held → observé : valeurs « Kühlschrank ohne Gefrierfach », « Fresh Zone Fach », « Mehrzweckhopfen », « +2 °C bis +8 °C » ; « 143.50 cm », « 11.4 % », « 68.5 cm » ; attendu : valeurs en français, virgule décimale | D 
 T28-14 | Stocks › Matériel › Carnets › carnet « ZZ TEST — tour 28 » ouvert (390 px, en ligne index-CoXAhg_q.js) | Fiche hopfenmarkt Mosaic → observé : Alpha 11.4 % au milieu de la grille, après Farnesene et Caryophyllene ; « Total oil 0.8ml » sans « /100 g » ; attendu : α, récolte, huiles totales en tête (penser-brasseur, L04) | D 

## Code (voie liens, commit a6ba98f32)
 functions/src/lecturesLiens.ts                     |   6 +-
 functions/src/lienBloquee.ts                       |   2 +-
 functions/src/lienIA.ts                            |  12 +-
 functions/src/lienLibelles.ts                      | 191 +++++++++++++++++++
 functions/src/lireLien.ts                          |  20 +-
 src/ui/carnets/FicheArticle.tsx                    |  21 ++-
 src/ui/carnets/fiche-article.css                   |   3 +
 tests/fixtures/carnets/galaxus-ks240l-de.html      |   4 +
 tests/fixtures/carnets/galaxus-ks240l-fr.html      |   4 +
 tests/unit/carnetsLiensReprise.test.ts             | 204 +++++++++++++++++++++
 tests/unit/carnetsLiensRepriseFiche.test.tsx       |  79 ++++++++
 tests/unit/carnetsPageBloquee.test.ts              |   2 +-
 .../voies/liens/RESULTAT.md                        |  34 ++++
 .../voies/liens/cap-fiche-vitrine.png              | Bin 0 -> 62435 bytes
 14 files changed, 567 insertions(+), 15 deletions(-)

## Rappels
- Libellés et valeurs : table des clés connues + l'appel IA existant rend en français ; aucun appel en plus. Nombres : virgule décimale suisse, unités (« 143,5 cm », « 11,4 % »).
- Houblon (L04, cerveau/brasseur/penser-brasseur.md) : α, récolte, huiles totales (ml/100 g) en tête.
- Banc : npx tsx scripts/banc-liens.ts (63 liens, sans IA) ; pages HTML du banc déjà copiées par la voie liens.
