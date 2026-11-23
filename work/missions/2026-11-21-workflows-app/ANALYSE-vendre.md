# Chaîne VENDRE : analyse des workflows (21.11)

Ses mots, d'où part l'analyse : « c'est pas du tout que le calendrier mais l'app dans sa totalité vu que tout est lié, tout est dynamique ensemble » ; « Aussi on a une vente, ça l'ajout au calendrier automatiquement » ; « on modélise des actions, workflow… mais pas le "visuel" » ; « des vrais gain et pas juste des gimmick » (GAIN.md).

Règles citées : les règles R1 à R7 du CADRAGE § 3 (`work/missions/2026-11-20-workflows/CADRAGE.md`). REGLES.md n'existait pas au moment de l'analyse. Banc, fixture et bugs : voir `BUGS-vendre.md` ; scripts dans `vendre/` (fixture.mjs, outils.mjs, c1.mjs, c2.mjs) ; captures dans `vendre/captures/`.

**Limites.** La chaîne V1 a été jouée au doigt de bout en bout. Les chaînes 2 à 5 ont été rejouées au doigt le 21.11 (section « Rejeu mesuré ») : leurs chiffres marqués « mesuré » remplacent les « estimé ». V3 n'a pas pu aller jusqu'au bout (WFV-14). Les fréquences sont estimées : l'app locale n'a pas son usage réel. La forme de ses données (ventes de fûts aux pros, « Café du Pont, 1 fût », « La Cigogne, 3 fûts ») vient de ses captures du 20.11, reprises dans la fixture du parcours Calendrier.

## Table des chaînes

| Chaîne | Entrée réelle | Gestes aujourd'hui | Gestes visés | Frictions |
|---|---|---|---|---|
| V1 Vente au comptoir, 6 × 33 cl, TWINT | Bord › + › Vente | **10 gestes, 7,3 s** (joué) | 5 (P4) | 6 touchers pour 6 bouteilles ; TWINT et Espèces de 58 × 30 px (WFV-8) ; jauge « 99.6 » (WFV-7) ; la vente n'est pas une chose de la rangée Ventes (WFV-3) ; le Bord ne la voit pas (WFV-4) ; aucun stock restant (WFV-6) |
| V2 Facture à un pro, 2 fûts, puis les fûts sortent | + › Vente, puis Stocks › Fûts × 2 | **18 (mesuré 21.11)** : caisse 8, Stocks › Fûts 2, livraison de chaque fût 4 (× 2) | 8 (P1) | client, date et brassin saisis trois fois ; la vente laisse les fûts « pleins en cave » (WFV-1) ; consigne « une facture a besoin d'un client » loin du choix du client (WFV-9) |
| V3 La commande promise devient vente | Calendrier › chose « La Cigogne, 2 fûts » | **11 avant retrait (mesuré 21.11)** : vente de zéro 8, puis Calendrier, chose, Facturer 3, qui ouvre Finances sans caisse (WFV-14) ; retrait du plan non joué | 3 (P2) | aucun pont entre le plan et la caisse ; sans retrait, le montant compte deux fois (WFV-2) |
| V4 Retour d'un fût vide | Stocks › Fûts › fiche | **4 (mesuré 21.11)** : Stocks 1, Fûts 1, F-004 1, Retour vide 1 | 2 (P5, chemin carnet non joué) | le retour ne se fait que depuis le fût, pas depuis le client chez qui il est |
| V5 Encaisser une facture due | Finances (bouton « Noter l'encaissement » à l'accueil) | **4 (mesuré 21.11)** : Finances, Noter l’encaissement, ✓ Encaisser 140,00, OK | — | rien à gagner : en annexe |
| V6 Combien me reste-t-il à vendre ? | aucune | impossible (aucun écran) | 1 regard (P3) | Brassins masque les bières conditionnées et terminées (WFV-5) ; Stocks n'a pas de produit fini (WFV-6) |

Ce qui suit déjà bien, vu dans l'app : la vente arrive tout de suite dans Finances (« Entré 167,00 · 2 ventes », caisse 2 500 → 2 527), avec la feuille avant → après et Annuler. Elle arrive aussi dans la courbe du calendrier et dans le carnet du client (« La Cigogne · 1 vente »). Les gestes répondent sans lenteur à CPU × 1.

