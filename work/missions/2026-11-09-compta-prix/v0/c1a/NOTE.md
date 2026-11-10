# c1a — Coût d'un brassin et d'un litre · froid

**Chaleur** : froide (affine la feuille « Budget du prochain brassin » d'aujourd'hui, `budget-brassin.png`).
**Idée** : deux tuiles côte à côte séparent enfin les deux nombres, « À payer 64,26 CHF » (noir, l'argent qui sort) et « Le litre 7,51 CHF/L » (bleu, le coût de revient) ; chaque poste de la liste porte une flèche ↗ s'il se paie maintenant.
**Où** : feuille ouverte depuis Synthèse › Coûts › « Coût des brassins » (comme aujourd'hui), et depuis la recette et le brassin.

## Chiffres (fixture `src/dev/financeDemo.ts`, rien d'inventé)
Malt 6 kg × 7,472 = 44,83 (3 kg en stock, 3 kg à acheter 22,42) ; énergie 8,00, nettoyage 3,00, emballage 24,00, impôt bière 6,84 (= 41,84 de frais) ;
charges fixes 4 800 ÷ 1 200 L × 27 L = 108,00 ; amortissement 360 ÷ 1 200 × 27 = 8,10. Total 202,77 ÷ 27 L = 7,51 CHF/L. À payer : 22,42 + 41,84 = 64,26.
Houblons et levure : la recette de démo n'en a pas → « ? » hachuré, « hors recette », jamais 0 (honnêteté).

## Problèmes de l'inventaire résolus
3 (le litre a une seule source, la feuille), 5 (en partie : estimé marqué, coût réel ex post toujours absent), 27 (12 phrases d'aide → 0 au repos ; un seul volume éditable, « Brassé 30 L → 27 L nets »), et le défaut métier « argent à sortir / coût de revient confondus » (§ 5).

## Baseline (plancher)
Gardé : total d'achats TTC, ingrédients à acheter (dans la ligne Malt), autres frais (4 lignes), coût de revient CHF/L, comparaison à l'estimation enregistrée (« écart 0,00 »), volumes, Enregistrer, Prévoir cette dépense (primaire, avec le montant), × fermer.
Repliés à un toucher : la ligne d'un ingrédient (prix, source) s'ouvre sur place (cadre 2) ; « Comprendre ces montants » devient une question IA au toucher.
Partis : la date du scénario (« Aujourd'hui / Demain / Dans 7 jours ») passe dans la ligne Malt ouverte (elle ne sert qu'au partage du stock) — non dessinée, à dessiner si gardé. La feuille couvre la barre du bas, comme aujourd'hui.

## IA (ajout du 09.11)
« Pourquoi ce loyer ? » : bouton au toucher sous la liste ; jamais au repos à la place d'un chiffre.

## Boosters UX (boosters-ux)
- `recap-deux-nombres` — lire/choisir ; deux tuiles boutons ; noir = poche, bleu = litre ; toucher « À payer » estompe les lignes non payées maintenant et la barre (cadre 2).
- `barre-litre` — lire ; barre empilée du litre en couleurs de catégorie, fin hachurée = inconnu ; la plus grosse part (violet, charges fixes) saute aux yeux.
- `volume-net` — ajuster ; − 27 L + ; tout se recalcule (cadre 2 : 24 L → 7,77 CHF/L, 60,83 à payer).
- `ia-expliquer`, `prevoir` — déclencher.
- B1 OK — 4 boosters, effet dessiné au cadre 2. B2 OK — un primaire ; deux tuiles dominent (choix voulu : ce sont les deux nombres à ne pas confondre). B3 alerte — 98 mots au premier écran (seuil modéré 98). B4 OK — deux groupes nommés « Le brassin » / « L'année ». B5 OK. B6 OK — 3 tailles, Plex Mono pour les montants. B7 OK — COMMUN contraste OK. B8 OK — inconnu « ? » hachuré, estimé marqué. B9 s.o. (statique). B10 OK — champ prix `inputmode="decimal"`, pas de `type="number"`. B11 « À payer 64,26 maintenant ; un litre coûte 7,51, surtout le loyer. » B12 OK — rayons 10/16/24. B13 OK — cibles ≥ 28 px.

## Contrôles (sorties recopiées)
`verifier-page` : PAGE OK (390 px, sans erreur) · 1280 : débord 0 · `controle-commun --profil=sans-houblons` (6 concepts) : COMMUN OK · mots : 98 (alerte modérée) · panel : remplissage 0,525 · PANEL OK (lot c).
Captures : `c1a-haut.png`, `c1a-page.png` (cadres 1 et 2), `c1a-1280.png`.

## Ce qui tient / ce qui casse
Tient : la séparation poche / litre se lit en 2 s ; la flèche ↗ relie les deux. Casse : 98 mots, à la limite ; la feuille reste une liste (peu « moderne ») ; l'en-tête de l'app est sous le voile.
