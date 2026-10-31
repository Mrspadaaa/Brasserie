OK — ChampNombre rend le composant protégé Input ; rendu identique mesuré (écart 0 px sur 21 champs) ; audit, tsc, build verts

# p3-champ : ChampNombre sur `Input`

## Fichiers écrits
- `src/ui/identite/ChampNombre.tsx` : `<input>` brut remplacé par `<Input>` (de `src/ui/Input.tsx`, non modifié). Retirés, car `Input` les pose déjà : `autoComplete`, `autoCorrect`, `spellCheck`, `data-lpignore`, `data-1p-ignore`. Gardés : `type="text"`, `inputMode` decimal/numeric, `enterKeyHint="done"`, `aria-label/invalid/describedby`, `required`, `placeholder`, `id`, `data-*` (via `marques`), `style` de largeur au contenu, tous les gestionnaires.
- `src/ui/identite/identite.css` : les 6 sélecteurs `input.idn-champ…` deviennent `:is(input, textarea:where([data-single-line])).idn-champ…` (même spécificité) ; une règle ajoutée pour le `textarea` du Fermenteur (`.idn-fin`, hauteur fixe 32 px) : `padding-block: 3px 0`, car un textarea colle son texte en haut là où un input le centre.
- `tests/unit/identite/champNombreTactile.test.tsx` (neuf, 9 tests).
- `work/missions/2026-10-31-ecran-identite/voies/p3-champ/` : `capturer-identite.mjs` (copie de p2 + passes), `comparer-mesures.mjs`, `diff-captures.mjs`, `captures/avant`, `captures/apres`, `captures/diff`.

## Critère 1 — Input ou NumberInput
Choix : `Input`. `NumberInput` garde son propre brouillon (`useNumericDraft`), reformate à la sortie, met `enterKeyHint="next"` et ne passe ni `data-*` ni `style` ni les touches ↑ ↓ / Échap ; `ChampNombre` tient déjà son texte, ses bornes, Entrée, Échap et ↑ ↓. Comportement inchangé (les 106 tests identite le prouvent à la souris, les 9 neufs au toucher). Jamais `type="number"`.

## Critère 3 — audit et tests
- `node scripts/audit_inputs.mjs` : `INPUT PROTECTION AUDIT PASSED: 648 protected usages in 352 files`.
- `tests/unit/identite/` : 8 fichiers, 106 tests verts. `tests/integration/waterVolumeExplanation.test.tsx` : 3 tests verts. Aucun test existant modifié (les sélecteurs `textbox` convenaient déjà aux deux éléments).
- Test neuf (`matchMedia('(pointer: coarse)')` simulé) : textarea, `rows=1`, `data-single-line`, inputmode, id, `data-element`, aria-describedby/invalid, largeur `2.4ch`, `resize: none` ; sélection au focus (0–2) ; premier `mouseup` annulé, le second passe ; Entrée valide sans retour à la ligne, ne remonte pas au parent, quitte le champ ; Échap rend 24 ; ↑ ↑ ↓ = 25 ; texte illisible n'écrase rien, vider reste vide (jamais 0). Côté souris : input texte, jamais `type="number"`.

## Critère 4 — Chrome (puppeteer, serveur port 5614, fixtures)
Commande (sortie `captures/apres`, puis `captures/avant` lancée avant la modification du code) : `IDENTITE OK` aux deux, trois passes chacune : 390 souris (`(pointer: coarse)` faux, champ `INPUT`), 390 tactile (`isMobile + hasTouch`, `(pointer: coarse)` vrai, champ `TEXTAREA` après, `INPUT` avant), 1280 souris.
- Mesures (`node comparer-mesures.mjs`) : `MESURES OK (21 champs comparés)` : volume, ébullition, fermenteur ; repos, frappe du volume (« 27 » tapé), fermenteur ouvert ; 3 passes. Écart x/y/largeur/hauteur : 0,0 px partout (limite : 1 px). Police, taille, graisse, interligne, alignement, bordures identiques ; aucune barre de défilement (0 px), aucun débordement vertical ; `resize: none`.
- Pixels (`node diff-captures.mjs`, 39 captures) : 33 identiques au pixel près, dont repos, frappe du volume, ébullition 240, cave, repères, vide aux 3 passes. Six différentes :
  - `app-volume-frappe-1280` : 1 colonne de pixels = le curseur de saisie qui clignote ;
  - `app-profil-rendu-1280/-390-souris`, `app-clavier-apres-390-tactile`, `app-cuve-deborde-390-tactile` : fonds des barres (dégradé, hachures) captés en cours de transition, écart max 40/255, hors des champs (image de diff `captures/diff/` ouverte) ; deux exécutions du même code diffèrent aussi sur d'autres captures animées ;
  - `app-fermenteur-ouvert-390-tactile` : 360 px dans la boîte du champ « 30 » : la sélection (fond noir) du textarea couvre la ligne entière (24 px) là où celle de l'input ne couvre que le glyphe (19 px). Le chiffre est au même endroit (vérifié en rognant ×6, avant / après). Limite acceptée : détail natif d'un textarea, seulement pendant la sélection au focus.
