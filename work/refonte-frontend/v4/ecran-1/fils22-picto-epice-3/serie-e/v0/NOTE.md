# Picto « épicé », série E, v0 : l'épice entière, au trait

Voie r4d-e-metaphore (mission 2026-10-22-reprise-lot21), concepteur Opus. Chaleur : **tiède** pour les
huit (la forme de l'approche E : l'épice vue entière, de face, de profil ou de trois quarts, avec le détail
qui la nomme). Baseline suivie sans écart : viewBox 24, trait `#7a4e3a` de 2,571, bouts ronds, sans
remplissage ni halo (D88), rien sous 12 px (D60), classes préfixées `re-` (L26). Trois genres (de face,
de profil, trois quarts), huit épices réelles, aucune de la série A (cannelle, vanille, girofle, gingembre,
cardamome).

Régénérer : `node generer.mjs` (écrit `etat.html`), puis `node capturer.mjs` (`captures/planche-390.png`,
`tailles-390.png`, `cartes-390.png`, densité 2). Dessins : `dessins.mjs`. Outil de travail :
`captures/travail/loupe.mjs` rend chaque dessin en vrais pixels (densité 1) à 12, 16 et 24 px entre la
feuille et les brins, agrandi ×4 sans lissage (`ESSAIS=1` pour les essais de `essais.mjs`).

## Ce que montre chaque bloc
1. En tête, le « rayon » : les huit à 24 px, chacun avec le nom de son épice.
2. Le picto seul à 12, 16 et 24 px ; à droite, l'épreuve : feuille d'Herbacé, l'épicé, brins de Végétal,
   à 16 puis 12 px (l'épicé pris entre les deux, là où il se confond).
3. Trois vraies cartes : **Saaz** (l'épicé entre la feuille et les brins), **Cascade**, **Perle**
   (l'épicé en dernier, après Terreux). α : Beer Maverick (`proto-data.json`). Familles : Saaz, fiches du
   prototype (épicé « marqué » chez Hopsteiner) ; Cascade et Perle, tags Beer Maverick. Rôle : Cascade,
   Crosby Hops ; Saaz et Perle déduits de l'α, marqués « ≈ ».

## Propositions

| Id | Épice | Genre | Ce qu'il dit à un brasseur | Risque de confusion |
| --- | --- | --- | --- | --- |
| e1-badiane | badiane | de face | Huit barques bombées à pointe nette autour d'un cœur creux : l'anis étoilé du sachet | « étoile », « flocon » à 12 px ; « fleur » si on ne compte pas les pointes. Dessin neuf : carpelles bombés, pas l'étoile à angles vifs et point central de r4 |
| e2-muscade | muscade | trois quarts | La noix ovale tenue par les lanières du macis | « œuf » à 12 px ; « œuf et arbre » à 24 px |
| e3-anis-vert | anis vert | de profil | La graine en poire, côtelée, et la boucle de son pédoncule | « goutte », « graine » sans plus |
| e4-reglisse | réglisse | de profil | La racine coupée, son nœud, le bout mâché effiloché | « pinceau », « poireau » à 12 px |
| e5-genievre | genièvre | trois quarts | La baie, son étoile à trois branches, le rameau aux aiguilles par trois | « radis », signe « ♂ » à 12 px |
| e6-carvi | carvi | de profil | La graine en croissant, effilée, une côte sur le dos | « corne », « banane » ; épice peu connue |
| e7-coriandre | coriandre | trois quarts | La graine ronde côtelée, la couronne du calice au sommet | « grenade », « oignon » ; sans couronne, le poivre refusé |
| e8-tonka | tonka | de profil | La fève longue, fripée, ses rides en travers | « chips », « pain » à 12 px |

**Lecture à voix haute sur la capture à 12 px** (tailles-390.png et loupe) : e1 « badiane » sans
hésiter. e4 « bâton… réglisse » et e7 « coriandre » avec hésitation, sûrs à 16 et 24 px. e2, e3, e5, e6
et e8 : j'hésite, ils sont ratés à 12 px selon la règle de la voie ; je les montre quand même parce que
la série doit couvrir son angle, et chacun a été redessiné de trois à six fois (ci-dessous). Ce que la
série apprend : parmi les épices entières hors série A, seule la badiane a une silhouette qui se nomme
seule ; les graines (anis, carvi, tonka) et les fruits ronds (muscade, genièvre) tombent sur une forme
générique (goutte, croissant, ovale, rond) dès que le trait de 2,571 bouche le détail.

## Écartés en route (dessinés, regardés en loupe, refusés par moi)
- Badiane : carpelles en lentilles fines (étoile pleine, « tache »), lobes ronds (« fleur », « soleil »),
  vue de trois quarts écrasée (« couronne »), graines en points dans les carpelles (« trou »).
- Muscade : noix rayée (« œuf de Pâques »), noix couchée en macis (« ballon »), fruit fendu en anneaux
  (« bouée », « œil »), fruit ouvert (« escargot »), noix et moitié marbrée (« grains de café », un arôme
  de malt, interdit), noix ridée (« visage », « noix »).
- Anis vert : graine à nervure (« feuille », l'Herbacé), paire de graines pendantes (« cerises »,
  « boucles d'oreilles »), graine à cornes (« scarabée »), deux graines à queue (« pousse »).
- Réglisse : fibres longues en éventail (« poireau », « céleri »), bout rond (« allumette »).
- Genièvre : baie seule et son étoile (« hochet », « loupe », « logo », « smiley »), baie et queue en haut
  (« bombe »), baie et rameau en croix (« ♀ », « taureau »).
- Carvi : croissant à nervure (« feuille »), deux croissants (« sourcils »), croissant épais (« banane »).
- Coriandre : côtes en zigzag (« boule de Noël »), deux méridiens lisses (trop proche du dessin refusé de r4).
- Tonka : amande à rainure (« grain de café »), rides en long (« feuille »), bâtonnet rainuré (« baguette »).

## Refus précédents
- **Lot 15, « plutôt vanille, canelle ? »** et **22.10, nuit, « Je veux un forme qui représente vraiment ce
  que c'est »** : chaque proposition est une épice réelle, entière, déclarée par `data-epice`, pas un
  signe ni une sensation.
- **Lot 21, les grains de poivre** : aucun dessin de cercles seuls ; aucun poivre. La coriandre porte sa
  couronne et ses côtes pour ne pas redevenir un grain de poivre.
- **22.10, r4, « Aucun me convient... »** (sept épices-objets brunes) : la badiane et la coriandre
  reviennent avec un dessin neuf (le contrôle `--ter` vérifie qu'aucune signature ne reprend r4, même à
  l'unité). Mortier, pilon et saupoudreur ne reviennent pas ; la râpe à muscade non plus (un outil).
- **22.10, r4c, « un piment n'a rien à voir la dedans »** et « quasiment identique » : pas de piment ; huit
  silhouettes différentes (étoile, ovale, poire, bâton, baie et rameau, croissant, boule couronnée, fève).
- **Critique Fable du 22.10, « fais voir à côté de la feuille et de l'herbe »** : chaque proposition est
  prise entre la feuille et les brins, à 16 et 12 px, et sur la carte de Saaz. Les dessins qui se
  lisaient « feuille » (anis à nervure, carvi, tonka à rides en long) ont été écartés pour cette raison.
