# z4 — « Rénovation », la pile : une chose à la fois sur le Bord (chaude)

- **Chaleur** : chaude. Forme libre : la suite est une pile de cartes ; celle du dessus est « Ensuite », les deux suivantes
  dépassent, le reste se compte (« +2 derrière ») ; « Pas maintenant » envoie la carte au fond, « Fait » la sort.
- **Idée en une phrase** : sur le Bord, une seule chose à faire, en grand, avec ses faits en chips (prix, heures, bloqué par) qui
  se renseignent d'un toucher ; la liste complète est à un toucher (feuille « La suite », poignées ≡).
- **Axes** : place = le Bord, une ligne « Ensuite » et la liste à un toucher (1) ; forme = pile (forme libre) ; mot =
  « Rénovation » ; argent = rien tant qu'aucun prix (jour 1 : chip « + prix »), puis prix · reste ; dans `caisse`, « payable ?
  caisse à renseigner » → « payable · caisse 6 240,00 » ; temps = heures faites/notées, fin « rythme à régler » ; étapes = « Noter
  l'achat » seul.
- **Facteur libre** : la place, par « Pas maintenant » (`recul`, joué par script : la carte passe au fond) et par les poignées de
  la feuille (`ordre`).
- **Repris de la base** : en-tête, barre du bas, les cartes teintées du Bord (Brassins, Stocks, Finances, Agenda, Échéances) en
  bande figée ; la pile prend la teinte « Local et travaux ».
- **Données** : mêmes fixtures ; `ouvert` ajoute à la carte du dessus (sols) la nature, le payé avec sa facture, le pas d'heures et
  la fin ; `fini` : évier en haut, armoire derrière, trois faits sous la pile (hotte posée 1 850,00, sols faite 1 200,00, site
  « fait, sans facture », « — »).
- **États** : jour1 (+ `-apres` : la feuille « La suite »), encours, ajout (champ en tête de la carte, clavier figé), ouvert,
  depasse (chip rouge « 1 384,50 pour 1 200,00 · +184,50 »), caisse (+ `-apres`), fini, horsligne.

## Boosters UX (boosters-ux)
- Boosters : `recul` — ajuster ; bouton « Pas maintenant » ; la pile tourne (joué) · `pile` — déclencher ; cartes qui dépassent et
  « +2 derrière » ; feuille de la suite (captures `z4-jour1.png` → `z4-jour1-apres.png`) · `caisse` — déclencher ; chip ; devient
  « payable » (captures `z4-caisse.png` → `-apres`) · `renseigner`, `prix`, `heures`, `blocage` — choisir/ajuster ; chips ·
  `jauge` — lire · `nature`, `heures-pas` — ajuster · `fait`, `noter-achat`, `ajouter`, `noter`, `ordre`, `fermer`.
- B1 OK — 16 `data-booster`, 3 effets joués (recul, pile, caisse). B2 OK — le titre à 18 px domine, une action noire. B3 OK —
  MOTS 58 (un premier passage à 62 : « Fribourg / OFDF » retiré de la bande). B4 OK — pile, puis cartes du Bord. B5 OK. B6 —
  12/13/14/18 dans la pile, 16 des en-têtes de carte : quatre tailles, à resserrer en passe 2. B7 OK — CONTRASTE OK (pire 4,88:1,
  coquille). B8 OK — jour1 : trois chips « + », aucun chiffre ; fini sans facture ; hors ligne. B9 s.o. B10 OK. B11 — « je fais la
  hotte ensuite, et il y a quatre choses derrière ». B12 OK. B13 OK — chips 26 px, boutons 28/32, poignées 24 × 36.
- Écarts voulus : B6, quatre tailles (18 du titre de la carte du dessus : c'est la réponse de l'écran).
