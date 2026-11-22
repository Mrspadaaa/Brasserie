# Améliorations Stock et Carnet : workflow, besoins, nice to have (21.11)

Sa question : « Rien d'autre, en terme de workflow, upgrade, changement, ECT pas just des bug mais des améliorations ou nice
to have, ou des besoins ? » (21.11, Stock et Carnet).

## Portée et méthode
- Portée : ce qui manque au Stock (Articles, Courses, fiche, Recompter, Fûts) et au Carnet, **hors** défauts déjà versés
  (STE, STM, STG, STC, CRP, CRB, CRU, CRW), hors « à dessiner » D1 à D8 (Stock) et D1 à D7 (Carnet), hors propositions
  déjà écrites : G1 à G5 (`workflows-app/ANALYSE-acheter.md`), K3, K6, K8, N3, N6, PI-3, B6 (`workflows-app/SYNTHESE.md`,
  `ANALYSE-passe2.md`, `ANALYSE-principes2.md`), W1 à W3 (`chasse-carnet/CHASSE-workflow.md`), A4 (état « commandé »).
  Quand une idée les touche, elle les cite et dit ce qu'elle ajoute.
- Filtre : `workflows-app/GAIN.md` et les règles R1 à R12 de `REGLES.md`.
- **Limite** : analyse seule, aucune chaîne jouée dans l'app pour ce fichier. Tous les gestes sont **estimés** (lecture du
  code de `port-carnet`, tag `en-ligne/2026-11-21-tour8`, et des chaînes mesurées des analyses citées). Le point 2 de
  GAIN.md (chaîne jouée) reste à faire avant toute mini maquette.
- Fréquences : aucun usage réel mesuré. Hypothèse reprise d'`ANALYSE-acheter.md` : 3 brassins de 30 L par mois,
  1 à 2 commandes et 1 à 2 factures par mois. Achat de matériel : rare (0 réalisé, `CHASSE-workflow.md`).
- Note = gain × fréquence. Gain : 1 = quelques gestes ; 2 = au moins 30 % de gestes en moins ou une ressaisie
  supprimée ; 3 = une erreur coûteuse rendue impossible (brassin reporté, sachet périmé brassé, stock faux le jour J).
  Fréquence en fois par mois (par brassin = 3 ; par commande ou facture = 1,5 ; mensuel = 1 ; annuel = 0,08 ; rare = 0,05).
- Règle n° 1 : tout ce qui se voit part de sa maquette choisie (`ecrans.json`) en mini maquettes ; seul le domaine se
  code avant son choix. Un champ Firestore de plus est un accord.

## Le mois du brasseur, et où ça casse
1. **Planifier 3 brassins** : le manque se calcule (`domain/stock/disponibilite.ts`, MRP simple) et se date
   (`horizon.ts` : S49, 6 sem., Tout). Il ne dit pas **quand commander** au plus tard.
2. **Commander chez Brau- und Rauchshop** : « Copier la liste » écrit « Malt pilsner : au moins 3,2 kg »
   (`StocksTab.tsx:268-279`). Le site vend des sacs de 5 et 25 kg : il convertit de tête.
3. **Suivre la commande** : « commandé le / reçue le » existe, mais sur la fiche fournisseur seulement
   (`ui/fournisseurs/PageFournisseurs.tsx:145`), dans les réglages **de l'appareil** (`ReglagesFournisseurs.commandes`,
   pas Firestore) : une commande notée au téléphone n'existe pas au PC. Rien ne la ferme à la réception.
4. **Recevoir** : la facture entre au stock (`services/purchaseEntry.ts`) ; le PDF arrive par e-mail, l'app n'est pas
   cible de partage (aucun `share_target`). La DDM de la levure n'est jamais demandée à la réception (`expiresOn`
   absent des services d'achat), donc l'alerte AM-56 (`durabilite.ts`) ne se déclenche que si la DDM a été tapée à part.
5. **Préparer le brassin** : le déstockage suit la pesée réelle (`finance/brewStockConsumption.ts:160`, bien). Mais
   aucun geste ne vérifie avant le jour J que ce qui est en rayon existe vraiment ; soude, acide, bouteilles, capsules
   ne bougent jamais (grep « capsule|bouteille|étiquette » vide dans le déstockage : à confirmer au doigt).
6. **Prix** : la fiche d'un article montre le dernier prix seul (`stock/ficheArticle.ts:57`) ; la tendance n'existe que
   par fournisseur, dernier contre précédent (`fournisseurs.ts:310`). Le port (ligne `shipping`) n'entre pas au prix.

## Classement (gain × fréquence)

