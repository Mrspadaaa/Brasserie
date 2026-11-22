OK — Ligne ajoutée entière à 1280 et 390 ; « Idaho 7 » face à plusieurs « Idaho 7 » : vue FACTURE | STOCK, une sortie par article

## Bloquant 1 — la ligne ajoutée hors de vue à 1280
- Cause lue au banc sur HEAD (BAUHAUS 29 lignes, `mesures-ajout-head.txt`) : `enHaut` ne corrigeait que `dec<0` (jamais vers le bas) ; à 1280 la ligne restait à 602–1003, cases d'unité à 793–877, sous le pied (748). Après saisie du nom : 791–875, toujours hors de vue.
- Corrigé : `src/ui/depense/defilement.ts` (neuf) : `ancetreDefilant` (l'ancêtre dont le contenu dépasse réellement), `basDesCollants` (collants de SA colonne : la colonne de gauche sticky ne compte pas), `basVisibleDe` (conteneur, pied, clavier), `decalageVoulu` (pur), `amenerEnVue` (défilement instantané), `garderEnVue` (rejoué à l'image suivante, 150 et 400 ms). Branché dans la branche `libelle` de `focaliser` ; `remettreEnVue` à chaque frappe du nom de la ligne ajoutée (mode « minimal » : ne bouge que si elle sort de la zone).
- Mesures au banc après (`mesures-ajout.txt`, Chrome réel, clair et cave) : 1280 : ligne 287–688, collants jusqu'à 82, cases d'unité 478–562, bas visible 748 → OK ; après « Idaho 7 » : unité 476–560 → OK. 390 tactile : ligne 127–548, collants 68, unité 318–402, bas visible 792 → OK ; après « Idaho 7 » : ligne 72–746, haut 72 ≥ 68, unité 261–345 → OK. `AJOUT OK`.