## Rejeu mesuré (21.11, chaînes 2 à 5)

**Méthode.** Rejeu au doigt (`touchscreen.tap`, 390 × 844 tactile) du build de test de `port-carnet` servi en local, `?dev-local`, fixture simulée (`vendre/fixture.mjs`, aucune donnée réelle). Une session par passe, ordre 2 → 3 → 4 → 5. Passe 1 : CPU ×1. Passe 2 : CPU ×4 (`Emulation.setCPUThrottlingRate`). Le banc attend 80 ms avant et 700 ms après chaque geste : les durées sont celles du banc, pas celles d'une main. Script `vendre/rejeu-chaines.mjs` ; relevés `vendre/rejeu-cpu1.json` et `vendre/rejeu-cpu4.json` ; captures `vendre/captures/rejeu-cpu1/` et `vendre/captures/rejeu-cpu4/`.

**Contournement de WFV-12.** La puce « C Pro La Cigogne » (70 × 84 px, entière) a été touchée au doigt. Clavier vérifié à part : Tab trois fois depuis le premier bouton, puis Entrée ; le client est choisi, la feuille reste ouverte. Le libellé « La Cigogne » seul ne commence aucune cible visible : le 28 × 28 du premier passage n'est pas reproduit.

| Chaîne | Gestes CPU ×1 | Durée CPU ×1 | INP max CPU ×1 | Gestes CPU ×4 | Durée CPU ×4 | INP max CPU ×4 | Fin |
|---|---|---|---|---|---|---|---|
| 2 Facture 2 fûts (V2) | 8 | 8,9 s | 64 ms | 8 | 12,3 s | **568 ms** | OK, facture 280,00 |
| 3 Commande promise (V3) | 3 | 4,0 s | 56 ms | 3 | 4,3 s | 272 ms | **bloquée** à « Facturer » (WFV-14) |
| 4 Livraison F-001 (V4 + C3) | 6 | 6,3 s | 72 ms | 6 | 6,7 s | 168 ms | OK, « Livré le 21.11 » |
| 4 Retour F-004 (V4) | 2 | 2,5 s | 48 ms | 2 | 2,8 s | 192 ms | OK, « À laver » |
| 5 Encaisser 140,00 (V5) | 4 | 6,0 s | 72 ms | 4 | 6,4 s | 192 ms | OK, caisse 2 640 CHF |
| **Total** | **23** | | 72 ms | **23** | | **568 ms** | |

Le INP de « OK » après encaissement est resté à 0 : aucun événement retenu, à ne pas lire comme 0 ms. Sur 23 gestes, à CPU ×4, 5 dépassent 200 ms (408, 384, 208, 568, 272 ms) ; à CPU ×1, aucun.

**Ce que la chaîne montre.**
- Chaîne 2 : la facture est créée. F-001 et F-002 restent « plein » (WFV-1 confirmé). Le plan « La Cigogne, 2 fûts +280 » reste « active », à côté de la facture dans la rangée Ventes (WFV-2 confirmé).
- Chaîne 3 : « Facturer » sur la chose du plan ouvre la liste Finances (« à encaisser 420,00 ») ; aucune caisse préremplie, aucune vente créée (WFV-14). Le banc s'arrête là et ne touche rien d'autre.
- Chaîne 4 : la livraison passe par la liste client du fût (champ « Client », puis « La Cigogne », puis « Livrer »). Le retour se fait par « Retour vide » ; il met le fût « À laver ».
- Chaîne 5 : « ✓ Encaisser 140,00 » demande un second toucher, « OK » (feuille avant → après, 30 px, WFV-13). Ensuite la caisse affiche 2 640 CHF en caisse et 280,00 à encaisser.
- Le relevé `transactions` du banc garde « unpaid » après l'encaissement : c'est le cache du banc, pas l'écran. Ne pas s'en servir pour dire qu'un encaissement est enregistré.

