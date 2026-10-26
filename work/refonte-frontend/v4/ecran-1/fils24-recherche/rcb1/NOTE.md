# rcb1 — « Tape comme tu parles »

- **Chaleur** : tiède (la forme de la série rcb : un autre genre de recherche, ici la phrase).
- **Idée** : un seul champ, on écrit la demande comme on la dirait ; la machine souligne ce qu'elle a compris, à la
  couleur de ce que c'est (famille, α en chiffres, cuve pour le moment, barré pour « pas de »), et la liste suit à
  chaque lettre (D138 : pas de bouton « Rechercher »). Ce qui n'est pas compris reste en pointillé gris : rien n'est
  deviné. Sous chaque nom, pas la demande répétée mais ce que le houblon dit **en plus** (ses mots hors des 12
  d'abord, en italique, puis ses mots de famille à leur couleur) : c'est ce qui les sépare entre eux.
- **Cas** : « passion, α < 12, dry hop, pas d'herbacé » → 18 houblons du catalogue (fruit de la passion cité, α max
  ≤ 12, herbacé non cité), 1 en stock (Hallertau Blanc 30 g), classés par huile totale (dry hop : l'huile fait
  l'arôme) ; « dry hop » trie, il ne filtre pas (aucun moment par houblon dans les données : dit dans la légende).
- **D'où, où** : le champ « Ajouter — houblon… » de l'étape (ligne grise ‹ Houblons 3/7 en haut) ; « + » ajoute à la
  recette, appui long ouvre la fiche courte (radar 12 familles, n/N fiches, « Lui seul »), glisser à gauche vers
  Comparer (barre du bas : « Comparer 2 », les deux déjà pris). Le glisser n'est pas joué dans cette v0.
- **Baseline** : pictos au trait de la planche v3 (épicé : cannelle et clou), couleurs des familles (jetons), thème
  blanc (D106), α en plage puis rôle en mot (L04), stock en petit badge (D23), lentille au style · 16D / absolu et
  zone des familles attendues (D75), légende derrière « ? » (D89), fiche à l'appui long (D25), 390 × 844, deux
  tailles de texte au premier écran (12 et 15 ; la fiche en 22).
- **Honnêteté** : huile « ? » quand elle n'est pas publiée (Vienna Gold) ; mots des fiches seulement, traduits (D97) ;
  « Passionfruit » de Hopsteiner ramené au même concept.

## Ce qui tient, ce qui casse

- Tient : on comprend en trois secondes ce qu'on a demandé et ce qui répond ; la ligne « en plus » (vin blanc chez
  Hallertau Blanc, caramel chez Callista, nectar chez Nectaron) fait la différence entre dix-huit houblons tropicaux.
- Casse : le champ est une page statique (pas de vraie saisie en v0) ; la grammaire comprise est courte (famille, mot
  précis, α, moment, « pas de », stock) ; 141 mots au premier écran (18 lignes denses), au-dessus de D1.

## Contrôles (24.10, soir)

- `concepts.mjs` : CONCEPTS-BIEN-4 ; `controle-pictos-trait --page=etat.html` : TRAIT OK (67 pictos, 0 faute).
- `controle-commun … --page=etat.html --sans=mots` : COMMUN OK (couleurs 3 teintes, au-style, survol, blocs, contraste,
  fiche 4/4, standard, trait, legende, parlant, brutes).
- `controle-panel` sur les quatre captures : PANEL OK (remplissage médian 0,70, ressemblance 0,86, 0 doublon).
- `mots-premier-ecran --max=70 --modere` : 174 mots (100 hors données), MOTS ECHEC — v0, sauté (D1 à reprendre en
  passe 2 : moins de lignes au premier écran ou deux mots par ligne).
- `controle-une-question` (D98) : indicatif, écran de recherche sans facteur libre d'outil ; non joué sur cette page.

Captures (ouvertes) : `captures/rcb1.png` (premier écran), `captures/rcb1-fiche.png` (fiche de Tango à l'appui long),
`captures/rcb1-page.png`. Générateur : `generer.mjs` ; données : `donnees-rcb.mjs` ; pièces communes : `commun-rcb.mjs` ;
captures et mesures : `capturer.mjs` (série).
