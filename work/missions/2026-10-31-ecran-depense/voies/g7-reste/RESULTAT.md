OK — M1 corrigé, M5 durable (éclair aussi), M11 défaut, D354 corrigé, D357 fait, D358 fait (ligne d'arrondi, pas d'étiquette)

Aucun banc Chrome, aucun Gemini, aucune capture : le rendu reste à voir par le pilote (L12). Tout est vérifié en tests et en types.

## Fichiers touchés
- `src/ui/depense/confiance.ts` (M1), `src/ui/depense/rangees.ts` (M11), `src/ui/depense/Liste.tsx` (D357, D358), `src/ui/depense/p3c.css` (M5), `src/ui/finance/ExpenseSheet.tsx` (M1 chips, M11, D354, D358).
- `scripts/check-invoice-journey-emulator.mjs` (M5 : attend la fin de l'éclair ; M11 : lit le champ marqué et nommé), `node --check` OK.
- Tests neufs : `tests/unit/depense/g7/regles-g7.test.ts` (7), `tests/unit/depense/g7/ecran-g7.test.tsx` (7).
- Tests changés (D354 contredit leur assertion de D329 : « la correction reste bleue, la puce garde son compte ») : `tests/unit/depense/g2a/tout-valider.test.tsx` (4 assertions), `tests/unit/depense/lecture-d/ecran.test.tsx` (1).
- Sorties : `test-rouge-60a8c25f.txt`, `test-vert-g7.txt` (même dossier).

## M1 — corrigé (la cause n'est pas celle du brief)
- Cause : l'unité est déjà sûre (`piece-defaut`, `confiance.ts:182-183`, D328a). Les deux rangées (line-13 et line-17 de sa pièce, rénovation, nature « equipment ») sont jaunes par la **famille** : sa lecture porte un point `lectures-divergentes` sur `items.N.kind` (les trois lectures : equipment / other / stock). `confiance.ts` (TABLE_POINTS, `lectures-divergentes`) le traduit en cible `famille: repris`, donc `nom` repris, donc rangée à contrôler. Vérifié en rejouant `lignesDeLecture` + `confianceLigne` sur sa lecture (lue en local, aucune valeur écrite ici) : unité sûre, quantité, prix, montant sûrs, famille repris « deux lectures diffèrent ».
- Correction : `natureSansEnjeu(point, contexte)` (`confiance.ts`) : un désaccord portant **seulement** sur `items.N.kind`, sur une ligne dont la famille n'a pas de stock (`!familleAUnStock`, hors « Autres ») ne pèse plus. Sûr = rien (D277, D353). Appliqué à la rangée (`confianceLigne`) et à la file des chips (`ExpenseSheet`, `pointsMontres` : sinon « Désaccord » restait au bandeau et au compte). Nettoyant, emballage, ingrédient, « Autres » gardent leur désaccord (leur nature décide d'un mouvement de stock). Un désaccord sur le prix ou le nom reste signalé.
- Test : `regles-g7.test.ts` (M1 ×4). Rouge sur 60a8c25f : 3 de 4 (le 4e est le témoin « autre cellule », et le 3e « nettoyant garde son désaccord » reste vert exprès). Vert après.

