OK — s2a2 : courbe remontée et chiffrée, tuiles dry hop, rail de garde, six images

## Fichiers écrits
- `work/missions/2026-11-14-brassins/voies/p2b/s2a2/etat.html` (copie de s2a, classes `s2a2-`, états repos, geste, dryhop, liste ; `?etat=…&theme=…`)
- `work/missions/2026-11-14-brassins/voies/p2b/s2a2/NOTE.md`
- `work/missions/2026-11-14-brassins/voies/p2b/tests.txt`
- Captures (toutes ouvertes) : `p2b/s2a2/s2a2-repos-390-clair.png`, `s2a2-geste-390-clair.png`, `s2a2-dryhop-390-clair.png`,
  `s2a2-liste-390-clair.png`, `s2a2-repos-390-cave.png`, `s2a2-repos-1280-clair.png`.
- Script de capture hors OWNS (scratchpad de session), non versé.

## Défauts de s2a (t1), un par un
1. Courbe en bas, coupée : remontée sous « Maintenant », entière au premier écran. Corrigé.
2. Pas d'échelle, 1,018 barré : échelle 1,060 · 1,040 · 1,020 ; quatre points chiffrés, aucun sur la ligne du jour. Corrigé.
3. Jauge de garde illisible : rail OG → bande nommé, « encore 0,004 jusqu'à 1,014 ». Corrigé.
4. « Ajouté » seul : tuiles par houblon, « Ajouté aujourd'hui · sort Citra 100 g et Mosaic 80 g du stock » ; état après : « sorti du
   stock », 1 j d'avance, Annuler, goutte J+6 → J+5. Corrigé.
5. 1280 petit, tiers bas vide : ×1,15, courbe puis table des relevés à droite. Corrigé.
- Retouches communes 1 à 7 : faites (détail dans la NOTE). « Fait » de la consigne de J+7 retiré (« dans 2 j »).

## Greffes intégrées
- s2c : tuiles par houblon, 7,5 g/L sur 24 L, déstockage dit.
- s2e : rail OG → bande, dans la rangée Garde (pas en tête sombre : chaleur froide, en-tête z1 gardé).
- Liste par geste à faire : Pale Ale en tête (Brasser / Replanifier), agenda de la semaine en puces, occupation F1/F2, Clos.

## Critères
- G1 : `PASSE OK`
- G2 : `MESURE OK` — controle-panel : remplissage médian 0,78 (s2a : 0,50), 0 sous 0,50, ressemblance 0,71 → `PANEL OK`
- Rendu : 0 `type="number"`, 0 bouton sous 44 px, tailles de texte à 390 : 12, 14, 17 px.

## Prédiction
« Là je vois ce que je dois faire aujourd'hui et où elle en est sans descendre ; le dry hop dit enfin ce qui sort du stock. »

DÉCISION À PRENDRE : aucune
CONNAISSANCE : aucune
LEÇON PROPOSÉE : un sélecteur `.x span{position:absolute}` capture aussi les spans de chiffres imbriqués ; viser l'enfant direct (`.x>span`) dès qu'un bloc mêle étiquettes positionnées et chiffres balisés.
