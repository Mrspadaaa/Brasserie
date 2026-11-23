# Chasse Calendrier : regard visuel (21.11)

Version jugée : tag `en-ligne/2026-11-21-tour8`, build de test (`scripts/parcours/vite.parcours.config.mjs`), `?dev-local&finance-demo=parcours-calendrier`, fixture `scripts/parcours/fixtures/calendrier.mjs`. Ni Gemini ni seedData.
Joué : 390×844 tactile (CDP touch) et 1280×800 souris, thèmes clair et cave, 844×390 paysage (clair). Échelles : 6 sem., 3 mois, 6 mois, An au menu ; 2 sem. et 4 sem. par la poignée de fin ; « 17 sem. » essayé en étirant depuis 3 mois, mais la poignée n'a pas bougé (vue identique à 3 mois). Gestes : toucher une barre (fiche), glisser une barre en cuve et une barre planifiée, appui long, menu, cacher la courbe, aligner, toucher une semaine, toucher la courbe, retards, + de rangée, picto d'étape.
Mesures : audit DOM à chaque capture (textes qui se chevauchent, rognés, débords, contraste), ordre des pistes lu par `aria-label`.
Captures (ouvertes et regardées) : `C:/Users/mrspa/AppData/Local/Temp/chasse-visuel-out/` (1×) et `…/chasse-visuel-out/z/` (3×) ; planches P1 à P6 et Q1, Q2.
Défauts connus non recopiés : CAL-VIDE (≈ 300 px vides en 2 sem.), VUE-FOND, CAL-VIDES-EN-LIGNE (« vides Travaux Activités »), CAL-FICHE, CAL-GESTE-BRUIT (étiquette de glisse sur NEIPA Test), CAL-JOUR.
Le contraste 1,1:1 que l'audit signale sur les barres en clair est un faux positif : le fond de la barre est un élément frère. Aucun débord horizontal de page (scrollWidth = largeur partout).

## Défauts

### CH-visuel-1 — gênant — La ligne du solde barre les étiquettes de la courbe
- Geste : 390, menu de période, « 3 mois » (aussi 6 mois, et en paysage).
- Attendu : chaque étiquette (nom, montant, période du cadre) reste lisible ; aucun trait ne la traverse.
- Constaté : « S44 – S3 2027 » (étiquette du cadre) est coupé par une marche verte et le trait bleu, ce qui donne « S44 – S3 20Ʒ7 ». À 3 mois, le trait passe aussi sur « Hotte −900 ». À 6 mois, « lol −600 » et « Hotte −900 » sont sur les marches. En aligné à 3 mois, « Facture Café du Lac +1 200 » est barrée. Même chose en cave, à 1280 et en paysage.
- Captures : `z/clair-ent-3mois.png`, `z/clair-ent-6mois.png`, `z/clair-al-3mois.png`, `pays-clair-e-3mois.png`, `d-cave-e-6mois.png`.
- Probable : `src/ui/calendrier/entete/Courbe.tsx` (pose des `text.ent-nom`) et `Fenetre.tsx` (étiquette du cadre), sans évitement du tracé.

### CH-visuel-2 — gênant — En aligné, « −45 » collé au « 0 » se lit « −450 »
- Geste : 390, bouton règle « Aligner la courbe sur la frise », 6 sem.
- Attendu : le repère « 0 » de la ligne zéro reste à part des montants.
- Constaté : en haut à droite, « Emballage −45 » finit contre le « 0 » du repère. On lit « Emballage −450 », donc un montant faux.
- Capture : `z/clair-al-6sem.png`.
- Probable : `src/ui/calendrier/entete/Courbe.tsx:572` (`text.ent-zero-l`, x = largeur − 3), que les étiquettes n'évitent pas.

### CH-visuel-3 — gênant — En aligné, les étiquettes s'empilent en escalier sur la courbe
- Geste : aligné, 3 mois à 390 ; 6 sem. à 1280.
- Attendu : sur la courbe, quoi et quand, lisibles (SPEC 17.11 : « le graph avec toutes les infos »), sans qu'elles se couvrent.
- Constaté : à 390 en 3 mois, sept étiquettes en cascade couvrent toute la zone rose (Brouwland, Commande de malt, La Cigogne, Facture, lol, Hotte, TVA T4). À 1280 en 6 sem., huit étiquettes sont serrées entre S45 et S47, l'une coupée (« Énergie et net… −24 »), et le reste de la largeur est vide.
- Captures : `z/clair-al-3mois.png`, `d-clair-00-repos.png`, `d-clair-g-appui-long.png` (en-tête).

