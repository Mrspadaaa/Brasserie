# Ma levure — retour du 19.11 (liste figée)

Ses mots : « Lance une sous session pour la levure uniquement sur la partie "ma levure" en /rc. Il y a énormément de problème, même en terme de
fluidité ». Portée : l'onglet « Ma levure » de l'étape Levure 4/7. Chercher, Comparer, Suggérer hors mission. Constats au registre : LEV-1 à LEV-11
(`work/missions/BUGS.md`). Tests : `tests/integration/etapeLevure/maLevure1911.test.tsx` (8 rouges sur HEAD, LEV-4 vert : pas un défaut).

Banc : vite local, Firebase factice, `?dev-local&etape=levure&recherche=simulee` (recherche simulée, aucun appel IA), parcours US-05 → Andechs Lager →
White Labs Munich Lager Yeast 500g. Sondes : `sonde.mjs` (états, captures, Event Timing), `profil.mjs` (CPU), `trace.mjs` (style et mise en page),
`bissecte.mjs` (règle CSS fautive), `vite.banc.config.mjs` (build de production local, jamais déployé).

| id | constat | décision |
|---|---|---|
| LEV-1 | « Lallemand Brewing · White Labs Munich… », marque Lallemand | `identiteLevure` : sans préfixe fabricant ni conditionnement ; « White Labs · vendue par Lallemand » |
| LEV-2 | « Depuis Brewing Science Institute · Andechs Lager » lu comme une 3e levure | « Avant : Andechs Lager · non enregistré » ; puce précédente au nom court |
| LEV-3 | fiche 9–11 °C, conduite 19 °C | valeur en alerte ; « → 11 °C » cale la primaire (bord le plus proche) ; « ↶ 19 °C » rétablit |
| LEV-4 | FG 1,006–1,007, ≈ 2,5–2,7 % pour OG 1,026 | vérifié : FG = OG − (OG − 1) × 68–72 %, alcool cohérent (test). Pas un défaut |
| LEV-5 | cinq « ⌕ non documenté » empilés | une rangée, un bouton, une recherche comptée une fois (les cinq axes) |
| LEV-6 | « ? dose à saisir » | dose de la fiche fabricant (« 500g for up to 10 hL » → « ≥ 15 g » à 30 L) ; la dose se touche et ouvre son volet |
| LEV-7 | huit volets sous la conduite | « Dose, ensemencement et starter » puis « Plus » (stock, produit, fiche, objectifs, sources, atelier) |
| LEV-8 | fluidité | voir mesures ; reste au-dessus de 100 ms à CPU ×4 pour le choix, le calage, le glisser et un volet |
| LEV-9 | « °C » du graphe hors du cadre à 390 | débord du graphe réduit à 6 px dans Ma levure |
| LEV-10 | « Brouillon » dit deux fois dans la conduite | l'étiquette du titre masquée dans Ma levure |
| LEV-11 | rangée groupée : le bouton chevauchait « sucres restants » (vu à la vision) | la rangée prend toute la largeur |

## Mesures (Event Timing, pire durée entrée → image, 390×660 tactile, CPU ×4, build de production local)

| geste | HEAD | après |
|---|---|---|
| frappe « Andechs » (1re recherche) | 2 864 ms | 112–200 ms |
| frappe « Munich Lager » | 3 104 ms | 136–176 ms |
| choix d'une tuile | 696–744 ms | 152–472 ms |
| ouvrir un volet | 112–296 ms | 80–232 ms |
| glisser palier ↕ / ↔ (pire image) | 306 / 222 ms | 188–236 / 153–195 ms |
| caler / rétablir | — | 144–208 ms |

À 1280 (CPU ×1) : toutes sous 50 ms, sauf « ouvrir dose/Plus » mesuré 1,8 s **sans aucune tâche longue** (artefact : pas d'image produite
avant la suivante ; aucun travail du fil principal).
Causes corrigées : index de recherche refait à chaque lettre pour 1 733 fiches ; recherche à 18 facettes à chaque lettre ; mise en page forcée
à chaque rendu (puces) ; `toLocaleString` par nombre pendant le glisser ; carte refaite à chaque volet (mémo) ; règle
`.recipe-wizard main:has(.fer)` qui recalculait le style de toute la page (1 700 → 453 éléments par geste) ; conduite et volets hors écran
(`content-visibility`) ; conduite et contenu des volets montés en différé.
Reste (hors de Ma levure) : 5 835 règles CSS globales, le rendu complet du wizard à chaque écriture de la recette (`BrewWizard`), l'évaluation
de `YeastRecipePlan` au lâcher d'un palier, `.rc2-aux:not(:has(details[open]))` (Récap, 1 700 → 1 013 si retirée).
