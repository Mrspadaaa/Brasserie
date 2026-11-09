# l4 — la levure et sa conduite lues ensemble (chaude, passe 2, 09.11)

Idée : une carte compacte de la levure en tête, puis le graphe de conduite agrandi, qui porte derrière ses paliers la plage de la
fiche (18–26 °C, bande hachurée or, la couleur de la levure) : on voit d'un coup que les 19 °C tombent dans sa plage.

## D'où vient chaque partie
- Carte : r1 (nom, Fermentis · sèche, « 2–3 sachets · 15–24 g » à droite, ×) et z1 (« FG 1,012–1,015 · 6,8–7,1 % vol » en pastilles).
- Graphe : la station de sa capture, agrandie (348 × 318), avec sa structure entière : °C × jours, 19 °C J0–J10, 4 °C jusqu'à J12,
  poignées ↕ et ↔, palier 1 surligné, « 4 paliers · fin J12 ». Ajout : la bande de la fiche. Pas de refonte du graphe.
- u4 / u3 : l'idée « laquelle tient ma conduite » (la plage contre la conduite), sans l'échelle comparative au repos.
- s1 : le champ et ses puces sous le graphe.

## Cadres
1 repos · 2 floculation touchée (« recherche… » dans la carte, 4/20 aujourd'hui) · 3 résultat (« floculation moyenne à haute »,
« à confirmer », source, Corriger / Garder) · 4 pas de levure : le graphe reste, **sans bande** ; carte tiretée « sa plage viendra sur
la conduite » · 5 produit exact non choisi (« — sachets », « choisis le sachet pour la dose »).

## Honnêteté
- La bande couvre J0 à J10, la fermentation ; la garde à froid à 4 °C (J10–J12) est hors bande par dessein, sans alerte : la plage
  de température d'une levure vaut pour la fermentation. À confirmer par le pilote.
- Valeurs US-05 de la fiche ; **fictif** : le résultat de floculation du cadre 3. Ni prix ni « Brouillon ».

## Boosters UX
- `conduite-plage` — lire et ajuster ; la plage de la levure derrière les paliers, poignées ↕ ↔ sur la donnée.
- `dose-sachets`, `chercher`, `ligne-levure`, `champ-levure`.
- B1 OK · B2 OK (le graphe domine, la carte au-dessus) · B3 77 mots · B6 ~ (12, 13, 14, 20, 30) · B8 OK (vide sans bande) · B9 s.o. ·
  B11 « US-05, 2–3 sachets, et mes 19 °C dans sa plage 18–26 » · B12 OK · B13 ~.

## Contrôles
- PAGE OK. Mots : **77** (> 72) ; 47 hors données. Écart : le graphe agrandi porte environ 20 mots de graduations et d'étiquettes
  (acquis) ; hors graphe, environ 57.
- PANEL (4 cadres p2l) : PANEL ECHEC par la diversité 0,93 (chrome imposé). CHOIX OK (levure ouvert).
- Captures : `l4-haut.png`, `l4-page.png`, `l4-cadres.png`, `l4-c1.png` à `l4-c5.png`.
