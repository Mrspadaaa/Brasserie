# Brief passe 4 — Chercher (filtres) et Suggérer (générique), 09.11

Plancher à enrichir (L07). Lire d'abord : `BRIEF-PASSE2.md` (règles de forme, cadres 390 × 844, captures, verifier-page),
`savoir/AUDIT-FILTRES.md` (la liste d'axes, mesurée), `p2/c5a/` et `p2/s6a/` (etat.html, NOTE.md, captures),
SPEC-BRASSEUR.md (fin, ses mots du 09.11), DEFAUTS-RECURRENTS.md ligne LV-1.

## Ses choix (règle n° 1, ne pas défaire)
- l5b choisie (étape), s5a choisie (Comparer), s6a choisie (Suggérer, la forme : cartes comme q2b). c5a retenue pour Chercher,
  « pas assez de filtre ».
- Ses mots : « houblons, banane ECT était juste des exemples c'est pas assez générique DU TOUT !!!! ».

## Ce qui est demandé (4 maquettes statiques, 3 cadres chacune, classes préfixées)
- **c6a, c6b** : c5a telle quelle (carte de la US tapée, pont, écarts, ordre c4), avec les filtres de l'audit :
  premier rang (Boisson = bière par défaut, Famille, Style, °C, Atténuation, Tolérance à l'alcool, Effets, Floculation,
  Forme, Disponibilité, En stock), « Plus de filtres » (Sans STA1, Labo, Vitesse, Rondeur, Soufre, Nutriments, Sans alcool),
  « Trier par ». Chaque choix porte son compte et son « non documentées » (toucher = recherche IA). Tolérance et °C
  pré-réglés depuis la recette en repère, jamais en filtre imposé (US-05 reste en tête après « 1056 »).
  c6a et c6b diffèrent par la façon de tenir 18 filtres sur 390 px (exemples : tiroir à sections repliables ; rangée de
  puces défilante + feuille ; filtres actifs en résumé d'une ligne). Cadres : repos, tiroir ouvert, trois filtres posés.
- **s7a, s7b** : s6a (cartes, langue q2b) rendu générique : les cartes sont **les axes de la liste**, pas des buts nommés.
  Chaque axe a **+ et −** (plus / moins d'esters, de phénols, de thiols, d'atténuation, de rondeur, de clarté, de tolérance,
  de soufre, de vitesse…), relatif à la levure actuelle de la recette. Le résultat reclasse les levures (vendues chez toi
  d'abord), avec l'écart sur l'axe, sa source et le levier de conduite quand il existe (°C). Deux axes combinables.
  Aucune carte écrite pour un exemple (pas de « Plus de banane » en dur : banane est un descripteur de l'axe esters/arômes).
  s7a et s7b diffèrent par la façon de montrer tous les axes (exemples : cartes groupées Arômes · Corps · Conduite ;
  un curseur −/+ par axe).

## Comptes
Vrais, calculés sur `src/data/yeastCatalogueBootstrap.json` et `yeastSupplyBootstrap.json` (reprendre
`audit` et le script des comptes de c5a) ; « estimé » écrit quand le compte vient d'une recherche de mots.

## Contrôles (chaque maquette)
- verifier-page PAGE OK, captures ouvertes (L12).
- c6 : les 11 filtres du premier rang et les 7 du second sont présents ; US-05 en tête au cadre 1.
- s7 : chaque axe montré a un + et un − ; aucune carte de but nommé (échoue sur s6a : LV-1).
- NOTE.md : idée, cadres, comptes et leur origine, boosters, mots.

Possède : `p2/c6*/**`, `p2/s7*/**`. Plafond : 50 tours. Rendre une ligne.
