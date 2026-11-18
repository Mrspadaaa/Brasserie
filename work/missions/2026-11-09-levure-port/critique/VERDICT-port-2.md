OK — 6 problèmes, 2 bloquants

# Verdict du port Levure, 2e passe (voie t1) — les 24 points de VERDICT-port.md rejoués, et le neuf

Version : dd39fe8e + arbre de travail (corrections de u1, u2, d1 du 09.11, servies par `npx vite --port 5660`, VITE_HOP_V4=on), banc `?dev-local&etape=levure`.
Captures : `critique/captures-2/` (97 : 24 états × 390 tactile / 1280 × clair / cave ; `journal-*.json` : texte de chaque état, 0 erreur de page sauf N5). Côte à côte avec la maquette : `critique/montages-2/<état>.png` (23), toutes ouvertes. Script : `capturer-port.mjs` (ajouts : « ⌕ » saisi en vol puis à l'issue, bas de Comparer, mesure du pied) ; `montage.mjs --captures=captures-2 --sortie=montages-2`.
Réseau : tout hors localhost bloqué ; l'appel IA (127.0.0.1:5001, émulateur absent) est refusé après 4 s pour voir l'état en vol. Thème : clé `laffinee.theme` du bouton de l'app. Serveur arrêté à la fin.

## Les 24 points : corrigé ou non

| Point | État | Preuve (capture) |
|---|---|---|
| L1 « + » entre deux paliers | **corrigé** : boîte pointillée « ? °C · ? j » à sa place, paliers suivants gardés (« J? », « fin ? »), × sur la boîte, aucune carte ni paragraphe | l4-plus-entre (4 formats) |
| L2 « + » sur la fin | **corrigé** : boîte après J12, « fin ? », aucun point à 0 °C, aucun texte | l5-plus-fin |
| L3 « ⌕ » d'une donnée | **corrigé sur le geste** : la recherche part, la cellule dit « recherche… 1/20 », puis l'issue ; la vue reste, aucun repli ne s'ouvre. Issue au banc (réseau coupé) : « Service IA momentanément indisponible. · OK » — honnête : aucune valeur inventée, pas « introuvable ». Mais voir **N1** (rognage à 390) | l6-loupe, l6b-loupe-issue |
| L4 puces proposées | **corrigé** : « Pomona », « Verdant IPA » (vendues ici, API d1), « Hors catalogue » ; ↺ absent faute de levure précédente au banc | l1-repos |
| L5 bande 18–26 | **corrigé** : deux pointillés ocre 18 et 26 sur les paliers de fermentation (J0–J9), même trait que la légende ; pas sur la garde à 4 °C (lecture de u1, acceptable) | l1, l2, l3 |
| L6 « Fermentis » | **corrigé** : « sèche · Fermentis · 15–24 g » | l1-repos |
| L7 pied à 390 | **corrigé** : pied collé au bas dès l'ouverture (y = 804 / 844), « Retour · Comparer (1) · Suivant — Paliers », le + à droite sans recouvrir « Suivant » ; les ⇄ × du bas de Comparer restent au-dessus du pied | l1-repos, m1b, m2c-bas |
| C1 repère 7 % | **corrigé** : résumé « repères 19 °C · 7,1 % », trait rouge « ≈ 7,1 % vol · ta bière » sur l'histogramme, bascule « ne garder que ≥ 7,1 % vol », ○ sur Tolérance dans l'index ; Comparer et Suggérer disent aussi 7,1 % | c1-1056, c2-feuille |
| C2 carte 1056 | **non corrigé, non bloquant** : ni « liquide », ni date de fiche sous le nom (le badge « fabricant présent en Europe » seul) ; effets « neutre · houblon ? · épicé ? » (données d1, la fiche dit « neutre »). u2 : forme posée « si la référence la donne » — la 1056 du banc ne la montre pas | c1-1056 |
| C3 titres des rayons à 390 | **corrigé** : « Vendue CH · FR · DE 4 » + badge « à vérifier » ; reste « Fabricant présent en Europe » avec « 12 » à la ligne (voir N3) | c3-3filtres-390 |
| C4 lignes « STA1 ? » pâles, « épuisée » | **corrigé** : lignes pâles ; « épuisée au relevé du 27.09 » (date du relevé, jamais une rupture datée) — mais voir **N2** | c3-3filtres |
| C5 index | **corrigé** : « — » sur Boisson, Disponibilité, En stock ; « estimé » gardé. « Laboratoire ⌕ 1 » subsiste (doute) | c2-feuille |
| M1 ⊕ et la levure tapée | **corrigé** : « Verdant » tapé → Verdant IPA en tête, puis les proches ; « Wyeast » → 1056 trouvée | m1-feuille-tape-verdant, m2-trois-colonnes |
| M2 Dose à 390 | **corrigé** : sachets puis « 2–3 sachets » sur deux lignes, « à renseigner » à côté, aucun chevauchement avec 3 colonnes | m2-trois-colonnes-390, m2-croix-390 |
| M3 source Verdant | **corrigé** : esters « tropical · abricot — Lallemand Brewing · TDS » (d1 : 82 faits de revendeurs écartés dans 16 LalBrew) ; voir N4 pour l'effet de bord | m1-verdant-ajoute |
| M4 « ⌕ » dans Comparer | **corrigé** : « recherche… 1/20 » dans la cellule phénols, Comparer reste à l'écran, issue honnête ; mais **N1** à 390 | m3-loupe, m3b-loupe-issue |
| M5 en-têtes | **corrigé** : « 1056 / Wyeast / Europe », « Verdant IPA / Lallemand / CH », « US-05 réf. / Fermentis / CH DE » | m2-trois-colonnes |
| M6 données | **tranché** : floculation 1056 « faible à moyen » (catalogue « Low Medium ») ; phénols US-05 restent « non déclarés » — d1 : Fermentis ne les déclare pas, « non documenté » est juste. Accepté | m2-trois-colonnes |
| S1 référence en tête | **corrigé** : « US-05 · ta levure · la référence », ⊕ grisé, au repos et avec des axes (« ⌕ thiols ? ⌕ clarté ? ») | s1-repos, s3-deux-axes |
| S2 levier °C dessiné | **corrigé** : piste 15–30 °C, repère 19, pointillé « plus chaud » ; bornes désormais structurées (d1 `levierDetail`) | s3-deux-axes |
| S3 Diamond « 19 hors plage » | **corrigé** : « 10–15 °C · 19 hors plage » sous Diamond (et « 20–25 °C · 19 hors plage » sous LA-02 au repos) ; en gris, la maquette le met en rouge (N6) | s3-deux-axes, s1-repos |
| S4 vendues ici quand la référence est muette | **corrigé** : « Vendue CH · FR · DE 3 » : US-05 (la référence), Verdant (thiols ■■■ · clarté ■■□), Pomona | s3-deux-axes |
| S5 doublon du levier | **corrigé** : une seule boîte, avec la preuve chiffrée (Samia 2026) ; « − atténuation » n'a que l'en-tête | s2, s3 |
| S6 « 30 L », « épuisée » | **corrigé** : « 30 L · 19 °C » dans l'en-tête ; « épuisée au relevé du 27.09 » sur 1007 | s1-repos, s2 |

Bilan : 21 corrigés, 1 tranché (M6), 1 corrigé sur le geste avec un défaut neuf (L3/M4 → N1), 1 non corrigé (C2, non bloquant).

## Table des captures

| capture (état) | thème | largeur | état | problèmes | bloquants |
|---|---|---|---|---|---|
| l1-repos | clair = cave | 390 · 1280 | Ma levure au repos (l5b c1) | 0 | 0 |
| l2-palier2-touche | clair = cave | 390 · 1280 | palier 2 touché, son × | 0 | 0 |
| l3-croix | clair = cave | 390 · 1280 | × : 3 paliers, fin J9, « Annuler » | 0 | 0 |
| l4-plus-entre | clair = cave | 390 · 1280 | « + » entre 2 et 3 : boîte « ? °C · ? j » | 0 | 0 |
| l5-plus-fin | clair = cave | 390 · 1280 | « + » sur la fin : boîte, « fin ? » | 0 | 0 |
| l6-loupe | clair = cave | 390 seul | « ⌕ » floculation : « recherche… 1/20 » rogné (« 1/2 ») | 1 (N1) | 1 |
| l6b-loupe-issue | clair = cave | 390 seul | issue : « Service IA momentanéme… » rogné, « OK » hors cadre | N1 (même) | — |
| m1b / m1c pied | clair = cave | 390 · 1280 | pied collant, « Comparer (1) », + à droite | 0 | 0 |
| c1-1056 | clair = cave | 390 · 1280 | « 1056 » : repère 7,1 %, carte sans forme ni date | 1 (C2) | 0 |
| c2-feuille | clair = cave | 390 · 1280 | Tolérance : trait 7,1 %, bascule, ○ ; « Laboratoire 1 » | 0 (doute) | 0 |
| c3-feuille-3filtres | clair = cave | 390 · 1280 | feuille, 3 filtres posés | 0 | 0 |
| c3-3filtres | clair = cave | 390 seul | « à vérifier » : ligne 1007 illisible ; « Europe / 12 » sur deux lignes | 2 (N2, N3) | 1 |
| m1-repos | clair = cave | 390 · 1280 | Comparer, référence seule | 0 | 0 |
| m1-plus-feuille | clair = cave | 390 · 1280 | ⊕ : feuille | 0 | 0 |
| m1-feuille-tape-verdant | clair = cave | 390 · 1280 | Verdant IPA en tête | 0 | 0 |
| m1-verdant-ajoute | clair = cave | 390 · 1280 | 2 colonnes, sources Lallemand | 0 | 0 |
| m2-trois-colonnes | clair = cave | 390 · 1280 | 3 colonnes, Dose sur deux lignes | 0 | 0 |
| m2-croix / m2c-bas | clair = cave | 390 · 1280 | × : 2 colonnes ; ⇄ × au-dessus du pied | 0 | 0 |
| m3-loupe / m3b-loupe-issue | clair = cave | 390 seul | phénols US-05 : « recherche… 1/2 » puis « omentanément ind » rognés | N1 (même) | — |
| s1-repos | clair = cave | 390 · 1280 | référence en tête, 30 L, « épuisée au relevé » ; Pomona sans arôme | 1 (N4) | 0 |
| s2-moins-attenuation | clair = cave | 390 · 1280 | carte en grand, 1084 −7 pts, 1007 −5 pts | 0 | 0 |
| s3-deux-axes | clair = cave | 390 · 1280 | piste 15–30, vendues ici 3, Diamond « 19 hors plage » en gris | 1 (N6) | 0 |

À 1280, les cellules de recherche tiennent (« recherche… 1/20 », « Service IA momentanément indisponible. OK » lisibles) et la ligne 1007 est entière : N1 et N2 sont des défauts du téléphone.

## « Combien et quels problèmes ? », par vue

### Ma levure (l5b) — 1, bloquant
1. **N1 · bloquant, 390 seul** — La cellule floculation pendant et après la recherche : « recherche… 1/2 » (le « 0 » coupé), puis « Service IA momentanéme / indisponible. » sur trois lignes, rognées à droite, et le bouton « OK » hors du cadre : on ne lit pas le compteur et on ne peut pas fermer. Texte illisible et geste inaccessible (D342 : « texte illisible »). À changer : la cellule « ⌕ » passe en pleine largeur de la carte quand elle porte un état (une ligne sous « floculation », comme l'encadré « non documenté » des effets), texte court en vol (« recherche… 1/20 ») et à l'issue (« IA indisponible · OK »), `overflow` visible, `min-width: 0`.

### Chercher (c6b) — 3, dont 1 bloquant
1. **N2 · bloquant, 390 seul** — Dans « Vendue CH · FR · DE · à vérifier », la quatrième ligne : « épuisée au relevé du 27.09 » s'imprime par-dessus le nom (« 1007 German Ale » n'apparaît plus) et sur le badge « STA1 ? ». Il dirait : « c'est quoi cette ligne ? ». À changer : « épuisée · 27.09 » en badge court sous le nom, ou nom tronqué à droite, jamais superposé ; `flex-wrap` sur la ligne pâle.
2. **N3** — « Fabricant présent en Europe » puis « 12 » seul à la ligne (390). À changer : compte collé au titre comme pour « Vendue CH · FR · DE 4 ».
3. **C2 (reste)** — Carte de la levure tapée sans forme (« liquide ») ni date de fiche ; descripteurs limités à « neutre ». Données d1 pour la 1056 ; la vue ne pose la forme que si la fiche la donne. À changer : forme lue du catalogue (la 1056 Wyeast est « liquid » au catalogue), date du relevé si elle existe.

### Comparer (s5a) — 0 propre ; N1 s'y rejoue
- **N1 (même cause)** — Cellule phénols US-05 : « recherche… 1/2 » puis « omentanément ind » rognés, « OK » invisible à 390 ; lisible à 1280. Même correction que Ma levure (`CelluleRecherche` partagée) : texte court, cellule qui s'étire en hauteur.

### Suggérer (s7a) — 2, non bloquants
1. **N4** — Pomona (LalBrew) n'a plus d'arôme : « thiols · clarté moyens » au repos, « arômes ? » dans Chercher (maquette : « pêche · agrumes »). Effet de la purge de d1 (M3) : 15 LalBrew ont perdu leur descripteur de revendeur ; honnête, mais le brasseur perd une info vraie et connue. À changer (d1) : verser les arômes des TDS Lallemand (Pomona : « pêche, agrumes, tropical » dans sa fiche technique), comme fait pour Verdant.
2. **N6** — « 10–15 °C · 19 hors plage » sous Diamond en gris pâle ; la maquette (cadre 3) le met en rouge comme Comparer « 19 hors ». À changer : la même couleur d'alerte que Comparer.

## Doutes (non comptés)
- **N5** — Une fois, au lancement de la série cave 390 (c1 : onglet Chercher puis « 1056 »), la page a planté : « React has detected a change in the order of Hooks… » puis « Cannot read properties of undefined (reading 'inst') » ; l'étape a disparu. Trois rejeux isolés de c1 en cave 390 : 0 erreur. À ce moment, deux séries de captures tournaient sur le même Vite (réoptimisation de dépendances et rechargement à chaud probables). Hooks de `MaLevure` (`Effet`, `useEtatRecherche`) lus : inconditionnels. À surveiller en ligne (console) ; pas de preuve d'un défaut de l'app.
- Le compteur « 1/20 » : compte-t-il l'appel refusé ? Non vérifié (un seul appel par page).
- « Laboratoire ⌕ 1 » dans l'index : une fiche bière sans laboratoire, plausible mais à vérifier (d1).
- Comptes de Suggérer et de Chercher légèrement changés depuis la passe 1 (esters − 73 · + 303, 1 308 fiches) : conséquence annoncée par d1, pas un défaut.
- Le cas « 19 hors » de Comparer (W-34/70) n'est toujours pas rejouable au catalogue (pas de plage °C) ; le même signal est maintenant visible dans Suggérer (Diamond).

## Total
6 problèmes neufs ou restants (N1, N2, N3, N4, N6 et le reste de C2), **2 bloquants** (N1, N2), tous deux à 390 et de mise en page ; 23 des 24 points de la passe 1 sont corrigés ou tranchés, C2 reste ouvert sans bloquer.
