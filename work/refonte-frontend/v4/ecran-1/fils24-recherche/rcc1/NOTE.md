# rcc1 — La roue d'abord

- **Chaleur** : tiède (la forme de l'approche rcc : l'arôme d'abord, l'α, l'usage et le stock en second).
- **Série** : rcc, « l'arôme d'abord ».
- **Idée** : on cherche en touchant la roue des 12 familles. Les mots précis de la famille touchée (« fruit de la passion 21 »,
  « ananas 15 »…) s'ouvrent à côté, avec leur compte. Le centre « ◇ hors 12 » ouvre les mots qu'aucune famille ne range. La liste
  suit à chaque toucher, sans bouton « Rechercher » (D138).
- **Vrai cas** : on vient du champ « Ajouter — houblon… » de l'étape (stout export 16D). Requête : Tropicaux › fruit de la passion,
  α ≤ 12, dry hop (aromatique ou double), stock d'abord. Résultat : **21 houblons**.
  - En tête, Hallertau Blanc (30 g en stock, α 9,5 du lot), puis Ariana et Nectaron (0 g).
  - Puis Callista, Melba, Riwaka, Sládek, Solero, Harlequin…
  - Une ligne dit ce que le stock a et que les critères écartent : « En stock mais hors critères : Galaxy α 17,2 ·
    Citra cryo α 24,8 » (« je fais une recette puis ensuite j'achète les ingrédients »).

## Ce qui tient
- La roue garde le code couleur et les pictos au trait de la baseline. Chaque secteur porte son compte, recalculé avec l'α et
  l'usage : on voit où sont les houblons avant de toucher.
- Trois niveaux à la fois : la famille, le mot précis (D131 ter), le mot hors des 12 (D130). Sur chaque ligne :
  - le mot trouvé, dans sa couleur de famille, suivi des autres mots de la même famille (« fruit de la passion, ananas ») ;
  - un mot hors 16D, marqué ◇ (« ◇ groseille à maquereau ») ;
  - dans l'ordre L04 : nom, α (celui du lot s'il est en stock, en orangé s'il sort de la plage), usage en mot, bande des 12
    familles, puis le stock en badge.
- Au style 16D par défaut : un trait noir hors de la roue marque les familles attendues de la stout export (Floral, Herbacé,
  Terreux). En absolu, il disparaît.
- L'appui long ouvre la fiche (α, usage, radar, familles et leurs fiches « 1/2 », mots hors 12, goût). Le « + » ajoute à la recette.

## Ce qui casse
- 189 mots au premier écran (124 hors données). Une liste de résultats est faite de noms et de mots, d'où `--sans=mots`
  ci-dessous. La passe 2 peut retirer la répétition du mot cherché sur chaque ligne.
- La roue (200 px) pousse la liste : 4,5 lignes visibles au premier écran.
- Plusieurs familles touchées se combinent en « et » : à dire, ou à rendre réglable.

## Baseline : écart déclaré
- `--sans=mots` : une liste de houblons trouvés est une donnée par nature. Le seuil de 70 mots (98 en modéré) vise les écrans de
  lecture. Toutes les autres exigences communes passent.

## Contrôles (24.10, soir), sorties recopiées
- `concepts.mjs rcc1 rcc2 rcc3 rcc4` : CONCEPTS-BIEN-4.
- `controle-pictos-trait.mjs … --page=etat.html` : rcc1 · 35 pictos de famille · 0 faute ; TRAIT OK.
- `controle-commun.mjs … rcc1 rcc2 rcc3 rcc4 --page=etat.html --sans=mots` : couleurs, au-style, survol, blocs, contraste,
  fiche, standard, trait, légende, parlant et brutes OK ; COMMUN OK.
- `mots-premier-ecran.mjs --max=70 --modere` : rcc1 189 mots, ECHEC (raison ci-dessus).
- `controle-panel.mjs` sur les 4 captures : remplissage médian 0,56, 0 sous 0,50 ; ressemblance 0,87 ; PANEL OK.
- Réactivité (D138), geste joué dans Chrome : toucher « α ≤ 6 » fait passer la tête de liste de « Hallertau Blanc, Ariana,
  Nectaron… » à « Callista, Riwaka, Grungeist… » (96 ms, geste compris).

Captures : `captures/rcc1.png` (premier écran), `captures/rcc1-fiche.png` (appui long), `captures/rcc1-apres.png` (α ≤ 6).