## Bloquant 2 — « Idaho 7 » face à plusieurs « Idaho 7 » au stock
- Un seul état, pour une ligne lue et pour une ligne ajoutée : la vue FACTURE | STOCK (« 2 articles « Idaho 7 » · lequel ? choisis dessous », trait ambre « ? »), une sortie « Relier à … » par candidat distinguée par α, récolte, stock (« Relier à Idaho 7 2025 · α 13 », « = variété · 40 g au stock »), puis « bis » et « Nouvel article ». Rien n'est coché ni relié au repos. Plus de « hors stock » ; la ligne fermée dit « plusieurs articles « Idaho 7 » : choisis ⇄ ». ⇄ ouvre le choix de l'article avec les candidats d'abord (α, stock, catégorie), puis le reste du stock. Une ligne « article · relié · ⇄ · Retirer » reste dessous une fois un candidat relié ; « un autre article du stock ⇄ » sinon.
- Code : `etat.ts` (`articlesDeMemeNom`, `candidatsDuNom` : candidats « ambigu » de la règle ∪ articles de même nom, 2 au moins), `candidats.ts` (neuf : `distinguerCandidats`, `titreDeSortie` : seul ce qui varie d'un candidat à l'autre, jamais une donnée absente), `Plateau.tsx` (`Sortie` : ton « neutre », seul ajout ; aucun composant neuf), `ExpenseSheet.tsx` (trio à N candidats dans `trioEl`, `regleExistante` en cache pour garder la vue une fois un candidat relié, options du combo, « Nouvel article » au nom de la ligne quand il diffère des candidats).
- La garde s1 (dépense hors brassage : aucun article ni picto de stock) reste pour les lignes LUES ; une ligne ajoutée à la main sur un ticket de rénovation (cas de sa capture) suit la règle (ses mots du 10.11 : elle passe en Houblons).
- Cas d'un seul article au même nom (montages p4) : inchangé, test qui le tient (`['bis','relie','neuf']`, jamais « relie- »).
- Tests rouges sur HEAD (src de HEAD, tests de p5) : 6 rouges sur 7 de `ecran-p5.test.tsx` (le 7e, l'article unique, est l'acquis et reste vert) ; `defilement.test.ts` : module absent sur HEAD.
- Tests existants changés (leur cible était l'état rejeté « hors stock » + « plusieurs articles : choisis ») : `d381/stock-repare.test.tsx` C0 et C2 (« bis » de la vue à la place de « Suivre au stock »), `fiche/ecran.test.tsx` R13 (idem) ; `aide-plateau.ts` : `stockDe` lit `relie-<ref>`.

## Critères
- `npx tsc --noEmit -p .` : sortie vide (`tsc.txt`).
- Tests : `npx vitest run tests/unit/depense tests/unit/finance tests/integration/depense* tests/integration/finance tests/integration/financeQuickActions.test.tsx --reporter=dot > tests.txt` → **245 fichiers (244 verts, 1 ignoré), 3 116 tests verts, 4 ignorés, zéro rouge** (`tests.txt`).
- `npm run build` : vert, exit 0 (`build.txt`).
- Banc `banc/` (copie de p4 ; cas neufs `idaho-deux`, `bauhaus-piege-idaho`), Chrome réel (puppeteer-core), Vite en arrière-plan puis arrêté (port 5199 libre). `capturer-p5.mjs` : `CAPTURES OK`, zéro échec de mesure (une seule vue, aucun « hors stock », deux « Relier », bis, nouvel article, rien coché, une seule sortie cochée après chaque geste, candidats d'abord dans ⇄, aucun débordement horizontal) ; `mesurer-ajout.mjs` : `AJOUT OK`. Sorties : `mesures-idaho-deux.txt`, `mesures-ajout.txt`, `sortie-capturer.log`, `sortie-ajout.log`.
- Captures OUVERTES en image : `captures/montage-idaho-deux-390-1/-2/-3.png`, `montage-idaho-deux-1280-1/-2/-3.png`, `montage-ajout-390.png`, `montage-ajout-1280.png` (clair au-dessus de cave) ; plus à l'unité `idaho-deux-1280-clair-1-repos`, `-6-autre-candidats-d-abord`, `idaho-deux-390-cave-2-sortie-relie-MP-Idaho7-25`, `-7-fermee`, `-6-autre-candidats-d-abord`, `ajout-bauhaus-piege-idaho-390-cave-2-apres-nom`, `-1280-clair-1-apres-ajout`, `-2-apres-nom`. Les `*-head.png`/`*-t1.png` sont les premiers essais (HEAD et premier correctif), non ouverts un à un.

## Essais utilisés
Un par critère (tsc, build) ; tests : deux passes (la 1re : 3 rouges attendus, dont la cible était l'état rejeté) ; bloquant 1 : un essai de correction (vert au premier banc) ; bloquant 2 : un défaut trouvé au banc (garde s1 trop large : la ligne ajoutée sur un ticket de rénovation n'avait pas la vue), corrigé avec test.

## Doutes et limites
- À 1280, après la saisie du nom, la ligne (674 px avec ses cinq sorties) est plus haute que la zone (666) : les cases d'unité sont visibles au-dessus du pied (critère), les deux dernières sorties demandent un défilement. Aucune règle ne les met en vue avant le toucher ; le haut de la ligne reste sous les collants.
- Pas joué sur Android réel : le clavier se lit par `visualViewport` (comme DP-5) ; au banc le clavier n'existe pas.
- La sortie « bis » au repos s'intitule « Idaho 7 » (le nom proposé) avec « = variété », comme le trio validé ; entre « Relier à Idaho 7 2025 » et elle, la différence est dans le mot « Relier à ». Un titre plus explicite serait un choix de libellé du brasseur.
- Pas de champ « lot » sur un article du stock : l'α, la récolte (lue sur le nom, « Idaho 7 2025 »), l'origine et le stock distinguent ; deux articles identiques en tout (même nom, α, stock) se verraient identiques (aucune donnée inventée pour les séparer).
- Une ligne « Retirer » après un lien ramène la vue à « rien coché » (testé) ; un brasseur qui veut « hors stock » pour une ligne ajoutée de ce nom n'a plus ce choix visible sous le trio (le type « Service » ou « Matériel » le fait).

DÉCISION À PRENDRE : aucune bloquante. Optionnel : libellé de la sortie « bis » quand plusieurs articles portent le nom (aujourd'hui « Idaho 7 », comme le trio p4) ; recommandation : le laisser, c'est son trio validé.

CONNAISSANCE : à 1280, `enHaut` (jeu en ligne 8) ne défilait que vers le haut ; `ancetreDefilant`/`decalageVoulu` (`src/ui/depense/defilement.ts`) rendent le calcul pur et testable. La règle s1 (hors brassage) vise les lignes lues ; une ligne ajoutée à la main suit la règle du stock.
LEÇON PROPOSÉE : aucune
