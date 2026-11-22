G2A OK — rouge, filtre, Tout valider, Plié, Rétablir, nature, pluriel, format, menu du stock seul, Lectures n/n, en-têtes sous filtre ; visuel à mesurer dans Chrome (g1)

## Fichiers écrits
- Code : `src/ui/finance/ExpenseSheet.tsx`, `src/ui/depense/{Pied,Recap,Liste,Ligne,rangees,groupes,p3c.css}`, `src/theme/themes.css`.
  `groupes.ts` : seulement les fonctions de pliage (`reglerTous`, `toutPlier`, `etatSegment`), à moi depuis le message du pilote.
- Tests neufs : `tests/unit/depense/g2a/{aide.tsx, rangee.test.tsx, tout-valider.test.tsx, plier-regrouper.test.tsx}` (pièces fictives, Gemini simulé).
- Journaux : `voies/g2a-ecran/rouge-rangee.txt`, `rouge-fichiers.txt`, `rouge-horsstock.txt` (rouges avant correction), `vert-1.txt`, `suite-1..6.txt` (suite complète), `sortie-tsc.txt`, `sortie-build.txt`.

## Méthode (corrigée par le pilote en cours de route)
Tests Vitest pour la logique et l'état seulement ; aucun test jsdom ne vérifie une classe CSS pour D328d, D331, D328e, la couleur de D330 (verts par construction). Ces défauts se prouvent par le banc Chrome g1 (M5 à M13) : **aucune capture prise de mon côté, aucun rendu ouvert : validation visuelle non effectuée**.
Un test par règle : D330/D334 (mots rouges, focus), D329 (file, ordre, Garder, Annuler, Retirer, Voir, Tout valider, Confirmer = tout gardé), D333 (Plié ferme tout, état du segment), D332 (Rétablir), D335 (table + un segment pressé par nature + toucher), D328h (format), B1 (traduction ≠ correction), D328b (câblage `horsStock`).

## Critères
1. Rouge sur HEAD puis vert : tests rouges gardés dans `rouge-*.txt` (14 + 11 rouges au départ, `horsStock` rouge sans câblage : « Rénovation 21 Stk + 2 ? » ; le test pur de la table des natures et `decimalesAuRepos` sont verts par construction, le rendu qui les emploie était rouge).
   Les fichiers `rouge-*` ont été pris avec le code d'écran de HEAD et mes aides pures déjà ajoutées dans `rangees.ts`.
2. `copie.mjs "npx vitest run tests/unit/depense"` : **150 fichiers, 2 319 tests verts, 4 ignorés** (`suite-6.txt`) ; `tsc --noEmit` 0 ; `npm run build` 0.
3. Banc g1 : à rejouer par le pilote.
4. `git status --short` : rien hors Possède de mon fait. Fichiers modifiés par d'autres : `confiance.ts`, `familles.ts`, `finale.ts` (g2b), `scripts/check-invoice-journey-emulator.mjs` (pas moi), `tests/unit/depense/{confiance,stock}` (g2b / pilote).