| # | proposition | règle | gain | fréq./mois | note | coût | donnée | classement |
|---|---|---|---|---|---|---|---|---|
| A1 | Date limite de commande par brassin | R1, R4 | 3 | 3 | 9 | petit | existe (délai : appareil seul) | **vrai gain** |
| A2 | Vérifier le stock d'un brassin avant de brasser | R11, R8 | 3 | 3 | 9 | petit | existe | **vrai gain** |
| A3 | Nettoyage et emballage déstockés au brassin, proposés | R1, R8 | 2 | 3 | 6 | moyen | dose absente (accord) | **vrai gain** |
| A4 | Partager une facture ou un lien vers l'app | R1, R11 | 2 | 2 | 4 | moyen | aucune requise | **vrai gain** (Android) |
| A5 | Liste de commande en conditionnements, total estimé | R8, R4 | 2 | 1,5 | 3 | petit | existe | **vrai gain** |
| A6 | La réception demande ce que seul le paquet dit | R2, R1 | 3 | 1 | 3 | petit | existe (DDM, α) | **vrai gain** |
| A7 | La facture ferme la commande | R1 | 2 | 1,5 | 3 | petit | existe (appareil seul) | **vrai gain** |
| A8 | Prix et dispo du jour chez le fournisseur sur Courses | R4, R8 | 2 | 1,5 | 3 | moyen à gros | lien produit absent | nice to have |
| A9 | Historique des prix sur la fiche de l'article | R7, R6 | 2 | 1 | 2 | petit | existe | **vrai gain** |
| A10 | Port réparti sur le prix des lignes | R4 | 1 | 1,5 | 1,5 | petit | existe | nice to have |
| A11 | Substitut en stock quand un houblon manque | R8 | 2 | 0,5 | 1 | moyen | existe | nice to have |
| A12 | Âge du lot sur la ligne, le plus ancien d'abord | R6 | 1 | 1 | 1 | petit | existe | nice to have |
| A13 | Seuil proposé selon l'usage | R8, R2 | 2 | 0,2 | 0,4 | petit | existe | nice to have |
| A14 | Valeur du stock au 31.12 pour la fiduciaire | R1 | 3 | 0,08 | 0,25 | petit | existe | nice to have |
| C1 | Carnet : « tient dans la place » | R4 | 3 | 0,05 | 0,15 | moyen | place absente | nice to have |
| C2 | Carnet : annonces d'occasion suisses lues | R7 | 1 | 0,05 | 0,05 | petit | non mesuré | nice to have |

Bilan : **8 vrais gains**, **8 nice to have**, **8 écartés** (annexe).

## Détail

### A1 — Date limite de commande par brassin (vrai gain)
- Aujourd'hui : Courses dit le manque et sa semaine (« S49 »), jamais « commande avant ». Il ouvre Plus › Fournisseurs ›
  la fiche pour lire le délai (environ 3 gestes, estimé), puis calcule de tête ; s'il oublie, le brassin glisse.
- Visé : sur la ligne du manque et au Bord, « commander avant jeu. 27.11 · IPA du 01.12 » = date du brassin − délai
  appris du fournisseur (`fournisseurs.ts:86 delaiAppris`) ; sans délai appris, 7 jours marqués « estimé » (R2).
- Gain : 0 geste au lieu de 3 plus un calcul ; oubli rendu visible avant qu'il coûte un report. Complète G2 (quelle
  liste s'ouvre), ne le remplace pas.
- Coût : une date de plus sur une ligne qui existe ; aucun écran. Donnée : `plannedBrewDate` existe ; délai existe mais
  vit sur l'appareil (voir A7).

### A2 — Vérifier le stock d'un brassin avant de brasser (vrai gain)
- Aujourd'hui : Stocks › Recompter › Compter par rayon ; ses 8 ingrédients sont dans 4 rayons (Malts, Houblons, Levures,
  Autres). Estimé d'après PI-3 (25 gestes pour 10 articles) : environ 22 gestes, et rien ne dit qu'il a fini.
- Visé : depuis la carte du brassin planifié (J−3), « Vérifier le stock » ouvre Recompter filtré sur ses seules
  sources de besoin ; « ✓ comme prévu » d'un toucher (son choix E2), chiffre tapé pour l'écart. Environ 10 gestes (−55 %).
- Gain : un malt absent découvert au concassage devient impossible ; le stock est juste là où il compte. Fréquence :
  chaque brassin.
- Coût : un filtre de plus dans Recompter (choix E2 et F2 déjà pris) et une entrée sur la carte du brassin.
  Donnée : les sources nommées par brassin existent (`disponibilite.ts`) ; mouvement `inventory-adjustment` existe.

