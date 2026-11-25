ECHEC — R90 LISTE KO : sans filtre 55 % (seuil 70 %) inatteignable avec la fixture ; FIX 20/20 vert, filtre 68 %, tsc OK (hash dans la réponse finale)

## Plan (règle → endroits → correctif)
- R89 (replier avec un filtre) : en-tête de DOMAINE (`ArbreCarnets.tsx`) = `button.cnl-dn` avec `aria-expanded`, plie ses lignes ET ses sous-domaines ; sous-domaine : l'état voulu (`voulus`) l'emporte sur le défaut « déplié sous un filtre ou une recherche » (avant : `|| !!mot || filtre !== null` le forçait ouvert). Le filtre, la recherche et le compte restent ; le repli demandé est gardé quand on retire le filtre.
- R91 (priorité, sans glisser) : `src/domain/carnets/priorite.ts` (nouveau : `classerParPriorite`, `ordreApresGeste`, `prioritesPour`, `poserPriorites`) ; `modele.ts` : champ `priorite` entré dans `CLES_CARNET` et lu par `lireDonneesCarnet` ; `arbre.ts` : listes classées par priorité puis ordre actuel ; `ArbreCarnets.tsx` : `RangMenu` (⋯ à côté de la ligne, puces En tête / Monter / Descendre, grisées aux bouts, Échap ferme) sur TOUTES les lignes (problèmes à plat du domaine compris, décision du pilote) ; `ecransCarnet.tsx` : `onPriorite` → `geste(poserPriorites(...))` = bandeau « Descendu d’un rang · Annuler » (un toucher défait).
  Un geste n'écrit que le minimum (préfixe qui ne se retrouve pas dans l'ordre « récent d'abord ») : un carnet neuf se glisse après les classés, un carnet jamais déplacé n'est jamais réécrit. Le geste se lit sur les lignes VUES (filtre, recherche) et s'applique à l'ordre complet du groupe.
- R90 (densité) : `CoupDOeil.tsx` + `carnets-liste.css` : coup d'œil en une rangée de 30 px (chiffre et mot sur une ligne, 4 états colorés gardés), rangée Arbre / À faire / cloche / loupe à 28 px, la ligne « Filtre : … Tout montrer » fondue dans la case active (× ; le statut reste pour les lecteurs d'écran, `.cnl-filtre` hors mise en page), en-têtes de domaine et de sous-domaine à 28 px, lignes 50 px (52 avant), picto 32.

## Sorties décisives
- `npx vitest run tests/unit/c74Regles.test.tsx` → `Tests 20 passed (20)` (avant : 18 rouges). `tests.log`.
- Porte : tests/unit/{carnets*, c48..c74Regles, noteRegles, lot3CarnetOuvert, proprietes} → `92 files, 2197 passed | 3 skipped` ; c68Realises, c70RangementIA, virgule-transversale, stocksMaterielUneRangee → `28 passed`. `tests-porte.log`, `tests-porte2.log`.
- `npx tsc --noEmit` racine : 2 erreurs connues (seedData GanttTask, virtual:pwa-register), aucune neuve ; functions/ : 0. `controle-bugs.mjs` → BUGS OK (aucune ligne C74 dans BUGS.md : rien à passer en « corrigé »).
- `node scripts/controle-liste-compacte.mjs` : avant `50 % de 637 px, 6 lignes entières | 49 % de 656 px, 6 lignes` ; après `LISTE KO sans-filtre: 55 % de 637 px, 7 lignes entières | filtre-cherche: 68 % de 654 px, 8 lignes entières`. Les lignes entières (≥ 7) sont tenues ; la part (≥ 70 %) non.

## Captures (390, ouvertes) — `cap-apres/`
`liste-sans-filtre.png`, `liste-filtre-cherche.png` (après) vues à côté de `c74-tests/cap/*` (avant) et de la plainte `plaintes/2026-11-25-carnet-liste-compact.jpg` : le filtre « Tout montrer » et la rangée de 4 grosses cases ont disparu, 8 lignes au lieu de 5 sous filtre ; `menu-ouvert.png` (⋯ ouvert : En tête / Monter / Descendre), `apres-descendre.png` (domaine Brasserie replié sous filtre, bandeau Annuler, filtre gardé). Le bouton ⋯ s'étirait sur la hauteur du menu : corrigé après la capture (`align-self: flex-start`), non recapturé.

## Doutes et limites
- DÉCISION À PRENDRE : le seuil « 70 % sans filtre » est hors d'atteinte : la liste n'a que 8 lignes, 3 domaines et 4 sous-domaines repliés (7 en-têtes) ; même chrome ramené à ~230 px, 8 lignes de 50 px donnent au mieux ~63 %. Seule une ligne de 56 px et plus (donc MOINS de lignes à l'écran) le franchirait : j'ai refusé de gonfler les lignes pour la mesure. Options : (a) seuil sans filtre à 55 % (« chrome ≤ 45 % » pour 7 en-têtes) et 65 % sous filtre ; (b) mesurer la part sur « lignes + leur en-tête de sous-domaine » ; (c) garder 70 % mais sur un jeu à plus de lignes par en-tête. Recommandation : (b). Le contrôle n'est pas à moi (scripts/controle-liste-compacte.mjs, voie c74-tests) : non modifié.
- Sous filtre : 68 % (2 points de moins que le seuil) ; passer les lignes de 50 à 52 px le tiendrait, même défaut de mesure ; non fait.
- Déplacement sous un filtre / une recherche : le geste suit la ligne voisine VISIBLE ; l'ordre complet du groupe reste cohérent (testé en logique, pas par un test d'écran sous filtre : à jouer en ligne).
- Aucun test ajouté ni modifié ; aucun test jugé faux. Menu ⋯ : `aria-label « Menu ⋯ de la ligne : <titre> »`, puces `role=menuitem` (conforme au test).
- Pas joué en ligne (ZZ TEST) ni sur téléphone réel : captures du banc seulement.

CONNAISSANCE : la mesure de part du contrôle R90 récompense la hauteur des lignes autant que la compacité du chrome ; avec peu de lignes et beaucoup d'en-têtes elle plafonne vers 63 %.
LEÇON PROPOSÉE : aucune