### CH-visuel-4 — gênant — En An, l'étiquette du cadre ne dit pas la période (forme nouvelle de CAL-PERIODE-LIBRE)
- Geste : menu, « An » (390, paysage, deux thèmes).
- Attendu : le cadre dit la même période que la barre de l'app et la frise.
- Constaté : la barre de l'app dit « 26.10.26–24.10.27 » et la frise va de O à O (octobre 2026 à octobre 2027), mais le cadre de la courbe dit « janv. – nov. 2027 ». Le cadre ne couvre pas non plus la même largeur que la frise.
- Captures : `z/clair-ent-An.png`, `m-clair-e-An.png`, `pays-clair-e-An.png`.
- Probable : `src/ui/calendrier/entete/Fenetre.tsx:111` (`etiquetteCadre`, branche année).

### CH-visuel-5 — gênant — À l'arrivée, la pastille dit « Nov. », la frise montre 6 semaines (forme nouvelle)
- Geste : ouvrir le Calendrier (premier chargement, clair et cave).
- Attendu : la pastille d'échelle dit ce que la frise montre.
- Constaté : la pastille noire et la barre de l'app disent « Nov. », mais la frise et le cadre vont de S44 à S49 (26 oct. – 6 déc.). Dès qu'on choisit une durée au menu, la pastille dit « 6 sem. ».
- Captures : `m-clair-00-repos.png`, `m-cave-00-repos.png`.
- Probable : `src/ui/calendrier/entete/EnTete.tsx:705` (`libelle` tiré de la période de l'app, pas de la fenêtre).

### CH-visuel-6 — gênant — Les pistes des brassins changent d'ordre au toucher (forme nouvelle de VUE-SAUTE / CAL-FICHE-CACHE-BARRE)
- Geste : 390, 6 sem. ; toucher la barre « Milk Stout » (fiche) ; ou toucher S47 dans la bande ; ou recharger.
- Attendu : chaque brassin garde sa piste. Seule la fiche s'insère.
- Constaté : l'ordre lu au repos est « Ssr, Ttt, Hefe, neipa v3, neipa v3, Jhhh… ». Après le toucher de Milk Stout, il devient « Hefe, Jhhh, Milk Stout, [fiche], NEIPA Test, Jhhh, Ssr, Ttt… ». Après le toucher de S47 : « Hefe, Jhhh, Milk Stout, NEIPA Test, Jhhh, Blonde, Ssr… ». La même vue 6 sem. a aussi deux ordres selon le chemin suivi (après le tour des échelles : Hefe d'abord ; après rechargement : Ssr d'abord). Ssr passe ainsi de la 1re à la 7e piste : tout ce que le brasseur regardait change de place.
- Preuve : `z/R-clair.json` (ordreRepos, ordreRepos2, ordreFiche, ordreSemaine) ; captures `m-clair-e-6sem.png`, `m-clair-f-fiche.png`, `m-clair-s-semaine.png`, `z/clair-fiche.png`.
- Probable : l'attribution des pistes de la frise (`src/ui/calendrier/frise/`) dépend de la fenêtre et de la chose ouverte, et non d'un ordre stable.

### CH-visuel-7 — gênant — Le message d'un brassin en cuve coupe la consigne utile
- Geste : 390, 6 sem., glisser la barre « neipa v3 » (en cuve) vers la droite.
- Attendu : le message dit quoi faire.
- Constaté : on voit seulement « Brassin en cuve : le jour de brassage ne bouge pas.… ». La phrase « Seul le jalon de fin se glisse. » (texte lu dans le DOM) est coupée par la limite de deux lignes. Le brasseur apprend ce qui ne marche pas, pas ce qui marche.
- Capture : `z/clair-glisse-cuve-apres.png` ; aussi `m-clair-g-barre-apres.png`.
- Probable : `src/ui/calendrier/message.css:26` (`-webkit-line-clamp: 2`) avec le lien « Ouvrir le brassin › » sur la même ligne.

### CH-visuel-8 — gênant — Noms écrits loin de leur barre, barres vides
- Geste : 390, 6 sem., au repos (deux thèmes).
- Attendu : le nom dans sa barre, ou contre elle (CAL-PAYS-COMPACT : « étiquette dans ou contre sa barre »).
- Constaté : quatre barres de S48–S49 (≈ 115 px, de quoi loger le nom) sont vides. Leurs noms sont écrits à gauche, sur la grille vide, à 100 px et plus : « Blonde d'automne · coût à venir J0 / 28 », « neipa v3 −69 + J0 / 12 · prête 7 déc. », « Jhhh · coût à venir J0 / 15 », « Ttt −69 + J0 / 28 · prête 28 déc. ». On ne voit pas à quelle barre va quel nom.
- Captures : `m-clair-00-repos.png`, `m-cave-00-repos.png`, `z/clair-fiche.png` (bas).
- Probable : `src/ui/calendrier/frise/Barre.tsx:492` (`cal-lbl-${cote}`, côté choisi hors de la barre).

### CH-visuel-9 — gênant — Appui long : un menu de texte
- Geste : 390, appui long sur la barre « Ssr ».
- Attendu : des actions reconnaissables d'un coup d'œil (PORTRAIT : peu de mots).
- Constaté : il y a trois tuiles de 3 à 4 lignes (« Épingler / reste visible, rangée masquée », « Brassins seuls / 6 rangées masquées »), deux lignes d'action, puis un paragraphe de 3 lignes (« Un brassin ne se retire pas d'ici : on ne supprime rien. Ouvre le brassin pour l'annuler (Brassins). ») et un lien. Le menu couvre la moitié des pistes ; à 1280, il couvre les barres voisines.
- Captures : `m-clair-g-appui-long.png`, `m-cave-g-appui-long.png`, `d-clair-g-appui-long.png`.
- Probable : `src/ui/calendrier/frise/MenuAppuiLong.tsx`.

### CH-visuel-10 — mineur — Texte rogné dans une barre
- Geste : 6 mois à 390.
- Constaté : la barre « Blonde d'automne » contient « J0 / … » en ellipse, alors que son nom est dehors, à droite.
- Capture : `m-clair-e-6mois-plein.png`.

### CH-visuel-11 — mineur — « −69 + » : un « + » qui ressemble à un signe
- Où : barres et étiquettes de « Ttt » et « neipa v3 » (toutes les échelles).
- Constaté : un « + » suit le montant, sans explication. On lit « moins 69 plus… ». Le pied de la rangée dit « −228 + coût à venir ». Ici, le reste du sens manque.
- Capture : `m-clair-00-repos.png`.

### CH-visuel-12 — mineur — Résumés de rangée coupés à 390
- Constaté : « confirmé oct.–o… » (Brassins en An), « confirmé S44–… » (Papiers en 6 mois) et « confirmé oct.–… » (Papiers en An) sont coupés. La pastille « −1 051 + coût à venir » prend la place.
- Capture : `m-clair-e-An-plein.png`, `m-clair-e-6mois-plein.png`.

### CH-visuel-13 — mineur — Graduations irrégulières ou ambiguës
- Constaté : en 6 mois, on lit « S50 S52 ‹trou› S2 S4 ». S53 et S1 sont sautés : le pas fait 1,5 fois les autres et le rythme casse. En An, « O N D J F M A M J J A S O » : deux O, J J, M M, sans marque d'année, à côté d'un cadre qui dit « 2027 ».
- Captures : `z/clair-ent-6mois.png`, `z/clair-ent-An.png`.

### CH-visuel-14 — mineur — Semaine dépliée : légende minuscule qui déborde
- Geste : toucher S47 dans la bande.
- Constaté : « S47 16–22 nov. · toucher pour replier » est écrit en petit corps (≈ 9 px) et déborde sur S46. Les jours 16 à 22 sont serrés, et « 22 » touche « S48 ».
- Capture : `z/clair-semaine.png`.
- Probable : `src/ui/calendrier/entete/BandeColonnes.tsx:111`, `entete.css:270`.

### CH-visuel-15 — mineur — La bulle d'une étape masque la barre voisine
- Geste : 390, toucher le picto d'étape de « Ssr ».
- Constaté : la bulle « Brassage · 2 nov. » se pose sur la barre « Ttt » et cache son nom.
- Capture : `m-clair-j-jalon.png`.

### CH-visuel-16 — mineur — Points gris sans légende sur la courbe, en An aligné
- Constaté : des rangées de points gris « · · · » suivent les marches de la courbe de mai à octobre. Rien ne dit ce qu'ils sont.
- Capture : `z/clair-al-An.png`.

### CH-visuel-17 — mineur — En 2 sem., la courbe est vide
- Geste : réduire la fenêtre à 2 semaines (poignée de fin).
- Constaté : le cadre est tout rose, et le trait du solde est collé sur son bord bas, donc invisible. Aucune étiquette. Le cadre ne montre rien.
- Captures : `m-clair-e-2sem.png`, `d-cave-e-2sem.png`.

### CH-visuel-18 — mineur — Le côté de l'étiquette d'un jalon change sans raison visible
- Constaté : « Impôt sur la bière · Fruty » est à gauche de son picto (An), « Foire du Valais +2 400 » à gauche (6 mois) ; les autres sont à droite. La lecture zigzague.
- Captures : `m-clair-e-An-plein.png`, `m-clair-e-6mois-plein.png`.

### CH-visuel-19 — mineur — Feuille d'ajout : graduations pâles de la frise Durée
- Geste : + de la rangée Fêtes.
- Constaté : « nov. déc. janv. » sous la frise Durée sont minuscules et peu contrastés, surtout en cave.
- Capture : `m-cave-p-plus-rangee.png`.

## Bilan
9 gênants (1 à 9), 10 mineurs (10 à 19), 0 bloquant. Les deux thèmes donnent les mêmes défauts : aucun n'est propre au thème cave. À 1280, seul CH-visuel-3 est plus marqué. « 17 sem. » n'a pas été atteint au doigt : l'étirement de la poignée de fin depuis 3 mois n'a rien changé, à revoir avec le chasseur des gestes.
Arrêt : deux tours sans défaut neuf (paysage, puis cave à 1280).