### A3 — Nettoyage et emballage déstockés au brassin, proposés (vrai gain)
- Aujourd'hui : soude, acide, désinfectant, bouteilles, capsules, étiquettes, CO2 ne baissent qu'au recomptage. Le seuil
  de la soude (cas de la fixture d'`ANALYSE-acheter.md`) ne se déclenche donc jamais au bon moment.
- Visé : à la fin du brassin, une ligne « soude −150 g · acide −50 ml » ; au conditionnement « 72 bouteilles · 72
  capsules », valeurs = dernière dose (R8), un toucher pour poser, modifiables. Jamais imposé (R1 : suite incertaine).
- Gain : stock faux supprimé sur les consommables ; rupture de capsules le jour de l'embouteillage annoncée avant.
- Coût : moyen ; une dose « par brassin » sur l'article : **champ absent, donc accord**. Repli sans champ : reprendre la
  quantité du dernier mouvement de ce genre.

### A4 — Partager une facture ou un lien vers l'app (vrai gain, Android)
- Aujourd'hui : facture PDF reçue par e-mail : télécharger, ouvrir l'app, Actions rapides, Facture, choisir un fichier,
  Téléchargements, le PDF : environ 8 gestes (estimé). Lien d'un produit vers un carnet : copier, changer d'app, Stocks,
  Matériel, Carnets, le carnet, Coller : environ 7.
- Visé : Partager › L'Affinée : 2 gestes, la lecture part seule ; un lien demande « Carnet X ou nouveau ». −70 %.
- Gain : chaque facture électronique et chaque article de carnet. Coût : moyen (`share_target` du manifeste, réception
  par le service worker ; vite-plugin-pwa accordé le 21.11). **Limite** : Chrome Android installé ; iOS ne le permet pas.
  À vérifier : son téléphone.

### A5 — Liste de commande en conditionnements, total estimé (vrai gain)
- Aujourd'hui : « Malt pilsner : au moins 3,2 kg » ; il traduit en sacs sur le site et ne connaît le total qu'au panier.
- Visé : « Malt pilsner · 1 sac 25 kg (manque 3,2 kg) · ~48 CHF » ; taille du sac = conditionnement de son dernier achat
  de l'article ; en bas, total estimé par fournisseur. Une proposition, modifiable (R8).
- Gain : calcul de tête supprimé, commande au mauvais format impossible, total connu avant le panier (franco de port).
- Coût : petit, une règle du domaine et la liste copiée. Donnée : quantité, unité et montant de la dernière ligne
  (`latestBrewPrices`, `ficheArticle.ts:57`) ; `packageLabel` lu sur brauundrauchshop.ch (`functions/src/brewerSuppliers.ts:129`).

### A6 — La réception demande ce que seul le paquet dit (vrai gain)
- Aujourd'hui : une levure entre sans DDM ; pour la poser : Stocks, Levures, l'article, Modifier, DDM, sélecteur :
  environ 7 gestes, faits rarement. Sans DDM, AM-56 se tait et un sachet périmé peut se brasser.
- Visé : à Confirmer la facture, une rangée par levure « DDM ? » au mois et à l'année (R2, c'est ce qui est imprimé) ;
  par houblon, « α du sachet ? » si la facture ne le porte pas. 2 gestes, passable.
- Gain : erreur coûteuse rendue impossible sans y penser. Fréquence : chaque achat de levure, environ mensuel.
- Coût : petit. Donnée : `yeastLot.expiresOn` et `alphaPct` existent ; l'année de récolte n'existe pas (non demandée).

### A7 — La facture ferme la commande (vrai gain)
- Aujourd'hui : « commandé le » se note sur la fiche fournisseur ; « reçue » aussi, à la main (environ 4 gestes),
  souvent oublié : le délai appris (donc A1) devient faux.
- Visé : la facture confirmée d'un fournisseur qui a une commande ouverte la marque reçue (R1, réversible, dite).
- Gain : 4 gestes et un oubli supprimés ; le délai se nourrit seul. Coût : petit. Donnée : existe mais **sur l'appareil** ;
  la passer dans Firestore pour qu'elle suive du téléphone au PC est un accord. Ne fait pas l'état « commandé » sur
  l'article (A4 de VOIES-CORRECTION, WFA-4).

### A8 — Prix et dispo du jour chez le fournisseur sur Courses (nice to have)
- Le parseur des sites suisses existe (`brewerSuppliers.ts` : brauundrauchshop.ch, brewstore.ch, bierbrauzubehoer.ch,
  sios.ch) : prix, dispo, conditionnement, sku. Il sert la levure, pas Courses.
- Visé : « Citra · rupture chez B&R » avant d'ouvrir le site. Gain réel, mais : lien produit absent de l'article (à
  poser une fois), appel réseau par ligne, sites fragiles. Repli petit : garder le lien produit et ouvrir la page en un
  toucher depuis la ligne.

