OK — Comparer tient, Choisi visible, cadre et bulle visibles, noms distincts, phrase dite une fois

Lot corr2-L2-ecrans-ouvert-comparer, tour 2. Worktree `port-carnet` (branche claude/port-carnet-1711), pas de commit.
Corrigés : 6 sur 6. Banc `?preview=carnets` en dev (vite, port 60427, lancé puis arrêté), IA simulée, aucun appel Gemini,
données « ZZ TEST — … », Chrome 390 tactile (DPR 2) et 1280, clair et sombre.

## Fichiers écrits
- `src/domain/carnets/comparer.ts` : `nomsDistincts`, `domaineEtChemin` ; `tableau()` nomme ses lignes sans doublon ; `critereQuiTranche` reprend ces noms (façons homonymes : « 1re », « 2e »).
- `src/ui/carnets/Comparer.tsx` : cadre du tableau, fondu « suite à droite » mesuré (scroll et ResizeObserver), cellule de raison d'écart repliable.
- `src/ui/carnets/Choisir.tsx` : l'état « choisi » devient `ChoisiVue`, qui défile en haut à son arrivée (`scrollIntoView` block 'start'). Un pourquoi vide ne laisse plus de ligne vide.
- `src/ui/carnets/CadreArrivee.tsx` : un bloc `.cn-cadre-bloc` (cadre et conséquence G9), rendu visible à son arrivée et quand G9 paraît (`scrollIntoView` block 'nearest'), une fois par apparition.
- `src/ui/carnets/ChampCarnet.tsx` : publie `--cn-champ-h` et `--cn-clavier` (`useKeyboardInset`) sur `[data-carnets]`. Quand la bulle G8 paraît, la vue défile de sa hauteur.
- `src/ui/carnets/ListeCarnets.tsx` : `phraseEnTitre` (normalisé, préfixe du banc et rognage `titreDePhrase` compris). Si le titre est la phrase, rien n'est écrit sous le titre ; sinon la phrase citée tient en 2 lignes au plus. Le bouton « Coller un lien » est resserré.
- `src/ui/carnets/CarnetOuvert.tsx` : si le titre est la phrase, « votre phrase en titre » une fois, et rien quand le carnet vient d'être créé (le bandeau le dit déjà) ; sinon la phrase citée.
- `src/ui/carnets/carnets.css` :
  - Comparer : la colonne des noms est collée à gauche, le fondu montre la suite, les en-têtes, pastilles et raisons se replient ; la page passe à 920 px de large à partir de 900 px ; « Côte à côte n » reste sur une ligne.
  - Défilement : `scroll-margin` sur le cadre et sur Choisi.
  - Liste : titre et phrase citée sur 2 lignes au plus.
- Tests : `tests/unit/carnetsComparer.test.ts` (4 tests neufs, 1 attente corrigée : elle demandait « X et X »), `tests/unit/carnetsEcrans.test.tsx` (6 tests neufs ; 1 attente R18 mise au mot du lot voisin, voir Doutes).
- Banc et preuves, dans ce dossier : `banc-l2.cjs`, `lancer-l2.sh`, `mesures-*.txt`, 40 captures `m390-*` et `d1280-*`.

## Problème → fait → preuve
1. **d1280-2 : Comparer coupé à droite.** Les noms, pastilles et raisons se replient ; la page Comparer passe à 920 px de large à partir de 900 px. À 390, la colonne des noms est collée à gauche et un fondu indique la suite tant qu'il en reste. Les écartés restent à la fin avec leur raison (D-52).
   Preuve : `d1280-clair 27 tableau : scrollWidth 894, clientWidth 894 → TIENT` (même chose en sombre). La dernière colonne est « écarté Ventilateur de plafond 130 cm » ; la raison « … écartée : brasse la buée sans la sortir » est entière. `m390 27 noms fixes : nomGauche 25 avant et après un défilement de 220 px` ; `fondu présent`, puis `au bout : suite false`. Captures ouvertes : d1280-clair-27, d1280-sombre-27, m390-clair-27, m390-clair-27b, m390-sombre-27.
2. **État 28 : « choisi » non visible après Choisir.** À son arrivée, l'écran défile en haut.
   Preuve : `28 choisi : pastille « Choisi le 17 nov. » top 86, « Pourquoi ce choix » top 248, champ à 733`, à 390 et à 1280, en clair et en sombre. Vitest : `scrollIntoView({block:'start'})` appelé sur `.cn-choisi`. Captures ouvertes : d1280-clair-28, m390-clair-28, m390-sombre-28.
3. **m390 état 11 : cadre G10 hors de l'écran pendant la frappe.** Le cadre et G9 forment un bloc qui se rend visible (nearest) sans passer sous la barre ni sous le champ (scroll-margin).
   Preuve, Évier : `cadre 222→382, « les articles seront rangés sur le fond de bac, 38 cm au moins », champ à 659`. Preuve, Ventilation défilée tout en bas (1086/1086) puis frappe : la vue remonte à 70 et le cadre est entre 158 et 319, au-dessus du champ (659). Vitest : un défilement par apparition, et un de plus quand G9 paraît. Captures ouvertes : m390-sombre-11, m390-clair-11b.
