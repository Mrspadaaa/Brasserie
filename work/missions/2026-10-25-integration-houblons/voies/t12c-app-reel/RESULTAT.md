OK — IBU en plage (~) et EBC des grains calculés sur sa recette ; même haut d'écran aux 7 étapes, Abandonner dans l'en-tête.

## Cause de l'IBU « ? » (trouvée, pas supposée)
1. **IBU** : `recipeConversion.ts` `alphaDuLot` rendait `null` pour un α ≤ 0. L'app écrit `alpha: 0` pour « α non saisi » (ligne sans lot au stock). Le `null` est lu par `alphaDeAjout` comme « inconnu explicite » : il coupe le repli au stock puis à la plage variétale, que l'écran affichait pourtant (« α 3–4,5 % »). D'où « IBU de 2 ajouts incalculables », « ? IBU » par ajout. Corrigé : α absent → `undefined` (pas de `alphaLot`), donc repli stock puis plage de la variété (IBU en plage, valeur au milieu, « ~ »). Une variété hors du moteur reste « inconnu ».
2. **EBC** : `build()` écrit `colorEbc: details.colorEbc`, jamais posé. L'EBC de l'étape 2 vient de `computeBeerColor(grains)` dans le wizard seulement. Corrigé dans la conversion : `colorEbc` du brouillon, sinon `computeBeerColor` des grains (null si une couleur manque, jamais 0).
3. **Sans grain** (brouillon relevé par le pilote : `ogTarget` null, `fermentables` []) : l'OG est inconnue, donc « ? » est juste, avec la raison « densité initiale inconnue ». Ce n'était pas l'α. Testé.
4. **Écriture d'un α** : un houblon ajouté sans lot au stock s'écrit `alpha: 0` (convention de l'app, le type n'accepte pas null). Il se relit maintenant à la plage du catalogue (Nelson Sauvin α 9,6 % testé). La note de `versPatch` le dit.

## Test rouge sur HEAD, vert après
`tests/unit/hopIndexV4/etapeHoublonsRecetteReelle.test.tsx` (6 tests) + fixture écrite à la main `tests/fixtures/recetteSaazReelle.ts` (sa recette ; son brouillon sans grain ; aucune donnée réelle).
Avec `recipeConversion.ts` de HEAD : 5 échecs sur 6, par ex. « expected 'IBU de 2 ajouts incalculables' to be null », « expected 'IBU de 1 ajout incalculable' to be null ». Avec la correction : 6/6.

## Haut d'écran commun
- `BrewWizard.tsx` : `WizardStepName` à toutes les étapes (« ‹ Houblons 3/7 »), le repère « 3/7 » de T12b supprimé. Le bandeau Grain · OG · IBU · EBC du wizard s'affiche aussi à l'étape 3 (il était caché).
- Le grand bandeau IBU · OG · EBC de l'étape disparaît (`EtapeHoublonsContenu bandeau={false}` ; la maquette et l'onglet Ma bière gardent le leur). L'étape rend ses mesures par `onMesures` ; le bandeau du wizard montre l'IBU « ~7 » (plage au toucher, `title`), « — » avec raison si une donnée manque.
- « Brouillon repris sur cet appareil. » n'est plus écrit ; il reste annoncé aux lecteurs d'écran (`sr-only`). Les erreurs, messages d'événement et la confirmation « Supprimer ce brouillon ? » restent visibles. « Abandonner » : dans l'en-tête, à droite, avant l'import et le thème, compact (`text-xs`, 28 px de haut), dans un `<span>` pour échapper à la règle `.recipe-titlebar > button` (28 × 28) de recipe-wizard.css. Ordinateur (≥ 640 px) : par `actions` de PageShell.
- Drapeau éteint : inchangé (atelier V5.5, ligne « Brouillon repris » masquée aussi, voulu : « dans les 7 étapes »).