**Gains révisés (21.11).**
- **P1** : 18 gestes mesurés avant (caisse 8, Stocks 2, livraison 4 par fût) → 8 après (caisse seule), soit **−56 %**. Chaîne jouée : le point 2 de GAIN.md est rempli. Retenu.
- **P2** : 11 mesurés jusqu'au blocage. Après : 3 (estimé), mais l'action « Vendre » de la chose n'existe pas (WFV-14). Gain non établi : P2 ne passe que si WFV-14 est réglé.
- **P3** : inchangé, non rejoué.
- **P4** : inchangé, V1 hors rejeu du 21.11 ; le geste de glisser n'est pas mesuré.
- **P5** : 4 gestes mesurés par le chemin Stocks (≥ 4, donc pas de passage en annexe). Le chemin du carnet (2 gestes) n'est pas joué : gain non établi.
- **V5** (encaissement) : 4 gestes mesurés, estimé 2 à 3. Reste en annexe.

## Propositions (chaînes d'actions, pas de visuel)

Chaque proposition passe les cinq points de GAIN.md.

### P1 — Une vente de fût sort le fût, et livrer un fût prépare sa vente
- **Règle** : R1 (une action pose toutes ses suites sûres, chacune se défait).
- **Chaîne** :
  1. Choisir le client et toucher « fût 20 L » × 2 : la caisse désigne les fûts pleins du brassin, les plus anciens d'abord (F-001 et F-002). Un toucher les change.
  2. Encaisser ou facturer : les fûts passent « livrés chez La Cigogne, le jour de la vente ». Leur historique dit « livré · F-2026-00x ».
  3. Annuler défait la vente et la livraison.
  4. Dans l'autre sens, « Livrer » sur un fût plein ouvre la caisse avec le client, le brassin, le fût et son tarif déjà posés.
  5. Sans fût plein du brassin, la vente passe quand même, et le fût reste « à désigner ».