## M5 en sombre — durable ET éclair
- Les 2,1 (bg 102,88,55) sont l'**éclair** : mesure faite pendant les 1,6 s où `dp-p3c-garde` pose un fond ambre (animation `dp-p3c-eclair`, ou, sans animation, le fond fixe à 35 % de `prefers-reduced-motion`, `p3c.css:19-20`). `finish()` seul ne l'ôtait pas dans ce second cas. Le temporisateur de l'écran retire la classe à 1,6 s (`ExpenseSheet.tsx`, `surCompte`).
- Mais il reste un défaut **durable** plus bas : sous filtre, la rangée gardée est à `bg-attention/15` (`Ligne.tsx:45`). Mesures du banc après éclair : 3,89 (« imprimé… », « Libellé… » : 154,138,126 sur 56,48,33), 4,00 (corps de rangée, 56,46,30), 4,01 (« ✓ au centime »).
- Corrections : `p3c.css` : `[data-theme='cave'] [data-dp-filtree] { background-color: rgb(var(--attention) / .05) }` (le bord de 1,5 px reste le repère). Calcul : 154,138,126 sur le fond le plus clair possible de la feuille (34,29,25 + 5 % d'attention) = 4,57:1, le vert 5,0:1. Le clair ne change pas. Script : `mesurerG` attend `waitForFunction(() => !document.querySelector('.dp-p3c-garde'))` (4 s) avant `finish()`.
- **Non vérifié en rendu** : la base exacte sous le plateau n'est pas lue (le banc la compose à ~26,25,22) ; le chiffre vient du calcul. Le pilote rejoue M5 sombre sous filtre. Hors périmètre, constaté : en clair, `g-brassage lente filtre corrigees` reste sous 4,5 (bleu 31,100,163 sur 202,206,206 : 3,88 ; gris 102,102,102 sur 232,225,213 : 4,42) : fond bleu des corrections, pas le filtre. Non touché (« le clair ne change pas »).

## M11 — défaut, corrigé
- Cause : `niveauxRangee` (`rangees.ts`) et l'appel `champsARemplir(..., ingredient: line.kind === 'ingredient')` (`ExpenseSheet.tsx`) ne comptaient l'article que pour un ingrédient (lot g, D328c : le nettoyant n'est plus « ingredient »). « ⇄ Choisir un autre article » met `stockAction: 'existing'`, `stockRef: ''` : le plateau dit déjà « article « ? » · à choisir » en rouge, mais la rangée, la puce « à remplir » et `rouges` ne disaient rien. Les deux lisaient donc des choses différentes.
- Correction : `articleCompte(line)` = ingrédient **ou** lien demandé et vide (`existing` sans `stockRef`), quelle que soit la nature ; les deux endroits l'emploient. « Aucun mouvement », article relié, nouvel article : inchangés.
- D334 mesurable : le cas `g-remplir` retrouve sa puce par sa mise en place existante (⇄ sur le déboucheur). Le banc lisait mal l'article : le champ est dans un cadre `data-dp-niveau="inconnu"` et la phrase « à choisir » est un frère. `mesurerEtatG` accepte maintenant `e.closest('[data-dp-niveau="inconnu"]')` comme marque et lit le texte de `[data-dp-stock]` pour « nommé ».
- Tests : `regles-g7.test.ts` (M11 ×3) ; `ecran-g7.test.tsx` : ⇄ sans choisir → « 1 à remplir » ; la toucher ouvre la rangée, le champ « Article » est dans le cadre rouge, nommé « à choisir », et `document.activeElement` est le champ. Rouge sur 60a8c25f, vert après.

## D354 — corrigé (la marque restait)
- Cause : `ExpenseSheet.tsx`, `tranchees` (Garder, Tout valider) ne servait qu'à sortir le changement de la file du bandeau ; la rangée recevait toujours `corrigee={corrigeeDe(line)}` et `neuve={fusion.ajoutees.has(id)}` (bleu, ancienne valeur barrée, ↻), et la puce « N corrigées » gardait tout son compte. Le commentaire de `tranchees` le disait voulu (« elles restent à l'écran, bleues ») : D354 le remplace.
- Correction : la rangée ne reçoit plus `corrigee`/`neuve` quand `corr:<id>` ou `ajout:<id>` est tranché (un à un ou « Tout valider ») ; la puce ne compte que ce qui attend encore (`n` = cibles de la lecture moins les lignes gardées ; elle disparaît à 0). Une correction non encore gardée garde sa marque. Hors rangée, les tuiles d'en-tête corrigées (total, TVA, payé) n'ont pas de geste dans le bandeau : inchangées.
- **Lecture large, dite** : la puce suit la rangée. Une ligne : retirer la décision « la puce se tait aussi » revient à passer `n` à `fusion.n + perdues.length` (`ExpenseSheet.tsx`, `comptesItems`, entrée `corrigees`).
- Tests : `tout-valider.test.tsx` (Garder : marque partie, puce 3 → 2 → 1 après Annuler ; Tout valider : trois rangées sans `data-dp-corrige`, sans `data-dp-corrigee`, sans `data-dp-avant`, puce absente ; perdues-2 ; ligne ajoutée), `lecture-d/ecran.test.tsx` (Tout valider : puce absente). Rouge sur 60a8c25f : 5 tests ; vert après.

## D357 — fait
- `Liste.tsx` : le bouton cadré quitte la rangée de « + Ajouter une ligne ». Lien `data-dp-regrouper` au bout de « Détail a / b · Regrouper en une dépense » : `text-xs text-cave-400 underline decoration-dotted`, sans cadre ni fond, `min-h-6` (24 px). Contraste : cave-400 clair 102,102,102 sur blanc 5,7:1 ; sombre 154,138,126 sur 18,16,14 5,7:1 (≥ 4,5).
- « ↶ Rétablir » (D332) reste dans la rangée de l'ajout, inchangé ; le lien disparaît tant que le retour est offert.
- Test : `ecran-g7.test.tsx` (classes sans `border`/`rounded`/`bg-`, parent ≠ parent de « Ajouter », texte du parent contient « Détail »). Rouge sur 60a8c25f. Le test « Regrouper puis Rétablir rend les deux lignes » est vert avant et après (D332 intact).

## D358 — fait par une ligne d'arrondi, sans retomber sur l'étiquette
- `Liste.tsx` : ligne `data-dp-arrondi` « Arrondi à 5 centimes · −0,01 » après les rangées (hors filtre), neutre (`text-xs text-cave-400`). `ExpenseSheet.tsx` : `arrondiDuTotal(draft)` de `purchaseEntry.ts` (même règle que l'enregistrement : `sumCheck`, 5 ct, écart ≤ 2 ct, pas de ligne d'arrondi imprimée) ; le détail devient somme des lignes + arrondi = total, donc `ecart` faux, rien de jaune. Tout autre écart : inchangé (jaune).
- Rien n'est compté deux fois : la ligne n'est pas dans `draft.lines` ; `purchaseEntry.ts` n'est pas touché et ajoute toujours la sienne à l'enregistrement (testé par `banc-k7/arrondi.test.ts`, vert).
- Tests : 170,21 → 170,20 : « −0,01 », détail « 170,20 / 170,20 » sans classe attention/alert, ligne après la dernière rangée ; 124,48 → 124,50 : « +0,02 » ; 170,21 pour 171,20 : pas de ligne, détail « 170,21 / 171,20 » en attention ; somme exacte : pas de ligne. Rouge sur 60a8c25f (2 des 4 ; les deux témoins verts avant et après).
- Non fait : l'alignement exact de la colonne montant de la ligne d'arrondi sur celle des rangées (à voir en capture).

## Contrôles
- Rouge : `test-rouge-60a8c25f.txt` (les 5 fichiers de source remis à HEAD par `git show`, sauvegardés avant, restaurés et comparés par md5 après) : 15 échecs sur 41.
- Vert : `test-vert-g7.txt` : 4 fichiers, 41 tests. `tests/unit/depense` + `tests/unit/finance*` : 163 fichiers, 2 352 tests verts, 4 ignorés, 0 échec.
- **Environnement** : `npm test` et `tsc` standard échouent ici avant moi : `zxing-wasm` et `pdfjs-dist` manquent dans le `node_modules` partagé (25 fichiers de test ne chargent pas, `qrLecture.ts` ; idem sur HEAD). J'ai rejoué avec une config temporaire (scratchpad, hors dépôt) qui lit ces deux paquets dans `deploy-hosting-qr/node_modules` en lecture seule : `vitest.g7.config.ts`, `tsconfig.g7.json`.
- `tsc --noEmit` (tsconfig temporaire, mêmes chemins) : 0 erreur, tests g7 compris. Sur le tsconfig du dépôt : les deux seules erreurs sont ces modules.
- Build : `npm run build` s'arrête à `tsc` sur les deux mêmes modules (exit 2), avant et après moi ; `vite build` non lancé. Non prouvé ici.
- Manifeste : `md5sum source4-portable-bundle-manifest-01.json` = `21dd75b3…` avant et après.
- `git status --short` : seuls mes fichiers (liste ci-dessus) + ceux d'autres voies déjà là. Rien dans `deploy-hosting-qr`, `.codex`, `functions/.env`, `firebase.json`.
- Essais : 1 par point sur le code ; 2 pour `ecran-g7` (sélecteur du détail, article du stock pour que « ⇄ » soit offert).

## Doutes
- M5 : le 5 % est un calcul, pas un rendu. Si le banc montre encore < 4,5 sur un texte vert ou ambre, descendre à 3 % ou donner un fond à la rangée gardée sans teinte (le bord suffit).
- D354 : la puce suit la rangée (voir plus haut). Les tuiles d'en-tête corrigées restent bleues : aucun geste ne les valide.
- M1 : le désaccord sur la nature disparaît aussi de la file « Désaccord » pour une ligne sans stock ; elle ne le montre plus nulle part. Pour le garder dans la file seule, retirer `pointsMontres` dans `ExpenseSheet.tsx`.
- D357 sur le formulaire simple (`ExpenseSheet.tsx`, section « Ce que tu achètes », hors scan) : le bouton cadré y est resté ; ce n'est pas l'écran de sa capture.
- Les captures ne sont pas prises ni ouvertes (L12) : D357 et D358 à regarder à 390 et 1280, deux thèmes.

DÉCISION À PRENDRE : aucune bloquante. À valider par le pilote : D354 vide aussi la puce « N corrigées » (lecture large, réversible en une ligne).

CONNAISSANCE : un désaccord des lectures sur la seule nature d'une ligne (`items.N.kind`) rendait « à contrôler » des rangées de matériel que l'unité et le calcul disaient sûres ; la marque venait de la famille, pas de l'unité. Le `node_modules` partagé de ce poste n'a ni `zxing-wasm` ni `pdfjs-dist` : tests d'écran et build exigent une config qui les prend dans `deploy-hosting-qr/node_modules`.

LEÇON PROPOSÉE : avant de corriger une rangée « à contrôler », lire quel champ la marque (`data-dp-niveau` par cellule, ou `confianceLigne`) au lieu de croire la description du défaut : ici l'unité était juste, c'est la famille qui était jaune. Rejouer la vraie lecture dans `confianceLigne` (en local, sans écrire ses valeurs) coûte un test jetable.
