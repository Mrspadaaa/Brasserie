OK PARTIEL — rail 120′ réparé (vide, chevauchement, bandeau masqué), bandeau IBU + piste, renvois, demande S1 retirée de l'app ; « 42 % » et sources : non faits.

## Causes (mesurées, banc `?dev-local&etape=houblons`, fixture Saaz 120′ : `banc-t12d.mjs`)
- Vide sous le bandeau : sur un écran court (390 × 540 utiles), `disposerDock` réserve F px par graduation aux autres segments (D69), donc l'écart de l'ébullition tombe au minimum (1,2 px) ; au-dessus du doigt rien ne remplit la place, et la tête du rail reste accrochée au doigt : vide de 137 px (HEAD). Reproduit à 540 de haut, pas à 844.
- Chevauchement à 120′ : la carte tenue (2 lignes, « · Saaz (US) ») tombait sur la rangée « Ébullition 120′ », dessinée en dessous. Mesuré : 20 px de recouvrement.
- Bandeau resté affiché : la classe d'estompe était posée sur l'écran Houblons, hors de `.recipe-metrics` (le bandeau du wizard, t12c).

## Corrections (fichiers écrits)
- `src/ui/hopIndex/maBiere/rail.ts` : écarts d'ébullition d'au-dessus du doigt élargis (11,5 px au plus) pour remplir la place (`planFixe(…, eh)`) ; rangée nommée recouverte par la carte : fondu ; estompe aussi quand la carte monte à 4 px du haut.
- `rail.css` : `.recipe-metrics` s'estompe (opacité seule, la vue ne saute pas). `Frise.tsx` : estompe posée sur le `main` qui défile ; renvois (voir plus bas).
- `src/pages/BrewWizard.tsx` : « Changement appliqué et brouillon conservé… » passe en `sr-only` ; libellé « IBU » (plus « IBU chaud ») avec le nombre et sa piste (48 × 8 px, bande du style, repère) ; hauteur du bandeau inchangée (31 px aux étapes 2 et 3) ; `allerDepuisHoublons`.
- `EtapeHoublons.tsx` (type `bande`, prop `onAller`), `MesuresWizard.tsx` (bande), `hote.tsx` (`allerWizard`), `maBiere/index.tsx` (« dégusté le 18.10 » : la date vient de la dégustation réelle).
- Demande : `parcours/donnees.ts` (`demande`, S1 seulement par défaut maquette ; vide dès que l'app configure), `parcours/visee.ts`, `suggerer/voies.ts`, `suggerer/EcranApp.tsx` (prop `visee`), `comparer/calcul.ts`, `comparer/Feuilles.tsx`.
- Tests : `tests/unit/hopIndexV4/renvoisEtDemande.test.tsx` (nouveau, 5 tests : toucher Ébullition → Identité ; levure toucher/appui long ; sans dégustation aucune demande ; maquette garde S1) ; `ficheSuggererApp.test.tsx` adapté (visée posée).
- Contrôles : `banc-t12d.mjs` (rail + bandeau), `banc-plus.mjs` (+ de grammes, phrase, piste, renvois). Je n'ai pas touché `controle-fonctions-rail.mjs` (maquette) : le contrôle de l'app est dans la voie.

## Critères
- Rail 120′ : ECHEC sur HEAD (« vide de 137 px… ; étiquettes qui se chevauchent : Saaz (CZ)/Ébullition/20 ; bandeau reste affiché »), `RAIL-120 OK (vide max 8 px, bandeau masqué puis rendu, retour en place, moment 120′)` après ; aussi OK à 844 de haut.
- Piste d'IBU : HEAD `BANDEAU ECHEC : pas de piste d'IBU` ; après `BANDEAU OK (… hauteur 31 px)`.
- `controle-fonctions-rail.mjs` sur la maquette : `FONCTIONS-RAIL OK (37/37)`. `controle-etats.mjs` : lancé, sans sortie à la clôture (non confirmé).
- `npx vitest run tests/unit/hopIndexV4` : 14 fichiers, 159 tests verts. `tests/integration/recipeEditing.test.tsx` : 30 verts. `npm run build` : vert (exit 0). `tsc` propre.
- Captures ouvertes (390 de large, `captures-apres/844/` : `glisser200.png`, `glisser290.png`, `9-apres.png`, et `%TEMP%/t12d-plus/apres-plus-etape3.png`) : bandeau masqué pendant le glisser, pas de vide, retour en place, « IBU 84 » et sa piste après un +. Captures à 540 de haut : `%TEMP%/t12d-ap*`. Captures de l'étape 2 et du renvoi : prises par `banc-plus.mjs <dossier>`, non rouvertes.

## Le « + » qui « fait sauter »
Non reproduit : saut max 0 px (6 touchers, défilement 0, 60), même avec la page défilée. Une cause probable déjà corrigée : la ligne « Brouillon repris… » (t12c) changeait de hauteur ; la phrase « Changement appliqué… » est désormais `sr-only`. Le contrôle reste dans `banc-plus.mjs` (seuil 8 px) mais il est vert sur HEAD : il ne prouve pas la cause. À rejouer sur l'app déployée (stock réel, α de lot).

## Renvois
Faits : « Ébullition 60′ › » → Identité, champ Durée d'ébullition (`wz-boil`, valeur 120 jouée dans Chrome) ; ligne de la levure : toucher → étape Levure (jouée), appui long (450 ms) → couche `hopTiming` étape yeast (testé, pas rejoué dans Chrome).
Autres renvois possibles, non faits : whirlpool (aucune étape cible : la durée est sur la carte), fermentation et post-fermentation (étape Levure ou Paliers, à choisir), « 0′ » (rien), lien « Sans X › » (déjà actif). Eau et Paliers n'apparaissent pas dans l'étape Houblons.

## Restes de fixture
Retirés du chemin de l'app : demande S1 (floral +1, résineux −1), « Plus agrumes » de Suggérer, date « 18.10 » de la légende. Restent hors chemin app : `TERMES_S1` des hôtes maquette (comparer, dryhopper), `apercuDev.ts` (banc local), commentaires.

## Non faits (en fin de file, tours épuisés)
1. « autres 42 % » expliqué pour chaque houblon (calcul + liste des mots avec ◇, test du nombre de mots = pourcentage).
2. Sources de la fiche : vrai lien (`url` du catalogue, `target="_blank" rel="noopener"`), source sans adresse sans lien ; test BM → `url`.

DÉCISION À PRENDRE : Suggérer dans l'app n'a plus de demande (visée `{}` en dur dans `suggerer/EcranApp.tsx`) : sans visée, il ne propose rien. Options : (a) transmettre la visée posée dans Ma bière à Suggérer par la porte (recommandé, la prop `visee` est prête) ; (b) laisser le brasseur poser la visée dans Suggérer ; (c) revenir à S1 (écarté : donnée inventée). La demande ne se déduit pas d'une dégustation (elle porte des niveaux, pas un souhait).

DÉCISION À PRENDRE : le bandeau se masque quand le rail ou la carte monte jusqu'à lui (pas à chaque glisser). Si le brasseur veut « toujours masqué pendant le glisser », une ligne dans `rail.ts` (retirer la condition).

Doutes : à 120′ la carte tenue peut empiéter de 8 px sur le bandeau (il est alors masqué). `Carte.tsx` non touché. Bascule CRLF/LF : `rail.ts`, `Frise.tsx` etc. sont signalés par git (avertissement LF→CRLF), contenu inchangé hors mes lignes.

CONNAISSANCE : la durée d'ébullition longue + écran court compresse l'écart de la loupe au minimum (D69 réserve F px par graduation des autres segments) ; le vide se règle en élargissant seulement les écarts au-dessus du doigt.
LEÇON PROPOSÉE : un contrôle d'écran doit se jouer à la hauteur utile du téléphone du brasseur (≈ 540 px sous la barre du navigateur), pas à 844 : le défaut n'existait qu'à cette hauteur.
