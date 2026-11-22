OK — s2d en passe 2 : 12 cadres sur la frise du brassin, clair et cave

## Fichiers écrits (tous dans la voie)
- `p2c/outils/commun.mjs` (icône `up` ajoutée), `p2c/outils/construire.mjs`, `p2c/p2c/source.mjs`, `p2c/p2c/etat.html`, `p2c/p2c/NOTE.md`, `p2c/p2c/p2c-clair.png`, `p2c/p2c/p2c-cave.png`, `p2c/tests.txt`, `p2c/REPRISE.md` (état de la reprise, désormais clos).

## Critères
- G1 : `controle-serie.mjs … p2c --complet` → `SERIE OK` (dans tests.txt)
- G2 : `verifier-page.mjs …/p2c/etat.html` → `PAGE OK (1 images chargées, 390 px, sans erreur)`
- Mesure du constructeur (12 cadres) : hors 0, chevauchements 0 partout ; vide bas : accueil 111, attente 87, reponse 67, erreur 105, urgent 84, fournisseurs 116, finances 71, conversations 105, plafond 119, limites 8, zero 97, bureau 118 px. Réseau : aucun appel.

## Cadres (fait · ouvert en clair et en cave · défaut restant)
- accueil · ouvert clair et cave · rappel daté « Demain 09:00 · Citra 85 g » ajouté ; la ligne des limites, raccourcie, ne déborde plus ; aucun défaut restant
- attente · ouvert clair et cave · « Pendant ce temps : la pression au journal ? » ajouté ; aucun défaut restant
- reponse · ouvert clair et cave · aucun défaut restant
- erreur · ouvert clair et cave · l'interrupteur n'est plus étiré ; aucun défaut restant
- urgent · ouvert clair et cave · cases et interrupteur à leur taille, « 85 » ne touche plus l'épingle (aujourd'hui à J+1,15) ; « Prochaine mesure 23:20 » ajouté ; aucun défaut restant
- fournisseurs · ouvert clair et cave · aucun défaut restant (vide 116 px, sous la limite)
- finances · ouvert clair et cave · la question préremplie occupe 6 lignes dans le champ : c'est voulu (longue), mais c'est lourd
- conversations · ouvert clair et cave · plus de débordement (colonne `minmax(0,1fr)`, rangées de 64 px) ; groupe « Plus anciennes » ajouté ; aucun défaut restant
- plafond · ouvert clair et cave · « repart à zéro le 1.12 », le rappel qui sonne sans IA ajouté ; aucun défaut restant
- limites · ouvert clair et cave · « Ce mois · 54 questions » par mode, modes avec durée, « Prévenir à 80 % du budget » ; actions collées en bas, d'où un creux de 80 px environ au-dessus d'elles
- zero · ouvert clair et cave · la question en file ajoutée à l'aperçu grisé ; aucun défaut restant
- bureau · ouvert clair et cave · échange J+1 replié en tête, « Pourquoi » déplié (la largeur sert), journal J+0 à J+8 ; aucun défaut restant

## Captures (ouvertes, avec les 8 recadrages par rangée, clair et cave)
- `work/missions/2026-11-14-compagnon/voies/p2c/p2c/p2c-clair.png`
- `work/missions/2026-11-14-compagnon/voies/p2c/p2c/p2c-cave.png`

## Prédiction
« La frise, je comprends tout de suite quand agir ; l'urgent, on ne peut pas le rater. Le champ des finances est un peu long. »

DÉCISION À PRENDRE : les données de la passe 2 se contredisent. « Depuis 36 h », « le Citra de J+2 » et « Densité à J+4 : vers 1,020 » ne tiennent pas à J+4 avec une DF de 1,012 relevée. L'accueil est donc posé à J+1, et « DF 1,012 : la levure a fini ? » devient « Densité à J+4 : la levure a fini ? ». « Brassin 31 · Blonde de garde » devient « Brassin 30 ». Le pilote a accepté ces choix ; ils sont réversibles dans `source.mjs`. Données de maquette ajoutées (inventées, plausibles) : conversation « Brassin 28 · Saison », 54 questions du mois (38, 12, 4), rappel 09:00, journal « J+6 : DF 1,012, retour à 19 °C ».

CONNAISSANCE : aucune
LEÇON PROPOSÉE : dans une maquette, un `span` interrupteur ou une case placé dans une rangée `>span{flex:1}` s'étire en silence. Les contrôles restent verts ; seule l'image le montre. Il faut donc donner `flex:none` aux contrôles, ou en faire des boutons (L12, L26).
