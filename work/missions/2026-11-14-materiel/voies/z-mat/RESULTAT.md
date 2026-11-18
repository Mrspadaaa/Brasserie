OK — série z : quatre mini maquettes, fil, tableau d'ombres, ligne d'échéance, bons de travail

## Fichiers écrits (Possède seulement)
- `M/v0/z/zq1/etat.html` (écrit directement), `zq1/NOTE.md`
- `M/v0/z/zq2|zq3|zq4/parts.html` (contenu propre), `etat.html` (assemblé), `NOTE.md`
- `M/v0/z/_socle/assembler.mjs` : reprend le chrome et les pictos de zq1, change le préfixe par split/join (L26).
  Écart à « fichiers par l'outil Write » : les `parts.html` sont écrits par Write ; les `etat.html` de zq2 à zq4 sont assemblés par node, en UTF-8.
- 12 captures : `M/v0/z/<id>/<id>-{repos,geste,repos-cave}-390.png`
- Tests : sans objet (maquettes statiques).

## Critères
- G1 : `SERIE OK` (rejoué après la dernière capture).
- Contrôle maison, au premier écran repos hors noms (`data-mots="lignes"`) : zq1 52 mots, zq2 35, zq3 44, zq4 46 (≤ 60).
  Aucun texte < 12 px, 0 `type="number"`, 12 à 16 `data-booster` par variante. `capt.mjs` : CAPTURES OK, sans erreur de page.
- `git status --short` : seul `work/missions/2026-11-14-materiel/` (non suivi, dossier de mission).

## Les quatre genres
- zq1, tiède, le fil des échéances : rail du temps ; au-dessus d'« aujourd'hui », les dus et leur geste ; en dessous, les échéances à l'échelle des jours. Fiche : le fil de l'appareil, avec l'étalonnage en tête.
- zq2, chaude, le tableau d'ombres : panneau perforé, silhouettes peintes. L'étiquette suspendue porte le dû et sert de geste. La pompe en panne n'a plus que son ombre. Fiche : flacons tampons (pH 4 rouge, pH 7 jaune).
- zq3, chaude, la ligne d'échéance : toutes les jauges courent vers une même ligne rouge. Le retard déborde en hachures ; le refroidisseur se compte en 5 crans de brassins. Fiche : cycles en dents de scie, règle de tolérance.
- zq4, chaude, les bons de travail : bons pendus à une tringle (verbe, chiffre, bouton de 44 px), puis « Bientôt » et le reste. Fiche : le bon ouvert, l'étalonnage pas à pas.
- Les données sont communes aux quatre et calculées au 14.11.2026 (détail dans les NOTE). Inconnus en badge (« prix inconnu », « jamais étalonné »). Le total « 1 739 CHF sur 2 prix connus » est montré dans zq1 et zq4. Aucun EQ-.

## Captures ouvertes (L12)
- Ouvertes : zq1 repos et geste (après correction) ; zq2, zq3 et zq4 repos (1re version : collisions de classes avec le socle, corrigées) ; zq3 repos-cave et zq4 geste (après correction).
- **Non ouvertes après correction, faute de contexte** (agent à 190 k) : zq1 repos-cave, zq2 repos, zq2 geste, zq2 repos-cave, zq3 repos, zq3 geste, zq4 repos, zq4 repos-cave.
  Elles sont à ouvrir avant de montrer la série, sans relancer de capture.
- Défauts connus, à reprendre en passe 2 :
  - zq4 geste : environ 250 px vides sous les dépenses ;
  - zq2 : la zone Mesure laisse deux cases vides ;
  - zq1 : le repère « janv. » touche le point du réfractomètre ;
  - à vérifier en 1re version : les étiquettes de zq2 débordaient et ont été élargies (min-width).

## Prédiction
« Le tableau d'ombres et la ligne rouge, là je vois tout de suite ce qui est à faire et quand ; enfin c'est plus une liste de noms. »

DÉCISION À PRENDRE : aucune (les écarts aux acquis sont écrits dans chaque NOTE : pastille d'état hors liste, Déjà possédé et Projets dans le ⋯, Achat par la case « Ajouter » dans zq2).
CONNAISSANCE : un tampon pH se reconnaît à sa couleur du commerce (pH 4 rouge, pH 7 jaune ou vert, pH 10 bleu) ; c'est un repère visuel gratuit pour l'étalonnage.
LEÇON PROPOSÉE : L26 a frappé encore (le 4e retour). Un socle préfixé par variante n'empêche pas qu'un nom de rôle de la variante (`plus`, `sous`) écrase une classe du chrome. Il faut un contrôle mécanique qui liste les classes définies deux fois dans un même `etat.html`.