### A9 — Historique des prix sur la fiche de l'article (vrai gain)
- Aujourd'hui : dernier prix seul ; comparer le Pilsner Brouwland et B&R = deux fiches fournisseurs et une recherche de
  ligne dans chacune (environ 8 gestes, estimé).
- Visé : la courbe « Ce qui a bougé » (son acquis) porte le prix au kg sur chaque marche d'achat, couleur du fournisseur ;
  « +12 % en 1 an ». Port du mécanisme existant (R7), pas un écran neuf. 1 geste.
- Gain : −85 % de gestes à chaque commande où il hésite. Donnée : `unitPriceCents` des lignes, mouvement `receipt`
  (`transactionId`, `stockItemRef`). Coût : petit, mais il touche son acquis : mini maquette.

### A10 — Port réparti sur le prix des lignes (nice to have)
- La ligne `shipping` est exclue (`finance/ledger.ts:70`) : le prix au kg et le coût du brassin (N6) l'ignorent.
  Écart non mesuré sur ses factures (à relever). Réparti au prorata du montant, marqué « port compris ».

### A11 — Substitut en stock quand un houblon manque (nice to have)
- Sur le manque d'un brassin : « Mosaic en stock · 24 g pour le même IBU ». Le moteur de substitution existe
  ([[substitution-moteur]]). Fréquence du cas non connue ; une proposition, jamais une recette réécrite (recette figée).

### A12 — Âge du lot (nice to have)
- « acheté il y a 14 mois » depuis la date du mouvement d'achat ; le plus ancien en tête de la pesée. Utile pour les
  houblons ; ne calcule aucune perte d'α (voir écartés).

### A13 — Seuil proposé selon l'usage (nice to have)
- Beaucoup de lignes « sans seuil » ; proposer la médiane consommée par brassin (mouvements « brassage »), un toucher.
  Réglage ponctuel : sous le seuil mensuel de GAIN.md.

### A14 — Valeur du stock au 31.12 (nice to have)
- Quantité × dernier prix, par catégorie, exportable. Annuel ; utile seulement si sa comptabilité porte un stock au
  bilan (à lui demander par la fiduciaire, pas bloquant).

### C1, C2 — Carnet (nice to have)
- C1 : un critère « place prévue 1,9 × 1,6 × 2,1 m » ; Comparer barre ce qui ne passe pas (dimensions lues du titre,
  parseur local de `CHASSE-workflow.md`). Erreur chère, achat rare.
- C2 : lire Ricardo, Tutti ou Anibis comme lien de carnet ; schema.org non mesuré sur ces sites.
- Le Carnet a peu de vrais gains propres : son achat est rare. Les siens passent par A4 (partage d'un lien) et par W1,
  W2 déjà écrits.

## Annexe : écartés (raison en une ligne)
- Notification push de rupture ou de DDM : le Bord le dit déjà (AM-56, horizon) ; une permission de plus, aucun geste en moins.
- Prévision de consommation par l'IA : les brassins planifiés donnent le besoin exact ; une IA ferait moins juste, et facturée.
- Perte d'α calculée (HSI, température du congélateur) : HSI du lot inconnu, précision fausse ; A12 suffit.
- Recomptage par photo de l'étagère (IA) : plus d'erreurs qu'un comptage, coût Gemini ; A2 vise juste.
- Rappel de recomptage tournant (un rayon par semaine) : A2 compte là où l'erreur coûte, le reste reste à son choix E2/F2.
- Panier pré-rempli sur le site du fournisseur : aucune interface publique connue, geste externe ; A5 suffit au collage.
- Levure récoltée et regénérée comme lot : PRODUCT.md privilégie les sachets secs ; aucun usage dit.
- Coût d'usage (kWh, entretien) dans Comparer du Carnet : donnée rarement publiée, achat rare.
- Déjà écartés ailleurs, non recopiés : `ANALYSE-acheter.md` (annexe), `CHASSE-workflow.md` (annexe), `SYNTHESE.md` l. 80-83.

## Ensuite
- Jouer au doigt les chaînes A1, A2, A5, A6, A7, A9 sur fixtures « ZZ TEST » (point 2 de GAIN.md), gestes et secondes
  relevés ; A3 et A4 demandent d'abord ses données (consommables par brassin, son téléphone).
- Accords à grouper : dose par brassin sur l'article (A3) ; commandes fournisseur en Firestore (A7).
- Ce qui se voit (A1, A2, A5, A6, A9) : mini maquettes depuis sa maquette choisie du Stock, dans l'ordre de la note.
