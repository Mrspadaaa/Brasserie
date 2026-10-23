OK — controle-retour.mjs : croix 44 px à l'encre (D109), même retour (D118), en-tête fixe (D119) ; échoue sur d332792c

## Fichiers écrits
- `work/refonte-frontend/v4/tournoi/outils/controle-retour.mjs`
- `work/refonte-frontend/v4/tournoi/outils/temoins/retour-ok/{biere,suggerer,comparer}/etat.html`
- `.../temoins/retour-petit/suggerer/etat.html`, `.../retour-ailleurs/suggerer/etat.html`, `.../retour-en-tete-saute/{biere,suggerer,comparer}/etat.html`
- `retour-sans-nom` (première version du contrat, ma création) retiré : remplacé par `retour-ailleurs` selon le changement de contrat.
- `portee-defauts.json` : ma seule ligne D109 (relue juste avant, réécrite en un seul processus ; D107, D108, D110, D114, D120 des autres voies intacts). Ses mots couvrent D109, D118, D119 ; portée suggerer, comparer, dryhopper, levure, substituer, biere ; verdict garde ; tourne oui.

## Ce que le contrôle fait (routes par défaut : biere, suggerer, comparer, dryhopper, levure, substituer ; 390 × 844 tactile puis 1280 × 800)
- Retour = `[data-role="retour"]` ; repli : premier bouton visible de l'en-tête nommé « Fermer » ou « Retour… » (mesuré quand même).
- D109 forme : une croix. Lue sur la capture agrandie ×4 de l'icône (masque d'encre : encre aux 4 coins, au centre, nulle au milieu des bords, symétrie H et V ≥ 70 %). Sondé à la main : × glyphe, ✕, svg lucide x, x plein = croix ; ‹, +, cercle = pas une croix.
- D109 taille : boîte ≥ 44 × 44 ; icône ≥ 20 px. Encre : couleur de l'icône (lue sur le tracé) à 24 au plus de la couleur la plus fréquente du texte (hors bouton). Boîte dans l'écran et l'en-tête ; centre non recouvert. Aucun mot exigé.
- D118 : un toucher mène à `#/ma-biere` (outil ouvert seul). De plus, si le dossier a `ma-biere` et `biere`, trois parcours joués à 390 px : Suggérer depuis l'étape (`pont-floral`), Suggérer depuis l'onglet (`pont-floral`, `pont-objectif-autre`, `pont-objectif-resin`), Comparer depuis Suggérer (`pont-comparer`) ; la croix doit mener à `#/ma-biere`. Sans ces pages : « parcours non joués », dit.
- D119 (biere, suggerer, comparer présents dans `--routes`) : centre de la croix à ±2 px en x et y ; hauteur de l'élément `<header>` à ±2 px ; hauteur du « bloc » = du haut du `<header>` au bas des onglets (`[data-role="onglets"]`, s'ils dépassent le header) à ±2 px. Mesuré : le `<header>` du PageShell et ce bloc, les deux sont imprimés.
- Sortie : une ligne par route et largeur, `RETOUR OK (n routes × 2 largeurs[, k parcours])` (0) ou `RETOUR ECHEC` + lignes `- D109|D118|D119 …` (1) ; page absente : code 2.

