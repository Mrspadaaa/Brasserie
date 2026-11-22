# Voie t-pieges — des pièces piégées, fictives, avec leur vérité (D381)

Agent : auteur (Sonnet), maxTurns 40. Pilote : Opus.

## Ses mots
« Fait des piège aussi sur les images type photos, avec des aberrations sur certains endroits notamment sur les jonctions. Voir comment sa réagi. »
« SI il y a une tâche sur la facture, et que c'est pile sur une jonction » ; « SI la facture est pas balanche ? SI la tâche fait toute la facture ?
SI la photo est un peu floue »

## OWNS
- `work/missions/2026-11-03-lecture-longue/pieges/generer.mjs`, `pieges/verifier.mjs`, `pieges/README.md`
- Sorties (images, masques, vérités) : UNIQUEMENT dans le dossier passé en argument (le pilote donne
  `C:/Users/mrspa/AppData/Local/Temp/claude/C--Users-mrspa--codex-worktrees-openai-clean-start-Brasserie/16fc09ec-4e69-48a9-9744-5912b6ef6552/scratchpad/pieges`),
  jamais dans le dépôt.

## À faire
`node work/missions/2026-11-03-lecture-longue/pieges/generer.mjs <dossier>` fabrique, dans Chrome sans écran (puppeteer-core :
`createRequire('C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/package.json')('puppeteer-core')`,
Chrome `C:/Program Files/Google/Chrome/Application/chrome.exe`, canvas 2D), des pièces 100 % fictives (fournisseur « Brasserie Fictive SA »,
articles inventés de brasserie). Pour chaque pièce : `<nom>.jpg`, `<nom>.masque.png` et `<nom>.verite.json`.
- Vérité : articles dans l'ordre `{ name, quantity, unit, price, amountTTC }`, total TTC = somme exacte, et `lignes` : pour chaque ligne visuelle de
  texte, son article (rang) ou null (en-tête, totaux).
- Masque : MÊMES transformations que l'image (rotation, perspective, recadrage), chaque ligne visuelle remplie d'une couleur unique
  (rang de ligne + 1 codé en RGB : r = n & 255, g = (n >> 8) & 255, b = 0), fond noir, SANS flou ni bruit ni tache.
- Contenu piégé dans chaque pièce : 6 lignes identiques à la suite (« BIERE BLONDE 33CL » 2.50) et des articles sur deux lignes (désignation, puis
  « 2 x 31.50   63.00 ») répartis partout (au moins tous les 10 articles), remises négatives, une ligne d'arrondi.
- Pièces (tickets de caisse ≈ 80 mm, 700 px de large, 120 à 150 articles, hauteur > 3 × largeur) :
  1 `papier-gris` (fond 185, texte 50) · 2 `tache-jonctions` (taches de café irrégulières, semi-transparentes, ≈ 3 lignes de haut, vers les
  lignes 22–28, 47–53, 72–78, 97–103) · 3 `tache-totale` (décoloration et taches sur toute la hauteur) · 4 `flou-leger` (flou gaussien 1,2 px) ·
  5 `flou-fort` (2,5 px) · 6 `ombre` (dégradé fort + ombre d'un téléphone sur un côté) · 7 `penche` (rotation 2,5° + légère perspective) ·
  8 `pli` (pli clair et sombre en travers de deux lignes, coin replié) · 9 `fond-table` (ticket photographié sur une table sombre, le papier au
  milieu) · 10 `tout` (flou léger + penché 1,5° + ombre + tache sur une jonction). Facture A4 :
  11 `facture-zebre` (1 240 px de large, 300 lignes de tableau, une rangée sur deux grisée, une page haute).
- Bruit et JPEG 0,8 sur les photos (1 à 10).
`node .../pieges/verifier.mjs <dossier>` : pour chaque pièce, les couleurs du masque redonnent toutes les lignes de la vérité, dans l'ordre, et
chaque article a au moins une ligne ; écrit `pieges.json` (liste des pièces, tailles, nombre d'articles, total).

## Critères (le pilote les rejoue)
- `node .../pieges/generer.mjs <dossier>` puis `node .../pieges/verifier.mjs <dossier>` → « PIÈGES OK 11/11 »
- Le pilote ouvre 3 images au hasard : elles doivent ressembler à des photos de tickets, pas à des images propres.
- `git status --short` → seulement les trois fichiers OWNS.
Interdits : appel IA, réseau (hors Chrome local), données réelles, écrire hors OWNS. Retour : une ligne.
