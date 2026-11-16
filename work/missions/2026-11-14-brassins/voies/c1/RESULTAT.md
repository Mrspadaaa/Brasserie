REPRISE — 4 maquettes faites, critères G1 à G3 verts ; 16 captures restent à ouvrir et juger

## Lecture (5 lignes)
1. Il a dit : « Créer : aucune … Ça resoud aucune de mes problématique » (15.11), après e5, e5n et e5g ; ailleurs : « Moins de touche… en un clic on a tout l'essentiel, ça s'autocomplete », « je fais une recette puis ensuite j'achète les ingrédients, souvent pas présent ».
2. On en lit : ce n'est pas la forme du formulaire (recette, volume, date) qui pèche, c'est le formulaire lui-même. Il veut que le brassin naisse d'un geste, là où il est, et que la création dise ce qui manque (problèmes 2, 4, 5, 6 et 7 de PROBLEMES.md).
3. Genres choisis : 1 « le brassin naît de la recette d'un toucher » (c1a, froide) ; 2 « refaire un brassin fini » (c1b, tiède) ; 3 « une ligne libre lue par l'IA » (c1c, chaude) ; 4 « ce que je peux brasser avec mon stock » (c1d, tiède).
4. Au repos :
   - c1a : ses cartes de recettes (coque e11a), avec un bouton « Brasser 24 L » qui crée le brassin sans feuille ;
   - c1b : la fiche d'une bière écoulée (e2a), « la dernière / la prochaine » en colonnes et le carnet en regard, avec interrupteurs ;
   - c1c : une grande ligne sombre à taper ou dicter, et quatre cases qui se remplissent ;
   - c1d : trois étagères (prêtes, il manque peu, déjà prévue), avec une barre d'ingrédients par recette.
5. Aucune ne pose recette, volume et date dans un formulaire. Chacune arrive sur la fiche planifiée e1a (c1a, c1c) ou dans la liste e6a (c1b, c1d), sans les redessiner.

## Fichiers écrits
- `c1a/` à `c1d/` : `etat.html`, `NOTE.md`, 5 PNG chacun ; `c1a-repos-1280-clair.png` en plus.
- `capture.mjs` (tiré de e5g), `tests.txt` (sortie des CHECK), ce fichier.

## Critères (sortie dans tests.txt, rejoués depuis la racine)
- G1 : `SERIE OK`
- G2 : `IDENTITE OK 4/4`
- G3 : `NOTE OK 4`
- Tests : aucune suite Vitest (rien dans `src/`).

## État du jugement visuel (L12)
- Ouvertes et jugées : `c1a-repos-390-clair`, `c1a-geste-390-clair`, `c1a-apres-390-clair`, et l'ancien `c1a-vide` (à moitié vide). Le vide a été enrichi depuis : chaque brassin y garde sa recette, avec « Brasser 24 L ». Ce nouveau rendu n'a pas été rouvert.
- **Pas encore ouvertes** :
  - c1a : `vide` (nouveau), `repos-390-cave`, `repos-1280-clair` ;
  - c1b, c1c, c1d : les 5 images de chacune.
- Points à regarder en priorité :
  - c1d : `repos` (h=869) et `geste` (h=912) dépassent 844 px. Les étagères se coupent-elles sous la barre du bas ?
  - c1c : le bloc sombre (`--cave-texte-50` en fond) doit être lisible en cave, et le caret visible.
  - c1b : le toast et le bloc gris de la fiche doivent rester lisibles.
  - c1a : en 1280, la grille de recettes passe sur 2 colonnes ; à vérifier.

## REPRISE
Contexte de l'agent à environ 158 k : arrêt sur consigne (150 k). Reprise dans un agent concepteur neuf, sur ce fichier :
1. Ouvrir une fois chacune des 16 captures listées ci-dessus, avec la question « je comprends en trois secondes ? ». Corriger dans `etat.html` (classes c1x-), puis `node work/missions/2026-11-14-brassins/voies/c1/capture.mjs <id>`.
2. Rejouer G1 à G3 vers `tests.txt`, puis réécrire la ligne 1 en `OK — …`.

Prédiction : c1d et c1a lui parleront le plus (« un clic », le manque dit à la création) ; c1c divisera (l'IA à la création), mais elle tranche avec tout ce qu'il a vu.

DÉCISION À PRENDRE : aucune.
CONNAISSANCE : aucun fermenteur n'est libre dans les données communes (F1 NEIPA, F2 Pale Ale prévue, F3 Pils en garde). Tout nouveau brassin naît donc avec « cuve à définir » ; les maquettes le disent sans inventer de cuve.
LEÇON PROPOSÉE : aucune.
