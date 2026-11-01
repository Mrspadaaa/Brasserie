# Brief commun : lot v0 de l'étape « Malts/sucres 2/7 » (création de recette)

**La question du lot** : comment le brasseur voit d'un coup d'œil ce que sa recette contient en malts et en sucres, et en ajoute un en un
toucher ou au clavier ?

## Lire d'abord (une fois)
- `jury-fermentescibles/fiche.md` : le cadrage. J1 à J16 sont tranchés, les hypothèses 1 à 5 s'appliquent, et **A1 à A4 sont tes axes**.
- `inventaire/inventaire-fermentescibles.md` (les blocs, les fonctions, les états) et `inventaire/captures/fermentescibles-vide-390.png` :
  c'est la **baseline**.
- **Sa langue**, ce qu'il a choisi pour l'étape 1 : `work/missions/2026-10-31-ecran-identite/v1/r4-a/etat.html`, ouvert dans Chrome, et
  `r4-et-r4a-repos.png`. Il a dit de r4 : « Est le meilleur », et de r4-a : « ça semble vraiment bien ».
- Les skills `boosters-ux`, `impeccable` et `ui-design-system`, **avant de dessiner**. Puis `.claude/rules/affinee-frontend.md`, DESIGN.md (rayons
  de 10, 16 et 24 px), `docs/ui-compacte.md`, `cerveau/brasseur/glossaire.md` et `cerveau/brasseur/pas-de-cockpit.md`.

## Obligatoire, et rien d'autre
1. **La baseline, suivie toujours**, quelles que soient la chaleur et la série : un plancher à enrichir (L07). À cocher dans ta NOTE :
   - les éléments communs, montrés tels quels (hors périmètre, J12) : l'en-tête « ‹ Fermentescibles 2/7 », import et thème ; le fil des 7 étapes,
     où « Malts/sucres » est l'étape courante ; le bandeau Grain · OG · IBU · EBC ; le pied « Retour · Suivant — Houblons » ; le + flottant ;
   - chaque acquis de J5 : la ligne (nom, moment, part, masse) ; les 5 familles ; la famille figée sur la ligne ; la masse à zéro à l'ajout ;
     le jour d'ajout en fermentation ; les avertissements du lactose et de la densité ; **le parcours au clavier**, nom, Entrée, puis masse.
2. **L'honnêteté** (J7) :
   - une couleur inconnue s'écrit « ? » ou « à renseigner », jamais 0 ;
   - l'EBC total vaut « — » tant qu'une couleur manque ;
   - le rendement de 75 % est un « repère » ;
   - rien n'est inventé.
3. **Le pouce à 390 px** et l'ordinateur à 1280 px (J1). Clavier fermé, au premier écran :
   - chaque ligne est lisible et l'ajout est visible ;
   - **80 mots au plus, aucune phrase d'aide au repos** ;
   - le stock en 0 mot (D23) ;
   - 1,05 écran au plus avec 8 grains (D5).
4. **Les interdits** :
   - le cockpit ;
   - le texte ou la légende au premier plan ;
   - « en stock » ou « stock épuisé » écrit sur les options ;
   - l'en-tête qui change ;
   - un bouton imposant ;
   - la superposition ;
   - un EBC sans teinte ;
   - un texte sous 12 px ;
   - `type="number"`.

## Indicatif
- **Les boosters UX** (`boosters-ux`) : marque chaque booster `data-booster="nom"`, puis coche B1 à B13 dans ta NOTE. B8 (les états) et B11
  (l'honnêteté) sont obligatoires dès la v0.
- **Les cas limites** (J11) : montre-en au moins deux dans l'annexe d'états de ta page, dont la recette vide.
- **La recette à montrer : la sienne**, « NEIPA Test multi-houblons ». C'est une NEIPA hazy de 30 L, avec 8 kg de grain, IBU 24, OG — et
  EBC —, telle que l'app l'affiche (lu en ligne le 31.10) :
  - Pilsner Malz (Weyermann), empâtage, 5,0 kg (63 %) ;
  - Weizenmalz hell (Weyermann), empâtage, 1,5 kg (19 %) ;
  - Haferflocken (flocons d'avoine), empâtage, 1,5 kg (19 %).
  Les trois couleurs sont **à renseigner**. Un second état montre les couleurs renseignées après le geste : Pilsner 3,5 EBC, Weizenmalz hell
  4 EBC, flocons 2 EBC, des valeurs saisies par lui. Un troisième état ajoute un sucre : dextrose, 0,4 kg, à l'ébullition.

## Ce que rend chaque concept (`work/missions/2026-10-31-ecran-fermentescibles/v0/<série><n>/`)
- `etat.html` : une page statique jouable à 390 × 844, qui tient aussi à 1280 px. Elle porte les vrais mots et les vrais chiffres. Ses classes
  sont préfixées par son id (L26), et chaque nombre se tape.
- `NOTE.md` :
  - la chaleur ;
  - les axes explorés (A1 à A4) ;
  - l'idée en une phrase ;
  - les acquis cochés et B1 à B13 cochés ;
  - ce qui tient et ce qui casse.
- Les captures du premier écran et de la page entière : `node scripts/agents/verifier-page.mjs <etat.html> --captures <dossier>`, puis **ouvertes**
  (L12). Ajoute une capture à 1280 px.
- Contrôles :
  - `node work/refonte-frontend/v4/tournoi/outils/controle-commun.mjs <dossier> --profil=sans-houblons` ;
  - `mots-premier-ecran` et `controle-contraste` avec le même profil.
  Note leur sortie ; un échec ne bloque pas la v0, mais il se dit.
- Environ 10 tours par concept. Un concept minimaliste, c'est **une seule idée, pas un écran vide** : il remplit son premier écran.

## Les séries (chacune lit la liste pour ne pas refaire les autres)
| Série | Approche | Agent |
|---|---|---|
| r | **des représentations distinctes**, dans la langue de r4-a : la masse en curseur tapable, la composition en barre, la teinte en pastille (A1, A2, A4) | concepteur (Opus) |
| z | **créative à fond** : la forme est libre, sans retenue, et la baseline reste suivie | concepteur (modèle Fable) |
| u | **libre, au brief minimal** : la baseline et la question, rien d'autre | concepteur (Opus) |

Chaque série fait **4 concepts**, tous différents et pas déclinés les uns des autres :
- **1 froide**, qui affine la baseline ;
- **1 tiède**, qui suit la forme de l'approche ;
- **2 chaudes**, de forme libre.
Le lot fait 12 concepts (D204 : « il faudra pas autant de mini maquettes et série, c'est trop demandant en quotas »).

N'écris que dans ton dossier `v0/<série>*/`. N'écris aucun code par heredoc ni par `node -e`. Pas de `git stash`, aucun commit. Rends une ligne.
