# l1 — r3 resserré : la dose en grand, trois jauges plates (froide, passe 2, 09.11)

Idée : r3, sa préférée, sans établi ni instruments dessinés : la dose d'abord, en sachets et en grammes, puis trois jauges plates
de la langue p6-b2 (Rendement, Couleur), puis la station Conduite.

## D'où vient chaque partie
- r3 : la question « qu'est-ce qu'elle fait à ma bière » (FG en plage, alcool, température fiche + conduite, floculation) ; les sachets
  (2 pleins, 1 hachuré) de r2 greffés sur r3 (SYNTHESE, greffe 1).
- p6-b2 : la ligne sélectionnée (bord 2 px), le panneau gris des repères, la piste plate à crochet mono (« style 6–14 » → « 15–24 g »).
- s1 : le champ « Changer de levure » toujours prêt, puces dessous (stock d'abord, puis habituelle, hors catalogue, comparer).
- Conduite : la station de sa capture (`refs/conduite-app-aimee.jpg`), restylée à peine (« il peut être un peu restilisé ») : graphe
  °C × jours, 19 °C J0–J10 puis 4 °C jusqu'à J12, poignées ↕ et ↔, palier 1 surligné, « 4 paliers · fin J12 », « Jours de bascule et
  légende ». Ôtés au repos : « Brouillon », « 3 points à vérifier », la phrase d'aide et l'encadré « Palier 1 : ↕ … ».
- La dose est la plus grande chose de l'écran : 44 px contre 20 px pour les repères (SYNTHESE : « la dose on la voit à peine »).

## Cadres (`etat.html`, statique, aucun JS)
1 repos · 2 floculation touchée, « recherche… » sur place avec le compte du jour (4/20) · 3 résultat IA « moyenne à haute »,
« à confirmer », « fiche Fermentis · vue le 09.11 », Corriger / Garder ; la proposition en segments hachurés à contour tireté jusqu'à
« Garder » · 4 pas de levure (le champ prêt, curseur posé ; jauges vides, « — ») · 5 produit exact non choisi (« choisis le sachet pour
la dose », aucun chiffre) · 6 repos plus bas : la station Conduite entière sous les repères.

## Honnêteté
- US-05 (fiche, hypothèse 2) : 50–80 g/hL × 30 L = 15–24 g → 2–3 sachets de 11,5 g ; FG 1,012–1,015 ; alcool 6,8–7,1 % ; 18–26 °C.
  Aucune dose exacte au repos : la poignée ↔ est posée sur la plage, sans nombre.
- **Fictif** : le résultat « floculation moyenne à haute · fiche Fermentis » du cadre 3 est une valeur de démonstration, pas une donnée.
- Floculation inconnue : segments gris unis, jamais une barre à zéro. Biotransformation : puce « chercher » (loupe), non remplie.
- Aucun prix, aucun « Brouillon » au repos ; le stock en icône (cube) sur la puce Nottingham.

## Boosters UX (boosters-ux)
- `dose-sachets` — lire ; sachets dessinés (2 pleins, 1 hachuré = le haut de la plage) et « 2–3 » en 44 px.
- `regle-dose` — ajuster ; règle 0–40 g graduée par sachet, plage du fabricant hachurée, poignée ↔ sur la donnée (langue du graphe).
- `reperes` — lire ; densité (OG en trait, sucres mangés hachurés, FG en bande teal), température (dégradé, plage fiche cerclée,
  poignée ↔ de la conduite à 19 °C), floculation (3 segments).
- `chercher` — déclencher ; la loupe dans une puce tiretée ambre sur chaque donnée manquante ; touchée → « recherche… » sur place.
- `champ-levure` — choisir ; `ligne-levure` — lire / retirer ; `conduite` — ajuster (↕ ↔ de l'acquis).
- B1 OK (6 boosters marqués) · B2 OK (la dose domine) · B3 72 mots · B4 OK · B5 ~ (non mesuré) · B6 ~ (quatre tailles : 12, 14, 20, 44)
  · B7 non mesuré · B8 OK (vide, recherche, résultat, produit absent) · B9 s.o. (statique) · B10 s.o. · B11 « US-05 : 2–3 sachets, elle
  finit vers 1,012–1,015 à 18–26 °C » · B12 OK (s1 / p6-b2) · B13 ~ (puces 32 px, poignées 22 px).

## Contrôles
- `verifier-page.mjs` : PAGE OK (390 px, sans erreur ; `--min-images 0`, la page n'a pas d'image).
- `mots-premier-ecran.mjs --max=72` : **72 mots** (44 hors données).
- `controle-panel.mjs` sur les 4 premiers cadres de p2l : remplissage médian 0,66, 0 sous 0,50 ; ressemblance 0,93 → PANEL ECHEC
  (diversité : en-tête, bandeau, champ et station Conduite sont imposés par le brief, communs aux quatre).
- `controle-choix.mjs` : CHOIX OK (levure ouvert).
- Captures : `l1-haut.png`, `l1-page.png`, `l1-cadres.png`, `l1-c1.png` à `l1-c6.png`.
