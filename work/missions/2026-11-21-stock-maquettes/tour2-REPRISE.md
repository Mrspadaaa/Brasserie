# Reprise — tour 2 des mini maquettes du Stock (D416), 21.11

Arrêt à 208 k (hook). Retouches faites et captures ouvertes ; reste la page de choix, ses contrôles et le commit.

## Fait (st1-build.mjs, st2-build.mjs ; builds et captures rejoués, tous « ok »)
- Communs : totaux du mur à 13 px IBM Plex Mono (14 px à 1280), espace fine `NB` entre nombre et unité, `kg(0)` = « 0 kg » ;
  colonne du nom 68 px (C1 : « Houblons » ne touche plus « Hazy ») ; onglets `flex:auto` + 15 px (C5, st1 et st2) ;
  en-tête st1 avec la chope et la barre du bas en couleur (C4) ; polices Google chargées dans st1.
- Légende : `legende: 'mot'` (pastille « Légende » dans la colonne du nom, sous « Levures 8 », comme sa capture 01) pour
  d1a/d1b/d1c ; `legende: 'rond'` (rond « ? » à côté du compte des Levures, ne couvre plus « Fumé ») pour d2a, d2c, d3b, d3a-1280, d7a.
- d2a : pointe du rayon actif sous la colonne du nom (ne mange plus « 1,5 kg »).
- d2c : bulle Citra sous le mur, dans le flux, pointe vers le pot ; Levures visibles. « à compter » = icône de compte ;
  Galaxy épuisé = pot rouge.
- d3b-legende : rond « ? » actif, bulle ouverte sous le mur, pointe vers lui.
- d3a-1280 : bande de légende retirée (rond « ? »), tables complètes (17 malts, 15 houblons), barres houblon vertes, « 0 kg ».
- d7a : rebâtie dans st1-build.mjs sur le mur st1 (couleurs EBC, sachets, tirets) avec un groupe « Sucres » (pots dorés à
  points) au bout du rang Malts → `st1-d7a-repos.html`. st2 n'écrit plus d7 (d7b écartée).
- d8a Matériel : « Parc 2 510 CHF + 1 ? », projets différenciés (2 projets, 1 projet, prix à saisir, aucun projet).
- d8b Fûts : K5 et K7 (30 L) plus grands ; ligne de légende retirée ; listes Pleins/Livrés/À laver/Propres avec leur action
  (Livrer, Retour, Lavé, Remplir).
- d4b : noms sur deux lignes à largeur souple (plus de collage), capsule couronne dentée, caisse à cloisons, rangée de filtres,
  Fûts « 10 · 3 pleins · 2 à laver » + Matériel « rien à signaler » ; bulle dans le flux sous Emballage (Commander/Fiche).
- d5a : pastilles = besoin et prix seulement ; « Pck = 25 g · il en reste » dans le pavé ; courbe « Ce qui a bougé » (FRISE
  commune, deux +1 séparés) ; Modifier en feuille par-dessus la fiche (contexte visible).
- d5b (alternative D5) : instruction retirée, « aucun seuil » à droite, graduations alignées (tiret sur 2), besoin en pastille,
  Enregistrer sur deux lignes (« +2 · seuil 2 »).
- d6b : texte « le pot comme sur l'étagère » retiré, bandeau « EBC inconnu sur 3 malts · Compléter › » greffé.

Captures ouvertes après correction : st1 d1a-repos, d2a-repos-660, d2c-bulle-660, d3b-legende, d3a-1280, d7a-repos,
d8a-materiel, d8b-futs ; st2 d4b-bulle, d4b-repos, d5a-repos, d5a-modif, d5b-geste, d6b-repos. Pas encore rouvertes :
st1-d8b-futs après ajout de « Propres », st1-d1a-repos après pastille resserrée (vue 1 fois, bonne), st2-d6b après onglets.

## Reste à faire
1. Lire la fin de SPEC (`work/refonte-frontend/v4/SPEC-BRASSEUR.md` l. 2610-2642 : ses mots du 21.11 sur le Stock, dont
   « La vue type étagère est incroyablement, mais il y a un ou deux souci, et dans autre stock, j'ai pas cette vue.. »).
2. Écrire à la main `choix-stock.html` sur le modèle de `../2026-11-21-calendrier-fiche/choix-fiche.html` (même CSS et même
   script ; `L` = ids ; `db.doc('choix/stock-'+v)` ; localStorage `choix-stock`). Ses mots en tête ; section Référence :
   `st1-ref/st1-ref-01-annote.jpg` (01) et `st2-ref/ref-02-fiche.jpg` (02). Un `h2` par axe ; sections et captures :
   - d1a : st1-captures/st1-d1a-repos.jpg, st1-d1a-recompter.jpg (son dessin ; la rangée « Comparer » gardée telle qu'il l'a laissée)
   - d2a : st1-d2a-repos-660.jpg, st1-d2a-houblons-660.jpg ; alternative d2c : st1-d2c-repos-660.jpg, st1-d2c-bulle-660.jpg
   - d3b (légende 390) : st1-d3b-legende.jpg ; d3a (1280) : st1-d3a-1280.jpg (img class large) — deux sous-choix séparés
   - d4b : st2-captures/st2-d4b-repos.jpg, st2-d4b-bulle.jpg
   - d5a : st2-d5a-repos.jpg, st2-d5a-modif.jpg ; alternative d5b : st2-d5b-repos.jpg, st2-d5b-geste.jpg
   - d6b : st2-d6b-repos.jpg (dire : la Recompter de D6 est celle à tuiles, celle de d1a a la bande de rayon et la coche ronde)
   - d7a : st1-d7a-repos.jpg
   - d8a Matériel : st1-d8a-materiel.jpg ; d8b Fûts : st1-d8b-futs.jpg
   Lignes `p.ecartee` : d1b (Recompter dans le rond : il l'a dessiné en onglet) ; d1c (pastille « DDM · ★ » illisible) ;
   d2b (perd noms et totaux du mur) ; d3a 390 (légende écrite au repos) ; d3b 1280 (colonne vide sous le mur) ; d4a (barres
   anonymes, mur à rebâtir) ; d4c (mur à rebâtir sur l'étagère st1, structure à revoir après son choix de D4) ; d5c (ne vaut
   que pour les unités comptées) ; d6a (EBC en colonne, 120 px de large) ; d6c (barres avec légende au repos) ; d7b (une rangée
   de plus, en texte) ; d8b Matériel (moins d'information) ; d8a Fûts (tuile Pleins incohérente avec la liste).
3. `node scripts/agents/verifier-page.mjs work/missions/2026-11-21-stock-maquettes/choix-stock.html --page-lot` → PAGE OK.
4. Commit par chemins : `git add -f work/missions/2026-11-21-stock-maquettes/` (builds, html, captures, page, cette reprise),
   message terminé par « Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com> ». Pas de push.
5. Retour en une ligne avec la liste des fichiers référencés par la page.

## Restes connus (non bloquants, à dire dans la page si utile)
- C3 (le + couvre la quantité de la dernière rangée visible) non traité : hors des 7 retouches ; SPEC 21.11 dit que le + se
  cache pendant l'interaction (petite marge seulement).
- d7a : étiquettes de groupe serrées (gap 3 px, em 12 px) pour loger « Sucres » et « ○ Fumé » à 390.
- Outils : `scratchpad/patch.mjs` (blocs @@@OLD/@@@NEW/@@@END ; un NEW vide casse l'analyse), `scratchpad/mes.mjs` (largeurs du rang Malts).
