# r2 — Local et travaux : les Projets de matériel élargis (tiède)

- **Chaleur** : tiède. La forme de l'approche r (étendre ce qui existe) poussée sur l'écran qui existe déjà : Finances › Prévisions ›
  Projets.
- **Axes** : place = Finances › Prévisions, les Projets de matériel élargis ; forme = file ordonnée par flèches, dans les horizons
  de l'app (Bientôt · Ensuite · Plus tard) ; mot = « Local et travaux » (la catégorie `renovation` du modèle) ; argent = la caisse
  des Prévisions, « caisse à renseigner » tant qu'elle est inconnue ; temps = les heures par manque, sans date de fin ; étapes =
  « Noter l'achat » seul (l'étape du projet reste celle de l'app : Idée, À étudier, Devis, Prêt).
- **L'idée** : on ne crée rien à côté ; les Projets de matériel acceptent le travail (nature, heures), les flèches ▲▼ font passer un
  manque d'un horizon à l'autre, et un récap en haut pose le reste à payer contre la caisse.
- **Une question** (L10) : seul facteur libre, l'horizon (la place dans la suite) ; argent et heures restent sur la ligne de la rangée.

## Ce qui vient de la base
En-tête, onglets Synthèse · Opérations · Prévisions · Annuel, titre « Anticiper les dépenses », sous-navigation Échéances · Projets
(raccourci de « Projets de matériel »), horizons `UPGRADE_TIMINGS`, étapes `UPGRADE_STAGES`, achat + livraison + installation,
« Dans les prévisions » (case de l'app), « Noter l'achat », « Réalisés » (portée de l'app), « Renseigner le solde de départ »
(lien des Prévisions), barre du bas et +. Plancher enrichi : le filtre « Local et travaux · Matériel », la nature, « Mes heures »,
le blocage en cause, le champ d'ajout en bas sous le pouce, le récap en jauge (goût sourcé « un récap en haut », SPEC l. 898).

## Honnêteté
- Jour 1 : cinq titres, rangés dans « Plus tard » comme l'app range un projet neuf (`timing: 'later'` par défaut, `upgrades.ts`) ;
  Bientôt et Ensuite restent nommés avec « 0 ». Aucun prix, aucune ligne d'argent.
- Récap : n'apparaît qu'avec un prix connu ; « +1 à estimer » collé au total ; « caisse à renseigner » en pointillé ocre, jamais 0.
- `caisse` : caisse saisie 3 200,00 → la jauge montre à payer (bleu plein), reste (hachuré clair), et le chiffre « reste 1 120,00 ».
- Dépassé : segment rouge dans la jauge, « dépassé +152,40 », la rangée montre « 1 012,40 sur 860,00 prévus ».
- Fini : « fait hors de l'app », « sans achat noté », renvoi « Noter l'achat › ». Aucune date.

## Boosters UX (boosters-ux)
- `horizon` — choisir ; flèches ▲▼ par rangée, segment « Quand » dans la feuille ; la rangée change de bande (r2-geste-horizon-site-plus-tot).
- `caisse` — suivre ; jauge touchable ; « caisse à renseigner » ouvre le solde de départ (r2-geste-caisse-a-renseigner).
- `local-travaux` — lire / filtrer ; puce de catégorie ; `noter`, `nature` — déclencher, corriger (état `ajout`).
- `cause`, `noter-achat` — dans la feuille du projet (état `ouvert`, 2ᵉ évier).
- B1 OK (7 marqués, 3 gestes) ; B2 OK (le reste à payer, 16 px gras, seule masse teintée) ; B6 OK (12 / 14 / 16) ; B10 OK (champs
  `inputmode="decimal"`, aucun `type="number"`) ; B13 flèches 28 × 24 (au seuil).
- Écart voulu : « Réalisés » est posé à côté des catégories en état `fini` (dans l'app c'est un segment À venir · Réalisés · Archives).

## Contrôles
Voir `../r-RESULTAT.md`.
