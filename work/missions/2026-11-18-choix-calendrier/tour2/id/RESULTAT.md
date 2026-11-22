OK — ID-TROP-AMBIGU : cuve nommée, eau ajoutée choisie et calculée, renvoi vers Eau (4/4)

Lot id, tour 2. Arbre `port-carnet`, branche claude/port-carnet-1711 (HEAD 6055c5e82). Rien n'est commité, poussé ni déployé.

## Fichiers écrits (port-carnet)
- Étape Identité : `src/ui/identite/regles.ts` (`remedesCuve`), `src/ui/identite/CarteVolume.tsx`, `src/ui/identite/identite.css`, et le branchement dans `src/pages/BrewWizard.tsx` (hunks Identité et plan d'eau seulement).
- Chaîne de calcul, indispensable au point 3 : `src/services/brewingMath.ts` (option `topUpToKettle` et `topUpL` dans le plan, scaleRecipe), `src/types/brewSystem.ts` (`installation.kettleTopUp`, `installation.topUpL`), `src/domain/brewDay.ts` (densité avant ébullition), `src/domain/recipeInstallation.ts`, `src/domain/adaptRecipeEquipment.ts`, `src/services/brewTimer.ts` (ce que lit le jour de brassage).
- Tests : `tests/unit/identite/cuveTropPetite.test.tsx` (nouveau, 11 tests). `cartes.test.tsx` et `correctifs.test.tsx` attendaient le libellé refusé, « de trop » : ils sont mis à jour.

## n° → fait → preuve
1. **Calcul vérifié** → 29 L et 130 min donnent ~6,5 L évaporés et 38,7 L à chaud avant ébullition, pour une cuve utile de 35 L. Avec 60 min d'ébullition de moins, il faut 3 L de moût de moins au départ (35,7 L).
   - Preuve : test « le calcul du cas de la capture » (matériel practicalEquipment, fond de cuve 1,5 L, 70 g de houblon en cuve). Il passait déjà avant le changement : le calcul était juste, seul le libellé trompait.
2. **Le message nomme la cuve** → la ligne affiche `Cuve trop petite : 38,7 L pour 35 L` (role=alert) à la place de « +3,7 L de trop ». Une ligne dit la cause : « 130 min d'ébullition évaporent ~6,5 L : plus elle dure, plus il faut de moût au départ. »
   - Test : il échouait avant (8 tests sur 10 du nouveau fichier en échec).
   - Banc : `debordement = "Cuve trop petite : 38,6 L pour 35 L"` sur la fixture `recette=identite`, dont le grain est simulé (d'où 38,6 et non 38,7).
3. **Remède mis en avant et chiffré** → un bouton « Ajouter 3,7 L d'eau pendant ou après l'ébullition ». Deux liens chiffrés suivent : « ou ébullition 55 min », « ou 25 L ».
   - Une fois choisi, le plan d'eau retire cette eau de l'empâtage et du rinçage. Le moût d'avant ébullition tombe à ≤ 35 L, et le volume final reste 29 L.
   - La densité avant ébullition compte l'eau ajoutée : les points de densité sont conservés jusqu'au volume final. L'OG ne change pas, puisqu'elle est calculée sur le volume final.
   - Le jour de brassage dit : « Puis ajouter X L d'eau… ».
   - Une fois choisie, l'alerte disparaît. La carte affiche « +3,6 L d'eau pendant ou après l'ébullition · Retirer ».
   - Preuves (tests) : `topUpL = 3.7` ; preBoilHotL ≤ 35 ; mash + sparge baisse de 3,7 L ; bilan de volume final ≈ 29 L ; densité attendue égale à `1 + 0,06 × (avant − évap + T/0,96) / avant` ; l'étape Eau ne dit plus « Il manque ».
   - Preuve au banc : avant ébullition `~34,8 L` après le choix.
4. **Renvoi** → « Eau / grain et rinçage › » ouvre l'étape Eau et met le focus sur le curseur Eau / grain (`#w-mash-ratio`), ou sur l'interrupteur Rinçage s'il n'y a pas de rinçage.
   - Test : `onVersEau` appelé.
   - Banc : `RENVOI {"id":"w-mash-ratio","label":"Épaisseur de maische","etape":"Eau","manque":false}` à 390, 844 et 1280.

## Contrôles
- `npx tsc --noEmit -p .` : aucune erreur.
- vitest : 30 fichiers et 410 tests verts. Le lot couvre identite/*, brewWaterPlanning, brewingMath, brewingMathStandards, brewDay, brewTimer, brewDayCalculs, brewV1Verite, et les tests wizard, adapt, scale et installation.
- Banc : vite sur le port 5604 (Firebase factice, WebSocket HMR coupé, car d'autres lots écrivent dans l'arbre), puppeteer-core et Chrome. Tailles 390×660 tactile (thèmes clair et cave), 844×340 tactile et 1280×800 (thème cave). Aucune erreur de page, pas de débordement horizontal. Serveur arrêté.
- Captures ouvertes, dans le dossier de ce RESULTAT :
  - `m390-clair-deborde.png`
  - `m390-sombre-eau-ajoutee.png`
  - `p844-clair-eau-ajoutee.png`
  - `d1280-sombre-deborde.png`
  - `m390-clair-renvoi-eau.png` (la première version montrait « Il manque 3,6 L d'eau » à l'étape Eau : corrigé, la valeur suggérée de l'étape Eau passe l'option ; capture refaite et ouverte)
- Essais : 1 par critère, plus 1 correctif trouvé au banc (l'étape Eau).

## Reste, doutes et limites
- La quantité affichée est le dépassement lu (3,7 L), en eau froide. En toute rigueur, 3,6 L suffiraient (3,7 × 0,96). On a gardé 3,7 L pour la cohérence avec « 38,7 pour 35 ». Le moût tient toujours (34,8 L).
- Avec une répartition d'eau saisie à la main (`volumesEdited`), l'eau ajoutée garde sa dernière valeur. La choisir remet les volumes au calcul, comme l'interrupteur Rinçage le fait déjà.
- Les appels à `waterVolumes` de `brewerRecipeRefresh`, `brewerTools` et `brewSystemInsights` ne passent pas l'option. Ils servent à des lectures et des conseils, pas au plan enregistré : à revoir si l'un d'eux réécrit le plan.
- À 844×340, la barre « Suivant » fixe couvre le bas de la carte tant qu'on n'a pas défilé. Le lien reste joignable en défilant (mesuré : `elementFromPoint` atteint le lien).
- Le registre `ecrans.json` n'a pas été rouvert. La maquette r4-a est gardée : barre de cuve, ligne « cuve 35 L », pièces de la carte. Seul le libellé de droite change, et un bloc de remède s'ajoute sous la ligne de la cuve, seulement quand elle déborde.
- Rien n'est vérifié en ligne (local, non déployé).

DÉCISION À PRENDRE : eau à ajouter, 3,7 L (le dépassement lu, cohérent avec le message) ou 3,6 L (le minimum exact en eau froide) ? Je recommande 3,7 L : c'est plus simple à lire, l'écart de 0,1 L est sous la précision d'un relevé, et le moût tient toujours.

CONNAISSANCE : le plan d'eau est linéaire. 1 L de moins en fermenteur retire 1/(1 − rétraction) L à chaud avant ébullition ; 1 min d'ébullition de moins retire le débit d'évaporation divisé par 60. L'eau ajoutée après ébullition (T froids) retire T/(1 − rétraction) L à chaud.
LEÇON PROPOSÉE : un banc Vite dans un arbre où d'autres lots écrivent recharge la page en plein geste (« Execution context was destroyed »). Couper le WebSocket HMR par `evaluateOnNewDocument`, ou servir depuis une copie (L17).
