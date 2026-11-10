OK — voie p passe 4 : p5a–p5f, six escaliers de p4a où l'info se lit sur le graphe ; MOTS, COMMUN, PANEL OK

## Fichiers écrits (tous dans `work/missions/2026-11-09-compta-prix/p4/`)
- `p5a/` à `p5f/` : `etat.html` (statique, classes préfixées, sans script), `NOTE.md`, `<id>-haut.png` (premier écran), `<id>-page.png` (premier écran + annexe), `<id>-1280.png`.
- `p5a/capturer-1280.mjs` (captures 1280 des six ; même script que p3, chemins p4).
- `p4/RESULTAT-p.md`. Rien d'autre : les `c6*`, `e3*`, `v6*`, `RESULTAT-c.md`, `critique/` et les `src/`, `tests/` modifiés du worktree ne sont pas de cette voie.

## Ses mots et la réponse
« p4a … Mieux mais on perds l'info directement sur le graph … et ça reste dure à lire... Fait plus de variante de cette vues ». Les six gardent p4a (sa base : cartes ou bascule Sans / Avec, l'escalier, le frigo et le brassin planifié, le passage sous zéro daté) et mettent **nom, montant, date de chaque marche sur le graphe**, en 13 px au moins, graphe agrandi (300 à 500 px). Chiffres communs inchangés (p3) : avec frigo au 15.11 → 1 121,60 · 1 064,18 · 664,18 · 657,34 · 257,34 · −142,66 le 25.01 · −892,66 ; sans frigo → 2 107,34.

## Les six
- **p5a** (froide) — p4a avec les étiquettes de p1b revenues sur chaque marche ; un chemin plein, l'autre en pointillé avec sa fin ; la liste garde les sources (frigo : usure 600, litre 8,01 ; brassin : recette, stock, facture). Annexe : sans frigo.
- **p5b** (tiède) — les étiquettes accrochées : chaque sortie est une pastille tenue par un fil à sa marche, les projets disent leur source dessus, le solde après posé sur les marches ; liste repliée (« 8 sorties »). Annexe : l'étiquette du frigo touchée → sa fiche (usure 3 / 5 / 8 ans, litre, plus bas, 179 bouteilles).
- **p5c** (tiède) — mois par mois : l'escalier en haut, et sous chaque mois ses sorties en cartes et ce qu'il reste à la fin du mois (664,18 · 257,34 · −892,66) ; liste et graphe ne font qu'un. Annexe : sans frigo (carte « pas compté »).
- **p5d** (tiède) — un escalier par chemin, même échelle, fonds bleu pâle / bleu-vert pâle, le chiffre de tête dans le bandeau de chaque graphe. Annexe : horizon 30 j, les petites marches lisibles.
- **p5e** (tiède) — l'écart peint : les deux chemins sur un escalier, marches nommées une fois, la bande hachurée entre les deux = le frigo (nom, montant, usure, litre), les deux fins au bout. Annexe : frigo glissé au 10.01, même fin, « aucun mois ne tient sans vente ».
- **p5f** (chaude) — la descente : l'escalier vertical plein écran en version nuit, le temps descend, l'argent va à droite, une étiquette claire sous chaque marche, rouge à gauche du zéro. Annexe : sans frigo.

## Sorties décisives
- `verifier-page.mjs <etat.html> --captures p4/<id>/<id> --min-images 0` : **PAGE OK** × 6.
- `p4/p5a/capturer-1280.mjs` : **CAPTURES 1280 OK** (débord 0, erreurs 0, × 6).
- `mots-premier-ecran.mjs p4 p5a…p5f --page=etat.html --profil=sans-houblons --sans-donnees --max=60` : **MOTS OK** — p5a 60 · p5b 57 · p5c 59 · p5d 59 · p5e 59 · p5f 57. Le compteur compte « · », « → » et « /an » comme des mots : séparateurs en virgules dans les SVG, signe « − » collé au nombre.
- `controle-commun.mjs p4 p5a…p5f --page=etat.html --profil=sans-houblons --sans=mots` : **COMMUN OK** (couleurs, survol, blocs, contraste, standard, parlant, brutes). Corrigés en route : `--acc:#C8382F` déclaré dans `:root` des six (sans lui, le brun du brassin, 24°, est lu « alerte » et la page passe pour « trop retenue ») ; étiquettes déplacées hors des traits et des séparateurs ; dans p5d et p5e, étiquettes du brassin en noir (le brun ne tient pas 4,5:1 sur un fond teinté) ; pastille unie sous les fins de p5e (la hachure fait tomber la mesure) ; bascule de p5b à 10 px (S3).
- `controle-panel.mjs` (6 `-haut.png`) : **PANEL OK** — remplissage médian 0,70, 0 sous 0,50, ressemblance 0,83, 0 paire ≥ 0,95 (0,94 avant la version nuit de p5f et les fonds teintés de p5d).
- Transversales : 7,51 → 8,01 CHF/L sur le frigo (p5a, p5b, p5c, p5d, p5e) ; 5,00 marqué exemple (p5b, p5e) ; payé ≠ à payer ≠ prévu nommés (légende ou pied, sauf p5d et p5e où la couleur dit le chemin, dit dans la NOTE) ; 27 L ; hors fixture = exemple ; glossaire (« à payer », « usure », « sous zéro ») ; aucune rangée de fournisseurs ; couleurs nommées.
- Statique : aucun script ; chaque état est dessiné dans un second cadre, ouvert et regardé (L12).
- Non fait : thème cave ; B5 et B9 non mesurés ; skills `impeccable`, `boosters-ux`, `ui-design-system` non chargés (budget, six concepts) ; aucun contrôle de choix (`controle-choix.mjs`) : Prévisions n'a pas d'entrée choisie dans `ecrans.json`, p4a est la base « mieux mais ».

## Captures (ouvertes, L12)
`p4/p5a/p5a-page.png`, `p5a-haut.png` · `p5b/p5b-haut.png`, `p5b-page.png` · `p5c/p5c-page.png` · `p5d/p5d-page.png` · `p5e/p5e-page.png`, `p5e-haut.png` · `p5f/p5f-page.png`, `p5f-haut.png`. Les `-1280.png` n'ont pas été rouvertes (débord 0 mesuré).

## Prédiction
Il gardera p5a ou p5b comme écran (« là je vois tout sur le graph ») et demandera la fiche de p5b dans l'écran retenu ; p5e : « l'écart peint, intéressant » ; p5f : « ça j'aime bien visuellement mais pas dans l'app claire » ou l'inverse ; p5c et p5d : « lisible mais je préfère un seul escalier ».

DÉCISION À PRENDRE : le fond sombre de p5f (variante chaude) dans une app claire ; s'il le retient, un port en thème clair garde la verticale et perd la nuit. Et, comme en p3 : la vente des 27 L n'est proposée d'office dans aucune (« Entrées : aucune »).
CONNAISSANCE : la ressemblance du panel (vignettes de gris 24 × 52) ne descend sous 0,90 que par de grandes aires de luminance différente (fonds teintés, un graphe sombre), pas par la disposition des étiquettes ; six écrans clairs d'un même onglet plafonnent vers 0,94.
LEÇON PROPOSÉE : `mots-premier-ecran.mjs` compte « · », « → » et « /an » comme des mots, et `controle-couleurs.mjs` sans `--acc` lit le brun (24°) comme l'alerte : chaque brief de maquettes finances devrait dire « séparateurs en CSS ou en virgules ; `--acc` dans `:root` », sinon chaque voie redécouvre les deux en fin de course.
