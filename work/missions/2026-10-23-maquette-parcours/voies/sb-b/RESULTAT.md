OK — série b Substituer : huit concepts v0 « la réponse d'abord », baseline COMMUN OK, PANEL OK

## Concepts (une ligne chacun : chaleur, idée, ce qui tient, ce qui casse)
- sbb1 · chaleur froide · u4 affiné : sa liste classée (plage hachurée si huiles inconnues), « Nelson Sauvin, 62 g » posé au-dessus avec son pourquoi · tient : classement lisible, ordre du moteur, toucher = nouvelle réponse · casse : huit lignes denses, plage 79–99 calculée par la page.
- sbb2 · chaleur froide · u4 affiné : le face-à-face « même IBU » réduit à la paire Nugget → réponse (α/β en plages, arômes en cases, ma bière) · tient : plus de colonne coupée, « l'ébullition en emporte l'essentiel » dit · casse : reste proche de Comparer, réponse pas en tête.
- sbb3 · chaleur tiède · verdict en grand puis « Tu gardes / Tu perds / On ne sait pas » · tient : gagné/perdu en un regard, chaque ligne tirée des données · casse : le plus de texte (95 mots hors données), bandeau plein lourd.
- sbb4 · chaleur tiède · ma bière dit la réponse : 12 familles avant/après, IBU dans 50–70, grammes face au stock · tient : on voit qu'à 60′ rien ne bouge et que le résineux reste hors style · casse : barres presque vides, l'absence d'effet est peu spectaculaire.
- sbb5 · chaleur tiède · trois réponses, trois raisons : sans rien acheter (Nelson), le moins de matière (Galaxy), le plus proche (Magnat) · tient : la réponse suit la contrainte du brasseur, écran plein (0,72) · casse : trois cartes au même gabarit, tris faits par la page.
- sbb6 · chaleur chaude · le ticket de remplacement : − Nugget, + Nelson, lignes amertume, matière, stock 100 → 38 g, inconnus, total « proximité 86 », tampon EN STOCK · tient : forme lue par tous, coût visible · casse : chasse fixe dense, 911 px, deux sélecteurs (onglets et pile).
- sbb7 · chaleur chaude · la cible : Nugget au centre, chaque remplaçant à la distance de son score, stock à gauche, achat à droite · tient : compromis proximité/disponibilité vu sans chiffre, étiquettes au doigt · casse : angle arbitraire, points de droite serrés.
- sbb8 · chaleur chaude · la fiche de brassage corrigée : Nugget barré, « ↳ Nelson Sauvin 62 g · 60′ » écrit dessus, notes en marge, autres corrections crayonnées · tient : la réponse là où elle sert, données de la recette S1 seules · casse : crayonné sans geste libre, liste « ou bien » proche de sbb1.

## Fichiers écrits
- `work/refonte-frontend/v4/ecran-1/fils24-substituer/sbb1/` à `sbb8/` : `etat.html`, `NOTE.md` ; dans `sbb1/` : générateur (`generer-sbb.mjs`, `socle-sbb.mjs`, `briques-sbb.mjs`, `concepts-sbb*.mjs`), données (`moteur-sbb.ts` → `donnees-sbb.json`, moteur du parcours en direct), `capturer-sbb.mjs`, `notes-sbb.mjs`.
- `work/refonte-frontend/v4/ecran-1/fils24-substituer/captures/sbbN-{premier-ecran,page,geste,fiche}.png` (N = 1 à 8).

## Critères
- G1 : SERIE-BIEN-8
- G2 : `controle-commun --sans=mots` → COMMUN OK (couleurs, au-style, survol, blocs, contraste, fiche, standard, trait, legende, parlant, brutes : OK)
- G3 : NOTE OK
- Indicatifs : UNE-QUESTION OK ; SANS-FAMILLE OK ; MOTS hors données 54 à 95 (5/8 au-dessus de 80), tous mots 122 à 189 ; PANEL OK (médiane 0,58, 0 sous 0,50, ressemblance 0,87).

## Prédiction
« sbb7 et sbb8 c'est pas mal, et sbb4 montre enfin qu'à 60′ ça change rien, mais il y a trop de texte sur sbb3 et sbb5. »

DÉCISION À PRENDRE : aucune.
CONNAISSANCE : à 60′ dans la stout S1, aucun remplaçant de Nugget ne fait bouger ma bière de plus de ~1 point ni ne fait passer le résineux sous le haut du style (moteur du parcours, lireBiere) ; le choix se fait sur l'amertume, la matière et le stock.
LEÇON PROPOSÉE : controle-fiche ferme la fiche avec le premier `[data-role="fermer-fiche"]` du document : avec une fiche par houblon, une seule boîte de dialogue remplie au moment de l'ouverture évite un faux échec (sinon le bouton visé est celui d'une fiche cachée).
