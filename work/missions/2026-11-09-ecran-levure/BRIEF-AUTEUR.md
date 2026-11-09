# Brief commun : lot v0 de l'étape « Levure 4/7 » (création de recette)

**La question du lot** : comment le brasseur voit d'un coup d'œil la levure de sa recette et sa dose, et en change en un toucher ?

## Lire d'abord (une fois)
- `jury-levure/fiche.md` : le cadrage. J2 à J16 sont tranchés, les hypothèses 1 à 4 s'appliquent, et **A1 à A4 sont tes axes**.
- `inventaire/inventaire-levure.md` et `inventaire/captures/levure-choisie-390.png` et `levure-vide-390.png` : c'est la **baseline**.
- **Sa langue**, choisie aux étapes 1 et 2 :
  - `inventaire/captures/reference-malts-p6-b2-sucre-apres.png` ;
  - `work/missions/2026-10-31-ecran-fermentescibles/v7/s1/etat.html`, ouvert dans Chrome : son choix s1 sur p6-b2 ;
  - `work/missions/2026-10-31-ecran-identite/v1/r4-a/etat.html`.
- Les skills `boosters-ux`, `impeccable` et `ui-design-system`, **avant de dessiner**. Puis `.claude/rules/affinee-frontend.md`, DESIGN.md,
  `docs/ui-compacte.md`, `cerveau/brasseur/glossaire.md` et `cerveau/brasseur/pas-de-cockpit.md`.

## Obligatoire, et rien d'autre
1. **La baseline, suivie toujours** : un plancher à enrichir (L07).
   - Les éléments communs, montrés tels quels : l'en-tête « ‹ Levure 4/7 », import et thème ; le fil des 7 étapes, où Levure est l'étape
     courante ; le bandeau Grain · OG · IBU · EBC ; le pied « Retour · Suivant — Paliers » ; le + flottant.
   - Les acquis J5 : le catalogue, la saisie hors catalogue, la fiche corrigeable, Comparer et le produit exact, à un toucher au plus.
2. **L'honnêteté** (J7, hypothèse 2) : seulement les valeurs de la fiche et de l'hypothèse 2.
   - La dose en plage de sachets, jamais un nombre exact inventé.
   - FG et alcool en plage.
   - La floculation « à renseigner ».
   - La biotransformation « non documentée ».
   - Tout en français : jamais « Low », « Medium » ni « esters » en anglais.
3. **Le pouce à 390 px** et l'ordinateur à 1280 px. Au premier écran, clavier fermé :
   - la levure, sa dose et l'accès au changement sont visibles ;
   - **80 mots au plus, aucune phrase d'aide au repos** ;
   - aucun prix, aucune offre, aucun « Brouillon » au repos ;
   - le stock en 0 mot (une icône).
4. **Les interdits** : le cockpit ; le texte ou la légende au premier plan ; l'en-tête qui change ; un bouton imposant ; la superposition ;
   un texte sous 12 px ; `type="number"` ; un picto sans nom visible (D81).

## Indicatif
- Les boosters UX : marque chaque booster `data-booster="nom"`, puis coche B1 à B13 dans ta NOTE. B8 (les états) et B11 (l'honnêteté) dès la v0.
- Les états à mettre en annexe de ta page (deux au moins) :
  - **pas de levure** (obligatoire) ;
  - le produit exact non choisi (« choisis le sachet pour la dose », hypothèse 3) ;
  - deux levures (relais) ;
  - une levure liquide ;
  - hors catalogue.

## Ce que rend chaque concept (`work/missions/2026-11-09-ecran-levure/v0/<série><n>/`)
- `etat.html` : une page statique jouable à 390 × 844, qui tient aussi à 1280 px. Elle porte les vrais mots et les vrais chiffres. Ses classes
  sont préfixées par son id (L26), et chaque nombre se tape.
- `NOTE.md` : la chaleur, les axes explorés, l'idée en une phrase, les acquis et B1 à B13 cochés, ce qui tient et ce qui casse.
- Les captures du premier écran et de la page entière : `node scripts/agents/verifier-page.mjs <etat.html> --captures <dossier>`, puis une
  capture à 1280 px. **Ouvre-les** (L12).
- Contrôle : `node work/refonte-frontend/v4/tournoi/outils/controle-commun.mjs <dossier> --profil=sans-houblons`. Note sa sortie ; un échec ne
  bloque pas la v0, mais il se dit.
- Environ 10 tours par concept. Un concept minimaliste, c'est **une seule idée, pas un écran vide**.

## Les séries (chacune lit la liste pour ne pas refaire les autres)
| Série | Approche | Agent |
|---|---|---|
| r | **des représentations distinctes**, dans la langue de p6-b2 : la dose en sachets, la plage du fabricant en jauge, les repères en pastilles (A1, A2, A4) | concepteur (Opus) |
| z | **créative à fond** : la forme est libre, sans retenue, et la baseline reste suivie | concepteur (Fable) |
| u | **libre, au brief minimal** : la baseline et la question, rien d'autre | concepteur (Opus) |

Chaque série fait **4 concepts**, tous différents :
- **1 froid**, qui affine la baseline ;
- **1 tiède**, qui suit l'approche de la série ;
- **2 chauds**, de forme libre.

Le lot fait 12 concepts (D204).

N'écris que dans `v0/<série>*/`. N'écris aucun code par heredoc ni par `node -e`. Pas de `git stash`, aucun commit. Rends une ligne.
