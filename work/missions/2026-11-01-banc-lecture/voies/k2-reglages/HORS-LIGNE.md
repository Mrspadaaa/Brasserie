# Hors ligne — C★, C★′ et N sur la sortie payante de k1

Recalcul sans aucun appel ni clé, depuis les 21 parcours déjà payés (banc-k1-20261101-081144 : 7 documents × 3 tirages). Mêmes lectures, mêmes durées mesurées, mêmes coûts : seule la façon de conclure change.
- **C★** : comme C (deux Flash-Lite, la 3.8 sur désaccord), mais la 3.8 **tranche seule** : son résultat remplace le vote à trois. Statut d’une lecture seule : « checked » si aucun point ne pèse, « disputed » sinon.
- **C★v** : les valeurs de la 3.8 quand elle tranche (comme C★), mais le statut du vote à trois (comme C) : « disputed » dès que les lectures ont divergé sur un champ qui pèse. Décision du pilote du 01.11.
- **C★′** : comme C★, et la 3.8 est aussi appelée quand les deux Flash-Lite concordent mais que l’arithmétique échoue (comme C′).
- **+N** : normalisation de code appliquée à chaque lecture avant le vote, pour toutes les variantes : devise « Fr. », « SFr. », « CHF. » → « CHF ». Rien d’autre ; une devise étrangère n’est jamais devinée.
- Aucune valeur des documents ici : des comptes, des durées, des coûts et des noms de champs. Une lecture des défauts communs à toutes les variantes est dans `RESULTAT-BANC.md` de la mission.

## Total

| | A | A+N | B | B+N | C | C+N | C′ | C′+N | C★ | C★+N | C★v | C★v+N | C★′ | C★′+N |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Champs justes / jugés | 214 / 243 | 214 / 243 | 214 / 243 | 214 / 243 | 219 / 243 | 222 / 243 | 219 / 243 | 222 / 243 | 217 / 243 | 217 / 243 | 217 / 243 | 217 / 243 | 213 / 243 | 213 / 243 |
| Lignes justes / jugées | 182 / 207 | 182 / 207 | 182 / 207 | 182 / 207 | 166 / 207 | 172 / 207 | 166 / 207 | 166 / 207 | 181 / 207 | 187 / 207 | 181 / 207 | 187 / 207 | 181 / 207 | 181 / 207 |
| **Faux verts** | **0** | **0** | **3** | **3** | **0** | **0** | **0** | **0** | **4** | **4** | **0** | **0** | **4** | **4** |
| Faux « corrigés » | 1 | 1 | 0 | 0 | 1 | 1 | 1 | 1 | 0 | 0 | 1 | 1 | 0 | 0 |
| Alertes justes | 14 | 14 | 13 | 13 | 17 | 15 | 17 | 17 | 12 | 10 | 15 | 13 | 12 | 12 |
| Alertes inutiles | 6 | 6 | 3 | 3 | 3 | 5 | 3 | 3 | 3 | 5 | 5 | 7 | 3 | 3 |
| Verts justes | 0 | 0 | 2 | 2 | 0 | 0 | 0 | 0 | 2 | 2 | 0 | 0 | 2 | 2 |
| Durée médiane | 17,4 s | 17,4 s | 8,9 s | 8,9 s | 10,4 s | 10,4 s | 10,5 s | 10,5 s | 10,4 s | 10,4 s | 10,4 s | 10,4 s | 10,5 s | 10,5 s |
| Durée maximale | 44,6 s | 44,6 s | 50,4 s | 50,4 s | 29,6 s | 29,6 s | 29,7 s | 29,7 s | 29,6 s | 29,6 s | 29,6 s | 29,6 s | 29,7 s | 29,7 s |
| Appels (moyenne par parcours) | 2,67 | 2,67 | 1,33 | 1,33 | 2,81 | 2,71 | 2,95 | 2,95 | 2,81 | 2,71 | 2,81 | 2,71 | 2,95 | 2,95 |
| Coût médian par parcours (CHF) | 0,0424 | 0,0424 | 0,0162 | 0,0162 | 0,0247 | 0,0247 | 0,0251 | 0,0251 | 0,0247 | 0,0247 | 0,0247 | 0,0247 | 0,0251 | 0,0251 |