4. **m390-7 / R27 : la dernière note est cachée, clavier ouvert.** Le champ publie sa hauteur et le retrait du clavier ; le cadre s'en sert.
   Preuve, 390×544, défilé en bas, champ au focus : `dernière note bas 308 ≤ champ 325`. Preuve, `?keyboard=300` : `note 308 ≤ champ 325, champ bas 504 ≤ 844−300`. Captures ouvertes : m390-clair-r27-544, m390-sombre-r27-clavier300.
5. **L4-4 : bulle G8 « exemple.test et exemple.test », et elle recouvre le tableau.** Les noms deviennent distincts dans cet ordre : nom lu, vendeur, domaine et bout de chemin, prix, sinon la place. C'est fait dans `tableau()`, donc les colonnes, les lignes et la bulle disent la même chose. Quand la bulle paraît, la vue défile de sa hauteur.
   Preuve, au banc, deux liens exemple.test collés dans Évier : bulle « … entre exemple.test/evier-2-bacs-inox et exemple.test/evier-inox-120-cuve-pro… », `distincts: true`. Preuve, Ventilation : la ligne repère était à 703 et le champ à 733 ; avec la bulle, le repère est à 595, sous le haut de la bulle (634) : `bulle sans rien recouvrir`. Vitest : 6 cas de `nomsDistincts`, plus le cas de deux articles au même domaine. Captures ouvertes : m390-clair-10b, m390-sombre-10.
6. **L4-5 : la phrase est citée sous le titre, et le titre fait 4 lignes à 390.** Rien sous le titre sur la liste quand titre = phrase. Sur le carnet, « votre phrase en titre » une fois, et seulement par le bandeau juste après la création. Titre et phrase citée tiennent en 2 lignes au plus ; « Coller un lien » reste à droite.
   Preuve : `liste titres : lignes 2 partout, cite null pour l'idée phrase = titre` ; `carnet créé : « votre phrase en titre » 1 fois`. Vitest : la phrase apparaît une fois, aucune double citation, sur la liste comme sur le carnet. Captures ouvertes : m390-clair-liste-phrase-titre-carte, et côte à côte avec p2:g05-1 dans `m390-clair-liste-cote-a-cote-g05-1.png`.

## Critères (a)
- `npx vitest run tests/unit/carnets tests/integration/carnet` : 19 fichiers, **312 tests verts**.
- `npx tsc --noEmit -p .` : sortie 0.
- `npx vite build --outDir <scratchpad>` : exit 0 (« built in 37 s »). `dist` n'est pas touché, à la demande ; `check-private-research` et `check-build-flags dist` ne sont donc pas rejoués.

Essais : Comparer 1280, 2 (734 au bord, puis page de 920 px) ; R27, 2 (le banc défile dans sa zone, pas dans la fenêtre ; le script a été corrigé) ; liste, 2 ; les autres au premier essai. Erreurs console : 0, requêtes coupées : 0.

## Doutes et limites
- **Lot voisin.** `NoteEnVrac.tsx` (lot voisin) dit maintenant « Nouveau carnet « Prochain brassin » · aucun carnet proche ». J'ai mis l'attente R18 de `carnetsEcrans.test.tsx`, qui est mon fichier, à ce mot. Pendant mon tour, `carnetsParcours` a échoué une fois (P2 : 5 carnets au lieu de 4) ; après le travail des lots voisins sur `rangement.ts`, il est vert.
- **Liste.** Sur la liste, quand titre = phrase, je n'écris rien sous le titre : à 390, la colonne de texte fait environ 115 px, et « votre phrase en titre » y ferait 2 lignes de plus. Le carnet ouvert le dit une fois.
- **Banc.** Le préfixe « ZZ TEST — » du banc allonge les titres de la liste (ils tiennent en 2 lignes, avec « … »). En vrai, sans préfixe, il reste plus de place.
- **Comparer à 1280.** La page passe de 760 à 920 px. C'est une place à l'écran, pas un habit : le figé g01-8 est un dessin mobile. Avec plus de 6 articles, le tableau défile, avec la colonne collée et le fondu.
- **R27.** La « réserve » passe par les variables publiées et les `scroll-margin`. Le banc borne la hauteur : le champ est sous la zone qui défile, si bien qu'un `padding-bottom` en plus aurait doublé l'espace. Les mesures donnent la dernière note au-dessus du champ à 544 px et avec un clavier de 300 px.
- **Captures.** Celles de 390 qui ont été ouvertes viennent de la dernière passe à 390, sauf trois : m390-clair-11b, m390-clair-10b et m390-clair-r27-544, ouvertes lors d'une passe antérieure. Leur rendu ne dépend pas des retouches qui ont suivi (en-tête de Comparer, bouton « Coller un lien ») ; les mesures de la dernière passe sont identiques.

DÉCISION À PRENDRE : aucune.

CONNAISSANCE : le banc `?preview=carnets` borne la hauteur. La zone voisine du champ défile, pas la fenêtre : `window.scrollTo` n'y fait rien. Un banc qui mesure le bas de page doit faire défiler le conteneur `overflow-y: auto` parent de `.cn-page`.

LEÇON PROPOSÉE : aucune.
