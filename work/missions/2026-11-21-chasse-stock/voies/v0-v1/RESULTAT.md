REPRISE : work/missions/2026-11-21-chasse-stock/voies/v0-v1/RESULTAT.md — V0 faite (banc), V1 faite sauf le contrôle de l'étoile (STG-NOTE-1) et STM-10

## Fait (commit 585dbcb67 dans port-carnet, par chemins, index temporaire ; mes fichiers aussi remis dans l'index réel)
V0, banc : `scripts/parcours/stock.mjs` (option `--ref`, `--build`, `--seulement`, `--passes`, `--rouge ID,ID`), `scripts/parcours/fixtures/stock.mjs`
(fixtureChaines + Cryo 25g 1 Pck, 2 brassins liés par `stockItemRef`, 17 malts + 2 sucres = rayon Malts 19, 22 houblons, 11 levures dont 4 kveik, Nettoyage vide),
`scripts/parcours/stock-etapes/00-base.mjs` (captures 01, 02, 03 aux 4 passes). Un fichier d'étapes par voie, `export default async (c)`, `c.controle(id, cond, détail)`.
Fixture sur `parcours-chaines` (entree-app.mjs inchangé). Capture 390-clair 01 et 02 ouvertes : fidèles aux captures du brasseur (Cryo « 1 Pck », « Unité incompatible : g vers Pck » dans la fiche).
V1, code : `liste.ts` (`grammesDesPaquets` par `poidsDePiece`, règle unique de la dépense, aucune regex ajoutée ; `quantiteBarre` houblon en Pck),
`ligne.ts` (`texteSousLeNom`), `LigneStock.tsx` (+ `EtoileStock` 44×44, même dessin), `StockRow.tsx`, `RecompterStock.tsx` (tuiles suivent recherche/état ; famille vide sans tuile),
`recompter.css` (rangée de saisie à deux étages : nom sur une ligne, hauteurs égales).
Test : `tests/unit/stockQuantitePaquet.test.ts` (7), avec ligne/liste/listeFiltres : 38 verts ; tsc sans erreur dans mes fichiers.

## Critères (rejouables : `node scripts/parcours/stock.mjs <dossier> --build <build> --seulement quantite`)
- Builds gardés : tour8 `C:/Users/mrspa/AppData/Local/Temp/parcours-stock-build-ewrV2U`, arbre (V1) `…/parcours-stock-build-lWT5nc` (peuvent disparaître : `--ref en-ligne/2026-11-21-tour8`).
- ROUGE sur tour8 : STC-2 (3 mesures), STC-17 (2 fois), STG-9, STE-9, STE-10 (53/63 px, nom 99 px) : « KO » vus. VERT sur l'arbre : STC-2 « 1 Pck · barre oui », STC-17 0 fois, STG-9 « Houblons 1 », STE-9 aucune tuile 0/0, STE-10 hauteurs 64 px, nom 244 px.
- ÉTOILE (STG-NOTE-1) : code fait, contrôle PAS FINI. Le sélecteur `article[data-ligne] button[aria-pressed]` rend 0 lignes sur les deux builds (la liste n'est pas mesurable à cet instant, ou l'`article` est en `display:contents`). À reprendre : mesurer `.l1-fav button` ou `[aria-label^="Épingler"]` après avoir fait défiler la ligne dans l'écran, vérifier rouge (28×28) sur tour8 et vert (≥ 44) sur l'arbre.
- STM-10 : NON FAIT. `stockLevel.ts` rattache déjà par `stockItemRef` ; seul le rattachement par nom perd le manque au renommage (la fixture a B-ZZ-REF lié par ref et B-ZZ-MANQUE lié par nom). Reste : test vitest « renommage, ligne liée par stockItemRef garde le manque » + étape parcours (Modifier la fiche > Nom > Enregistrer). Restera « à confirmer » (A2).
- Rejeu des 4 passes (390/1280, clair/cave) de 00-base et quantite : pas fait (390-clair seulement), voir DEMANDE EXECUTANT.

## DEMANDE EXECUTANT
1. `cd port-carnet && node scripts/parcours/stock.mjs "$TEMP/stock-v0-4passes" --build "C:/Users/mrspa/AppData/Local/Temp/parcours-stock-build-lWT5nc" --seulement 00-base` → attendu `PARCOURS STOCK OK` ; ouvrir `1280-cave-01-articles.png`, `1280-clair-02-fiche-article.png`, `390-cave-03-recompter.png`.
2. Même commande avec `--seulement quantite --passes 1280-clair` (étapes écrites pour 390 ; seul le banc dit si elles tiennent à 1280).
3. Rouge : `--build …ewrV2U --seulement quantite --rouge STC-2,STC-17,STG-9,STE-9,STE-10` → `ROUGE OK`.
Ouvrir `stock-v1-vert/390-clair-quantite-compter.png` et `…-tuiles-recherche.png` (le pilote juge le dessin de la rangée de saisie, 64 px à deux étages : écart au « 48 px » de la voie).

## Doutes et limites
- STE-10 : la rangée fait 64 px (nom sur une ligne en tête, « prévu » et « il en reste » dessous), non 48 : 48 px tient mal avec « il en reste » + champ + ✓ à 390. Le brasseur voit la rangée : à lui de dire si 64 px uniforme convient.
- STC-17 : sous le nom, « quantité inconnue » ou « manque inconnu » ; « à compter » reste à droite (maquette). Un houblon en Pck SANS poids dans le nom reste « à compter » (jamais deviné) ; le mur (`murDonnees.ts`, V2) ne compte pas encore les Pck dans ses barres : à vérifier par V2.
- Tuiles de Recompter : avec une tuile de famille choisie ET une recherche, les autres tuiles gardent tous les comptes (la recherche n'est pas passée à Recompter ; StocksTab est à V3 : lui passer `recherche`).
- `liste.ts` importe `ui/depense/poidsPiece` (couche domaine → ui, déjà le cas ailleurs : carnets/levure) ; build/vitest sans cycle.

DÉCISION À PRENDRE : hauteur de rangée de Compter (64 px à deux étages, recommandé, nom lisible) ou 48 px avec nom tronqué (…) ? Recommandation : 64 px.
CONNAISSANCE : aucune
LEÇON PROPOSÉE : un sélecteur de banc sur une liste virtualisée ou en `display:contents` rend 0 sans erreur ; le banc doit dire « N lignes lues » avant de mesurer.