## Par document (champs justes/jugés · lignes justes/jugées · FV = faux verts)

| document | A | A+N | B | B+N | C | C+N | C′ | C′+N | C★ | C★+N | C★v | C★v+N | C★′ | C★′+N |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| doc1 | 30/33 · 14/21 | 30/33 · 14/21 | 30/33 · 14/21 · FV 3 | 30/33 · 14/21 · FV 3 | 30/33 · 0/21 | 30/33 · 0/21 | 30/33 · 0/21 | 30/33 · 0/21 | 30/33 · 14/21 · FV 3 | 30/33 · 14/21 · FV 3 | 30/33 · 14/21 | 30/33 · 14/21 | 30/33 · 14/21 · FV 3 | 30/33 · 14/21 · FV 3 |
| doc2 | 30/36 · 9/18 | 30/36 · 9/18 | 30/36 · 9/18 | 30/36 · 9/18 | 27/36 · 9/18 | 30/36 · 9/18 | 27/36 · 9/18 | 30/36 · 9/18 | 30/36 · 9/18 | 30/36 · 9/18 | 30/36 · 9/18 | 30/36 · 9/18 | 30/36 · 9/18 | 30/36 · 9/18 |
| doc3 | 24/36 · 0/0 | 24/36 · 0/0 | 24/36 · 0/0 | 24/36 · 0/0 | 30/36 · 0/0 | 30/36 · 0/0 | 30/36 · 0/0 | 30/36 · 0/0 | 24/36 · 0/0 · FV 1 | 24/36 · 0/0 · FV 1 | 24/36 · 0/0 | 24/36 · 0/0 | 24/36 · 0/0 · FV 1 | 24/36 · 0/0 · FV 1 |
| doc4 | 36/36 · 0/9 | 36/36 · 0/9 | 36/36 · 0/9 | 36/36 · 0/9 | 36/36 · 0/9 | 36/36 · 6/9 | 36/36 · 0/9 | 36/36 · 0/9 | 36/36 · 0/9 | 36/36 · 6/9 | 36/36 · 0/9 | 36/36 · 6/9 | 36/36 · 0/9 | 36/36 · 0/9 |
| doc5 | 36/36 · 78/78 | 36/36 · 78/78 | 36/36 · 78/78 | 36/36 · 78/78 | 33/36 · 76/78 | 33/36 · 76/78 | 33/36 · 76/78 | 33/36 · 76/78 | 35/36 · 77/78 | 35/36 · 77/78 | 35/36 · 77/78 | 35/36 · 77/78 | 35/36 · 77/78 | 35/36 · 77/78 |
| doc6 | 28/36 · 60/60 | 28/36 · 60/60 | 29/36 · 60/60 | 29/36 · 60/60 | 33/36 · 60/60 | 33/36 · 60/60 | 33/36 · 60/60 | 33/36 · 60/60 | 32/36 · 60/60 | 32/36 · 60/60 | 32/36 · 60/60 | 32/36 · 60/60 | 28/36 · 60/60 | 28/36 · 60/60 |
| doc7 | 30/30 · 21/21 | 30/30 · 21/21 | 29/30 · 21/21 | 29/30 · 21/21 | 30/30 · 21/21 | 30/30 · 21/21 | 30/30 · 21/21 | 30/30 · 21/21 | 30/30 · 21/21 | 30/30 · 21/21 | 30/30 · 21/21 | 30/30 · 21/21 | 30/30 · 21/21 | 30/30 · 21/21 |

## Ce que la 3.8 qui tranche seule change

