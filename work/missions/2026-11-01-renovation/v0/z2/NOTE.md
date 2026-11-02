# z2 — « Rénovation », la brasserie en plan (tiède)

- **Chaleur** : tiède. La forme de la série z : une vraie vue figurée, la brasserie vue du dessus, chaque manque épinglé à sa
  place ; le dessin est un plan technique (murs, cuve, éviers, porte), pas une illustration (u3 : « un peu enfantin »).
- **Idée en une phrase** : un écran à lui, ouvert depuis le Bord, avec le plan de la brasserie au-dessus de la liste ordonnée ;
  le numéro de l'épingle est la place dans la suite, sa couleur l'état ; toucher une épingle surligne sa ligne.
- **Axes** : place = écran à lui (3) ; forme = vraie vue figurée (plan) ; mot = « Rénovation » ; argent = une enveloppe qu'il
  fixe (« Enveloppe à fixer » puis 4 000,00 en jauge : engagé / libre, les « à estimer » dits hors de la jauge) ; temps = aucun ;
  étapes = cases à cocher dans le manque ouvert (achat, livraison, pose), sans doubler l'Agenda.
- **Aucune zone muette (D259)** : Brassage (sol hachuré = la seconde passe, cuve, hotte en pointillé au-dessus de la cuve), Lavage
  (évier existant plein, 2ᵉ évier en pointillé), Fermentation (deux cuves, rien à faire), Extérieur (armoire en pointillé contre le
  mur), Entrée (porte), « En ligne · vitrine » (le site, hors des murs). Chaque zone porte son nom. Les pièces sont **fictives et
  schématiques** : un vrai plan doit venir de lui (passe 2 : plan ajustable au doigt).
- **Facteur libre** : la place, par les flèches ▲▼ (`data-booster="ordre"`) ; les épingles se renumérotent.
- **Repris de la base** : en-tête, barre du bas, lien de retour « ‹ Bord », chevrons, rayons.
- **Données** : mêmes fixtures que z1 ; `ouvert` montre la hotte (achat 1 850,00 coché, livraison reçue, pose à estimer, bloquée
  par l'artisan, « Posée », Noter l'achat).
- **États** : jour1 (épingles noires 1 à 5, aucun chiffre), encours, ajout (champ au-dessus du plan, clavier figé), ouvert,
  depasse (épingle rouge, « +184,50 »), caisse (+ `-apres` : enveloppe), fini (épingles vertes à coche, sol du Brassage vert
  pâle), horsligne.

## Boosters UX (boosters-ux)
- Boosters : `pin` — lire/choisir ; épingle sur le plan ; la ligne se surligne · `ordre` — ajuster ; flèches ; renumérotation du
  plan (joué par script) · `enveloppe` — déclencher ; bouton ; jauge engagé/libre (captures `z2-caisse.png` → `z2-caisse-apres.png`)
  · `jauge` — lire · `etapes` — suivre ; cases à cocher · `blocage` — choisir ; chip · `ouvrir`, `ajouter`, `noter`, `noter-achat`.
- B1 OK — 10 `data-booster`, 3 effets joués (pin, ordre, enveloppe). B2 OK — le plan domine, une action noire. B3 OK — MOTS 37.
  B4 OK — figure, puis liste ; deux bords gauches. B5 OK. B6 — 11/12 px dans le SVG (étiquettes du plan), 14 en liste, 18 titre :
  à surveiller (texte ≥ 12 px demandé ; « cuve », « évier », « sols », « armoire » sont à 11 px dans le viewBox, rendus ≈ 11,7 px à
  390). B7 OK — CONTRASTE OK (pire « Bord » 6,16:1). B8 OK — jour1 juste, fini, hors ligne. B9 s.o. B10 OK. B11 — « voilà où
  sont mes cinq chantiers, le 1 c'est la hotte au-dessus de la cuve ». B12 OK. B13 OK — épingles 24 px, flèches 25 × 28.
- Écarts voulus : étiquettes du plan à 11 px dans le viewBox (lisibles sur la capture, à passer à 12 en passe 2).
