# Les houblons de Beer Analytics qui manquent au catalogue (c9, point 3)

435 fiches Beer Analytics.

| Groupe | Nombre |
|---|---|
| Déjà au catalogue de base (nom ou alias, table d'alias comprise) | 261 |
| Déjà dans les ajouts (c6) | 95 |
| Nom ambigu, à confirmer (GR/US, Cerera, HBC 522) | 7 |
| Produits ou mélanges (Pink Boots, SAB Blend…) | 6 |
| **Vraiment manquants** | **66** (dont 65 avec un α de recettes) |

Parmi les manquants : 6 ont au moins 100 recettes, 14 au moins 50, 53 au moins 10.

Proposition : ajouter les 66 comme variétés à une source (Beer Analytics), marquées « déclaré par les recettes », avec leur compte de sources ; ce n'est pas un ajout massif sans le dire, c'est 66 fiches de plus au fichier à la demande (moins de 40 ko). Mécanisme : ajouter Beer Analytics aux sources de nom de rattachement.mjs (SOURCES_NOMS) ; la voie c9 n'y touche pas (le test de la fusion compte 18 sources).

## À confirmer
- Brewer's Gold : plusieurs variétés du catalogue portent ce nom (Brewer's Gold (GR), Brewer's Gold (US)) et la fiche ne dit pas laquelle
- Cerera : Cerera → Celeia (distance 2) : probablement faux ; décision du pilote
- HBC 522 : code de sélection HBC 522 : une variété sans nom, à ne pas rapprocher d'un nom par la distance ; décision du pilote
- Magnum : plusieurs variétés du catalogue portent ce nom (Magnum (GR), Magnum (US)) et la fiche ne dit pas laquelle
- Northern Brewer : plusieurs variétés du catalogue portent ce nom (Northern Brewer (GR), Northern Brewer (US)) et la fiche ne dit pas laquelle
- Perle : plusieurs variétés du catalogue portent ce nom (Perle (GR), Perle (US)) et la fiche ne dit pas laquelle
- Saaz : plusieurs variétés du catalogue portent ce nom (Saaz (CZ), Saaz (US)) et la fiche ne dit pas laquelle

## Produits ou mélanges
- Density (https://www.beer-analytics.com/hops/aroma/density/)
- EXP 2/20 (https://www.beer-analytics.com/hops/dual-purpose/exp-2-20/)
- Pink Boots (https://www.beer-analytics.com/hops/dual-purpose/pink-boots/)
- SAB Blend (https://www.beer-analytics.com/hops/dual-purpose/sab-blend/)
- TNT Blend (https://www.beer-analytics.com/hops/aroma/tnt-blend/)
- Veterans Blend (https://www.beer-analytics.com/hops/dual-purpose/veterans-blend/)

## Vraiment manquants
| Nom (Beer Analytics) | Recettes | α des recettes (10e–90e centile) | Origine | Usage | Fiche |
|---|---|---|---|---|---|
| Falconer's Flight 7 C's | 7320 | 9.9–11 (milieu 10.5) | États-Unis | Dual Purpose | https://www.beer-analytics.com/hops/dual-purpose/falconers-flight-7-cs/ |
| Iunga | 605 | 9.9–11.5 (milieu 11) | Pologne | Dual Purpose | https://www.beer-analytics.com/hops/dual-purpose/iunga/ |
| Hallertauer Gold | 568 | 3.8–7.5 (milieu 6.3) | Allemagne | Aroma | https://www.beer-analytics.com/hops/aroma/hallertauer-gold/ |
| HBC 342 | 370 | 10.4–17.4 (milieu 13.1) | États-Unis | Bittering | https://www.beer-analytics.com/hops/bittering/hbc-342/ |
| Fortnight | 146 | 13.7–14 (milieu 13.9) | États-Unis | Dual Purpose | https://www.beer-analytics.com/hops/dual-purpose/fortnight/ |
| Citiva | 109 | 7–9.5 (milieu 9) | États-Unis | Aroma | https://www.beer-analytics.com/hops/aroma/citiva/ |
| Tangerine | 97 | 1.7–11.3 (milieu 6) | États-Unis | Aroma | https://www.beer-analytics.com/hops/aroma/tangerine/ |
| Sequoia | 92 | 9.8–11.1 (milieu 10.5) | États-Unis | Aroma | https://www.beer-analytics.com/hops/aroma/sequoia/ |
| Oktawia | 81 | 7.1–9.2 (milieu 7.8) | Pologne | Bittering | https://www.beer-analytics.com/hops/bittering/oktawia/ |
| Korsta | 71 | 5.8–10.4 (milieu 8) | ? | Dual Purpose | https://www.beer-analytics.com/hops/dual-purpose/korsta/ |
| HORT 9909 | 68 | 6.8–9.6 (milieu 7) | Nouvelle-Zélande | Dual Purpose | https://www.beer-analytics.com/hops/dual-purpose/hort-9909/ |
| Nobility | 55 | 4.4–5.3 (milieu 5.2) | États-Unis | Dual Purpose | https://www.beer-analytics.com/hops/dual-purpose/nobility/ |
| Evergreen | 53 | 6.6–8.5 (milieu 8) | États-Unis | Aroma | https://www.beer-analytics.com/hops/aroma/evergreen/ |
| HPA 035 | 51 | 5.7–8.6 (milieu 7.5) | Australie | Dual Purpose | https://www.beer-analytics.com/hops/dual-purpose/hpa-035/ |
| ProvOAK | 43 | 3.4–5 (milieu 4.7) | États-Unis | Aroma | https://www.beer-analytics.com/hops/aroma/provoak/ |
| Lunga | 42 | 8–12 (milieu 10) | Pologne | Dual Purpose | https://www.beer-analytics.com/hops/dual-purpose/lunga/ |
| Hulla Norrgård | 41 | 5.5–8.2 (milieu 7.8) | ? | Dual Purpose | https://www.beer-analytics.com/hops/dual-purpose/hulla-norrgaard/ |
| HS10416 | 40 | 12.8–16.5 (milieu 14) | États-Unis | Bittering | https://www.beer-analytics.com/hops/bittering/hs10416/ |
| Lomik | 39 | 3.9–4.6 (milieu 4.5) | Pologne | Dual Purpose | https://www.beer-analytics.com/hops/dual-purpose/lomik/ |
| ADHA-529 | 38 | 9.9–12.7 (milieu 11) | États-Unis | Dual Purpose | https://www.beer-analytics.com/hops/dual-purpose/adha-529/ |
| Hallertauer Bitter | 38 | 5.9–11 (milieu 10) | Allemagne | Bittering | https://www.beer-analytics.com/hops/bittering/hallertauer-bitter/ |
| Svalöf Mauritz | 36 | 1.8–3 (milieu 2.5) | ? | Aroma | https://www.beer-analytics.com/hops/aroma/svaloef-mauritz/ |
| ADHA-484 | 33 | 10.4–12.1 (milieu 10.6) | États-Unis | Dual Purpose | https://www.beer-analytics.com/hops/dual-purpose/adha-484/ |
| ADHA-527 | 32 | 13.4–15.8 (milieu 13.4) | États-Unis | Dual Purpose | https://www.beer-analytics.com/hops/dual-purpose/adha-527/ |
| Malling | 30 | 6.4–9.8 (milieu 7.2) | Autriche | Dual Purpose | https://www.beer-analytics.com/hops/dual-purpose/malling/ |
| Hallertauer Diamant | 27 | 5.9–8.1 (milieu 7) | Allemagne | Dual Purpose | https://www.beer-analytics.com/hops/dual-purpose/hallertauer-diamant/ |
| NZL-32 | 27 | 9.6–12 (milieu 9.9) | Nouvelle-Zélande | Dual Purpose | https://www.beer-analytics.com/hops/dual-purpose/nzl-32/ |
| Puławski | 26 | 5.7–8.9 (milieu 7.3) | Pologne | Dual Purpose | https://www.beer-analytics.com/hops/dual-purpose/pulawski/ |
| Edelweiss | 25 | 5–5.8 (milieu 5.8) | États-Unis | Dual Purpose | https://www.beer-analytics.com/hops/dual-purpose/edelweiss/ |
| Hüller Bitter | 25 | 5.2–8.2 (milieu 5.8) | Allemagne | Dual Purpose | https://www.beer-analytics.com/hops/dual-purpose/hueller-bitter/ |
| Patagonia Red | 25 | 7.8–14.5 (milieu 11.6) | Argentine | Aroma | https://www.beer-analytics.com/hops/aroma/patagonia-red/ |
| CF185 | 22 | 11.1–12.5 (milieu 12.4) | Royaume-Uni | Dual Purpose | https://www.beer-analytics.com/hops/dual-purpose/cf185/ |
| Tomyski | 22 | 3.6–4 (milieu 4) | Pologne | Aroma | https://www.beer-analytics.com/hops/aroma/tomyski/ |
| GP75 | 21 | 1–9.7 (milieu 7) | Royaume-Uni | Dual Purpose | https://www.beer-analytics.com/hops/dual-purpose/gp75/ |
| CF184 | 20 | 7.5–10.4 (milieu 8.4) | Royaume-Uni | Dual Purpose | https://www.beer-analytics.com/hops/dual-purpose/cf184/ |
| Książęcy | 20 | 6.9–10.1 (milieu 7.2) | Pologne | Aroma | https://www.beer-analytics.com/hops/aroma/ksiazecy/ |
| Otto Supreme | 20 | 9.9–14.9 (milieu 14.6) | États-Unis | Bittering | https://www.beer-analytics.com/hops/bittering/otto-supreme/ |
| Kracanup | 19 | 3.6–9.5 (milieu 8.4) | Australie | Aroma | https://www.beer-analytics.com/hops/aroma/kracanup/ |
| Lemonaughty | 19 | 9.4–10.6 (milieu 10.3) | États-Unis | Dual Purpose | https://www.beer-analytics.com/hops/dual-purpose/lemonaughty/ |
| Bertwell | 18 | 5–5 (milieu 5) | États-Unis | Aroma | https://www.beer-analytics.com/hops/aroma/bertwell/ |
| Rubin | 14 | 8.2–11.5 (milieu 9.5) | Tchéquie | Bittering | https://www.beer-analytics.com/hops/bittering/rubin/ |
| U3/132 | 14 | 11.6–18 (milieu 18) | Afrique du Sud | Dual Purpose | https://www.beer-analytics.com/hops/dual-purpose/u3-132/ |
| Vinnie Special | 14 | 10.5–12 (milieu 12) | États-Unis | Bittering | https://www.beer-analytics.com/hops/bittering/vinnie-special/ |
| The Bruce | 13 | 8.5–13 (milieu 9.6) | Nouvelle-Zélande | Dual Purpose | https://www.beer-analytics.com/hops/dual-purpose/the-bruce/ |
| Slavyanka | 12 | 5–5.2 (milieu 5.2) | Ukraine | Aroma | https://www.beer-analytics.com/hops/aroma/slavyanka/ |
| Aloha | 11 | 8.6–12.6 (milieu 10.3) | États-Unis | Dual Purpose | https://www.beer-analytics.com/hops/dual-purpose/aloha/ |
| Excelsior | 11 | 10–15 (milieu 11.3) | États-Unis | Dual Purpose | https://www.beer-analytics.com/hops/dual-purpose/excelsior/ |
| Izabella | 11 | 5.1–7.6 (milieu 6.8) | Pologne | Aroma | https://www.beer-analytics.com/hops/aroma/izabella/ |
| J-Lime | 11 | 6.1–6.9 (milieu 6.9) | États-Unis | Aroma | https://www.beer-analytics.com/hops/aroma/j-lime/ |
| San Juan Ruby Red | 11 | 6.7–7 (milieu 7) | États-Unis | Aroma | https://www.beer-analytics.com/hops/aroma/san-juan-ruby-red/ |
| Alta | 10 | 10.8–12 (milieu 11) | Ukraine | Bittering | https://www.beer-analytics.com/hops/bittering/alta/ |
| Cleopatra | 10 | 10–11 (milieu 11) | États-Unis | Dual Purpose | https://www.beer-analytics.com/hops/dual-purpose/cleopatra/ |
| Zoso | 10 | 8–12 (milieu 10) | États-Unis | Dual Purpose | https://www.beer-analytics.com/hops/dual-purpose/zoso/ |
| HBC 353 | 9 | 7–9 (milieu 7) | États-Unis | Dual Purpose | https://www.beer-analytics.com/hops/dual-purpose/hbc-353/ |
| HBC 432 | 9 | 12.5–12.5 (milieu 12.5) | États-Unis | Dual Purpose | https://www.beer-analytics.com/hops/dual-purpose/hbc-432/ |
| Limonadier | 8 | 8–11.2 (milieu 9) | Canada | Aroma | https://www.beer-analytics.com/hops/aroma/limonadier/ |
| Vermelho | 8 | 8.1–9.1 (milieu 8.6) | Pologne | Dual Purpose | https://www.beer-analytics.com/hops/dual-purpose/vermelho/ |
| Flinders | 7 | 1.8–15 (milieu 13) | Australie | Dual Purpose | https://www.beer-analytics.com/hops/dual-purpose/flinders/ |
| Ibuki | 7 | 5.8–8 (milieu 7.5) | Japon | Aroma | https://www.beer-analytics.com/hops/aroma/ibuki/ |
| Klon 18 | 7 | 2.9–3.6 (milieu 3) | Ukraine | Aroma | https://www.beer-analytics.com/hops/aroma/klon-18/ |
| Traful | 6 | 4.7–7 (milieu 5.8) | Argentine | Aroma | https://www.beer-analytics.com/hops/aroma/traful/ |
| Lilly | 5 | 6.7–7.5 (milieu 7.5) | Allemagne | Dual Purpose | https://www.beer-analytics.com/hops/dual-purpose/lilly/ |
| Zibi | 5 | 10–13 (milieu 13) | Pologne | Dual Purpose | https://www.beer-analytics.com/hops/dual-purpose/zibi/ |
| Hokitika | 2 | 5.3–5.3 (milieu 5.3) | Nouvelle-Zélande | Aroma | https://www.beer-analytics.com/hops/aroma/hokitika/ |
| Hallertauer Rotrebiger | 1 | 1.8–1.8 (milieu 1.8) | Allemagne | Aroma | https://www.beer-analytics.com/hops/aroma/hallertauer-rotrebiger/ |
| GN37 | 0 | — | Royaume-Uni | Aroma | https://www.beer-analytics.com/hops/aroma/gn37/ |
