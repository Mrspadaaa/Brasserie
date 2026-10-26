OK — contour de l'original (Galaxy) dessiné au-dessus ; contrôle Chrome rouge puis vert ; audit des restes de test rendu (18 éléments)

## Cause du contour absent (D156)
Le contour de Galaxy était bien dans le DOM (gris #4d4d4d, 2,5 px, 8,4:1 sur le fond blanc, 3 à 7 sommets) : ni absent, ni de la
couleur du fond, ni confondu avec l'échelle. Il était dessiné SOUS les remplaçants (RadarBase : contours seuls d'abord). Les niveaux
des fiches n'ont que trois crans (non décrit, cité, marqué) : un remplaçant qui décrit les mêmes familles aux mêmes niveaux
(Nectaron, Tango, Harlequin…) recouvre exactement le trait et les points de l'original. Un contrôle sur le DOM passe au vert
(les premières mesures le montrent) ; seul un contrôle au pixel voit le défaut.

## Correctif (fait)
`src/ui/hopIndex/commun/RadarBase.tsx` :
- le rôle `contour` se dessine en dernier, au-dessus de la retenue et des autres ;
- trait 2,2 px (≥ 1,5) quand d'autres séries sont là ; sommets en anneaux creux r = 6,2 (la légende de Substituer montre un disque
  blanc cerclé), qui laissent voir le point plein du remplaçant au centre ;
