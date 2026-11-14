# Finances au banc (14.11) — combien et quels problèmes

Banc : `?dev-local&finance-demo=reel` sur `en-ligne/2026-11-14-stock-b` (d1622cbb, code en ligne), 390 tactile et 1280, clair et cave.
Captures : `analyse/cap/` (script `analyse/capturer2.mjs`). Maquettes choisies copiées dans `ref/` (v6a, v6b, v5a, g3a, g6, p5b).

## Choix déjà faits (SPEC, compta-prix) — base de chaque écran (règle n° 1)
- Synthèse = **g3a** (09.11 « Non la meilleure on garde celle ci ») ; plage « 6 mois, 4 mois » demandée le 10.11.
- Annuel = **g6** (09.11) ; Prévisions = **p5b** (09.11) ; Analyse = **a2a** (10.11) ; Mon mois = **f2d** (10.11).
- Opérations = **v6b** choisi le 09.11 (« 3 et 4 candidat validé »), puis **v6a** désigné le 10.11 (« Lignes serrées / v6a / v5a à − 12 % ; « ✓ Payé » reste à 24 px, le minimum. / Ça ressemble pas tellement à la mini maquettes ??? »). Ses derniers mots priment : **v6a**.
- Donc « Synthèse, Prévisions et Annuel jamais refaits » est inexact : ils ont été refaits et choisis ; on corrige leur écart à la maquette, sans nouvelles variantes.

## Problèmes (12)
1. Opérations : rangée en **v6b** (geste « + pièce » à gauche du montant), pas **v6a** (geste sous le montant, deux étages gardés). Plainte 10.11 ouverte.
2. Opérations : « … » (Autre période) n'offre que **du mois au mois** (`input type=month`, `PlageMois.tsx`) : pas d'intervalle précis du jour au jour (CP-3, 10.11).
3. Opérations : le « … » est un bouton muet à côté de la pilule ; rien ne dit qu'on peut choisir une plage.
4. Synthèse : l'écart du gain est **rempli de vert** sur toute la colonne Dépensé (5 429,60 contre 265,40) : on lit deux colonnes vertes ; g3a le dessine en pointillé vide.
5. Synthèse : les dépenses deviennent un trait au pied ; « Autres frais 250,20 » coupé sous le bord (390, clair et cave).
6. Synthèse : légende « payé » en pastille violette alors que les dépenses payées de ce mois sont jaune et gris ; la légende ne correspond pas aux couleurs vues.
7. Synthèse : libellé de vente sur trois lignes au pied de la colonne (« Vente 10 × Bière · 75 cl — Restaurant du Lac »).
8. Annuel : « Local et travaux 5 500,00 » compté en entier dans « Dépensé + usure » (perte −70,40) alors qu'Opérations le met « Matériel · à part » : à vérifier (achat de matériel = usure, pas charge). Métier, risque élevé : diagnostic avant tout geste.
9. Prévisions : axe en variation (0 à −80) faute de solde de départ ; le renvoi est dans « 3 choses à compléter ». Conforme p5b ; pas de défaut neuf.
10. 1280 : Opérations à deux colonnes correcte ; bouton + flottant collé au bord droit hors du contenu (BX-4, hors périmètre).
11. Cave : contrastes corrects sur les quatre onglets.
12. Mon mois (f2d, MM-1 en ligne depuis 0dd3d6bc) : à rejouer au port (`controle-mm1`).

## Trous
- Aucune maquette ne montre une plage de jours dans v6a : **c'est le seul choix ouvert** → mini maquettes (voies s1 à s3).
- Le cas « ventes ≫ dépenses » n'est dessiné dans aucune Synthèse : il se range dans l'état g3a (pointillé vide, segments lisibles), sans composant neuf (L03).
