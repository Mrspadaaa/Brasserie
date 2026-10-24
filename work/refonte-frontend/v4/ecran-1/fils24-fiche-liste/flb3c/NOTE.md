# flb3c — passe 3 légère de flb3 (série b, la signature, puis le reste)

- **Chaleur** : tiède.
- **Origine** : flb3b (passe 2, intacte), rejetée par le critique (`critique/PASSE2.md`, Verdicts) pour son second en-tête empilé au-dessus de l'étape (D119 « Header qui change ??? », D116 le vrai fil de l'app).
- **Fichiers** : `etat.html` écrit par `generer.mjs` ; socle et données copiés de flb3b (`socle-flb.mjs`, `donnees-flb.mjs`) ; captures par `capturer.mjs`.

## Retouches de la passe 3 et leur mesure (sur les captures)

1. **L'en-tête de l'étape reste le seul en haut, sans changement** : « ‹ Houblons 3/7 », « 16D hypothèse », IBU 60 · OG 1,066 · EBC 70, comme en v0. Le second en-tête de flb3b (question, onglets, « fixé ») est retiré.
2. **Le houblon se choisit dans l'étape**, sous son en-tête : une rangée de pastilles (Nugget, Nelson Sauvin, Citra cryo, Motueka, Cascade), sur le gris de l'étape, comme flc8b. C'est le seul facteur libre (`data-libre="houblon"`).
3. **La fiche s'ouvre par-dessus l'étape avec son en-tête à elle, comme g1** : nom ⊙ et croix ronde de 44 px, puis α et usage. La question (« Que sent Nelson Sauvin, dit avec ses mots ? ») et le contexte (« ta Stout export 16D · levure US-05 ») sont passés dans la fiche, sous l'α.
4. **Flèches du radar réparées** : le marqueur de flèche avait le même id dans les cinq radars ; sur les houblons cachés, il désignait celui du premier, d'où des barres noires coupées. Chaque radar a maintenant son marqueur. Vérifié sur `flb3c-nugget.png` : flèche sur Résineux 2/4 et sur Floral 2/4.
5. **La légende ne recouvre plus rien (D113)** : le « ? » déplie la légende dans le flux, sous sa ligne ; les familles, les « ? » et Comparer descendent. Vérifié sur `flb3c-legende.png`.

## Gardé de flb3b

La règle de repli, un seul α (g1 : Hopsteiner 2025), la zone 16D en pointillé gris, « non décrites » en pictos « ? », « cat. », « fruité » en gris.

## Recompté sur les captures

- **Nelson Sauvin** (`flb3c-nelson.png`, `flb3c-page.png`) :
  - α 12–14 %, lot 9,6 % (en orangé : hors de ses fiches), 100 g ;
  - Agrumes 1/2 cat., Épicé 1/2 cat. ;
  - la phrase « Vin blanc, raisin, groseille à maquereau. », 2 fiches sur 2 ;
  - puis sauvignon blanc 1/2, fruité 2/2 ;
  - 10 « ? ».
- **Nugget** (`flb3c-nugget.png`) :
  - α 11–14 %, lot 13 %, stock épuisé ;
  - en repli, « Boisé 2/4, ananas 2/4 » ;
  - puis gingembre, géranium, litchi et noix de coco, 1/4 chacun ;
  - Agrumes 1/4, Tropicaux 2/4, Floral 2/4, Herbacé 2/4, Résineux 2/4, Épicé 1/4 cat., Terreux 1/4 ;
  - 5 « ? ».

## Sorties des contrôles (24.10, flb3c seule)

- `controle-commun … flb3c --page=etat.html --sans=mots` : COMMUN OK. Passent : couleurs, au-style, survol, blocs, contraste, fiche, standard, trait, legende, parlant, brutes.
- `controle-une-question … flb3c --page=etat.html` : UNE-QUESTION OK. Titre « Que sent Nelson Sauvin, dit avec ses mots ? » ; un seul groupe libre, houblon ; contexte : base, levure.
- `mots-premier-ecran … flb3c --max=80 --page=etat.html --sans-donnees` : 77 mots, MOTS OK.
- **Sans controle-sans-famille**, même raison qu'en flb3b : les 5 mots hors familles de Nelson Sauvin sont visibles au premier écran, chacun avec son compte. Ils sont dans la phrase et sur la ligne « puis », à la place d'une forme neutre `data-role="autres"`.

Captures ouvertes : `flb3c-nelson.png`, `flb3c-nugget.png`, `flb3c-page.png`, `flb3c-legende.png` ; écrites, pas regardées : `flb3c-cascade.png`, `flb3c-nugget-page.png`, `flb3c-fiche-courte.png`.