- Captures ouvertes en image : `avant` et `apres` de `app-volume-frappe-390-tactile` (identiques à l'œil), `app-fermenteur-ouvert-390-tactile` avant/après (+ rognage ×6), `apres/app-fermenteur-ouvert-1280`, `diff/app-clavier-apres-390-tactile`.
- Un premier « après » montrait le « 30 » du Fermenteur 3 px trop haut au toucher : corrigé par la règle `padding-block: 3px 0` (relancé, mesures et pixels ci-dessus faits sur la version corrigée).

## Critère 5 — types, build, suite
- `npx tsc --noEmit` : sans erreur. `npm run build` : vert (« built in 21.84s »).
- `npm test -- --maxWorkers=2` en entier : **ne se termine pas dans ce poste** : un processus Vitest épuise le tas (« JavaScript heap out of memory », même à `--max-old-space-size=6144`) et la suite s'arrête sans résumé. Hors de mon périmètre ; l'échec se reproduit avec le `ChampNombre.tsx` de HEAD remis (vérifié sur la partie 2/6 de `tests/integration`, puis mon fichier restauré). Résultats obtenus par morceaux (`npm test -- --maxWorkers=2 <morceau>`, l'audit s'exécute avant chaque morceau) :
  - `tests/unit` : 521 fichiers, 520 verts ; 6 955 tests, 6 951 verts. Les 4 rouges : `tests/unit/depense/raccord/unites-enregistrement.test.ts` (R5, Stk face à un sachet). Un premier passage complet avait aussi montré des rouges dans `tests/unit/depense/raccord/ecran-lecture` et `ecran-recu`, verts au second : ce sont les fichiers en cours d'édition de la voie Dépense (`purchaseEntry.ts`, `stockLineMatching.ts`, `ExpenseSheet.tsx` modifiés dans l'arbre). Signalé, non corrigé.
  - `tests/fuzz` : 2 fichiers, 16 tests verts. `prototypes/houblons-v4/tests` : 15 fichiers, 157 tests verts.
  - `tests/integration` hors `hopV55*`, six parts (`--shard=i/6`) : parts 1, 3, 4, 5, 6 vertes (140 fichiers, 1 335 tests) ; **part 2 : mémoire épuisée** (reproduit sans ma modification).
  - `tests/integration/hopV55*` : épuisent aussi la mémoire du processus ; dans le passage complet, les 5 fichiers terminés (`PageQualifiedAdviceFullCatalogue`, `YeastRecipeChoice`, `PageAssistedAdvice`, `SemanticCompanion39`, `PageQualifiedAdviceStudy`) étaient verts avant le plantage.

## Doutes et limites
- Pas de vérification sur un vrai téléphone Android (l'audit le dit lui-même) : l'émulation Chrome tactile prouve le rendu et le comportement du textarea, pas l'absence de la barre d'accessoires.
- La sélection d'un textarea est plus haute que celle d'un input (voir ci-dessus).
- `Input` rend `inputMode="decimal"` : au toucher le clavier décimal peut ne pas offrir « , » sur certains claviers ; comportement déjà celui de l'input d'avant.

DÉCISION À PRENDRE : aucune.
CONNAISSANCE : un textarea d'une ligne (rendu tactile de `Input`) colle son texte en haut dans une hauteur fixe, un input le centre : tout champ à hauteur fixe qui passe par `Input` demande `padding-block` de (hauteur − bordures − interligne) / 2 en haut pour le textarea ; et la suite complète de ce poste épuise la mémoire (parties 2/6 d'intégration et `hopV55*`), même sur HEAD.
LEÇON PROPOSÉE : aucune.
