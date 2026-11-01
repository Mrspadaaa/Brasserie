# Brief commun — lot v0 de l'écran « Identité 1/7 » (création de recette)

**La question du lot** : comment le brasseur dit, d'un coup d'œil et d'un pouce, quelle bière, combien et comment, avant les ingrédients ?

## Lire d'abord (une fois)
- `MISSION.md` et sa capture de production `brasseur-identite-avant.jpg` : c'est la **baseline**.
- `cadrage-jury.md` : le cadrage du jury. Ses points J1 à J16 sont tranchés ; ses axes A1 à A6 sont **tes axes de variantes**.
- `inventaire-identite.md`, s'il est là : les blocs, les fichiers, les données et les états de l'écran.
- Les skills `boosters-ux`, `impeccable` et `ui-design-system`, à charger **avant de dessiner**. Puis `.claude/rules/affinee-frontend.md`,
  DESIGN.md et `docs/ui-compacte.md`, puis `cerveau/brasseur/glossaire.md` et `cerveau/brasseur/pas-de-cockpit.md`.
- L'étape Houblons, pour sa langue : pastilles, couleurs, contrôles, carte. J3 : « comme houblons » veut dire dans sa langue, pas seulement
  par sa méthode. Ouvre `work/missions/2026-10-25-integration-houblons/voies/m6-suggerer-moment/img/m1m2.png` et
  `work/missions/2026-10-25-integration-houblons/voies/m9-dipa-listes/img/agrumes-c.png`.

## Obligatoire, et rien d'autre
1. **La baseline, suivie toujours**, chaleur et série comprises. C'est un plancher à enrichir (L07). Ses acquis sont à cocher dans ta
   NOTE :
   - l'en-tête commun : ‹, « Identité 1/7 », Abandonner, l'icône d'import, le thème ;
   - le fil des 7 étapes ;
   - le bandeau Grain · OG · IBU · EBC.
   Ces trois éléments sont communs aux 7 étapes et **hors périmètre** (J12) : montre-les tels quels, ne les redessine pas.
2. **L'honnêteté des données** (J7) : rien d'inventé. L'évaporation de repli (10 %/h) et le repère de 20 % d'espace libre sont dits
   comme des estimations, jamais comme des mesures. L'inconnu n'est jamais 0.
3. **Le pouce à 390 px**, d'une main (J1). Clavier fermé, le premier écran montre le nom, le style, le volume, l'ébullition, NOLO et
   l'état du fermenteur (J4, J10) : **80 mots au plus, et aucune phrase explicative au repos**.
4. **Les interdits** :
   - pas de cockpit ;
   - pas de texte ni de légende au premier plan ;
   - pas d'en-tête qui change (D119) ;
   - pas de badge « 16D hypothèse » (D116) ;
   - pas de bouton imposant (C089) ;
   - pas de superposition (D164) ;
   - aucun texte sous 12 px ;
   - jamais de `type="number"` ([[saisie-mobile]]).
5. **La question de l'outil** : quelle bière, combien, comment. Le nom peut venir après (J2).

## Indicatif
- Les mots : « Objectif NOLO », « Choix pour ce brassin », « Repère provisoire » et « Matériel du plan » ne sont pas les siens (J8). Les
  libellés sont libres, courts, dans sa langue (glossaire).
- **Les boosters UX** (`boosters-ux`) :
  - marque chaque booster `data-booster="nom"` ;
  - coche B1 à B13 dans ta NOTE, avec le gabarit du skill ;
  - recopie les mesures, sans chercher à les faire passer en v0 ;
  - B8 (états) et B11 (honnêteté) sont obligatoires dès la v0.
- Les cas limites, à tenir (J11) : une recette neuve (bandeau vide), une recette collée, un style hors liste ou créé, un fermenteur trop
  petit, NOLO coché.
- La recette de démonstration : la sienne, « neipa v3 », Double IPA, 24 L, 60 min, OG 1,080, IBU ~93, EBC 9,5, cuve Royal Catering
  45 L, fermenteur 30 L.

## Ce que rend chaque concept (`work/missions/2026-10-31-ecran-identite/v0/<série><n>/`)
- `etat.html` : une page statique à 390 × 844, avec les vrais mots et les vrais chiffres, et ses classes préfixées par son id (L26).
- `NOTE.md` :
  - la chaleur (froide, tiède ou chaude) ;
  - l'axe ou les axes explorés (A1 à A6) ;
  - l'idée en une phrase ;
  - les acquis de la baseline cochés ;
  - B1 à B13 cochés ;
  - ce qui tient et ce qui casse.
- Les captures du premier écran et de la page entière, faites par `node scripts/agents/verifier-page.mjs <etat.html> --captures <dossier>`,
  et **ouvertes** (L12).
- Environ 10 tours par concept. Un concept minimaliste, c'est **une seule idée, pas un écran vide** : il remplit son premier écran.

## Les séries (chacune lit la liste pour ne pas refaire les autres)
| Série | Approche | Agent |
|---|---|---|
| g | **le geste d'abord** : « quelle bière, combien, comment », d'un pouce | concepteur (Opus) |
| w | **la réponse d'abord** : la bière, résumée en une carte ou une phrase, éditable sur place | concepteur (Opus) |
| v | **les vraies valeurs d'abord** : les repères du style, les plages et la recette dessus (A3) | concepteur (Opus) |
| r | **des représentations distinctes** : jauge de fermenteur, curseurs, puces, interrupteurs (A2, A4, A5) | concepteur (Opus) |
| e | **l'échelle du matériel** : cuve et fermenteur, volumes, évaporation, espace libre, dessinés | concepteur (Opus) |
| i | **l'entrée** : partir d'une recette collée ou d'un style, une recette neuve contre une reprise (A6) | concepteur (Opus) |
| z | **créative à fond** : la forme libre, sans retenue sur la forme, la baseline suivie | concepteur (modèle Fable) |
| u | **libre, au brief minimal** : la baseline et la question, rien d'autre | concepteur (Opus) |

Chaque série fait **6 concepts**, 4 au moins, toutes différentes et pas déclinées les unes des autres, dans les trois chaleurs : 2
froides, 2 tièdes, 2 chaudes. Le lot vise 48 concepts au moins.
- Une variante **froide** affine la baseline.
- Une variante **tiède** suit la forme de l'approche.
- Une variante **chaude** a une forme libre.
