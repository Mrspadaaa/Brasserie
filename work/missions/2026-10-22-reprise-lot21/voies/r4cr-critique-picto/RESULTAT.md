OK — accepté : la planche resserrée est montrable ; en tête p1 « calice et crochet », qui se nomme « piment » à 16 et à 12 px entre la feuille d'Herbacé et les brins de Végétal, sur Saaz, Columbus et Cascade ; le mot « épicé » reste le repli exact. Réserve que seul le brasseur peut lever : le piment dit « piquant », pas « épicé de houblon ».

Relecture 2 (relance 1 sur 2 du concepteur). Première relecture : rejetée (six genres, cinq perdants d'avance, voisins à feuilles absents) ; les quatre retraits demandés (É, volutes, zigzag, couronne) sont faits, les voisins Herbacé et Végétal sont dans chaque bloc, Saaz est ajouté, plus rien sous 12 px.

## Ce que j'ai regardé (L12)
- `work/refonte-frontend/v4/ecran-1/fils22-picto-epice-2/captures/planche-390.png` et `captures/contexte-390.png` (régénérées 18:51), ouvertes en image.
- Épreuve refaite moi-même : p1, p2, p3 à 16 et 12 px entre Herbacé, Végétal, Résineux, Tropical, Fruits à noyau, en vrais pixels ×4 sans lissage (scratchpad `voisins-loupe.png`) et à densité téléphone ×3 (`voisins-x3.png`).
- Contrat HTML : 4 `data-variante` (p1-crochet, p2-chair, p3-couche en `universel`, m1-mot en `mot`), tailles du mot 12 · 13 · 15 px, aucune à 11.

## Verdict par proposition
| Capture · bloc | Verdict | Phrase prédite du brasseur | Correction attendue |
|---|---|---|---|
| planche-390 · « Avant » (poivre) | OK comme témoin | « Oui ça c'est non, on l'a dit. » | Garder : l'avant / après se lit sur les mêmes lignes et la même épreuve. |
| planche-390 · p1 « calice et crochet » | **accepté, en tête** | « Le piment on comprend direct. Épicé c'est pas piquant, mais bon, c'est l'idée. » | À 16 px : piment, net. À 12 px en vrais pixels : gousse brune à queue en crochet, séparée de la feuille (ovale fermé à nervure, verte) par la pointe recourbée et la couleur. Rien à corriger pour la planche ; si retenu, passer en liste blanche de D101. |
| planche-390 · p2 « charnu » | accepté, second | « p1 ou p2 c'est pareil… p1. » | Même lecture ; à 12 px le crochet et la chair se touchent un peu plus (forme « ʃ »). Garder comme variante, il choisira entre les deux. |
| planche-390 · p3 « couché » | rejeté | « Celui-là on dirait une banane, un sourire. » | À 16 px la pose émoji se lit encore ; à 12 px c'est un « ‿ » sans calice lisible. Le concepteur le dit lui-même le plus faible : il peut rester sur la planche comme troisième dessin, mais ne pas le recommander. |
| planche-390 · m1 mot « épicé » (12 · 13 · 15 px) | accepté comme repli | « Pourquoi y en a un écrit et pas les autres ? Mais au moins c'est juste. » | Exact, 12 px au moins (D60 respecté). Incohérent dans une rangée de onze pictos ; il ne le prendra que s'il refuse le piment pour le sens. |
| contexte-390 (avant + quatre propositions, Saaz / Columbus / Cascade, épreuve 16 et 12 px) | accepté | « Là on voit à côté de la feuille, c'est bon. Saaz épicé, c'est juste. » | Vraies lignes (α Beer Maverick, usage Crosby ; Saaz « arôme ≈ » déduit de l'α et marqué, épicé de Saaz sourcé Hopsteiner en pied) : données honnêtes, D94 L5 respecté. Les pastilles de rôle sont passées à 12 px. Rien à corriger. |

## Les cinq questions de la voie
1. **Sans légende à 12 et 16 px** : p1 et p2 se nomment « piment » aux deux tailles sur téléphone et en vrais pixels ; p3 hésite à 12 px ; le mot se lit.
2. **Genres** : deux (universel, mot) comme le contrat réécrit le demande ; les trois piments diffèrent par le dessin, pas par l'idée, et c'est voulu. Risque D38 « tous un peu semblable » : il le dira peut-être de p1/p2, sans que ça coûte le lot.
3. **Confusions** : piment ↔ feuille d'Herbacé levée pour p1 et p2 (preuve dans la planche et dans ma loupe) ; aucune avec la flamme, Star, Activity ou Thermometer (les trois pictos qui y touchaient sont retirés).
4. **Contexte réel, avant / après** : oui, trois lignes dont une noble, voisins à feuilles présents, barre d'arôme marquée maquette.
5. **Hors périmètre** : `git status --short` : la voie r4c n'écrit que dans `fils22-picto-epice-2/` et son RESULTAT ; `captures/` et `planche/` ignorés par `.gitignore` comme pour r4. `pistes-l5f.png` à la racine est antérieur (L17, connu).

## Ce qu'il reste au brasseur
Le sens : un piment pour « épicé de houblon » (poivre, clou, herbes sèches). C'est un choix de goût, pas un défaut de planche ; la planche lui donne l'alternative exacte (le mot). Ordre proposé pour la page : avant, p1, p2, mot, p3.

LEÇON PROPOSÉE : aucune nouvelle ; celle de la première relecture tient (un brief de planche de picto nomme les familles voisines de même silhouette comme voisins obligatoires du contexte, et toute confusion écrite dans la NOTE doit être montrée dans la capture). À noter pour le pilote : le scratchpad de session est partagé entre voies ; un script homonyme (`loupe.mjs`) y a été écrasé entre deux relectures. Préfixer les fichiers de scratchpad du nom de la voie.
