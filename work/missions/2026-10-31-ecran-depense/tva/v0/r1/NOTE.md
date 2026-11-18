# r1 — un troisième mode de Synthèse : Situation · Coûts · TVA (froide)

- **Chaleur** : froide (les formes de l'app, telles quelles, enrichies d'une rangée par taux).
- **Axes** : place = mode de Synthèse à côté de « Situation / Coûts » ; période = année (le pas ‹ 2026 › des Opérations) ;
  forme = chiffres seuls (les rangées chiffrées de Prévisions) ; « si assujetti » = aucun chiffre, un lien AFC et la fiduciaire.
- **L'idée** : la réponse « Récupérer la TVA : Non » avant tout chiffre, puis « au moins 171,83 CHF » et, collé au total, le
  compte des dépenses à TVA inconnue ; chaque taux est une rangée qui filtre la liste des dépenses dessous.
- **Une question** (L10) : « Combien la TVA me coûte-t-elle, et est-ce que je la récupère ? » ; seul facteur libre : l'année.

## Ce qui vient de la base
En-tête de l'app, onglets Synthèse · Opérations · Prévisions · Annuel, titre « Situation financière » et son icône de réglage,
segment « Situation / Coûts » (TVA ajouté en troisième), pas d'année des Opérations (‹ octobre 2026 ›), rangées libellé à gauche,
montant en mono à droite et chevron (Prévisions), rangée « Compagnon brasseur », barre du bas et +. Tuile ① TVA de p3c-3
(colonne MWST · lu / proposé, calcul « ≠ imprimé ») reprise dans la feuille de la dépense douteuse (J5). Plancher enrichi : le
statut dit comme un réglage, le « au moins », le total souligné en pointillé quand l'inconnu pèse plus de la moitié des montants.

## Honnêteté
- Inconnu jamais à zéro : tiret « — », pastille hachurée « ? », montant TTC « payés » sous la rangée, et « +4 inconnues » collé
  au total ; le total se dit « au moins ». En `inconnues` (2025, 21 dépenses sur 27), le total passe en ocre souligné pointillé.
- Douteuse : « 1 choisie à la saisie » à côté du total et sur la ligne ; la feuille montre la tuile TVA (4,21 lu / 6,12 choisie).
- Étranger : « À part, pas de TVA suisse », MwSt 19 % en EUR, hors du total.
- Statut : « Non assujetti › » est un bouton de réglage, pas une phrase. Aucun conseil, aucune intro fiscale ; l'AFC au toucher.

## Boosters UX (boosters-ux)
- `mode-tva` — besoin lire ; segment de Synthèse ; troisième mode ; la vue entière (captures r1-annee-390).
- `periode` — besoin choisir ; pas ‹ année › ; 2024 / 2025 / 2026 ; capture r1-geste-annee-precedente (2025, 21 inconnues).
- `filtre-taux` — besoin comparer ; rangée-bouton par taux ; pastille pleine verte (2,6 %) ou bleue (8,1 %) ; la liste se
  réduit au taux (r1-geste-filtre-inconnues : la liste ne garde que les « ? »).
- `inconnues` — besoin suivre ; chip hachuré collé au total ; filtre les dépenses sans TVA lue (même capture).
- `douteuse` — besoin vérifier ; chip ocre pointillé ; ouvre la tuile TVA de p3c-3 (r1-geste-douteuse-ouverte).
- `etranger` — besoin lire ; pastille « DE » au trait ; rangée à part (r1-etrangere-390).
- `si-assujetti` — besoin déclencher ; repli ; deux liens, aucun chiffre (r1-si-390).
- `statut-reglage` — besoin régler ; chip « Non assujetti › » vers les réglages.
- B1 OK — 8 boosters marqués, chacun change l'écran (captures avant/après ci-dessus).
- B2 OK — dominante : « 171,83 CHF » à 28 px ; aucune action `primary` dans la vue (le + de l'app seul).
- B3 OK — 57 mots au premier écran (lignes de dépenses à part, `data-mots="lignes"`) ; 7 blocs.
- B4 OK — réponse, taux, « si », dépenses : quatre groupes séparés par des filets, sans carte.
- B5 s.o. — mesure R2 non jouée en v0.
- B6 OK — Source Sans 3 et IBM Plex Mono `tnum` ; tailles 12 / 13-14 / 16 / 28 (une de trop : 28 pour la seule dominante).
- B7 OK — CONTRASTE OK, pire 5,17:1 ; chaque couleur accompagne un mot (taux écrit dans la pastille).
- B8 OK — sept états dessinés ; vide : « 0,00 CHF » vrai (aucune dépense), cadre gardé, « Saisir une dépense › ».
- B9 s.o. — maquette statique, retour au toucher par `aria-pressed` seulement.
- B10 OK — aucun champ, aucun `type="number"`.
- B11 OK — « Je ne récupère pas la TVA ; elle m'a coûté au moins 171,83 CHF en 2026, 4 dépenses sans TVA lue. »
- B12 OK — rayons 10 / 16 / 24 (STANDARD OK), un trait d'icône rendu de 1,5 px.
- B13 OK — cibles ≥ 24 px ; rangées entières cliquables.

## Contrôles (sorties)
- controle-choix `--ecran=finances` : `CHOIX OK (0 écran(s) conforme(s) à son choix ; 0 ouvert(s))` — Finances n'a pas d'entrée
  dans `ecrans.json`, sortie notée telle quelle.
- controle-commun `--profil=sans-houblons --sans-lignes` : `COMMUN OK` (premier passage : STANDARD ECHEC S4, trois épaisseurs
  de trait rendues ; corrigé en réglant le trait par taille d'icône, et le + marqué `data-commun`).
- mots-premier-ecran `--max=60 --sans-lignes` : `r1 57 mots` → `MOTS OK`.
- controle-contraste : `CONTRASTE OK` (pire « TVA » 5,17:1).
- verifier-page `--min-images 0` : `PAGE OK (0 images chargées, 390 px, sans erreur)`.