## Fichiers écrits
Possède : `src/domain/hopIndex/v4/recipeConversion.ts` (le pont du brouillon est ce fichier), `src/pages/BrewWizard.tsx`, `src/ui/hopIndex/maBiere/Base.tsx` (« ~ » dans le bandeau, `ibuIncalculable` accepte `Pick<BiereLue,'og'|'ibu'>`), `tests/fixtures/recetteSaazReelle.ts`, `tests/unit/hopIndexV4/etapeHoublonsRecetteReelle.test.tsx`, `tests/unit/hopIndexV4/etapeHoublons.test.tsx` (tests T12/T12b adaptés : plus de bandeau d'étape, en-tête), ce dossier (`explorer.mjs`, `capturer.mjs`, `captures-app/`).
**Hors Possède, dit comme demandé** (maBiere/ autre que Base.tsx) :
- `maBiere/EtapeHoublons.tsx` : prop `onMesures` + type `MesuresEtape` + `bandeau={false}` (4 lignes ; t13 y a aussi ses changements de fiche, intacts).
- `maBiere/index.tsx` : prop `bandeau` (défaut vrai) de `EtapeHoublonsContenu`.
- `maBiere/Carte.tsx` : « ~ » et plage au toucher sur l'IBU d'un ajout (1 ligne).
- `prototypes/houblons-v4/tests/conversion-recette.test.ts` : le test « α inconnu → inconnu » devient « α absent → plage de la variété ; inconnu seulement hors du moteur ».
Je n'ai pas touché à `HopToolLayer.tsx`, ni aux gestes (appui long, Comparer).

## Critères
- `npx vitest run tests/unit/hopIndexV4 prototypes/houblons-v4/tests` : 28 fichiers, 308 tests verts. `tsc --noEmit` : propre.
- `tests/integration` : recipeWizardSafety (18), brewWizardDraftFreshness (30), noloWizardApply (4), brewWizardHopV55 (6) verts. Le passage complet a montré des rouges (Page V5.5, monkey, PropertyAdvice, levure : délais de 15 s dépassés, suites lourdes) sans lien avec ces fichiers ; je ne les ai pas comparés un à un à la liste de #177 (14 rouges d'avant).
- `npm run build` : vert.
- Captures Chrome, 390 × 844 ×2, `?dev-local&etape=houblons&recette=vide`, `VITE_HOP_V4=on`, via `with_server.mjs`, **toutes ouvertes** : `captures-app/etape-2-malts.png` et `etape-3-houblons.png` (même en-tête « ‹ Fermentescibles 2/7 » / « ‹ Houblons 3/7 », Abandonner, import, thème, onglets, bandeau Grain 5 kg · OG 1,058 · IBU — / ~7 · EBC 9,5) ; `etape-3-apres-plus.png` (Saaz US 14 g après 3 clics sur + : IBU ~7 → ~9, ~6 IBU et ~3 IBU par ajout). Mesures du script : IBU 6,51 → 7,39 → 8,27 → 9,15 par cran de 2 g.
  La recette de la capture est ma fixture (5 kg de grain donne OG 1,058, EBC 9,5), pas la sienne (OG 1,047, EBC 7,9) : mes ppg diffèrent. Le brouillon du banc a été réécrit dans le contexte Chrome du test seulement.

## Suite demandée par le pilote (option b pour l'affichage, vérificateur de t12b)
- **Même IBU aux sept étapes, drapeau allumé** : le bandeau Grain · OG · IBU · EBC du wizard lit le calcul v4 (repli sur la plage de la variété, « ~7 », plage au toucher) à toutes les étapes. À l'étape 3, l'étape rend ses mesures (`onMesures`) ; aux autres, un composant sans rendu `maBiere/MesuresWizard.tsx` (nouveau, chargé à la demande) fait le même calcul avec les mêmes données (`useHopData`, `toHopRecipe` avec la DI d'ébullition du wizard). La logique du libellé vit dans `recipeConversion.ts` (`raisonIbuIncalculable`, `libelleIbu`) ; `ibuIncalculable` de Base.tsx la reprend (une seule copie ; BrewWizard n'importe plus Base).
- **Ne changent pas** : `ibuTarget` enregistré (`ibu` du wizard, `hotBitterness` : α ≤ 0 = pas de lot, donc null), la page recette, tout hors wizard. Seul l'affichage du bandeau, drapeau allumé, change. Drapeau éteint : le `ibu` d'avant.
- **Test ajouté** (`etapeHoublonsRecetteReelle.test.tsx`, 3 tests de plus) : MesuresWizard (étapes autres que Houblons) et l'étape Houblons rendent le même `ibu` sur ma fixture ; `libelleIbu` « ~N » avec « entre a et b IBU… » ; « — » avec la raison sans grain ; le wizard monte MesuresWizard hors étape 3 et lit ces mesures aux sept étapes. Chrome : bandeau « IBU ~7 » aux étapes 2 et 3 (`etape-2-malts.png`, `etape-3-houblons.png`, rejouées et ouvertes).
- **Vérificateur t12b adapté** (`t12b-finitions/verifier.mjs`) : P2 « ‹ Houblons 3/7 » (étapes 1, 3, 4) ; P3 recette vide : pas de bandeau, ni « NaN » ni « IBU 0 », plus de grand bandeau d'étape ; un houblon sans malts : bandeau du wizard « IBU — », « OG — » ; P4 : Nugget, IBU chiffré dans le bandeau du wizard (le banc n'a pas de grain, d'où « OG — » et non 1,066) ; P1 gardé. Sortie : `FINITIONS OK` (22 mesures Chrome, `--sans-tests`). Avec les tests ciblés, il dit ECHEC (2) pour deux causes hors de ma voie : `designTokens` (`fiche/Replis.tsx:168 text-cave-600`, fiche de t13) et `audit_inputs` (`comparer/Feuilles.tsx:595`, Comparer). Mes fichiers passent les deux.

## Essais, doutes, limites
- Essais : Abandonner chevauchait l'import au premier rendu (règle CSS 28 × 28) → corrigé. Le banc réécrivait mon brouillon (clé `:apercu-…`) → clé `:new` + `recette=vide`.
- Le « +2 », « −60 » (écart du total, `majIbu`) du grand bandeau disparaît avec lui. À remettre dans le bandeau du wizard si le brasseur y tient.
- L'IBU enregistré (`ibuTarget`) et la page recette gardent `hotBitterness` : un α non saisi y reste « inconnu » (null). L'écran du wizard et ce que la page recette montrera peuvent donc différer pour un α non saisi : c'est l'objet de la DÉCISION ci-dessous, option (b) étendue.
- Sans grain, « ? IBU » de l'ajout rapide pour Nelson Sauvin est juste (OG inconnue) ; la raison est au toucher.
- `t12b-finitions/verifier.mjs` (P2 « ‹ 3/7 », P3 « IBU et OG ? » dans l'étape) et le test structurel de l'étape 3 ne décrivent plus l'écran : à déclarer caducs ou à adapter par le pilote. Je n'y ai pas écrit.
- Cadre noir autour du contenu sur les captures : focus de PageShell, déjà vu à t3, non touché.

DÉCISION À PRENDRE (affichage du wizard réglé en (b) sur ordre du pilote ; reste l'enregistrement et la page recette) : l'IBU « ~7 » vient de la plage de la variété (α non saisi). Options : (a) garder (écrit « ~ », plage au toucher) ; (b) faire de même dans le bandeau des autres étapes et dans `ibuTarget` (changerait `hotBitterness`, la page recette et l'enregistrement) ; (c) inviter à saisir l'α du lot. Recommandation : (a) maintenant, (b) par un ticket, car il touche la page recette.

CONNAISSANCE : l'app écrit `alpha: 0` pour « α non saisi » ; ce 0 ne doit jamais être lu comme un α de lot (il coupe le repli à la plage variétale). L'EBC d'un brouillon (`details.colorEbc`) n'est jamais posé : il se lit des grains.

LEÇON PROPOSÉE : un contrôle d'étape doit être rejoué sur une recette « comme la sienne » (α non saisi, grains sans colorEbc au brouillon) : les fixtures à α 13 % et colorEbc 70 posés masquaient les deux causes.
