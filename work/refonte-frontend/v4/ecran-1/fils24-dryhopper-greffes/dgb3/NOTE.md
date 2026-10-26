# dgb3 — « Trois épingles sur le rail »

**Chaleur : tiède.** **Greffe : `data-greffe="trois-plans-w2"`**, sur les épingles du rail et sur les deux lignes sous le
bandeau.

L'idée, une seule : la seconde moitié de w2 (« le plan tenu réglé en dessous ») portée dans le geste de l'écran. Les
trois plans sont trois épingles S, F, O sur le rail ; le pouce tient un plan (sa lettre dans la bulle du pouce, « F 2 j »)
et le règle en glissant, exactement comme le rail de l'écran le fait déjà ; toucher une autre épingle (ou sa ligne) prend
ce plan sans déplacer le premier. Le bandeau des quatre chiffres reste celui du plan tenu ; dessous, les deux autres plans
en deux lignes de 32 px : nom, moment, et leurs quatre chiffres, chacun avec son picto.

## Base et données
- Base : l'écran Dryhopper de la maquette jouable, tel qu'il se joue (`prototypes/houblons-v4/maquettes/parcours/dryhopper/etat.html`,
  sa p4b2f rendue sur le moteur ; « Pour le dryhopping, la meilleure version est celle de l'app jouable mais il lui faut
  quelques améliorations »). La page charge le même bundle et la même route ; rien n'y est retiré ni restylé, la greffe
  s'ajoute (script après le bundle, classes préfixées, remise en place si un rendu React la détache).
- Un seul facteur libre, le moment (D98) : les trois plans de w2 sont trois moments du même Idaho 7, même 4 g/L, même US-05.
  Sage = 0′ (rien à froid), Franc = actif · 2 j (★ du moteur), Osé = après · 3 j (le plus d'arôme, le résineux monte).
  w2 faisait varier dose, jours, moment et levure : ici, seulement le moment.
- Chiffres : aucun n'est recopié. Au chargement, la greffe pose le rail de l'écran sur chaque plan (ses propres touches),
  lit ce que le moteur affiche (bandeau, 12 barres, couleurs), puis revient sur ★. « ≈ » interpolé, « ? » inconnu gardés.
- Régénérer : `node <id>/generer.mjs` (socle `dgb1/socle-dgb.mjs`).

## Ce qui tient
- Aucune nouvelle surface : la greffe vit dans le rail et sous le bandeau ; la figure reste entière au premier écran.
- Le plan devient réglable : Sage peut passer de 0′ à 10′, ses chiffres suivent (lus sur le moteur à chaque cran).

## Ce qui casse
- Les épingles de 18 px sont petites au doigt (le rail de l'écran fait 26 px de haut).
- Les lignes ne s'alignent pas sur les colonnes du bandeau (une colonne de plus pour le nom).
- Le réglage d'un plan au doigt n'est pas capturé (seul le toucher d'une épingle l'est).

## Captures
`captures/dgb3.png` (repos, F tenu) ; `captures/dgb3-geste.png` (épingle S touchée : pouce « S 0′ », lignes F et O).

## Contrôles (sorties recopiées, 24.10 soir)
| critère | sortie |
|---|---|
| G1 `variantes.mjs dgb1 dgb2 dgb3 dgb4` | VARIANTES-BIEN-4 |
| G2 `controle-pictos-trait … --page=etat.html` | TRAIT OK (23 pictos de famille, 0 faute) |
| `controle-commun --sans=mots` | COMMUN OK |
| `controle-une-question` | UNE-QUESTION OK (1 groupe libre : moment) |
| `mots-premier-ecran --max=80 --sans-donnees` | MOTS OK |
| `controle-panel` (dgb1 à dgb4) | PANEL OK (remplissage médian 0,74 ; ressemblance 0,90 ; 0/6 paires presque identiques) |
| `controle-choix --ecran=dryhopper` (copie de la page en route `dryhopper`) | ECHEC sur un seul état : `etat-dryh-repos` 117 mots au premier écran (au plus 96) ; les 20 autres états de sa base OK. La base seule fait exactement 96 (CHOIX OK) : tout chiffre ajouté au premier écran dépasse. Écart assumé en v0 (`--sans=mots`), décision au pilote. |