- C★ contre C : champs -2, lignes +15, faux verts +4, durée médiane +0,0 s.
  - champs qui deviennent justes : doc1 : lignes : price (×2 parcours) ; doc2 : currency (×3 parcours) ; doc5 : lignes : kind ; doc5 : tvaAmount (×2 parcours) ; doc6 : documentType
  - champs qui deviennent faux : doc3 : amountTTC ; doc3 : date (×2 parcours) ; doc3 : orderNumber (×3 parcours) ; doc6 : items.count ; doc6 : tvaAmount
- C★′ contre C′ : champs -6, lignes +15, faux verts +4, durée médiane +0,0 s.
  - champs qui deviennent justes : doc1 : lignes : price (×2 parcours) ; doc2 : currency (×3 parcours) ; doc5 : lignes : kind ; doc5 : tvaAmount (×2 parcours) ; doc6 : documentType
  - champs qui deviennent faux : doc3 : amountTTC ; doc3 : date (×2 parcours) ; doc3 : orderNumber (×3 parcours) ; doc6 : items.count (×3 parcours) ; doc6 : tvaAmount (×3 parcours)
- C★v contre C : champs -2, lignes +15, faux verts 0, durée médiane +0,0 s.
  - champs qui deviennent justes : doc1 : lignes : price (×2 parcours) ; doc2 : currency (×3 parcours) ; doc5 : lignes : kind ; doc5 : tvaAmount (×2 parcours) ; doc6 : documentType
  - champs qui deviennent faux : doc3 : amountTTC ; doc3 : date (×2 parcours) ; doc3 : orderNumber (×3 parcours) ; doc6 : items.count ; doc6 : tvaAmount
- C★v contre C★ (le statut seul) : champs 0, lignes 0, faux verts -4, durée médiane +0,0 s.
  - champs qui deviennent justes : aucun
  - champs qui deviennent faux : aucun

## Ce que N rattrape seule

- A + N contre A : champs 0, lignes 0, faux verts 0, durée médiane +0,0 s.
  - champs qui deviennent justes : aucun
  - champs qui deviennent faux : aucun
- B + N contre B : champs 0, lignes 0, faux verts 0, durée médiane +0,0 s.
  - champs qui deviennent justes : aucun
  - champs qui deviennent faux : aucun
- C + N contre C : champs +3, lignes +6, faux verts 0, durée médiane +0,0 s.
  - champs qui deviennent justes : doc2 : currency (×3 parcours) ; doc4 : lignes : price (×2 parcours)
  - champs qui deviennent faux : aucun
- C′ + N contre C′ : champs +3, lignes 0, faux verts 0, durée médiane +0,0 s.
  - champs qui deviennent justes : doc2 : currency (×3 parcours)
  - champs qui deviennent faux : aucun
- C★ + N contre C★ : champs 0, lignes +6, faux verts 0, durée médiane +0,0 s.
  - champs qui deviennent justes : doc4 : lignes : price (×2 parcours)
  - champs qui deviennent faux : aucun
- C★v + N contre C★v : champs 0, lignes +6, faux verts 0, durée médiane +0,0 s.
  - champs qui deviennent justes : doc4 : lignes : price (×2 parcours)
  - champs qui deviennent faux : aucun
- C★′ + N contre C★′ : champs 0, lignes 0, faux verts 0, durée médiane +0,0 s.
  - champs qui deviennent justes : aucun
  - champs qui deviennent faux : aucun

## Lecture honnête

- 21 parcours par variante, sept documents : un gain porté par un seul document se voit dans le tableau par document ; il ne prouve pas que la règle vaille pour une autre facture.
- Le vote à trois garde une valeur sur laquelle les deux Flash-Lite s’accordent à tort ; la 3.8 qui tranche seule n’y change rien tant qu’elle n’est pas appelée (accord des deux lectures, arithmétique juste). Seul un désaccord ou un contrôle en échec la fait parler.
- N ne touche que la devise : il ne rattrape rien d’autre, et seulement quand la lecture a écrit une abréviation de franc.

