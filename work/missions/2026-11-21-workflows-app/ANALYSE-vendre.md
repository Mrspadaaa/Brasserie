# Chaîne VENDRE : analyse des workflows (21.11)

Ses mots, d'où part l'analyse : « c'est pas du tout que le calendrier mais l'app dans sa totalité vu que tout est lié, tout est dynamique ensemble » ; « Aussi on a une vente, ça l'ajout au calendrier automatiquement » ; « on modélise des actions, workflow… mais pas le "visuel" » ; « des vrais gain et pas juste des gimmick » (GAIN.md).

Règles citées : les règles R1 à R7 du CADRAGE § 3 (`work/missions/2026-11-20-workflows/CADRAGE.md`). REGLES.md n'existait pas au moment de l'analyse. Banc, fixture et bugs : voir `BUGS-vendre.md` ; scripts dans `vendre/` (fixture.mjs, outils.mjs, c1.mjs, c2.mjs) ; captures dans `vendre/captures/`.

**Limites.** La chaîne V1 a été jouée au doigt de bout en bout. Pour V2 à V5, seul le début a été joué : le reste vient du code et des boutons relevés. Leurs chiffres sont marqués « estimé », et le rejeu est demandé plus bas. Les fréquences sont estimées : l'app locale n'a pas son usage réel. La forme de ses données (ventes de fûts aux pros, « Café du Pont, 1 fût », « La Cigogne, 3 fûts ») vient de ses captures du 20.11, reprises dans la fixture du parcours Calendrier.

## Table des chaînes

| Chaîne | Entrée réelle | Gestes aujourd'hui | Gestes visés | Frictions |
|---|---|---|---|---|
| V1 Vente au comptoir, 6 × 33 cl, TWINT | Bord › + › Vente | **10 gestes, 7,3 s** (joué) | 5 (P4) | 6 touchers pour 6 bouteilles ; TWINT et Espèces de 58 × 30 px (WFV-8) ; jauge « 99.6 » (WFV-7) ; la vente n'est pas une chose de la rangée Ventes (WFV-3) ; le Bord ne la voit pas (WFV-4) ; aucun stock restant (WFV-6) |
| V2 Facture à un pro, 2 fûts, puis les fûts sortent | + › Vente, puis Stocks › Fûts × 2 | ≈ 19 (estimé : 7 à la caisse, joués jusqu'à « Facture QR », puis environ 6 par fût) | 8 (P1) | client, date et brassin saisis trois fois ; la vente laisse les fûts « pleins en cave » (WFV-1) ; consigne « une facture a besoin d'un client » loin du choix du client (WFV-9) |
| V3 La commande promise devient vente | Calendrier › chose « La Cigogne, 2 fûts » | ≈ 11 (estimé : vente faite de zéro, 7, puis plan retiré à la main, 4) | 3 (P2) | aucun pont entre le plan et la caisse ; sans retrait, le montant compte deux fois (WFV-2) |
| V4 Retour d'un fût vide | Stocks › Fûts › fiche | ≈ 4 (estimé) | 2 (P5, à confirmer) | le retour ne se fait que depuis le fût, pas depuis le client chez qui il est |
| V5 Encaisser une facture due | Finances (bouton « Noter l'encaissement » à l'accueil) | ≈ 2 à 3 (bouton vu) | — | rien à gagner : en annexe |
| V6 Combien me reste-t-il à vendre ? | aucune | impossible (aucun écran) | 1 regard (P3) | Brassins masque les bières conditionnées et terminées (WFV-5) ; Stocks n'a pas de produit fini (WFV-6) |

Ce qui suit déjà bien, vu dans l'app : la vente arrive tout de suite dans Finances (« Entré 167,00 · 2 ventes », caisse 2 500 → 2 527), avec la feuille avant → après et Annuler. Elle arrive aussi dans la courbe du calendrier et dans le carnet du client (« La Cigogne · 1 vente »). Les gestes répondent sans lenteur à CPU × 1.

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
- **Avant → après** : ≈ 19 gestes → 8 (**−58 %**).
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
- **Avant → après** : ≈ 11 → 3 (**−73 %**).
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
- **Avant → après** : ≈ 4 → 2 (**−50 %**, estimé).
- **Fréquence** : chaque fût vendu, donc la même fréquence que P1.
- **Gain** : ≥ 30 % de gestes en moins.
- **Coût** : un raccourci dans la fiche du client.
- **Réserve** : les 4 gestes d'aujourd'hui sont estimés. Si le rejeu en compte 3 ou moins, P5 passe en annexe.

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
- **Non mesuré** : CPU × 4 (le téléphone), demandé ci-dessous.

## Gimmicks écartés (non candidats)
- **Bouton « ajouter au calendrier » pour une vente** : la vente y entre déjà par la courbe. Le manque est un bug (WFV-3), pas un geste à ajouter.
- **Dates en horizons pour la vente** : une vente a un jour exact. R2 réserve les horizons aux intentions.
- **Prix estimé par IA à la caisse** : les tarifs existent déjà. Aucune ressaisie ne disparaît.
- **« Mon mois » plus visible** : le retour existe déjà (+27,00 en direct). Aucun geste n'en sort.
- **Vue « toute la chaîne de la vente »** : il l'a refusée (pe5, CADRAGE § 4).
- **Encaisser une facture (V5)** : 2 à 3 gestes depuis l'accueil de Finances. Moins de 30 % à gagner.

## DEMANDE EXECUTANT

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
