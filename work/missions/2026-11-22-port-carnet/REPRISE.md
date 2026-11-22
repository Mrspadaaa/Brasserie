# Reprise — port Carnet D419 (A1 Comparer, B1 prix, Choisir → achat prévu + Placer), 22.11

Arrêt à 151 k (consigne : rendre vers 130 k). **Rien n'est écrit dans le code, rien commité.** Lecture faite seulement.

## Lieu
- Code : worktree `C:/Users/mrspa/.codex/worktrees/openai-clean-start/port-carnet`, branche `claude/port-carnet-1711`,
  HEAD = tag `en-ligne/2026-11-22-tour9` (0 commit après) : « rouge sur le tag » = l'arbre avant ce port.
- Fichiers non suivis à la racine du worktree (`a2.cjs`, `bandes.cjs`, `build-v0*.cjs`, `cap-*.cjs`, `1`…) et modifiés
  (`scripts/parcours/chaines.mjs`, `source4-portable-bundle-manifest-01.json`, `work/missions/2026-11-20-frise/*`) : pas à nous, ne pas toucher.
- Banc de base lancé en fond sur l'arbre : `node scripts/parcours/carnet.mjs %TEMP%/port-a1b1/avant` (journal `%TEMP%/port-a1b1/avant/log.txt`).
  Ses captures montrent l'état actuel du carnet Chambre froide et de Comparer.

## Maquettes (règle n° 1, reprises telles quelles)
- `work/missions/2026-11-21-carnet-maquettes/cmp-build.mjs` : A1 l. 116-183 (`comparerTete`, `prixA`, `prixA1`, `A1_CSS`, `A1`),
  B l. 304-327 (`B_CSS`, `carnetTete`, `ligneB`, `listeB`), B1 l. 330-356. Captures `cmp-captures/cmp-{a1,b1}-{repos,sans,eur}.jpg` (ouvertes).
- A1 : fil « ‹ <carnet> », titre « Comparer », sous-titre « 1 façon · 3 articles » ; chaîne « Classé par [📌Prix] › Volume › Dispo »
  (puce noire épinglée ; prix inconnu partout : « 📌 Prix ? » pointillé, la suivante noire) ; colonnes = articles, en-tête : picto 50 px,
  rang en rond 26 px chevauchant le bas du picto (1 plein vert, autres cerclés), grande valeur mono (volume « 2,6 m³ »), « vendeur · pays » ;
  colonne du 1er teintée (#f4f8ef, coins 12 px) ; ligne épinglée verte (label avec épingle pleine, cellule du 1er #d8e6c6) ; Prix : « dès »
  au-dessus, EUR « ≈3 000 » brun + « 2 513 € » petit, inconnu = case hachurée « ? », devis = étiquette pointillée « Devis » ;
  Volume + mini barre ∝ valeur (70 px max) ; Au sol = rectangle à l'échelle 0,28 px/cm + « 150×120 » ; Dispo en couleur (en stock vert,
  délai brun) ; Porte cm ; CHF/m³ (« ≥ » si dès, « ≈ » si estimé ; absente sans prix) ; pied : « Vendeurs et prix : exemple »,
  EUR « ≈ rendu chez toi : port, TVA 8,1 %, estimé · exemple », sans prix « Prix manquants : classé par le volume · exemple ».
- B1 (liste du carnet, `CarteClassee` de `src/ui/carnets/CarteArticle.tsx` l. 233, appelée par `CarnetOuvert.tsx:847`) : pastille 96×60
  à droite : connu « 3 350 / CHF ✎ » (saisi) ou « CHF 🔗 » (lu) ; « dès » au-dessus ; inconnu pointillée « CHF ? / ✎ saisir » ;
  devis pointillée scan « devis » ; EUR brune « ≈3 000 / CHF rendu ⌃ », au toucher la décomposition sous la ligne :
  « 2 362 + port 357 + TVA 220 + frais 60 = ≈3 000 » et « en CHF · de 2 513 € et port 380 €, à 0,94 » (base = (€ + port €) × 0,94,
  TVA 8,1 % de la base, frais 60). Rang sur le picto = classement épinglé de Comparer ; puce verte = volume ; œil « veille » + bascule.

