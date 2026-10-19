# u2 — Frise de cuve : ce qui est vraiment faisable

**L'idée.** Le dry hop posé sur la frise de la cuve, de J0 à J20, avec des sachets qu'on glisse et qu'on étire au doigt. Sous les sachets, les risques et l'arôme simulé jour par jour, sur la même échelle de temps.

## Pourquoi ça aide à comprendre et à choisir

- Le brasseur : « 3j Citra, 7j Galaxy ; 3j Citra - 5j Idaho 7 […] C'est extrêmement complexe à voir ce qui est vraiment faisable ». La frise répond par un verdict en une ligne, qui change sous le doigt.
  - « Faisable, mais Galaxy reste 4 j sans gain mesuré ; hop creep possible jusqu'au froid. »
  - « Pas faisable tel quel : Idaho 7, 40 g demandés, 20 g en stock. » C'est le vrai stock de l'app : le brassin « 3 j Citra → 5 j Idaho 7 » à 2 g/L ne se fait pas avec ce qui est en cave. Le sachet en défaut est choisi d'office, et le passer à 1 g/L le rend faisable.
- Un geste par question :
  - étirer ou raccourcir un sachet : les jours au-delà de 3 se hachurent, « +N j sans gain » ; l'arôme ne bouge pas (H73 : rien de mesuré au-delà de 3 j) ;
  - glisser le froid (❄) : la zone de hop creep (contact × levure vivante) rétrécit ;
  - glisser un sachet avant J6 : il passe en dry hop actif, la bande de biotransformation apparaît, et la levure choisie compte ;
  - choisir la levure (US-05, Pomona, Verdant, Diamond) : la légende chiffre l'écart avec US-05.
- L'ajout cumulé est calculé comme le moteur du pilote : activités additionnées avant la courbe, donc saturation partagée.
  - Rejoué sur ses 60 paires : écart ≤ 0,2 point. Sur son cas K3 jour par jour : identique au dixième.
  - La somme naïve se tromperait jusqu'à 18,7 points.
- Une ligne « Ce qui compte » par drapeau : durée, hop creep, ouvertures, dose à cru, biotransformation, deux houblons ensemble, bière noire. Chaque ligne ouvre ses vraies valeurs et ses sources, et la plage de chaque ajout seul (grille du pilote).

## Ce qu'elle casse

- **Premier écran : 242 mots** (règle des 60 dépassée). Ce sont les jours, les étiquettes de couloirs et la liste des drapeaux.
- Les courbes montrent le **centre** du simulé. La plage n'est pas recalculée pour un assemblage ; elle est donnée ajout par ajout dans chaque feuille. C'est la faiblesse principale du concept.
- La fin de fermentation active est fixée à J6 (convention de la frise, comme les cas du pilote) : il faudrait la régler sur le brassin réel.
- Verdant et Diamond, pour un ajout seul : la grille n'a que US-05 et Pomona. La courbe montrée est celle d'US-05, et la feuille le dit.
- Glisser à 17 px par jour est précis mais petit au doigt. Les poignées ont une cible de 22 px.

## Captures (`captures/u2/`)

- `galaxy7-01-avant-citra3-galaxy7` → `02-apres-galaxy3j` (poignée tirée de 4 jours) → `03-apres-froid-J10` ;
- `idaho-01-avant-idaho7-stock` (pas faisable) → `02-apres-1gL` (faisable) ;
- `ensemble-01-avant-us05` → `02-apres-pomona` → `03-feuille-bio`.

## Contrôle d'honnêteté

```
u2 · 3 pictos · 2 mesurées · 6 simulées · 0 faute(s)
LISIBLE OK
```
