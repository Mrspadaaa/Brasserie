# z1 — « Ce qui me manque », une carte du Bord (froide)

- **Chaleur** : froide. Reprend ses deux goûts sourcés (SPEC l. 897-898) et les affine : le récap en haut qui renvoie (chips
  par état, chacune filtre la liste) et une pastille d'état sur chaque item.
- **Idée en une phrase** : sur le Bord, en première carte teintée « Local et travaux », la liste de ce qui manque, dans l'ordre
  « Ensuite », avec son reste à payer quand il est connu ; noter un manque est une ligne au bas de la carte.
- **Axes** : place = le Bord (1) ; forme = liste par état avec pastilles ; mot = « Ce qui me manque » ; argent = le reste à payer
  seul (rien tant qu'aucun prix, puis « caisse à renseigner » dans l'état `caisse`) ; temps = aucun ; étapes = « Noter l'achat »
  seul (feuille de l'état `ouvert`).
- **Facteur libre** : la place dans la suite, par la poignée ≡ (`data-booster="ordre"`) ; « Ensuite » est le premier de la liste.
- **Repris de la base** : en-tête, barre du bas (Bord actif), les cartes teintées du Bord (Brassins, Stocks, Finances, Agenda,
  Échéances et démarches) en bande figée, le gabarit de carte (en-tête teinté, corps gris) pour la nouvelle carte.
- **Données** : ses cinq titres (`data-mots="lignes"`), le reste inventé : sols 1 200,00 estimés, 480,00 payés (Sols Fictifs Sàrl) ;
  hotte 1 850,00 payée (Ventil'Demo Sàrl), pose à estimer ; évier devis 640,00 (Sanitaire Fictif SA) ; armoire à estimer,
  bloquée par les sols ; site 4 h, sans achat. `depasse` : 2 factures 1 384,50 pour 1 200,00 → +184,50. `caisse` : 6 240,00.
- **Honnêteté** : à `jour1`, aucun chiffre, aucune ligne de contexte ; « à estimer » et « pose à estimer » à la place d'un zéro ;
  « — » pour le site fait sans facture ; « ça passe » seulement après la caisse renseignée.
- **États** : jour1, encours, ajout (champ à 16 px, bouton Noter, bande clavier figée), ouvert (feuille des sols : nature, place,
  prix, payé en jauge, bloqué par, Noter l'achat, Fait), depasse, caisse (+ `-apres`), fini (3 faits atténués, dont le site sans
  facture), horsligne (bandeau).

## Boosters UX (boosters-ux)
- Boosters : `filtre` — lire/choisir ; chips d'état ; la liste se filtre au toucher (effet joué dans la page) · `ordre` — ajuster ;
  poignée ≡ ; place dans la suite · `ouvrir` — déclencher ; la rangée entière ; feuille du manque · `caisse` — déclencher ; lien
  ambre ; ligne de contexte complétée (captures `z1-caisse.png` → `z1-caisse-apres.png`) · `jauge` — lire ; barre payé/reste ·
  `nature`, `place` — choisir ; segments · `noter-achat`, `ajouter`, `noter`.
- B1 OK — 9 `data-booster`, 2 effets joués par script (filtre, caisse). B2 OK — une seule action noire par écran (« Noter » /
  « Noter l'achat »). B3 OK — MOTS 60 (hors titres), 7 éléments au premier plan. B4 OK — une carte, pas de carte imbriquée.
  B5 OK — 4/6/8 px. B6 — 12/13/14 dans la carte, 16 et 18 de la coquille ; mono tabulaire sur les montants. B7 OK — CONTRASTE OK
  (pire 4,88:1, coquille). B8 OK — jour1 sans zéro, hors ligne, fini sans facture. B9 s.o. (v0). B10 OK — `type="text"`.
  B11 — « il me manque 5 choses, la hotte d'abord, rien n'est encore chiffré ». B12 OK — chevrons, rayons 10/16. B13 OK —
  rangées de 36 px, poignée 24 × 36.
- Écarts voulus : aucun.