## Données (src/domain/carnets/modele.ts, `Article`)
- Existent : `prixCentimes`, `prixDes`, `devise` (CHF/EUR), `vendeur`, `pays`, `dispo`, `origine` ('vous'|'ia'|'page'|'locale'|'exemple').
- N'existent pas : devis, port, taux, TVA, rendu. À décider : constante d'estimation (taux 0,94, TVA 8,1 %, frais 60) dans le domaine,
  port inconnu → « port ? » (ne rien inventer) ; « devis » sans champ : pas d'état (à noter en doute).
- Source du prix : `origine === 'vous'` → crayon (saisi), sinon lien (lu).

## Code actuel à porter
- `src/ui/carnets/Comparer.tsx` (466 l.) : `colonnesComparer` (prix en tête, CRB-14), en-tête l. 325-349 (« ‹ Carnets », titre du carnet,
  « Ce qui compte … », « Côte à côte n », `classees`) ; table l. 351-404 (thead articles avec `cn-col-tete`, rang `rangVisible`) ;
  CSS `src/ui/carnets/carnets-decider.css` (197 l.). Les correctifs V3 (D415) sont déjà dans le tag (commit 516b9b439) ; restent en
  attente : la mise en cartes D1 (CRB-3, CRU-1, CRU-5, CRU-13), place visuelle de la rangée prix (CRB-2), CRB-5 sur la liste
  (`CarnetOuvert.tsx` et `CarnetsVue.tsx:1284` doivent lire `rangVisible(t, l)`), CRU-11 liste et fiche.
  Voir `work/missions/2026-11-21-chasse-carnet/voies/v3-comparer/RESULTAT.md`.
- Contrôles existants : `scripts/parcours/carnet-etapes/comparer.mjs` (mesure `.cn-comparer thead th`, `tbody th/td`, `.cn-tableau-zone`) :
  garder ses ids verts ou les adapter au port A1 en gardant leur sens.

## Choisir → achat prévu + Placer
- `CarnetsVue.tsx:1336` : `onChoisir` applique `choisir(...)` seulement ; l'achat prévu ne naît qu'au bouton « Envoyer dans À venir »
  (`envoyerAVenir`, l. 1417 : `planDepuisChoix` (date `dansTroisMois`, CRW-3, `operations.ts:592`), `ecrirePlan`, `poserSortie`).
- À faire : dans `onChoisir`, enchaîner `envoyerAVenir(c)` (idempotent) ; dans `ChoisiVue` (`Choisir.tsx:144-213`), à côté de
  « Dans À venir … · Voir », un bouton « Placer » qui envoie `window.dispatchEvent(new CustomEvent(EVENEMENT_CALENDRIER, { detail:
  { date: plan.date, id: plan.id } }))` (comme `auCalendrier`, l. 1409). `App.tsx:984` → `ouvrirChoseCalendrier` → `CalendrierTab` prop
  `viser` (l. 720-734) sélectionne la chose dont `source.id === id` ; la chose d'un plan a `source: { genre: 'plan', id: plan.id }`
  (`calendrier.ts:1116`, `deplacable: true`), plan.id = `PLAN-CARNET-<carnetId>`. Aucune caisse dans le carnet (C4).

## Prochaine action
1. Lire le journal du banc de base, ouvrir la capture de la Chambre froide (liste) et de Comparer.
2. Coder A1 (Comparer.tsx + carnets-decider.css), B1 (CarteClassee + fonction d'estimation dans le domaine + test vitest), Choisir+Placer.
3. Contrôles : `scripts/parcours/carnet-etapes/d419.mjs` (un id par point : D419-A1, D419-B1, D419-PLACER), rouge avec
   `--ref en-ligne/2026-11-22-tour9 --seulement d419`, vert sur l'arbre ; puis `carnet.mjs` complet et `calendrier.mjs` OK.
4. Captures 390 et 1280, clair et cave, ouvertes côte à côte avec `cmp-captures/cmp-{a1,b1}-*.jpg`.
5. BUGS.md à la main (`work/missions/BUGS.md`), `node scripts/agents/controle-bugs.mjs` → OK ; commit par chemins avec index temporaire.