- une série contour seule (Suggérer « ma bière seule ») garde exactement son dessin d'avant (2,5 px, points pleins).
`src/ui/hopIndex/substituer/Radar.tsx` : inchangé (le rôle `contour` y était déjà donné à l'original).
Autres radars (D156, « dis lesquels ») :
- Fiche (RadarFiche) : une seule série, pas d'original → pas concerné.
- Comparer : pas de série « original » ; la référence « ta bière » (trait noir `rb-stout`, absolu seulement) est dessinée sous les
  séries. Sur mes deux captures (Cascade/Idaho 7/Galaxy et Galaxy/Citra) elle reste visible (les séries sont au-dessus d'elle) mais
  elle serait recouverte à valeur égale : même défaut en puissance, NON corrigé (écran choisi, cmc2h ; voir DÉCISION 1).
  Ma sonde au pixel (`sonde-comparer.mjs`) donne des parts erronées (le trait noir sous un voile coloré n'est pas noir) : seules
  les captures `img/comparer-*-avant.png` font foi.
- Suggérer : même mécanisme (référence sous les séries), non corrigé, non mesuré.

## Contrôle (rouge puis vert)
`tests/integration/controle-contour-original.mjs` (Chrome, 390 × 844 puis 1280 × 800 dans la même exécution ; il n'a pas d'option
`--large`). Lit la capture au pixel : part de chaque côté de Galaxy qui garde sa couleur (70 % au moins pour un côté plein, 40 %
pour un tireté), anneau autour de chaque sommet ; plus trait ≥ 1,5 px, contraste ≥ 3:1 avec le fond et avec la grille, ≥ 3 sommets.
- Rouge sur le code de HEAD (bb0997cf ; `RadarBase.tsx` y est identique à 49907352, il n'a pas bougé depuis) : `CONTOUR ECHEC`, 390
  et 1280 : côtés « visible sur 0 % de sa longueur », 7 sommets « sans anneau (0 à 7 % des points autour) ». Capture :
  `img/radar-390-avant.png`, `img/radar-1280-avant.png` (Galaxy introuvable sous le vert et le bleu).
- Vert avec le correctif : `CONTOUR OK` (390 et 1280). Captures : `img/radar-390-apres.png`, `img/radar-1280-apres.png`.
- Test unitaire : `tests/unit/hopIndexV4/radarContourOriginal.test.tsx` (3 tests verts).
- Données mouvantes : d4 change les descripteurs en cours de voie ; Galaxy a eu 3, 4 puis 7 sommets d'une exécution à l'autre, et la
  liste des remplaçants a changé (Citra cryo n'y était plus : le contrôle prend alors le premier de la liste). Le rouge et le vert
  de la fin ont été pris sur le même état des données (j'ai remis temporairement la version HEAD de RadarBase, puis la mienne).

## Vérifications
- `npx vitest run tests/unit/hopIndexV4 tests/unit/designTokens.test.ts` : 430 verts, 1 rouge :
  `comparerComplements.test.ts:66` (`compose('beermaverick-nelson-sauvin', 'geraniol')` attendu null, rend 1–1,8 réf. NZH). Cause :
  les compléments de la voie c3/d4 (données NZ Hops, `proto-data.json` / compléments), pas mon code (je n'ai touché ni
  `substitution.ts` ni les données). À rejouer quand d4 aura fini.
- `node scripts/audit_inputs.mjs` : INPUT PROTECTION AUDIT PASSED (647 usages, 335 fichiers).
- `npm run build` : vert (« built in 20.47s »). `grep` de `dist/` : 0 fichier pour `dev-local`, `apercu-etape-houblons`, `__hopPile`.
- Dernière exécution du contrôle, après l'édition de Suggérer : `CONTOUR OK` en 390 et 1280 (comparés Harlequin et Citra ; Galaxy
  7 sommets ; côtés visibles à 100 % sauf le tireté à 56 % ; anneaux visibles à 78-82 %).
- Captures ouvertes (L12) : `img/radar-390-avant.png`, `img/radar-1280-avant.png` (Galaxy introuvable, recouvert par le vert et
  le bleu), `img/radar-390-apres.png`, `img/radar-1280-apres.png` (contour gris et anneaux nets au-dessus), `img/comparer-*-avant.png`,
  `img/texte-analyse-ma-biere.png` (écran provisoire, n° 7).
- Dryhopper n'a pas été joué dans Chrome (son ouverture exige un id d'ajout) : ses textes de capture (« jamais mesuré à ce
  moment », « levure rien ne change ici ») sont lus comme textes de sa maquette choisie, non vérifiés au rendu.

## Audit D158 : ce qui peut s'afficher sur une recette réelle
Méthode : lecture du code atteint par `hopV4` (`src/ui/hopIndex/`, `src/domain/hopIndex/v4/`), grep des imports de maquette, des
constantes de démonstration et des textes codés en dur ; puis le texte visible de Ma bière, Comparer, Substituer et Suggérer relu
en Chrome sur la recette de dev-local (`img/textes.json`, `img/texte-*.png`). Dryhopper, Levure et la fiche : lus dans le code
seulement (leur route d'ouverture exige un id d'ajout que mon banc n'a pas) ; non joués.
Les données du moteur ne fuient pas : l'app injecte son stock et sa dégustation (`configurerDonnees` dans Comparer, Suggérer, Ma
bière, Dryhopper/Substituer par `outilApp.tsx`, avant le premier calcul) ; la fixture `houblons-2026-10-17` (stock) n'est lue que
par le défaut de la maquette. `?dev-local` : `devLocalUser`, `apercuDev.ts` (Nugget 46 g, 16D) et l'ouverture de l'étape sont
derrière `import.meta.env.DEV` (éliminés du build : à confirmer par le grep de `dist/` plus bas).

| # | Fichier : ligne | Ce qu'il affiche | D'où | Verdict |
|---|---|---|---|---|
| 1 | `comparer/cas.ts:8` `VISEE` (floral +1), `comparer/index.tsx:32` `TROP` (résineux), lignes 251-255, 449-452, 588, 624 ; `comparer/hote.tsx:72` | « ta demande : plus de floral », « ta dégustation : trop de résineux », flèches ↑ floral ↓ résineux, rangée « Ta bière » avec ces deux pictos, écarts verts/orangés selon cette demande ; sans dégustation, le libellé dit « plus de floral, moins de résineux (ta demande) » | la dégustation S1 du 18.10 de la maquette, codée en dur (le moteur de l'app, lui, ne l'invente plus : `demandeCourante()` est vide) | à lui demander (touche l'écran choisi cmc2k ; le critère par défaut de Comparer en dépend) |
| 2 | `maBiere/index.tsx:137` | la puce « + floral › » (pont vers Suggérer) sur toute recette | même demande S1 | à lui demander : Suggérer répond « Aucune visée… » à cette puce |
| 3 | `dryhopper/index.tsx:31-33, 258, 350-351, 405-424` | critère ★ = gain de floral, « contre ★ : floral · résineux », « Face à ta bière » floral, baies, résineux, courbes résineux/baies/floral | même demande S1 (floral voulu, résineux « trop ») | à lui demander (même décision que 1) |
| 4 | `levure/index.tsx:67` | effets de levure sur floral, agrumes, résineux | familles fixes, pas sa demande | à lui demander (même décision) ; plausible comme choix d'affichage |
| 5 | `comparer/Feuilles.tsx:705-706` | feuille « Enchaîner » : « Citra seul », « Citra + Galaxy ensemble », « Citra 3 j, puis Idaho 7 5 j » dès qu'il a du Citra en stock | les plans x3b de sa maquette (ses notes du 20.10), noms de houblons codés (`H.galaxy`, `H.idaho7`) | à lui demander (voulu comme plan de sa maquette, mais Galaxy et Idaho 7 sont imposés, pas calculés) |
| 6 | `suggerer/index.tsx:471` | « hors 16D : … » sur une recette d'un autre style (21C) | texte de maquette, code de style fixe | RESTE DE TEST certain : CORRIGÉ (voir plus bas) |
| 7 | `HopToolLayer.tsx:88-98` `CoucheProvisoire`, atteinte par `maBiere/EtapeHoublons.tsx:49` (`biere` → `hopBeer`) | « Écran provisoire : l'outil v4 viendra ici. Moteur v4 chargé (… données du prototype, non réelles). » quand il touche « Ouvrir l'analyse de ma bière » (D121) | la couche `hopBeer` n'a pas d'écran dans la pile | inachevé récupérable : manque l'écran d'analyse de Ma bière ; pas un reste de donnée (voir DÉCISION 2) |
| 8 | `parcours/conditions.ts` `CONDITIONS` (4 g/L, 3 j, jour 2 et 7, US-05) ; `comparer/Ensemble.tsx`, `Feuilles.tsx`, `index.tsx:185-188` | « 4 g/L chacun », « dry hop : 3 j », levure US-05 quand la recette n'en a pas | règles par défaut du parcours, écrites comme telles (« Fixé pour… ») | voulu (hypothèses affichées, pas des données du brasseur) ; seule `recette.yeastId ?? US-05` (comparer/calcul.ts:318, adaptateur.ts:146, levure/index.tsx:51) suppose une levure sans le dire : à lui demander si « US-05 » doit s'écrire « supposée » |
| 9 | `comparer/calcul.ts:30-40` | couleurs fixes par houblon (Cascade, Idaho 7, Galaxy, Citra…) | palette de la maquette | voulu |
| 10 | `comparer/cas.ts:11` `H` ; `comparer/index.tsx:506` | clés de houblons nommés (Nugget, Cascade…) ; `cascade` sert à un cas particulier d'affichage | maquette | voulu (clés, pas d'affichage de donnée) ; à surveiller |
| 11 | `comparer/Huiles.tsx:15-31` | « De Saaz à X », « ← fade · Saaz » | l'étalon Saaz de sa maquette (rpz2, ses mots) ; Saaz vient du catalogue | voulu |
| 12 | `substituer/index.tsx:423-439` | variable `seulNugget`, texte `${h0.nom} seul` | nom de variable seulement ; le texte prend le nom du houblon | voulu (aucun affichage de « Nugget » codé) |
| 13 | `suggerer/voies.ts:23-25` `DEMANDE_Q2B` (floral, agrumes + S1) | demande de la maquette | seulement si `demandeCourante()` est l'objet par défaut de la maquette ; l'app le remplace par `{}` | voulu (maquette seule) |
| 14 | `domain/hopIndex/v4/profil-simule.ts:365, 383-384, 408` | source « Recette du lot 20 : stout 16D S1, Nugget 46 g à 60′ » attachée à la dose et aux jours de chaque ajout ; « Nugget compris » | texte du moteur | non affiché : aucun écran ne lit `sourceSimulee` ni les mesures réelles (grep `src/ui`) ; latent, à corriger avant d'afficher ces sources |
| 15 | `domain/hopIndex/v4/pouvoir.ts:540` | « Seule la 16D est lue face au style dans ce prototype » | moteur | non affiché (`faceAuStyle` n'est lu par aucun écran) ; latent |
| 16 | `parcours/donnees.ts:14-53`, `comparer/hote.tsx:72`, `dryhopper/hote.tsx:114` `TERMES_S1`, `DEMANDE_S1`, STOCK, CATALOGUE par défaut | stock réel du 17.10, S1, « stout 16D, 18.10 » | défaut de la maquette | voulu : remplacés par l'hôte de l'app avant tout calcul (`EcranApp`, `outilApp`, `EtapeHoublons`) ; surveillé : un nouvel écran qui oublierait `configurerDonnees` afficherait le stock du 17.10 |
| 17 | `App.tsx:108-135, 453-470`, `maBiere/apercuDev.ts` | compte dev-local, recette « Stout export 16D, Nugget 46 g à 60′, α du lot 13 % » | fixture de développement | voulu, hors production (`import.meta.env.DEV`) |
| 18 | texte de dev-local de Ma bière : « Wild Wolf α 8,3 % 10 g +3 IBU » | un ajout de 10 g à 10′ | proposition du moteur sur le catalogue (`Ajouter.tsx`), pas dans le code | voulu (catalogue) |

Corrigé (reste de test certain) : n° 6, `suggerer/index.tsx` + `suggerer/bulle.tsx` (nouveau `useCodeStyle`, lit le code du style
du fournisseur existant) : « hors 21C » sur une 21C ; hors fournisseur : « hors familles » ; la maquette garde « hors 16D ».
Rien d'autre n'est corrigé : les n° 1 à 5, 7 et 8 dépendent d'un choix de lui.

## Ce qui reste
- Le n° 7 est confirmé en Chrome (`img/texte-analyse-ma-biere.png` : « Écran provisoire : l'outil v4 viendra ici… données du
  prototype, non réelles. Recette apercu-etape-houblons »).
- Le test `comparerComplements.test.ts:66` rouge vient de `src/data/hopV4/proto-data.json` / `build-data.mjs` modifiés par d4
  (non commité), pas de ma voie ; je n'y ai pas touché. `substitution.ts` (e2) : aucun de mes tests n'en dépend.
- Dryhopper, Levure, fiche : audit par le code seulement.
- Je n'ai pas retrouvé dans ses captures un texte propre à une maquette qui s'afficherait avec ses données réelles ailleurs que
  les n° 1 à 4 et 7 (« floral ? », « baies ? », « résineux ? » du Dryhopper = n° 3 ; « Levure rien ne change ici » = texte
  de la maquette choisie, voulu).

DÉCISION À PRENDRE 1 : la demande « plus de floral, moins de résineux » (S1, 18.10) est codée en dur comme critère de Comparer,
Dryhopper, Levure et comme puce « + floral » de Ma bière, sur toute recette. Options : (a) la lire de sa visée ou de sa
dégustation (`demandeCourante()` / `lireVisee()`), sans demande : pas de flèche, pas de rangée « Ta bière », critère
neutre ; (b) la garder comme défaut assumé et l'écrire « exemple » ; (c) la laisser. Recommandation : (a), en conservant le
dessin de sa maquette quand la demande existe ; c'est un choix sur ses écrans choisis, donc à lui montrer en mini maquettes.
DÉCISION À PRENDRE 2 : « Ouvrir l'analyse de ma bière » mène à l'écran provisoire. Options : brancher l'écran Ma bière
(onglet analyse) dans la pile ; ou, en attendant, ne pas ouvrir la couche. Recommandation : le brancher (voie à ouvrir).
DÉCISION À PRENDRE 3 : le trait de référence « ta bière » de Comparer (et de Suggérer) est sous les séries ; au-dessus, il
resterait visible à valeur égale. Recommandation : le monter comme le contour de l'original, après lui avoir montré le rendu.
CONNAISSANCE : aucune
LEÇON PROPOSÉE : un contrôle de visibilité se fait sur la capture, pas dans le DOM : le contour de Galaxy était présent, de bon
contraste, et recouvert par un autre trait. Une échelle à trois crans fait coïncider souvent deux houblons.
