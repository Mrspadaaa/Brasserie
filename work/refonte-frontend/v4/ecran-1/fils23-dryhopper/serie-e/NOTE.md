# Série E, la frise : huit concepts de Dryhopper (v0, voie r7e)

Question : « Quand ajouter Idaho 7 ? ». Seul le moment varie (60′ à 0′ par 5′, whirlpool, dry hop actif et après,
1 à 7 jours de contact : 24 crans). Fixés dans la ligne de contexte : Idaho 7 α 12,7 % mixte, 4 g/L, US-05, Stout 16D.
Descripteurs : option A (Idaho 7 n'a aucun mot hors famille dans le pack).
Générés par `generer.mjs` (socle commun `socle.mjs`), captures et geste au doigt par `captures.mjs`
(`captures/geste-eN.json` : avant, pose du doigt, glissé, levé, 10′, après · 5 j ; 0 erreur console sur les huit).

## Concepts

| id | chaleur | ce qu'il montre | geste | vraie valeur | levure |
|---|---|---|---|---|---|
| e1 | froide | y1b + l'écran de la carte : les 12 barres l5b face à la zone 16D, la jauge d'amertume, et un dock sous le pouce dont chaque case est un moment et porte sa hauteur de floral (trait orangé dessous : trop amer) | glisser le pouce dans le dock ; loupe des moments voisins | Schmidt 2019 (E08) : l'essentiel passe en 2 j | dernière étape : « 1 Quand · 2 Levure › » |
| e2 | froide | x3b réduit : la cuve jour après jour (ébullition, levure active, levure au repos), Idaho 7 en bloc, les jours sans gain hachurés ; dessous « Ma bière → + Idaho 7 » en 12 colonnes | glisser le bloc le long de la cuve ; étirer sa poignée pour les jours de contact | Titus 2021 (E10) : 1 h ou 96 h, même arôme au panel | pont : « Que change ma levure ? › » |
| e3 | tiède | quatre cases (ébullition, whirlpool, actif, après) ; la case touchée s'ouvre, les autres gardent leurs six barres et leur IBU | glisser sur les cases, puis sur le sous-rail minute ou jour | McCabe 2023 (E03) : Idaho 7 au levurage, linalol 38 ± 13 µg/L (lecture à vérifier) | dernière case : « 2 Levure › Pomona agrumes ~+13 » |
| e4 | tiède | la frise debout : 24 lignes (une par moment) × 7 familles en barres l5b + IBU : le spectre du brassin se lit d'un coup | glisser le doigt de haut en bas | Wolfe 2012 (E05) : 43 % du linalol extrait en 6 h | pont |
| e5 | tiède | ce qu'on gagne, ce qu'on paie : 24 colonnes, le floral au-dessus de l'axe, dessous l'amertume (ébullition) ou le résineux et le végétal (dry hop) | glisser le long des colonnes | Lafontaine 2018 (E04) : intensité 8,1 sur 15 contre 3 sans houblon | dernière étape : « puis 2 Levure › » |
| e6 | tiède | la frise de radars : grand radar m4/h4 (ma stout en gris, avec Idaho 7 en violet, zone 16D) et cinq mini radars, un par étape | curseur à 24 crans sous la frise | Kankolongo Cibaka 2017 (E01) : linalol 72–178 µg/L en dry hop, seuil 8 | pont |
| e7 | chaude | le cadran du brassin : le brassin fait le tour, rayons de floral par moment, anneau intérieur d'amertume ; au centre le moment, floral, agrumes, baies, IBU, résineux | tourner le doigt autour du cadran | Sharp 2014 (E07) : à l'ébullition, cuit et herbacé au panel | dernière case du cadran : « 2 Levure › » |
| e8 | chaude | le goût compté en pictos (isotype) : 6 familles × 4 étapes, un picto = 5 points gagnés au style ; ligne IBU | toucher une colonne, puis le sous-rail minute ou jour | Titus 2021 (E10) | pont |

Levure : dernière étape dans e1, e3, e5, e7 ; pont vers l'outil Levure dans e2, e4, e6, e8 (aucun sélecteur de levure).
Chaleur : 2 froide (e1, e2), 4 tiède (e3 à e6), 2 chaude (e7, e8).

Ce que la frise apprend, sur les vraies données du moteur (Idaho 7, 4 g/L, US-05, stout S1) : l'ébullition coûte
l'amertume (≈ 161 IBU à 60′, ≈ 97 à 10′, ≈ 75 au whirlpool, 16D 50–70) pour un floral de ~+2 à ~+14 ; le dry hop
actif donne ~+22 de floral, amertume tenue, résineux ~+14 ; l'après donne ~+23 mais résineux ~+20 et végétal ~+10.
Le simulé sature à 2 j (plus rien ne monte ensuite), ce que disent aussi Schmidt 2019 et Titus 2021.

## Baseline

Reprise dans les huit (plancher à enrichir) :
- titre en question ; ligne de contexte « fixé » sans contrôle ; α du lot en tête puis rôle en mot (« mixte ») ; stock en
  icône de 12 px ;
- au style par défaut, absolu à un toucher, la zone du style visible dans chaque représentation ;
- pictos de famille au trait (les symboles de l'écran de la carte), code couleur des arômes, orangé réservé au hors style ;
- légende derrière le « ? » ; appui long (ou survol long) sur Idaho 7 → la fiche : silhouette en radar, α 9,5–14,9 %
  et lot 12,7 %, huile, arômes sourcés 1/1, Beer Maverick 2023, geste « Goûter dans ma stout » (FICHE OK) ;
- le geste de y1b : le moment se glisse comme un curseur, par 5′ à l'ébullition ; la réponse « Face à ta stout » en une
  ligne ; la jauge d'amertume (e1) ; le dock sous le pouce et sa loupe (e1) ; x3b réduit en cuve jour après jour et
  « Ma bière → + Idaho 7 » (e2) ; barres l5b (e1, e2 debout, e3, e4) ; radars m4/h4 (e6, et la fiche) ;
- honnêteté : « ~ » simulé, « ≈ » interpolé ou estimé (cases plus pâles), hachuré pour l'inconnu (pépins, melon),
  « IBU à cru ? » en dry hop (non modélisé), une vraie valeur mesurée et sourcée par page.

Écarts, chacun avec sa raison :
- **Barres l5b absentes de e5, e7, e8** : la chaleur porte sur la forme (gagner/payer, cadran, isotype) ; la zone du
  style y reste (bande, cercle, fond de case). À regreffer en passe 2 si le critique le demande.
- **Radars m4/h4 seulement dans e6** (et la fiche) : les autres concepts lisent le moment, pas la silhouette.
- **Disposition l8 non reprise telle quelle** : l'approche de la série met la frise au centre de l'écran.
- **a2b (« ce que la levure change »)** reste hors de Dryhopper : la levure est fixée (D98) ; elle vit à l'étape 2 ou
  dans l'outil Levure. e3 en dit seulement l'effet attendu (Pomona, agrumes ~+13 en actif, simulé).
- **« second houblon puis » (y1b)** absent : un seul facteur libre.
- **Valeurs interpolées** : entre 60′ et 10′ (linéaire en minutes) et à 5′ et 0′ (entre 10′ et le whirlpool), marquées
  « ≈ » et plus pâles ; l'IBU d'ébullition est de Tinseth (DI 1,066), celle du whirlpool (≈ +15) reprend l'estimation
  de l'écran de la carte.
- `controle-commun --sans=mots` seulement (MOTS joué à part, ci-dessous).

## Contrôles joués une fois (v0)

- G1 `controle-commun … --sans=mots` : **COMMUN OK** (couleurs, au-style, survol, blocs, contraste, fiche, standard,
  trait, légende, parlant, brutes).
- D98 `controle-une-question` : **UNE-QUESTION OK (1 groupe libre : moment)** ; e1, e4, e5, e6, e7 : 1 contrôle ;
  e2, e3, e8 : 2 contrôles (position et jours, étape et minute), tous balisés moment.
- D99 `controle-acquis` : ACQUIS ECHEC sur les huit (0/4) : radar, chimie, panel OSU et 3 vraies valeurs sont les
  acquis d'un écran Comparer, pas de Dryhopper ; e6 : « radar présent au rendu mais non balisé (data-acquis) ». Non
  applicable ici ; à trancher par le pilote si Dryhopper doit les porter.
- MOTS `mots-premier-ecran --max=80` : e1 93, e2 103, e3 81, e4 108, e5 76, e6 82, e7 72, e8 75 → MOTS ECHEC 5/8.
  Le surplus est surtout fait de données (24 libellés de moment dans e4, 12 écarts dans e2, 12 familles dans e1).
  À réduire en passe 2.

## Ce qui casse (pour la passe 2)

- e1 : un vide entre la source et le dock ; les cases du dock sont basses (le floral reste sous 25 % du style).
- e2 : les écarts écrits debout se lisent mal ; la poignée des jours est petite.
- e4 : 108 mots ; les lignes de 17 px sont fines sous le doigt.
- e6 : les mini radars sont petits à 58 px ; le résineux, déjà hors style, tire chaque radar vers la gauche.
- e7 : les rayons de floral restent courts ; le pouce est à l'intérieur de l'anneau.
- La fiche : la silhouette d'Idaho 7 (une seule source, niveaux 0 à 2) est pointue.