## Sorties décisives
- G1 d332792c : `ECHOUE OK (RETOUR ECHEC, code 1)` ; `RETOUR ECHEC (0/12 conformes, 60 manques)`. Mesures : « ‹ » de 28 × 28 px sur chaque outil, icône 16 px #333333 (encre #111111, #666666 sur substituer), pas une croix. D119 : en-tête 41 px sur biere (390), 33 px sur suggerer et comparer ; bloc 41 contre 81 (suggerer, onglets sous le header) ; croix en (22, 20) sur biere et (22, 16) sur suggerer. D118 : outil seul : comparer mène à #/suggerer, dryhopper à #/comparer?h=…, levure à #/dryhopper/idaho-7-1 ; parcours : Suggérer depuis l'étape → #/ma-biere (conforme), depuis l'onglet → #/biere, Comparer depuis Suggérer → #/suggerer.
- G2 retour-ok `--routes=suggerer` : `RETOUR OK (1 routes × 2 largeurs)` (croix 48×48, icône 22 px #1A1A1A = encre, en-tête 56, mène à #/ma-biere). Aussi `--routes=biere,suggerer,comparer` : RETOUR OK (3 routes × 2).
- G3 retour-petit : ECHOUE OK. 28 × 28, icône 16 px, #9CA3AF contre encre #1A1A1A (écart 149), pas une croix (chevron : coins 0/64/0/64 %).
- G4 retour-ailleurs : ECHOUE OK. Croix correcte (48 px, 22 px, encre), mais mène à `#/biere` : seul D118 échoue (2 lignes).
- G4b retour-en-tete-saute (biere 56, suggerer 56, comparer 64) : ECHOUE OK. Écart 8 px d'en-tête, 8 px de bloc, croix à 4 px en y ; seul D119 échoue (6 lignes).
- G5 : `PORTEE OK`.
- G6 : premier essai `TEMOINS ECHEC` : la fixture « voie Dryhopper » de systeme.mjs (pilote) ne citait pas controle-retour (ni controle-annuler, D120, autre voie) ; vérifié par `controlesDeLaPortee`. Le pilote a mis systeme.mjs à jour ; rejoué : `TEMOINS OK`.
- G7 : ce rapport (d332792c, retour-ok, retour-petit, retour-ailleurs, retour-en-tete-saute, 28).
- Captures : retour-ok rendu et ouvert en image (croix noire de 22 px sur 48 px, à gauche du titre) ; d332792c suggerer ouvert (« ‹ » gris de 28 px).

## Essais, doutes et limites
- Un essai par critère. Une seule correction : couleur de l'icône lue sur le premier tracé quand le svg n'a pas de peinture (x plein), sans effet sur lucide.
- D119 : sur d332792c, la hauteur de l'en-tête diffère aussi entre 390 (41) et 1280 (33) sur biere ; elle n'est comparée qu'entre onglets, à largeur égale. Le contrôle suppose que les onglets portent `data-role="onglets"` (c'est le cas dans Onglets.tsx).
- Non couvert : « dans le thème » (couleur de fond de la page non comparée à la maquette ; D106 le fait) ; la fiche (feuille, exclue par le brasseur) ; la touche retour du téléphone ; l'état après un chemin plus long que les trois joués ; un retour qui change de destination selon l'état (le contrôle joue ceux listés). La détection de croix est visuelle : une icône ⊗ (cercle autour) échoue, une croix avec pastille CSS passe.
- Les parcours supposent les `data-role` actuels (`pont-floral`, `pont-objectif-*`, `pont-comparer`) ; si p2 les renomme, le contrôle dit « introuvable » (échec franc, pas un faux vert).
- Le toucher viser le centre de la boîte : une croix de 48 px dont seul un svg de 22 px répond au clic passerait ; non mesuré.

## DÉCISION À PRENDRE
aucune bloquante. Recommandation : au portage, retirer `aria-label="Fermer"` hérité et garder `data-role="retour"`, que le contrôle vise en premier.

CONNAISSANCE : le « header » de la maquette n'est pas le même bloc d'un onglet à l'autre : sur d332792c, biere a ses onglets dans le `<header>` (41 px), suggerer les a dessous (header 33 px + onglets = bloc de 81 px) ; mesurer l'en-tête demande les deux.
LEÇON PROPOSÉE : un contrôle qui rend une portée dryhopper déclenche la fixture de systeme.mjs (« voie Dryhopper avec ses contrôles ») ; écrire la ligne de portée et la fixture dans le même tour, sinon TEMOINS ECHEC.
