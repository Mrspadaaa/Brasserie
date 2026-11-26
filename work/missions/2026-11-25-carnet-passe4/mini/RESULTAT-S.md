OK — 10 mini maquettes S (9 écrans, glisser en 2 états), sombres, chacune à côté de sa source

## Fichiers écrits (lettre S)
- `mini/S-liste.html` (v02) · `S-ranger-repos.html` + `S-ranger-glisse.html` (v01 glisser) · `S-noter.html` (v01 + M4) ·
  `S-rangee.html` (v01) · `S-notes-ecrit.html` (v04, tel quel) · `S-notes-ligne.html` (M4 + v01 + v03) · `S-ia-lit.html` (v03) ·
  `S-ia-echec.html` (v01) · `S-memo.html` (v02).
- Captures 390 × 844, dsf 2 : `mini/cap/S-*.png` (10). Chaque page HTML montre l'écran et, à droite, la capture de SA version
  (`../page/img/…`) avec ce qui est repris et ce qui change.
- `mini/COMMUN.md` : j'ai écrit une première version ; O l'a remplacée par la sienne pendant que je travaillais. J'ai repris
  ses jetons (couleurs d'état, trouvé ✓ plein, pas trouvé « ? » cerclé, estimé ≈ bleu tireté, en-tête 48, onglets 44 avec
  « ✦ hh:mm », pouce = champ + ✦ + « + », texte ≥ 14 px, aucun bandeau « exemple » dans l'écran). Le fichier est à O : je ne le commite pas.

## Contrôles
- Mesure DOM des 10 pages (script de capture) : aucun débordement hors des 390 px, aucun texte coupé sans points de suspension,
  aucun texte sous 13 px hors clavier (le seul 10 px est le glyphe dans la marque ✓/? de 15 px). Liste : 7 lignes de carnet
  visibles + 3 sous-catégories repliées (CARNET-LISTE-COMPACTE).
- `controle-choix.mjs` ne s'applique pas : il compare une app construite (routes `etat.html`), pas des pages statiques. La
  fidélité se juge sur chaque page, côte à côte avec sa source.
- J'ai ouvert et jugé les 10 captures (4 planches). Corrigé en route : pastilles du coup d'œil qui débordaient (« À faire »
  passé dans l'en-tête), lignes de méta coupées, badge « 1 à ranger » sur 2 lignes, « Je cherche » / « Décidé » incohérents
  entre Noter et Rangée, doublons (150 CHF, devis, « 2 ans ») retirés, rond d'appui mal placé.

## Ses remarques appliquées
- Visuel : barres d'avancement colorées + mot d'état, couleurs d'état, marques de fait avec leur mot, chiffre clé en grand
  (mémo « 2 ans », tuiles de l'échec). Aucun tableau, aucun symbole muet.
- Précis : jours comptés depuis le 26.11 (« 4 j · achat 30.11 », « ouvert 2 j »), heures 21:18 / 21:26 / auj. 08:41 ;
  trouvé / pas trouvé / estimé distincts ; chaque fait renvoie à sa ligne (« l. 2 », « l. 4–5 »).
- Honnête : prix du condenseur « 🔗 en lecture » (pas de 540 CHF inventé comme en v01) ; photo imaginée retirée là où le
  carnet n'en a pas ; « Condenseur B » nommé Brewtools (2e lien de son carnet) ; dates impossibles de v02 corrigées.
- Pratique : action principale sous le pouce, cibles de 44 px ; pendant le glisser, les sous-catégories se replient en cibles
  (même hors filtre) ; un seul geste change catégorie et priorité ; changements de la feuille décochables un par un.
- Aucune frise générique (retirée de l'échec v01) ; aucune question au pouce ; Organisé reste le premier onglet.

## Prédiction
« Là c'est clair et ça ressemble à mes choix » ; le risque : la liste (v02) reste dense, avec 7 lignes et pas plus.

DÉCISION À PRENDRE : aucune.
CONNAISSANCE : `controle-choix.mjs` ne lit que des routes construites ; une mini maquette statique se prouve par la capture côte à côte avec sa source.
LEÇON PROPOSÉE : deux concepteurs sur des jetons communs : un seul écrit COMMUN.md (désigné dans le brief), l'autre attend et lit. Sinon les deux écrivent en même temps et l'un écrase l'autre (26.11).
