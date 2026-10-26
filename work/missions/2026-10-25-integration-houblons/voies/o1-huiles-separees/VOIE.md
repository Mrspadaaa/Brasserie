# Voie o1-huiles-separees — chaque huile sur sa propre ligne dans la composition de Comparer (D154)

Agent : auteur (Sonnet), pour du code. Le dessin est son choix cmc2k (règle n° 1). Les lignes ajoutées reprennent exactement la
grammaire des lignes existantes de la composition : titre, mots d'arôme, une barre par houblon. Aucun texte, aucune légende ni
aucun autre élément en plus.

Avant de toucher à l'interface, lis :
- `.claude/rules/affinee-frontend.md` ;
- DESIGN.md et `docs/ui-compacte.md`, pour les parties utiles.

## Ses mots (26.10, matin)
- Sur la ligne « Autres · β-pinène, linalol, géraniol » : « Pourquoi tu as regrouper autre ? Avec plusieurs huiles ?? »
- Aux deux voies proposées (nos données : linalol et géraniol en lignes propres, avec un reste « autres » plus petit ; nouvelles
  sources : toutes les huiles séparées) : « Oui ne regroupe jamais plusieurs huiles. Sauf si c'est utile et que elles sont déjà
  séparé à un endroit. Donc je veux les deux »

Cette voie fait la première, avec nos données. La seconde viendra après la collecte des fiches fournisseurs (voies c3a à c3d, en
cours).

## État actuel
- `src/ui/hopIndex/comparer/Huiles.tsx` (`COMPOSES`, `plageDe`) : myrcène, humulène, caryophyllène et « Autres ».
- « Autres » est la valeur publiée par Beer Maverick (`oils.others`, « All Others, including β-pinene, linalool, geraniol &
  selinene »), avec le calcul 100 − les trois en repli.
- Le farnésène (`oils.farnesene`, 78 % des houblons) n'a pas de ligne.
- Le linalol et le géraniol ont une ligne plus bas, dans le tableau de chimie (`valeurs.ts`, `compose()` : fiches de
  `composes-houblon.json`, et `hsLinalool` du catalogue). Ils n'en ont pas dans la composition.
- Captures de l'état actuel : `voies/c2-comparer-valeurs/captures/composition-390.png`, et `voies/m1-farnesene/img/b-farnesene.png`
  pour le rendu d'une ligne farnésène, cloné dans la vraie app.

## À faire
1. **Composition, une ligne par huile nommée**, dans l'ordre de Beer Maverick, puis les autres :
   myrcène, humulène, caryophyllène, farnésène, linalol, géraniol.
   - Les mots d'arôme suivent la grammaire existante. Farnésène : « frais, vert, floral » ; linalol : « floral, lavande,
     agrumes » ; géraniol : « rose, floral ». Vérifie-les dans `composes-houblon.json` ou dans les données, et cite-les.
   - Les valeurs viennent de la même source unique que le tableau de chimie (`compose()`) : enveloppe des fiches et du
     catalogue, en % de l'huile.
   - Un houblon sans valeur s'affiche comme l'app affiche déjà un inconnu (hachures), jamais 0.
   - Une ligne dont aucun des houblons comparés n'a de valeur ne s'affiche pas.
2. **Le reste**, en dernière ligne, seulement s'il est utile.
   - Il ne doit compter aucune huile qui a sa propre ligne : pas de double compte.
   - Si linalol et géraniol sont connus pour un houblon, son reste vaut `oils.others` moins leurs plages, en arithmétique
     d'intervalles bornée à 0. Sinon, la valeur publiée, sans double compte possible : dis comment tu le garantis.
   - Son titre ne nomme que des huiles qui n'ont pas de ligne. Aujourd'hui : « autres · β-pinène, sélinène… ».
   - Applique sa règle : un groupe n'est admis que s'il est utile et que ses huiles sont séparées ailleurs. β-pinène et sélinène
     ne le sont nulle part tant que la collecte n'a rien rapporté. Garde ce reste et écris-le dans RESULTAT.md : il disparaîtra
     à la seconde étape.
3. **Un contrôle qui échoue sur la version d'avant (L13, D154).** Étends `tests/integration/comparerValeurs.chrome.mjs` :
   - chaque huile nommée qui a une valeur pour un houblon comparé (farnésène, linalol, géraniol) a sa ligne dans la composition ;
   - un titre de groupe ne nomme qu'une huile sans ligne propre ;
   - la somme des milieux d'un houblon ne dépasse pas 100 % + 2 points.

   Rouge sur 50f00b78 (arbre jetable dans `os.tmpdir()`, avec `.env`, `.env.local`, `src/data/seedData.ts` et
   `prototypes/houblons/data.json` copiés), vert après.

## Critères
- Le contrôle : rouge sur 50f00b78, vert après, en 390 × 844 et en 1280 × 800 (`--large`).
- `npx vitest run tests/unit/hopIndexV4 tests/unit/designTokens.test.ts` vert, `moteurInchange` compris.
- `npm run build` vert ; `node scripts/audit_inputs.mjs` → `INPUT PROTECTION AUDIT PASSED`.
- Captures de la composition, en 390 et en 1280, avec Nelson Sauvin, Citra et Mosaic, puis Saaz, Citra et Hallertau Blanc. Ouvre-les
  et compare-les avec `composition-390.png` de c2 : seules les lignes voulues ont changé.

## Possède
- `src/ui/hopIndex/comparer/Huiles.tsx`, `src/ui/hopIndex/comparer/valeurs.ts`, `comparer.css` (règles de la composition seulement).
- `tests/integration/comparerValeurs.chrome.mjs`, `tests/unit/hopIndexV4/`.
- `work/missions/2026-10-25-integration-houblons/voies/o1-huiles-separees/`.

D'autres voies sont en vol :
- p2-rendu possède `comparer/index.tsx`, `PageShell.tsx` et cinq CSS ;
- les voies c3 possèdent `src/data/hopSources/` et `scripts/collecte-hop/` ;
- r177 possède `src/services/hopV55/` ;
- ia1 possède `scripts/eval-hop/ia-*`.

N'y touche pas. Pas de `git mv`, pas de `git stash`. Fichiers de travail dans `os.tmpdir()`.

Retour en une ligne ; RESULTAT.md avec les preuves, les captures ouvertes et ce qui reste.
