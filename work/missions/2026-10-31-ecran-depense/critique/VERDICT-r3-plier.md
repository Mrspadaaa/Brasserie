# Verdict r3-plier — page de choix « tout plier, déplier sur D » (D307)

OK — accepté : D repris au pixel (0 pixel d'écart hors du groupe ouvert), cinq gestes vraiment distincts et lisibles en clair et sombre à 390, la question en une ligne ; un majeur sur C (Confirmer hors de l'écran dès qu'un point est au pied, dit par la page) et un risque d'usage sur D (second toucher caché), aucun bloquant.

Critique Fable, 02.11, agent neuf, calibré sur `fils21-choisir/critique/PORTRAIT.md` (v2). Jugé : `choix-plier/index.html`, ses 20 mini
maquettes (`img/*.png`, toutes ouvertes en plein format), `controle-haut.png`, `controle-page.png`, `controle-ordinateur.png`,
`controle/mesure-a-cote-a-cote.png`, `controle/mesure-pied-{a-unite,c-date,d-unite}.png`, contre sa maquette choisie
(`choix-sousfamilles/img/d-renovation.png`, ses mots : « J'aime beaucoup D mais il faudrait pouvoir facilement tout plier, déplier »)
et le verdict sœur `VERDICT-r2-sousfamilles.md`.
Rejoué : `controle-page-choix.mjs --min=3` → `plier : OK (4 variantes, 5 par rangée à 1280, 2 à 390)`, `PAGE-CHOIX OK (1 choix)`.
`grep -ci depense ecrans.json` → 0 : `controle-choix` sans objet, la base est D de `choix-sousfamilles` (retouche e-t12 comprise : les
sous-totaux de quantité « 9 Stk », « 2 Stk » y sont, le majeur n° 1 de e-t12 est réglé). Grep des noms de ses pièces sur `maquettes/` et
`index.html` : 0. `pl.css` : 8 lignes, toutes `pl-` (L26). `verifier-page.mjs` non rejoué (Chrome) : ses captures ont été ouvertes et jugées.
Dans l'app (`Liste.tsx` l. 68), l'en-tête de bande n'a aucun `onClick` et colle en haut (`p3c.css` l. 9) : le geste de B est libre.

## Verdict par option et pour la page

- **page** (`index.html`) — ACCEPTÉ. Une question, une ligne : « Sur D, où plies-tu ou déplies-tu tous les sous-groupes d'un coup ? »,
  la règle commune en une ligne (« Une ligne à vérifier garde son groupe ouvert, même tout plié (Désinfectant) »), la proposée avec sa raison
  et son prix. Têtes de 12 à 30 mots. À 1280 (`controle-ordinateur.png`), le lieu du geste se voit sans lire : rien, deux cercles sur les
  en-têtes, un bouton au pied, le segment du pied, le segment en haut. À 390 (`controle-haut.png`, `controle-page.png`), deux par rangée,
  têtes alignées, aucun débordement. Les 20 vues partagent la même pièce (562,10 = 86,00 + 21,40 + 454,70 ; 24 lignes ; Nettoyage
  « 1 Kg + 6 Stk » = 1 Kg + 1 + 3 + 2 Stk ; Rénovation 25 Stk = 9 + 2 + 2 + 3 + 5 + 2 + 2) : il compare les gestes, pas les chiffres.
  Phrase prédite : « Ok là je vois où c'est à chaque fois, c'est pas la même chose. »
- **A** (son choix D, un à un) — ACCEPTÉ. `controle/mesure-a-cote-a-cote.png` : bande Rénovation de A pliée contre `d-renovation.png`,
  mêmes colonnes, même pas, même en-tête « Rénovation 16 · 25 Stk · 454,70 », 0 pixel d'écart hors de « Peinture et sols » (ouvert dans sa
  capture, fermé ici, hors comparaison), 1 pixel de tramage au pointillé du pied. C'est sa maquette, règle n° 1 tenue. Les quatre vues
  montrent ce qu'il a dit : 8 touchers pour tout ouvrir, 8 pour tout fermer ; Désinfectant (« 2 Stk » déduit en jaune) reste ouvert
  tout plié, ce que e-t12 demandait en mineur. Phrase prédite : « C'est D, mais faut tout ouvrir un par un, c'est ce que j'ai dit. »
- **B** (en-tête de bande) — ACCEPTÉ. Le point · nom · compte · double chevron de l'en-tête devient la commande de sa bande ; » tout plié,
  ⌄⌄ tout déplié, » à l'état mêlé (`b-mele.png` : Peinture et sols ouvert, Rénovation porte » : le prochain toucher déplie tout). Rien ne
  bouge en hauteur, l'en-tête colle en haut, donc le geste reste sous le doigt dans une longue bande. Consommables (une seule
  sous-famille) n'a pas de chevron : juste. Sombre (`b-plie-sombre.png`) : chevron et cercle lisibles. Deux touchers ici, un par bande :
  c'est « tout » par bande, pas par dépense ; avec quatre bandes il en faudra quatre. Le double chevron est le seul signe neuf, et c'est
  le trait du chevron des sous-groupes : il se lit sans légende. Phrase prédite : « B c'est pratique, je suis dans la bande et je plie
  la bande. Mais c'est pas tout d'un coup. »