## Ce qui est fait (défaut → où)
1. D330/D334 : `champsARemplir` (rangees.ts) → au plateau, un mot rouge par champ qui manque (« unité à remplir », « prix à remplir », « article à choisir »… ; c'est un bouton qui donne le focus), champs au bord alert (`data-dp-niveau="inconnu"`), nom de rangée au bord tireté alert ; sous « à remplir », la rangée s'ouvre et le focus va au premier champ (`focaliser`). Le lien « n ? » d'un en-tête ↔ rangées rouges dépend de g2b (D328b) ; `horsStock` est câblé.
2. D331 : puce active = classes `dp-p3c-on dp-p3c-on-<jeton>` (p3c.css) : fond plein `--alert-strong-texte` / `--attention-texte` / `--area-finances-texte` / `--ebc-straw`, texte `--sur-paille`. Contrastes calculés à la main (clair et cave, ≥ 4,5) mais **non mesurés au rendu**.
3. D328d : règle `.bg-ebc-straw :is(.bg-cave-950,.bg-cave-900,.bg-cave-850)` (+ enfants) dans themes.css. Non vérifiée au rendu.
4. D329 : `Changement` (rangees.ts), file dans ExpenseSheet : pas retrouvées, valeurs corrigées (« nom corrigé », « quantité corrigée », « 2 valeurs corrigées »), lignes ajoutées, désaccords. Gestes : Garder / Retirer (perdue, ajoutée) / Annuler (rend la valeur du provisoire, ôte le bleu, puce −1) / Voir (ouvre la rangée). « Tout valider » dès 2 éléments restants. Rang « n/N » = gestes faits + 1 sur gestes faits + restants. Confirmer sans trancher = tout gardé.
5. D333 + E1 : `reglerTous` ferme tout, même un groupe à voir ; `etatSegment` : `plie` = tout fermé, `deplie` = tout ouvert (jamais les deux, mêlé = aucun) ; « Plié » ferme aussi les plateaux de chaque rangée.
6. D332 : « ↶ Rétablir les N lignes » à la place de « Regrouper », rend les lignes et leurs retouches (copie du brouillon avant regroupement), efface à la nouvelle lecture.
7. D328e : valeur de la preuve `shrink-0`, libellé qui passe à la ligne (visuel à mesurer à 390). D328f : « désaccord » n'a plus de puce à part (A3) ; les pluriels des autres puces étaient déjà justes (`reliés`, `proposés`, `nouveaux`, `moutures`, `corrigées`). D328h : prix et montants du plateau `fractionDigits = max(2, décimales)` (« 1,2 » → « 1,20 », « 0,098 » reste ; au focus la frappe reste telle quelle). Les cellules de rangée étaient déjà à 2 décimales.
8. B1 (remplace D328g) : `sansTraductions` : quand le nom IMPRIMÉ n'a pas été lu autrement (mêmes mots à la casse, aux accents, à la ponctuation et à l'ordre près), les cellules de nom ne sont plus une correction (ni bleue, ni barrée, ni comptée dans « ↻ corrigées ») ; la rangée porte le français seul. Une vraie relecture du nom reste une correction.
9. D335 : `natureDuSegment` ; une remise n'a pas de segment ; toucher le segment allumé ne change rien. Le menu « Type d'achat » reste.
10. D328b : `horsStock` passé à `LigneBande` ; `texteQuantite` n'écrit plus « ? » pour une ligne hors stock sans unité.
11. Ajouts g3 faits : C3 (aide du champ d'unité : « unité » au lieu de « kg, g, L, sachet… »), C2 (phrase d'unité et segment sur unité déduite retirés ; segment g/kg/Stk seulement pour l'unité inconnue, barre sous la rangée), C1 (une seule pastille : « article « ? » · à choisir » en rouge, plus de seconde « article ? »), C5 (selects matériel dans « plus »), A4 (« Champs corrigés » et « Lecture déjà disponible » ôtés du récap ; le second est au survol du « Détail »), A2 (« À vérifier » orphelin ôté), A3 (puce « hors stock » ôtée ; un désaccord compte dans « à contrôler » et la file le traite ; la chip « Désaccord » n'est plus au récap), G1 (puce « point courant » et « ✓ points revus » du pied retirées : née dans le commit 6bb83d4a comme reste de la « bande collante » du port p3c ; D233 se plaignait que « y aller » ne marche pas, il ne demandait pas cette puce ; aucune parole ni maquette ne la justifie), D2 (rangée gardée sous filtre : fond jaune + bord ; bande « n/N »).

