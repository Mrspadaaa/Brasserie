# CHASSE-workflow : Carnet › Chambre froide, du besoin à l'achat (21.11)

Regard : expert en workflow (préfixe CRW). Version jugée : tag `en-ligne/2026-11-21-tour8`. Ligne de départ : CRN-PRIX
(« il ya même pas le prix de la chambre froide ?? »). Règles : REGLES.md (R1 à R12), filtre GAIN.md.

## Méthode et limites
- Pas de banc Chrome rejoué pour cette passe. Preuves : ses captures 01 à 04 (ouvertes et regardées), le code du tag lu par
  `git show` (`functions/src/lireLien.ts`, `src/domain/carnets/{operations,modele,analyseLocale,ia}.ts`, `src/ui/carnets/*`),
  et les chiffres déjà mesurés d'`ANALYSE-acheter.md` (chaînes C, D, E).
- Gestes : comptés sur le code et les captures, donc **estimés**, sauf ceux d'ANALYSE-acheter (mesurés). Fréquences : aucun usage
  mesuré ; estimation d'après ses données (15 carnets, 14 en « Idée », 1 « À comparer », 0 réalisé : l'achat est rare).
- À vérifier au doigt avant toute maquette : CRW-2 (aucun champ prix sur l'article) et CRW-4.

## La chaîne, étape par étape

| # | Étape | Gestes (estimés) | Constat |
|---|---|---|---|
| 1 | Idée : écrire ou dicter dans « Une idée, un besoin… » | 2 à 3 | bon (01) |
| 2 | Coller un lien : bouton sur la carte, ou puce « Coller : … » (R15) | 1 | bon |
| 3 | Article créé : lecture du lien sans modèle (`lireLien`) | 0 | nom, photo, dispo ; prix seulement si la page publie schema.org Offer ou og:price, un seul prix |
| 4 | Prix absent : Ouvrir ↗ sur le site, lire, revenir | 2 + sortie de l'app | rupture (CRW-1) ; rien ne permet de le saisir (CRW-2) |
| 5 | Comparer › | 1 | colonne prix absente si aucun article n'en a ; colonnes vides (04) |
| 6 | Choisir (pourquoi) | 2 à 3 | permis sans prix si un nom est connu ; plan créé à 0 CHF |
| 7 | À venir : plan « budget inconnu », date vide | 0 (auto) | ne figure ni au Calendrier ni dans la caisse (CRW-3) |
| 8 | Commander / acheter | hors app | aucun bouton, aucun état « commandé » (CRW-5) |
| 9 | Facture photographiée → Finances → Calendrier | 9 (mesuré, chaîne C) | rien ne relie la facture au plan du carnet (CRW-6) |
| 10 | Réalisé (Matériel › Parc) | 6 (mesuré, chaîne E) | WFA-12 : demandé d'abord si aucun achat lié |

Total estimé idée → réalisé : environ 25 gestes, trois sorties de l'app (site du vendeur, boutique, appareil photo).

## Défauts

### CRW-1 (gênant) Rupture : le prix, lu ou non, oblige à quitter l'écran
- Geste : coller le lien d'une chambre froide ; ouvrir l'article.
- Attendu (R1, R2) : un prix, ou une invitation à l'estimer d'un geste.
- Constaté : `lireLien.ts` l. 133-150 : prix lu seulement via ld+json `Offer` à prix unique ou og/product:price ; une `AggregateOffer`
  ou plusieurs variantes « ne donnent aucun prix » (volontaire). Les deux chambres froides (02) n'affichent aucun prix. Dimensions :
  seul `additionalProperty` est lu (l. 158) ; un tableau HTML ne l'est pas.
- Mesure : 2 articles sur 2 sans prix (capture 02). Estimé : 4 à 5 gestes et une sortie de l'app pour retrouver un prix.

### CRW-2 (bloquant) Aucun moyen de saisir ou corriger le prix d'un article
- Geste : chercher où taper un prix sur la carte, la fiche ou le tableau.
- Attendu (R2) : un champ « Prix ? » sur l'article, fourchette ou estimation marquée, Entrée valide.
- Constaté : `FicheArticle.tsx` n'a aucun champ ; `operations.ts` expose `modifierLigne` pour critère, façon et note seulement
  (`cible: 'critere' | 'facon' | 'note'`), aucune opération `modifierArticle` ; seul `analyseLocale` pose un prix, et seulement quand
  il est écrit dans le message. À vérifier au doigt : « Ajouter à Chambre… » avec « 4 900 CHF » rattache-t-il le prix au bon article ?
- Conséquence : un prix absent est irréparable sans retaper un message. C'est la cause de CRN-PRIX, pas son symptôme.

### CRW-3 (bloquant) Choisir sans prix crée un plan à 0, sans date : il n'existe ni au Calendrier ni dans la caisse
- Geste : Comparer › Choisir un article sans prix.
- Attendu (R1, R2, R4) : plan daté par défaut (« dans 3 mois »), prix marqué estimé ou demandé en une ligne.
- Constaté : `planDepuisChoix` (operations.ts l. 591-606) : `date: ''`, `amountCents: 0`, `stage: 'research'`, `budgetKnown: false`
  si prix inconnu. `upgradeForecast.ts` l. 34 : « sans date, rien n'est posé ». Un achat choisi reste invisible des deux écrans
  que le brasseur vise, et le prix et la date se ressaisissent dans À venir (doublon).

### CRW-4 (gênant, à vérifier) Le prix saisi après coup ne suit pas dans l'autre sens
- Constaté : le plan est tiré une fois (`poserSortie` idempotent) ; aucune lecture inverse du plan vers l'article trouvée.
  Deux prix possibles pour une chose (R5). Non rejoué : à vérifier avant de conclure.

### CRW-5 (gênant) « Commander » n'existe pas : la chaîne s'arrête au choix
- Constaté : grep `Commander|Acheter|acheté` dans `src/ui/carnets` : aucun. L'achat se fait chez le vendeur, hors de l'app ; aucun
  état « commandé le … », aucun délai de livraison attendu (cf. WFA-4 d'ANALYSE-acheter).
- Livraison : `lireLien` lit la disponibilité, pas le délai ni le port ; pour une chambre froide de 4 m³, le port compte.

### CRW-6 (gênant) La facture ne retrouve pas le plan du carnet
- Constaté (chaînes C et E d'ANALYSE-acheter, mesuré) : la photo alimente stock et caisse, mais le plan du carnet reste « À venir » ;
  le réalisé se pose par « Marquer comme réalisé » (WFA-12). Le brasseur redit donc vendeur et montant, déjà connus du carnet.

### CRW-7 (mineur) Lignes vides au premier plan, dépendantes de l'IA
- 02/03 : « Ce qui compte · rien encore : l'IA le proposera » et « Façons · aucune : l'IA les cherche ». Si l'IA est hors ligne,
  aucun geste manuel visible (non rejoué). Colonne « Dimensions » coupée à 390 (« Dimensio ») en 02 ; « l&apos; » brut en 04
  (déjà dans CRN-PRIX, non recopié).

## Ce qui devrait être automatique
- Prix : lu quand la page le publie ; sinon saisi une fois sur l'article (CRW-2), jamais retapé dans À venir.
- Date du plan : par défaut un horizon (aujourd'hui, 1 mois, 3 mois), marqué estimé (R2).
- Dimensions : déjà dans le titre (« 1800 x 1500 mm - 4,06 m³ ») ; un parseur local suffit.
- Livraison : non lue ; schema.org `shippingDetails` est rarement publié (non mesuré) : ne rien promettre.

## Propositions passées au filtre GAIN

**W1 : un prix à l'article, en une saisie, marqué estimé (R2, R5, R8).** Candidat.
- Chaîne jouée : non (CRW-2 à confirmer au doigt). Avant (estimé) : 4 à 5 gestes + sortie ; après : 2 (toucher « Prix ? », saisir, Entrée).
- Fréquence : à chaque comparaison d'achat ; estimée mensuelle, non mesurée. Gain : ressaisie supprimée, erreur impossible (plan à 0).
- Coût : un champ sur la carte article ; retire la sortie vers le site.

**W2 : Choisir pose un plan daté (R1, R2, R4).** Candidat, lié à W1.
- Après : plan « dans 3 mois » modifiable d'un toucher, avec le prix de W1 ; visible au Calendrier et dans la caisse prévue.
- Gain : ressaisie (date, prix) supprimée ; erreur impossible (achat choisi mais absent des écrans). 0 geste ajouté, ~4 retirés (estimé).
- Coût : une valeur par défaut estimée, marquée comme telle.

**W3 : la facture propose le plan du carnet (R1, R8).** À jouer avant maquette.
- Estimé : 6 gestes de « Marquer comme réalisé » + redite remplacés par 1 confirmation « C'est l'achat de Chambre froide ? ».
- Fréquence : achat de matériel, rare (0 réalisé aujourd'hui) : probablement sous le seuil mensuel de GAIN.md. Non candidat tant que non confirmée.

## Annexe : gimmicks écartés
- Statut « commandé » avec suivi de livraison : fréquence trop basse, donnée non lue du lien.
- Lecture IA des dimensions depuis le lien : déjà dans le titre, aucun gain mesurable.
- Vue « toute la chaîne » du carnet à la facture : refusée par lui (pe2, pe5).
- Alerte de baisse de prix : la veille existe déjà (sans relève, R31) ; hors sujet ici.

## Synthèse
7 défauts : 2 bloquants (CRW-2, CRW-3), 4 gênants (CRW-1, 4, 5, 6), 1 mineur (CRW-7). 2 candidats GAIN (W1, W2), 1 à jouer (W3).
Racine commune : le carnet sait lire un prix mais pas le recevoir de lui, et n'en tire ni date ni écriture.