- **C** (bouton du pied) — ACCEPTÉ, mitigé. « » Tout » entre Catégorie | Papier et Confirmer : un toucher pour toute la dépense, l'état se
  lit (» / ⌄⌄), au pouce, en clair comme en sombre. Majeur, vérifié : `controle/mesure-pied-c-date.png`, avec le point « ① Date » au
  pied, « Confirmer » est coupé au bord droit (« Confirme », bord à 414 px pour 390 ; 453 avec « ① Spray unité »). Un point au pied est
  un état courant d'une vraie pièce (D277 : une valeur reprise ou inconnue devient un point). Ce que la VOIE interdit (« ne pas
  chevaucher une autre commande ») et ce que le pilote demande (« Confirmer toujours visible ») ne tiennent qu'en l'absence de point ;
  D10 (« pas de débordement ») est atteint dans cet état. Je ne rejette pas : les quatre vues montrées sont justes, la tête de C le dit
  (« Confirmer déborde de 32 px »), et A déborde déjà de 3 px avec un point long (`mesure-pied-a-unite.png`, `Pied.tsx` : point
  `flex-none`), la cause est partagée. Si C est choisie, elle ne se porte qu'avec une correction mesurée : bouton à l'icône seule
  (32 px, sans le mot « Tout » : 414 − 32 ≈ 382) ou le point qui se tronque, et `mesure-pied` ≤ 382 avec « ① Date ». Phrase
  prédite : « Le bouton en bas c'est bien, mais ça pousse Confirmer dehors ??? »
- **D** (Catégorie ×2) — ACCEPTÉ, mitigé. Aucun bouton de plus, un toucher, et le segment allumé porte » ou ⌄⌄ (lisible en sombre,
  `d-plie-sombre.png`). Mais le geste se cache sous une autre commande : « Catégorie » est la bascule de vue ; le toucher une seconde fois
  replie ou déplie tout. Il ne se devine pas sans l'avoir vu, et celui qui touche « Catégorie » pour s'assurer de la vue voit ses 8
  sous-groupes s'ouvrir sans l'avoir voulu. C'est un défaut d'usage (surprise sur une commande existante), pas un refus cité de SPEC :
  signalé, pas rejeté. Pied : +19 px, 404 avec un point long (`mesure-pied-d-unite.png`, Confirmer entier), 382 avec « ① Date ».
  Phrase prédite : « Catégorie deux fois ? je l'aurais jamais trouvé. Et des fois je veux juste la vue. »
