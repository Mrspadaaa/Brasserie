OK (5 sur 6) — C46-1, 2, 3, 4, 6 corrigés en local d0bb1e71a ; C46-5 hors de mon Possède, reste ouvert (décision ci-dessous)

## Plan (causes lues dans le code, avant correction)
- C46-1 (B) : `carnets.css:64` pose la couleur de la puce pressée sur la puce, mais le `<span class="cn-mut">` de « · budget » garde `color: var(--c-mut)` (`carnets.css:21`) : gris sur vert foncé. Correctif : `.cn-puce[aria-pressed=true] .cn-mut { color: inherit }`.
- C46-2 (m) : `carnets.css:684` coupait la ligne citée sur une seule ligne (nowrap + ellipse) et `recherche.ts:extrait` mettait le mot à 24 signes du début : à 390 px le mot passait sous l'ellipse. Correctif : `extrait` rogne sur des espaces (AVANT 18, LONGUEUR 60) ; `.cnd-cite` repasse sur deux lignes (`domaines.css` prévoyait déjà `line-clamp: 2`).
- C46-3 (m) : l'avis du geste « Au calendrier » vit dans `viser` (App.tsx:1017, état gardé) ; `CalendrierTab.tsx:~634` le redisait à chaque remontage du Calendrier (retour du Carnet après Choisir) avec le montant d'avant. Correctif : `avisADire(v.at)` (`src/domain/carnets/avisCalendrier.ts`) : un avis ne se dit qu'une fois par geste ; la sélection de la chose reste.
- C46-4 (D) : `RubriqueQuand.tsx` écrivait « estimé » après tout prix. Correctif : `prix.choisi` (`prixChoisi.ts`, posé par `ecransCarnet.tsx`) : prix de l'article choisi en francs = « 79,95 CHF » seul.
- C46-6 (D) : `lecture.ts` ajoute une ligne « Rangement » pendant la lecture (7), retirée à la fin (6). Correctif : `compterEtapes` ne compte pas le rangement (six étapes de lecture, D448), la barre n'en dessine pas ; la ligne reste dans la liste.

## Fichiers écrits
src/domain/carnets/{avisCalendrier,prixChoisi}.ts (neufs), recherche.ts, lecture.ts ; src/ui/carnets/{carnets.css, RubriqueQuand.tsx, ecransCarnet.tsx, carnetOuvertTypes.ts, LectureLien.tsx} ; src/components/tabs/CalendrierTab.tsx (2 lignes : le fichier de l'avis du Calendrier, hors cadre et entete) ; tests/unit/carnetsC46.test.tsx (neuf) ; tests/unit/carnetsFix30Ecran.test.tsx (1 attente : « Lecture · 6 sur 7 » devient « 6 sur 6 », c'était la règle rejetée) ; lignes C46 de BUGS.md.

## Preuves
- Tests rouges LANCÉS sur le code d'avant : 8 échecs sur 8 dans carnetsC46.test.tsx (CSS budget, CSS deux lignes, extrait fin ≤ 34 (37 avant), avisADire absent, CalendrierTab sans avisADire, prixChoisi absent, rendu « estimé » encore dit, total 7 ≠ 6).
- Après correction : `npx vitest run tests/unit/carnets <fichiers qui touchent CalendrierTab/LectureLien/RubriqueQuand/ListeCarnets/recherche/lecture>` : 47 fichiers, 747 tests verts. `tests/unit/proprietes` : 8 fichiers, 76 verts.
- `npx tsc --noEmit -p .` : 2 erreurs, les deux connues (seedData GanttTask, virtual:pwa-register).
- `node scripts/agents/controle-bugs.mjs` : BUGS OK : 2209 bugs, 511 ouverts.
- Pas de capture locale (consigne de la voie) : preuve en ligne par le pilote et le critique (390 px : Frigo + congel › Quand › Prix ; recherche « frigorifique » ; Au calendrier puis Choisir puis retour ; lecture d'un lien).

## DÉCISION À PRENDRE (C46-5, resté « ouvert »)
Le chiffre arrondi vient de fichiers que ma voie ne possède pas : À venir écrit `chf0` (francs entiers) dans `src/ui/finance/UpgradeWorkspace.tsx` (lignes 74-75 hero, 166 `chf0`, 409, 417, 430 ligne de liste) ; la frise et « Achats » arrondissent dans `src/ui/calendrier/entete/Courbe.tsx` (`chf` → `francs`) et la caisse. Le Carnet et la carte du Calendrier disent 79,95 (`prixTexte`, `montant`). Je n'ai pas arrondi le prix de l'article (jamais inventer ni perdre les centimes).
Options : (a) recommandée : montrer les centimes dès qu'il y en a (`79,95`, comme `prixTexte` de comparer.ts : « deux décimales dès qu'il y en a ») dans `chf0` d'UpgradeWorkspace et la frise/Achats ; (b) arrondir le Carnet aussi (« 80 »), à écarter : le prix lu sur la page s'affiche faux. À confier à la voie qui possède src/ui/finance et l'en-tête du Calendrier.

## Doutes et limites
- Rangement : pendant que l'IA range, l'en-tête dit « Lecture · 6 sur 6 » et la ligne « Rangement · l'IA range l'article » reste en cours dessous : le « 6 sur 6 muet » de T30-10 est évité par la ligne, pas par le compte.
- C46-3 : le Calendrier ne redit plus l'avis au retour, mais le montant de la carte est la source du prix ; seul l'avis (message + Annuler) part. La sélection de la chose reste à l'arrivée.
- C46-2 : la ligne citée est une cible de 2 lignes (≈ 45 signes chacune à 390 px) ; mesuré seulement par règle CSS + position du mot (fin ≤ 34 sur la ligne de la capture), à vérifier en ligne.
- C46-4 : le mot « estimé » disparaît seulement quand le prix du carnet égale celui de l'article choisi en francs ; autre devise ou prix modifié à la main : « estimé » reste.

CONNAISSANCE : aucune
LEÇON PROPOSÉE : aucune (un test existant codifiait le défaut, « Lecture · 6 sur 7 » : un test qui fige un compte à l'écran se relit à chaque règle de compte)