- **Avant → après** : 18 gestes mesurés (21.11) → 8 (**−56 %**). Le « après » est estimé : la caisse à 8 gestes existe, le fût désigné ne l'est pas encore.
- **Fréquence** : chaque fût vendu à un pro, plusieurs fois par mois (estimé d'après la forme de ses données).
- **Gain** :
  - ressaisie supprimée : le client, la date et le brassin ne se tapent plus deux fois ;
  - erreur rendue impossible : un fût vendu ne reste plus « plein en cave ».
- **Coût** : une ligne « fûts : F-001, F-002 » dans le panier, modifiable. Rien d'autre.
- **Ses mots** : « On commence notre brassin, on a tout qui se met à jour sans rien faire », appliqué à la vente.

### P2 — La vente réelle solde la vente promise
- **Règle** : R1. La suite sûre de la vente est de clore sa promesse.
- **Chaîne** :
  1. Sur la chose « La Cigogne, 2 fûts » du calendrier, toucher « Vendre » : la caisse s'ouvre avec le client, le brassin, la quantité et le prix du plan.
  2. Facturer : le plan passe « réalisé » et la facture prend sa place dans la rangée et dans la courbe.
  3. Une vente faite par ailleurs (+ › Vente), sur le même client et le même brassin, pose la question « c'est la commande du 1 déc. ? ». La réponse par défaut est oui, et elle se défait.
- **Avant → après** : 11 mesuré avant retrait (8 de vente, puis 3 jusqu'à « Facturer », qui ouvre Finances : WFV-14) ; retrait non joué. Après : 3, estimé ; gain non établi.
- **Fréquence** : chaque commande promise, plusieurs par mois (ses captures en montrent deux sur six semaines).
- **Gain** :
  - erreur rendue impossible : plus de double compte dans « à dépenser » (WFV-2) ;
  - ressaisie supprimée : le client, la quantité et le prix ne se retapent plus.
- **Coût** : une action sur une chose qui existe déjà. Aucun écran neuf.
- **Ses mots** : « Aussi on a une vente, ça l'ajout au calendrier automatiquement ». Le calendrier doit suivre la vente, et pas seulement la recevoir.

### P3 — Le reste à vendre se lit sans calcul
- **Règle** : R6 (une vue spécialisée par action fréquente, comme l'épicerie), avec R1 (la vente décrémente).
- **Chaîne** :
  1. La vente retire ses bouteilles et ses fûts du reste du brassin : Pale Ale 114 × 33 cl et 2 fûts pleins.
  2. Le reste est dérivé des ventes et du conditionnement, jamais stocké à part (P8 : aucun geste ne consomme de stock).
  3. On le lit à trois endroits : la caisse, la carte du brassin et un rayon « bière à vendre » des Stocks.
  4. Les ventes saisies avant la caisse ne sont pas comptées, et c'est dit (jamais un faux zéro).
  5. Brassins montre les bières en vente quelle que soit la période (WFV-5).
- **Avant → après** : impossible aujourd'hui (aucun écran ne le dit) → 1 regard.
- **Fréquence** : à chaque vente et chaque semaine de marché (estimé).
- **Gain** : erreur rendue impossible : on ne promet plus ce qui n'existe plus, et on n'ignore plus une bière qui vieillit en cave.
- **Coût** :
  - ajouté : un rayon dans Stocks ;
  - retiré : la jauge en litres de la caisse, que le reste en unités remplace.

### P4 — La quantité se donne d'un geste sur la tuile
- **Règle** : R3 (le geste sur la représentation passe avant le formulaire), avec R4 (le total bouge pendant le geste).
- **Chaîne** :
  1. Glisser vers le haut sur la tuile « 33 cl » : le compteur monte par paliers (6, 12, 24 = carton), et le total et « Mon mois » suivent pendant le geste.
  2. Le toucher simple garde son « +1 ».
- **Avant → après** : V1 10 → 5 gestes (**−50 %**). 24 bouteilles : 28 → 5 (−82 %).
- **Fréquence** : chaque vente au comptoir ou au marché, chaque semaine (estimé).
- **Gain** : ≥ 30 % de gestes en moins.
- **Coût** : un geste caché, à rendre visible par le compteur. Les boutons TWINT et Espèces passent à 44 px (WFV-8).

### P5 — Le fût revient depuis le client chez qui il est (à confirmer au rejeu)
- **Règle** : R1, avec R6.
- **Chaîne** :
  1. Dans le carnet du client, toucher « 1 fût dehors · 18 j » puis « Revenu vide » : le fût passe « à laver ».
  2. Une consigne facturée, s'il y en a une, se rembourse dans le même geste.
- **Avant → après** : 4 mesurés par le chemin Stocks (21.11) → 2 par le carnet (estimé, chemin non joué). Gain non établi.
- **Fréquence** : chaque fût vendu, donc la même fréquence que P1.
- **Gain** : ≥ 30 % de gestes en moins.
- **Coût** : un raccourci dans la fiche du client.
- **Réserve** : le rejeu du 21.11 compte 4 gestes sur le chemin Stocks (mesuré). Seuil « 3 ou moins » non atteint, donc P5 reste candidat ; le chemin du carnet reste à jouer avant de dire ≥ 30 %.

## Axes de goût (variantes, jamais bloquants)
- **P1 : désigner les fûts.** Trois variantes :
  - automatique, les plus anciens d'abord ;
  - toujours au doigt ;
  - automatique, avec la liste visible dans le panier.
- **P2 : l'entrée de la vente promise.** Deux variantes :
  - depuis la chose du calendrier seulement ;
  - aussi la question posée dans la caisse.
- **P3 : le lieu du reste à vendre.** Trois variantes :
  - un rayon des Stocks ;
  - la carte du brassin ;
  - les deux.
- **P4 : le geste de la quantité.** Trois variantes :
  - glisser ;
  - appui long avec 6, 12 et 24 ;
  - un pas de 6 réglable.

## Les quatre regards

### 1. Le brasseur (calé sur PORTRAIT.md)
- **V1** : la caisse lui parle (tuiles bouteille et fût, prix, total en gros). Phrase prédite : « pas mal, mais 6 fois taper pour 6 bouteilles ??? ». Ensuite : « 99.6 ? » (WFV-7).
- **V2** : « J'ai vendu 2 fûts et ils sont encore en cave ??? ». Un refus direct : l'intégration manque.
- **V3** : « La Cigogne compte deux fois ? », devant la courbe.
- **V6** : « Il me reste combien de Pale Ale ? ». Aucun écran ne répond. Il juge d'abord l'idée (P3) et accepte un « mais ».
- **Brassins vide de ses bières en vente (WFV-5)** : « Elles sont où mes bières ??? ».

### 2. Le designer d'interaction
- **Pouce** : les tuiles font 168 × 92 px, très bien ; TWINT et Espèces font 58 × 30 px, sous 44 px ; le × Fermer fait 28 × 28 px.
- **Retour** : la feuille avant → après et Annuler sont bonnes, mais elle colle sur tous les onglets (WFV-10).
- **Erreur** : la consigne « une facture a besoin d'un client » s'affiche loin de sa cause (WFV-9).
- **Vide** : « aucune bière conditionnée » est prévu.
- **Hors ligne** : la vente s'écrit sur l'appareil et se dit (« gardée sur cet appareil, pas dans Drive »). C'est vu.
- **Panier plein** : il est protégé à la fermeture (code). À rejouer.

### 3. L'intégration (où la donnée ne suit pas)
- **Vente → Finances** : oui, tout de suite.
- **Vente → courbe** : oui.
- **Vente → rangée Ventes** : non (WFV-3).
- **Vente → Bord** : non (WFV-4).
- **Vente → Clients** : oui.
- **Vente → Fûts** : non (WFV-1).
- **Vente → reste du brassin** : seulement dans la caisse (WFV-6).
- **Vente → vente promise** : non (WFV-2).
- **Livrer un fût → vente** : non (WFV-1).

### 4. Performance perçue (mesurée)
- **Gestes** : INP de 16 à 128 ms, mesuré par Event Timing à chaque geste à CPU × 1. Ouvrir « Vente » coûte le plus (64 à 128 ms) ; aucun geste ne dépasse 200 ms.
- **Démarrage** : 240 à 290 ms, build de test servi en local.
- **CPU × 4 mesuré (21.11, chaînes 2 à 5)** : INP max 568 ms sur « OK » après facture ; 408 ms à l'ouverture de « Vente » ; voir « Rejeu mesuré » et WFV-16.

## Gimmicks écartés (non candidats)
- **Bouton « ajouter au calendrier » pour une vente** : la vente y entre déjà par la courbe. Le manque est un bug (WFV-3), pas un geste à ajouter.
- **Dates en horizons pour la vente** : une vente a un jour exact. R2 réserve les horizons aux intentions.
- **Prix estimé par IA à la caisse** : les tarifs existent déjà. Aucune ressaisie ne disparaît.
- **« Mon mois » plus visible** : le retour existe déjà (+27,00 en direct). Aucun geste n'en sort.
- **Vue « toute la chaîne de la vente »** : il l'a refusée (pe5, CADRAGE § 4).
- **Encaisser une facture (V5)** : 4 gestes mesurés (21.11) depuis l'accueil de Finances, dont « OK ». Rien à retirer de façon sûre ; pas de proposition.

## DEMANDE EXECUTANT (faite le 21.11 : résultats dans « Rejeu mesuré »)

Rejeu de V2 à V5 jusqu'au bout, et mesure sous CPU × 4.

1. **Réparer le choix du client dans `vendre/c2.mjs`.** Toucher le bouton dont le texte est « C Pro La Cigogne », pas « La Cigogne » : le premier match visait une cible de 28 px (WFV-12). Après « Facture QR », relever le bouton primaire de facture et le toucher. Ouvrir ensuite Stocks › Fûts par `o.tap('Fûts', { pref: false })`, après avoir fermé la caisse par `o.tap('Fermer', { i: -1 })`.
2. **Lancer le rejeu**, depuis le dossier `vendre/` : `node c2.mjs <dossier>/caps`. Il faut le build de test, construit par `npx vite build --config scripts/parcours/vite.parcours.config.mjs --outDir <build> --emptyOutDir` dans `port-carnet`, avec `PARCOURS_RACINE` posé, et le chemin passé à `BUILD` dans `outils.mjs`.
3. **Mesurer sous CPU × 4** : `node c1.mjs <dossier>/caps4 4`.
4. **Relever** :
   - les gestes par étape (« == … : n gestes ») ;
   - les lignes KEGS, TX et PLANS ;
   - l'INP le plus haut sous CPU × 4.
5. **Attendu, si les hypothèses tiennent** :
   - KEGS : F-001 et F-002 restent `plein` après la facture (WFV-1) ;
   - PLANS : P-VENTE-CIG reste `active` (WFV-2) ;
   - CAL : la rangée Ventes porte à la fois le plan et la facture.
6. **Captures à ouvrir** : `c2-02-apres`, `c2-03-cal-apres`, `c2-04-futs`, `c3-02-livrer`, `c4-02-apres`, `c6-01`.