- **E** (Plié | Déplié, proposée) — ACCEPTÉ. Ses deux mots dans l'en-tête de la feuille, entre le titre et le justificatif : l'état se lit
  sans icône (« Plié » noir plein tout plié, « Déplié » tout déplié, aucun allumé à l'état mêlé, `e-mele.png`), un toucher pour toute la
  dépense, l'en-tête ne défile pas, le pied reste Catégorie | Papier · Confirmer (382 avec « ① Date »). Sombre (`e-plie-sombre.png`) :
  « Plié » en paille sur noir, lisible. Son prix réel : la commande en haut, loin du pouce ; et le segment prend 190 px de l'en-tête à
  côté de « Nouvelle dépense » : avec un titre plus long (une dépense modifiée, un fournisseur dans le titre) il faudra mesurer. Un
  segment où rien n'est allumé (état mêlé) est inhabituel mais se comprend : ni l'un ni l'autre. C'est la plus proche de ses mots.
  Phrase prédite : « E c'est clair, plié, déplié, je vois direct où j'en suis. »

## Les questions du pilote

1. **Chaque option permet-elle « facilement tout plier, déplier », sans mode d'emploi, sans cockpit ?** E et C oui, un toucher, l'état dit
   en un mot ou un signe ; B oui par bande (un toucher par bande, 2 ici) ; D un toucher mais caché sous « Catégorie » ; A non, c'est la
   référence et elle le dit (8 touchers). Aucun texte explicatif au premier plan, aucune légende (D1, D3) ; un seul signe neuf, le double
   chevron, et les deux mots de E. Tailles de texte au premier écran inchangées (D2). Pas de cockpit.
2. **D reste-t-il sa maquette au pixel ?** Oui. A mesurée (0 pixel d'écart hors du groupe ouvert). B, C, D, E : la liste est la même
   image (mêmes lignes, mêmes colonnes, mêmes sous-totaux de quantité) ; ce qui change est un chevron dans l'en-tête (B), un bouton ou un
   signe au pied (C, D), un segment en haut (E). Même police web, même fond blanc que e-t12.
3. **Plié / déplié / mêlé lisibles et distincts, clair et sombre, à 390 ?** Oui pour les cinq. Plié : chevrons » sur les sous-groupes,
   Désinfectant ouvert ; déplié : ⌄ partout, 22 rangées visibles jusqu'à Quincaillerie, Électricité sous le pied (défilée) ; mêlé :
   Peinture et sols ouvert, les autres fermés. L'état du geste : » / ⌄⌄ (B, C, D), Plié / Déplié / aucun (E). Sombre : paille sur noir,
   cercle éclairci, tout lisible.
4. **Aucune commande chevauchée, Confirmer toujours visible ?** Dans les 20 vues, oui. Avec un point au pied : A, B, E 382 ; D 382 (404
   avec un point long, comme A à 385) ; C 414 avec « ① Date » : Confirmer coupé. C'est le majeur ci-dessus.
5. **Distinctes ?** Oui : cinq lieux différents pour le même geste (nulle part, en-tête de bande, bouton du pied, segment du pied,
   en-tête de feuille). D38 ne se rejoue pas.

## Défauts

### Bloquant
Aucun. Aucune règle de SPEC ni de DEFAUTS-COURT n'empêche son choix ; sa maquette D est reprise au pixel (règle n° 1, L03 mesurée).

### Majeur
1. **C : Confirmer hors de l'écran avec un point au pied** (`controle/mesure-pied-c-date.png`, bord droit 414 px pour 390 ; D10, et la
   VOIE : « ne pas chevaucher une autre commande »). La page le dit dans la tête de C. Correction si C est choisie : bouton à l'icône
   seule (double chevron, 32 px) ou point tronqué (`truncate` sur le nom du point, déjà dans `Pied.tsx`), puis rejouer `mesure-pied-c-date`
   et exiger ≤ 382. Sans point au pied, rien à corriger.

### Mineurs
- **D : second toucher caché sous une bascule de vue.** Un toucher sur « Catégorie » déjà allumé plie ou déplie 8 groupes sans que
  l'utilisateur l'ait voulu. À dire dans la tête (« le second toucher se devine au double chevron » le laisse entendre) ; au port, un
  repli seulement si le double chevron lui-même est touché serait plus sûr. Goût d'usage, pas une règle citée.
- **E : largeur de l'en-tête avec un titre long.** Le segment prend 190 px à côté de « Nouvelle dépense » ; non mesuré avec « Modifier la
  dépense » ou un titre porteur du fournisseur. À mesurer avant le port.
- **B : « tout » vaut par bande.** Quatre bandes, quatre touchers. À dire tel quel dans la tête (elle le dit : « Un toucher par bande »).
- **Règle de bascule depuis l'état mêlé** (B, C, D : « déplie tout »). Le concepteur la note en décision à prendre ; elle ne change pas
  le choix, elle se règle au port ou en lui demandant devant la vue 3.
- **Tout plié, Désinfectant ouvert** : il demandera peut-être « pourquoi c'est ouvert ??? » devant la vue 1 ; la ligne d'en-tête le dit.
  C'est la règle qu'il a réclamée (« Surtout montrer les points où l'ia n'es pas sûr », 31.10) : à garder.
- `*.png` : « Local » en catégorie (« Brico Fictif SA · Local ») : cohérent avec r1-renovation (contexte Local), l'écart « Travaux » de
  e-t12 est corrigé.

## Greffes probables (il mélange)
- **E + B** : le segment Plié | Déplié en haut pour toute la dépense, et le double chevron de l'en-tête de bande pour une bande seule.
  C'est la combinaison que le concepteur prédit lui aussi ; elle ne coûte rien en hauteur.
- **E dans C** : les deux mots « Plié | Déplié » au pied à la place de « » Tout », si le pied reste sa place préférée (au pouce) ; mais la
  largeur (≈ 120 px) aggrave le majeur de C : seulement si le point du pied se tronque.
- **Le double chevron de D sur l'en-tête de bande** (= B) : D n'apporte rien que B n'ait pas, hormis l'absence de bouton.

## Ce que je prédis qu'il dira
« E c'est clair, plié déplié je vois direct. B aussi pratique dans la bande, les deux ce serait bien. C ça pousse Confirmer dehors. D je
l'aurais pas trouvé. »

## Pour le pilote
Publier telle quelle : aucun bloquant, la page dit elle-même le prix de C et de D. Si C ou D est choisie, port avec la mesure du pied
(≤ 382 avec « ① Date ») et, pour D, le repli sur le double chevron seul. Si E est choisie, mesurer l'en-tête avec le titre le plus long
de l'app avant le port.

- **page** (index.html) — ACCEPTÉ
- **A** (son choix D, un à un) — ACCEPTÉ
- **B** (en-tête de bande) — ACCEPTÉ
- **C** (bouton du pied) — ACCEPTÉ, mitigé : Confirmer coupé avec un point au pied (414 px), à corriger au port si choisie
- **D** (Catégorie ×2) — ACCEPTÉ, mitigé : second toucher caché sous la bascule de vue
- **E** (Plié | Déplié, proposée) — ACCEPTÉ

LEÇON PROPOSÉE : aucune.