## Tests existants rendus caducs (adaptés, assertions remplacées, pas retirées)
- `bandes/sous-groupes-d307.test.ts` (3), `bandes/sous-groupes-d311.test.ts` (4) : « Plié garde ouvert le groupe à voir » → D333 « Plié ferme tout » ; état de départ mêlé ; les deux moitiés jamais ensemble (E1).
- `ecran/sous-groupes-d311.test.tsx` (2) : idem au rendu.
- `lecture-d/ecran.test.tsx` (3) : le bandeau est maintenant la file de tous les changements (rang « 1/5 », « Tout valider » présent avec les 3 corrections, Garder/Retirer passent aux corrections).
- `pages/entree.test.tsx` (1) : D328e, valeur `shrink-0` sans `truncate`, libellé qui passe à la ligne (assertion de classe existante mise à jour, pas un test neuf de classe).
- `ecran/ecran.test.tsx` (phrase d'unité, C2), `ecran/p3c.test.tsx` T12 (G1), `fiche/ecran.test.tsx` n° 14 (C1) et n° 16 (A3), `rangees/rangees.test.tsx` (hors stock A3 ; Fiche matériel C5 ; défaut 8 / segment d'unité C2).
- `stock/renovation-d306.test.tsx` : adapté par le pilote (g2b), non touché par moi.

## Restes réglés (décisions du pilote)
- **C7** : l'interrupteur « Mettre en stock » et le libellé « Réception en stock » sont retirés ; le menu du stock est le seul contrôle (« Aucun mouvement de stock », « Ajouter à un article existant », « Nouvel article »). Migrés vers le menu : `ecran/ecran.test.tsx` (clic sur l'interrupteur de la ligne 20) et `ecran/tri.test.tsx` (R1, ligne 1). **Retiré, pas migré** : `ecran/ecran.test.tsx` « l'interrupteur « Mettre en stock » écrit none / existing, jamais new, et son état se lit » : il ne vérifiait que l'interrupteur (le menu écrit ses valeurs, couvert par R6, R12, R13). Aucun autre test ne dépendait de l'interrupteur ; les tests du menu (R6, R12, R13, S1, n° 14) passent sans changement. « plus » ne s'ouvre jamais seul : je n'ai trouvé aucun code qui l'ouvre (les `details` de `viser` et `focaliser` n'ouvrent que le plateau, et « plus » seulement pour le libellé vide) ; à confirmer sur le banc g1.
- **A2** : la rangée du récap dit « Lectures n/n » (jamais « n lectures ») ; un désaccord garde le point sans ✓. Tests adaptés : `lecture-d/ecran.test.tsx` (E12, E14), `lecture-d/finitions.test.tsx` (e), `pages/parcours.test.tsx` (T-A9, désaccord).
- **A3** : rien à faire (« reliés » masqué à 0, décidé).
- **D2** : sous un filtre, les quantités et montants des en-têtes de bande et de sous-groupe sont ceux des rangées montrées (`bandesMontrees`, ExpenseSheet), et le compte de bande et de sous-groupe dit « n/N ». Test `g2a/rangee.test.tsx` (rouge avant : « expected 5.85 to be close to 4.25 », `rouge-d2.txt`).

## Contrôles finaux
`copie.mjs "npx vitest run tests/unit/depense"` : 150 fichiers verts, 2 319 tests verts, 4 ignorés (`suite-9.txt`) ; `tsc --noEmit` 0 ; `npm run build` 0. Banc Chrome non lancé (g1).

## Doutes
- Les captures g1 sont la seule preuve de D328d, D331, D328e, du rouge et des corps visibles de D333.
- `Pied.tsx` garde le code mort `milieu` / `recapSorti` (props inchangées) ; à nettoyer plus tard.
- Le bandeau apparaît dès qu'une correction de la 3e lecture existe (même sans ligne perdue) ; « Confirmer » ne l'attend pas.

CONNAISSANCE : le Bash de ce poste mange aussi les `\\s` d'un script `node` écrit en heredoc ; les scripts d'édition à regex passent par Write (fichier) puis `node`.
LEÇON PROPOSÉE : un défaut purement visuel (clair/sombre, rognure, contraste) ne se prouve pas par jsdom : le test rouge est une mesure Chrome (déjà dite par le pilote, L12) ; un test de classe CSS est vert par construction.
