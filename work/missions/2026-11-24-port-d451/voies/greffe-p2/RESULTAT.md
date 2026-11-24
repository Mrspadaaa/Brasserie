OK — cartes Articles qui glissent, fiche d'un houblon, Comparer (kilo rendu, ✓, égaux repliés) portés ; deux branchements restent à la voie liste.

Passe 1 (déjà livrée, commit 1481a7518) : tableau houblons et matériel, « pour 1 kg », Selon la quantité, Arômes, Prix au m³. Passe 2 (ici) : le reste de VOIE.md.

## Inventaire de la passe 2 (maquettes2/v01 contre l'app, captures `cap/*-*.png`, 390 clair, 1280, 390 sombre)

| Écran | La maquette a | L'app avait | Fait | Reste |
|---|---|---|---|---|
| Articles (cartes) | rang, vignette, nom, vendeur · pays · récolte ; α et dispo en pastilles, ⚠ dispo ? ; ≈41 CHF/kg au gros, « 1 kg 40,69 € » ; glisser : Déplacer, Retirer ; « Conditionnement de Brau · le choix fait le prix » ; « Glisse une carte vers la gauche » | carte classée (jauge, Veiller, pastille de prix) | `CarteMatiere` pour un carnet de matière pesée dont un vendeur a plusieurs conditionnements ; le gros prix se touche et déplie le conditionnement (1, 5, 20 kg touchables : posent « pour ») ; `Glisse` (défilement natif à l'accrochage) autour de CHAQUE carte, matière ou non | « Coller un lien d'article » (le champ du bas existe déjà) |
| Fiche | tuile minuscule à la place de l'icône, vendeur · pays · TTC FR, α lot en gros, arômes en couleur, tableau « je prends · prix · CHF/kg rendu », TVA d'import, récolte/forme/origine/dispo (⚠ dispo ?), Choisir · vendeur, 1 kg | bandeau photo, Offre, Caractéristiques | houblon (matière dont la page donne l'α) : tuile, vendeur, α, arômes, « je prends » (dès 2 conditionnements), note d'import ; ⚠ dispo ? dans la grille ; « Choisir · MotlerHops, 1 kg » | note citée « ta note » (aucun champ ne la porte), « annoncé 10–15 » (idem), « Quand » (voie probleme) |
| Comparer avec critère / matière | « Prix au kilo, rendu » en barres, Côte à côte coché, ligne CHF/kg ≈41, Selon la quantité, Compromis, Choisir · X, 1 kg | tableau en colonnes, prix du sachet | tout cela, dès que `articles` est passé (voir DÉCISION 1) | pastille « ◎ prix au kilo » à droite (le « Classé par » la remplace) ; lignes récolte et dispo du tableau (colonnes du domaine) |
| Comparer sans critère | « 5 diffèrent », « 18 identiques ▸ » repliés, « En barres » en complément, Compromis, Choisir la 4,06 m³ | tableau complet | « n diffèrent » en tête, identiques repliés sur place (une ligne les dit, aperçu des valeurs), ✓ sur la meilleure valeur, « En barres · prix au m³ » (calculé), Choisir · 4,06 m³ | « L'IA propose : prix au m³ · Poser » (DÉCISION 2), « Écartés · n » replié (la table reste visible) |

## Fichiers écrits (commit par chemins)
src/ui/carnets/{tableauRegles.ts, CarteArticle.tsx, FeuilleCartes.tsx, FicheArticle.tsx, Comparer.tsx, TableauCarnet.tsx (2 lignes : `enBarres`), carnets-decider.css} ; tests/unit/carnetsGreffeP2Cartes.test.tsx (17 tests : conditionnements, note d'import, compromis, puce du doute, bouton Choisir, carte qui glisse, Comparer avec `articles`, égaux repliés) ; banc `banc/` (mode `?direct=cartes|comparer`, `capturer2.mjs`) et `cap/`.
Aucune assertion d'un test existant modifiée dans cette passe (celles de la passe 1, n° 7, restent).

## Critères
- `npx tsc --noEmit` : 2 erreurs, les 2 connues (seedData, virtual:pwa-register). Aucune neuve.
- Tests : `tests/unit/carnets*`, `c4*`, `c5*`, `c6*` (c48..c65Regles), lot3CarnetOuvert, pxPrixEcrans : **67 fichiers, 1589 verts, 3 ignorés** (`tests8.txt`).
- `npm run build` : non rejoué, impossible sur ce poste (vite-plugin-pwa absent de node_modules, déjà dit en passe 1). tsc vert, banc Vite sans le plugin fonctionne.
- Vision (toutes ouvertes) : 390 clair : cartes, cartes + conditionnement, cartes glissée (Déplacer, Retirer), cartes Déplacer (menu des carnets), fiche MotlerHops, fiche Brau, Comparer houblons, Comparer chambre froide (replié, déplié), Comparer critère, feuille réelle, Comparer réel ; 1280 : fiche, Comparer houblons, cartes ; 390 sombre : cartes glissée, Comparer. Côte à côte avec `maquettes2/cap/v01-{articles,fiche,comparer,comparer-sans}.png`. Les captures « après » de la passe 1 non ouvertes ont été ouvertes (apres-articles, apres-fiche, apres-comparer-critere, apres-comparer-sans, apres-carnet-froid-critere).
- Gestes joués au banc (puppeteer, fixture « ZZ TEST ») : ouvrir la feuille réelle, toucher le gros prix, faire défiler la carte, Déplacer (menu), fiche suivante, Comparer, déplier les égaux. Pas joués : Retirer (inerte dans l'écran réel tant que CarnetOuvert ne passe pas la prop, voir DÉCISION 1), Choisir, Escalader et Relire (leurs fichiers ne changent pas ; Escalader reste dans la cellule prix de Comparer et dans l'Offre de la fiche).

## Ce qui a changé pour un brasseur
- Feuille Articles d'un carnet de houblons à plusieurs conditionnements : chaque carte dit le kilo rendu au gros (≈41), α, dispo et son doute, le sachet de la quantité choisie ; un toucher sur le prix montre ce que coûte chaque sachet et le kilo qui en résulte ; toucher 1, 5 ou 20 kg change « pour ». Glisser une carte à gauche : Déplacer, Retirer.
- Fiche d'un houblon : α en gros, arômes en couleur, « je prends » avec le kilo de chaque sachet et la note de TVA d'import.
- Comparer : ce qui diffère d'abord, les égaux repliés en une ligne, le meilleur coché ; pour des houblons, le prix au kilo rendu, qui gagne à 1, 5 et 20 kg, et le compromis (gain, α perdu, dispo douteuse).

## Doutes et limites
1. Le tableau « je prends » de la fiche et l'Offre (« ≈4 CHF rendu », « 50 g · 74,80 CHF/kg ») se lisent ensemble : le bloc Offre reste (Escalader, Relire, prix posé, détail D447) parce que c57..c64 le testent (R43, R49, R50) ; la maquette ne l'a pas. De même α et arômes sont dits en tête ET dans la grille « Caractéristiques » (R38, R16). Retirer ces redites demande d'ouvrir ces assertions au pilote.
2. Le gros prix de la carte déroge à « 14 px partout » du carnet ouvert (V4 fiche, `carnets.css` l. 736) : un seul chiffre par carte, 24 px, avec `!important` ciblé.
3. « Choisir · 4,06 m³ » à la place de « Choisir la 4,06 m³ » : le genre de l'objet est inconnu (B23), la maquette parle d'une chambre froide.
4. « fruits tropicaux » reste gris (`familleArome` ne reconnaît que « tropical », hors Possède) ; « Selon la quantité » dit « 5 kg » au prix du kilo quand le vendeur ne vend pas plus d'un kilo (c'est vrai : cinq fois 1 kg).
5. Les cartes du conditionnement ne naissent que si le prix change avec la quantité (`aDesPaliers`) ; un carnet de matière à sachet unique garde la carte classée d'avant (c52 R14, c53 R17 l'exigent), qui glisse aussi.
6. Les tests de rendu Comparer et carte passent par le banc de fixture ; Retirer/Déplacer de bout en bout n'a pas été joué en ligne (non branché, voir ci-dessous).

DÉCISION À PRENDRE 1 (branchements, pilote ou voie liste, hors Possède) : sans eux, Comparer et la feuille n'ont pas ce qui rend la passe complète en ligne.
- `src/ui/carnets/ecransCarnet.tsx`, l. 134 (`<Comparer …>`) : ajouter `articles={ouvert.carnet.articles as never}`. Sans cette ligne, Comparer garde le tableau d'avant (le kilo rendu, « Selon la quantité », le compromis et le bouton « Choisir · X, 1 kg » demandent les offres).
- `src/ui/carnets/CarnetOuvert.tsx`, l. 327 (`<FeuilleCartes …>`) : ajouter `onRetirer={p.onRetirerArticle} onDeplacer={p.onDeplacerArticle} carnetsVers={p.carnetsVers}`. Sans elles, aucune carte ne glisse (le ⋯ de la ligne Articles garde Déplacer et Retirer).
Recommandation : faire les deux dans la voie liste ou probleme (trois lignes), puis jouer en ligne : glisser, Déplacer, Retirer avec Annuler, Comparer.

DÉCISION À PRENDRE 2 (brasseur, en mini maquette) : « L'IA propose : prix au m³ · Poser » (Comparer sans critère) demande que l'IA propose un critère et qu'un geste le pose ; rien de tel n'existe côté `ia`. Options : (A) la voie ia rend un critère proposé, Comparer l'affiche avec Poser ; (B) ne pas le porter, « En barres » calculé suffit. Recommandation : B pour l'instant (rien d'inventé), A au classement du port.

CONNAISSANCE : `.cn-ouvert :is(span, p, b, …) { font-size: 14px !important }` (carnets.css l. 736) écrase toute taille posée dans le carnet ouvert, la feuille Articles comprise ; un chiffre « au gros » demande un sélecteur `.cn-ouvert …` avec `!important`. Les variables `--c-*` ne vivent que sous `.cn-page`, `.cn-feuille` et voisins : un banc qui monte un composant seul doit l'envelopper dans `.cn-page`.
LEÇON PROPOSÉE : aucune.

## Essais
Quatre relances de tests : la 1re (49 rouges) venait d'un `nomAlpha` appelé sur une valeur absente et d'une réécriture de la grille de la fiche qui défaisait c53/c59/c61/c64 ; la fiche garde donc sa grille et ses blocs, et la nouveauté s'ajoute devant. 2e relance : 6 rouges (ligne « identiques » dans le `tbody`, arômes en allemand, bloc Offre masqué) ; 3e : verte. Captures : cinq passes (défauts corrigés : variables `--c-*` du banc, retour à la ligne de « 1 kg ✓ », largeur du tableau poussée par l'aperçu des identiques, taille du gros prix, « Prix ? » trompeur pour un carnet de matière).
