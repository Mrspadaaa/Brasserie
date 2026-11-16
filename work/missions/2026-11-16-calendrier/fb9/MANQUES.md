# fb9 : ce qui manque à fb pour 9/10 (16.11, Opus, regard de complétude)
Base : `fl/fb` passe 2 (proto, GESTES, CRITIQUE : 8,5 / 7,5 / 8,5 / 7,5 / 8). Sources : LIENS.md (25 sources, 21 liens), SPEC du 15 et du 16.11.
Ses mots : « le cœur de l'application… 9/10 voir plus… tout le reste… s'intègre là dedans… filtrer, trier pinner ou star… le moins d'action possible ».
Lu dans `proto.tpl.html` : 0 occurrence de recherche, épingle, favori, retard, rappel, conflit, fût, échéance, livraison ou entretien.

## 1. Complétude : ce qui manque d'important
- **Sources de l'app absentes.** fb ne montre que ses 7 rangées d'exemple (brassage, fête, vente, achat, travaux, activité, papiers) et le loyer figé. Manquent :
  phases du brassin (primaire, dry hop, garde, conditionnement, starter) ; factures à payer (`dueDate`) ; prévisions récurrentes ; fûts (livré, retour attendu, lavage) ;
  stock (manque daté par le brassin qui l'ouvre, levure qui expire) ; livraisons et commandes ; entretien (`nextDueAfter`, panne = cuve indisponible) ; TVA, clôture ; tâches de l'Atelier.
  Faire : un genre par source, lu par la projection (LIENS §3.1). Chaque chose garde son `origine`, et un toucher ouvre sa fiche dans l'app.
- **Aujourd'hui.** Il n'existe que comme action du +. Manquent un trait « auj. », l'ouverture centrée sur la semaine en cours, et une rangée « Maintenant » en tête : ce qui est dû ou en retard, 3 au plus, puis « +n ».
- **Retard.** L'état n'existe pas. Facture échue, entretien dépassé, fût non rendu, phase dépassée : en rouge, remontés dans « Maintenant », clos d'un toucher.
- **Fait.** On ne peut clore ni une phase, ni un entretien, ni un paiement, ni un lavage (LIENS §4). Faire : balayer ou toucher « fait », daté du jour par défaut.
- **Rappels.** Aucun. Faire : rappel la veille ou le jour, réglé par genre et non par chose. `brewAlarms` ne couvre que le jour J.
- **Conflits.** Seule la charge en jours existe (« 4/2 j » rouge). Manquent la cuve occupée (`fermenterConflict`), le matériel en panne, le stock manquant pour un brassin et la caisse négative (critique n° 1).
  Faire : une pastille sur la chose, et « décaler en S50 », le premier créneau libre, d'un toucher.
- **Cascade.** Déplacer un brassin ne montre ni le manque daté, ni la cuve, ni l'argent qui change de mois (LIENS §3.4). Faire : un aperçu pendant le geste.
- **Récurrence.** Le loyer est figé (« se règle dans Finances »). On ne pose rien de récurrent : entretien tous les 3 mois, brassin toutes les 2 semaines, TVA trimestrielle. « Sauter cette fois » manque aussi (C6).
- **Épingler, favoris.** Absents. Une étoile met la chose dans une rangée « Épinglé » collée en haut, qui survit au filtre et à la période. Une puce souvent posée devient favorite, en tête de la bulle.
- **Trier.** Absent : l'ordre des rangées est fixe. Faire : un tri d'un toucher, par prochain d'abord, urgence (retard, conflit), montant ou type.
- **Rechercher.** Absent. Sur 5 ans (5 590 choses, LIENS §3.5), on ne retrouve ni le Marché de Noël ni un fût. Faire : une loupe qui propose les noms récents et épinglés, puis la dictée ; le clavier en dernier.
- **Filtrer plus.** Le filtre ne connaît que le type. Ajouter l'état (à faire, en retard, fait), le client ou le lieu, « avec argent », les épinglés, et des filtres gardés en puces (« Brassage + fûts »).
- **Vue liste.** Sur téléphone, « cette semaine » se lit mieux en liste. Faire : une bascule frise ↔ liste, même source, mêmes gestes.
- **Carnet et liens (16.11).** Un achat posé se relie à sa fiche du carnet et à la veille de prix tous les 3 jours. Le devis ou la facture scannés le closent.
- **Écritures et hors ligne.** Rien ne montre une écriture en file ou refusée. Hors ligne, déplacer un brassin est refusé : à afficher (C5).

## 2. Obstacles à la lisibilité
1. « À te permettre » sort de l'écran pendant un geste : on ne voit pas qu'il passe de 259 à −281 (critique n° 1).
2. À 390, la première chose apparaît à 59 % de la hauteur, et l'en-tête collé prend 230 px. En paysage 844, la frise n'occupe que 37 % : une seule rangée visible.
3. Les rangées de « + » ajoutent environ 350 px. Les 7 rangées restent affichées même vides. Avec les 25 sources, la densité explosera. Faire : rangées non vides seules, repliables, « 3 + n » par case.
4. Rien ne fait ressortir le retard, le conflit ou le jour présent : l'urgent pèse autant que le fond, tout est en barres pleines de couleur.
5. Une chose porte deux noms (« Malt groupé », « Commande groupée de malt »). Le bandeau est coupé là où est l'information, et une barre a deux tons sans légende.
6. On voit 3,5 filtres sur 7 ; la bulle couvre 70 % de l'écran ; les compteurs restent figés pendant le geste ; une aide écrite reste au repos, le loyer est écrit deux fois, et rien n'annonce le glisser (critique n° 4 à 12).

## 3. Frappes clavier évitables et leur remplaçant
| Clavier ouvert dans fb ou dans l'app | Remplaçant |
|---|---|
| Nom d'une chose neuve hors puces (`[data-bulle-nom]`) | Puces apprises par historique, fréquence et saison (« comme l'an dernier ») ; dictée ; le clavier derrière « autre… » |
| Montant au toucher (`[data-edit]`) | Valeurs proposées : dernier prix, prix du devis lié, ±10 % ; le glisser reste |
| Achat : nom, prix, fournisseur | Coller un lien (aperçu, prix, fournisseur, veille 3 j) ou scanner le devis : l'IA remplit et date |
| Facture à payer | Le scan existant crée l'échéance (`dueDate`) ; « payé » d'un toucher, daté du jour |
| Brassin | Puces des recettes récentes ou épinglées ; date proposée au premier créneau avec cuve libre et stock |
| Fût livré, vente | Puce du client récent ; le fût choisi d'un toucher parmi les pleins |
| Récurrence | Puces « chaque mois / trimestre / tous les N brassins » |
| Recherche, note | Noms récents en puces ; dictée, dont l'IA tire le genre et la date |
Règle : aucun geste n'ouvre le clavier par défaut.

## 4. Critères mesurables pour 9/10 (390 tactile, 844 paysage, 1280, deux thèmes ; rejeu `capt.mjs`)
- **K1 Gestes.** T1 à T8 sans dépasser fb. En plus : T9 marquer fait : 1 ; T10 voir le retard : 0 en ouvrant ; T11 retrouver une chose : ≤ 3, sans frappe ; T12 épingler : 1 ;
  T13 trier : 1 ; T14 payer une facture échue : ≤ 2 ; T15 décaler pour résoudre un conflit : 1, cascade visible ; T16 poser un achat par lien collé : ≤ 2.
- **K2 Clavier.** Aucun clavier ouvert dans les 16 tâches ; aucun `type="number"`.
- **K3 Place.** À 390 au repos, la première chose apparaît à 40 % de la hauteur au plus, avec un en-tête collé de 150 px au plus. En paysage, la frise occupe 60 % au moins.
- **K4 Honnêteté.** « À te permettre » reste visible dans tous les états de geste, en rouge s'il est négatif.
- **K5 Filtres et noms.** Tous les filtres sont visibles sans défiler, à 390 comme à 844. Une chose a un seul nom à l'écran : aucun doublon.
- **K6 Intégration.** Sur fixture, au moins 12 genres de l'app (§1). Chaque chose ouvre sa fiche d'origine en 1 toucher.
- **K7 Signal.** Facture échue, entretien dépassé, cuve doublée, stock manquant et caisse négative ont un signal visible au repos et figurent dans « Maintenant ».
- **K8 Densité.** Sur la fixture ×4 (22 302 choses) : rendu sous 100 ms, aucune étiquette chevauchée (`controle-panel`), aucune phrase d'aide au repos.
- **K9 Hors ligne.** Lecture et gestes simples marchent sans réseau ; un refus s'affiche sur la chose.
- **K10 Juge.** Critique Opus sur captures ouvertes : 9 au moins dans les 5 colonnes, et aucun problème grave.

## Leviers ajoutés par le brasseur (16.11, « Tous »), obligatoires dès la passe suivante
- **L1 Partager vers l'app** : depuis le navigateur, « Partager → L'Affinée ». La chose arrive datée dans le calendrier ou le carnet, sans copier-coller. Simuler l'entrée dans le prototype.
- **L2 Raccourcis sur l'écran d'accueil** : un appui long sur l'icône propose « Ajouter au calendrier » et « Nouvelle idée ». Le montrer dans une capture.
- **L3 Voix au +** : un micro dans le menu du +. La phrase « Rénovation sol S20 à 40, 600 francs » crée l'activité. Simuler, aucune frappe.
- **L4 Gestes directs sur la frise** : glisser pour déplacer, tirer le bord pour allonger. Un appui long ouvre épingler, étoile, filtrer et dupliquer.
- **L5 Propositions acceptées en un toucher** : les brassins habituels, la saison du frigo et les échéances.
- **L6 Carnet lié** : une idée du carnet avec une échéance ou un budget apparaît sur la frise. Une baisse de prix signalée par la veille s'y affiche aussi.
- **L7 Essais sur son téléphone** : le prototype final doit pouvoir être joué seul dans une page, avec 5 tâches et un chrono. Le pilote le publiera.

## PRIORITÉ du brasseur (16.11) : L4, les gestes directs sur la frise
- **K11 Gestes directs** est un critère bloquant, sans 9/10 possible tant qu'il manque.
  - Déplacer : glisser une barre déplace la chose, avec un aimant à la semaine (ou au jour quand on zoome), en 1 geste et sans frappe.
  - Allonger ou raccourcir : tirer un bord de la barre, en 1 geste.
  - Menu : un appui long ouvre épingler, étoile et filtrer (« seulement ce genre »), puis dupliquer.
- Retour visible pendant le geste :
  - le fantôme de la barre ;
  - les semaines visées ;
  - la caisse qui se recalcule en direct ;
  - un « Annuler » de 5 s après le geste.
- La mesure puppeteer joue ces trois gestes par des événements tactiles réels et vérifie la nouvelle date. Les juges y passent en premier.

## K12 Lisibilité visuelle (16.11, à propos du carnet, valable ici aussi : « difficile à lire, voir... »)
- Mesure par script, sur chaque écran au repos à 390 : au plus 40 mots visibles hors étiquettes de la frise, aucun texte sous 14 px, contraste d'au moins 4,5:1, un seul titre dominant.
- Le juge lisibilité donne 9 au moins sur captures ouvertes.

## Tout est lié (16.11)
- Exemple du brasseur : un + dans la section voulue du calendrier ajoute une nouvelle idée, qui arrive directement dans le carnet.
- Règle générale : dans chaque section de la frise, le + crée la chose dans son module (idée → carnet, achat → besoins, brassin → brassins, facture → compta) sans quitter le calendrier.
- La carte des liens sera dans `work/missions/2026-11-16-liens-app/LIENS-APP.md`, dès qu'elle existe ; la lire à chaque passe.

## Critères 9,5-10 (panel 16.11)
- Détail (mesure exacte, seuil, sources, rejetés) : `work/missions/2026-11-16-criteres-10/CRITERES-10.md`. Aucun n'ajoute de texte au repos ; toucher sa maquette se montre en variantes.
- Q1 Zéro redite (tous) : clés `data-fait` comptées dans la fenêtre, rappel collé exclu si l'original est hors de vue ; 0 doublon dans chaque état (p1 échoue : 173 ×3).
- Q2 Un nombre par semaine (calendrier) : nombres visibles au premier écran 390 et par colonne de l'en-tête collé ; ≤ 24 au premier écran, ≤ 1 par semaine, ± en barre signée, charge en pastilles.
- Q3 Zéro troncature (tous) : scrollWidth > clientWidth + 1 ou ellipse sur noms, montants, dates, échéances ; 0 coupé, nom court K5 puis deux lignes, jamais « … ».
- Q4 Cibles et pouce (tous) : zone touchable sondée par elementFromPoint à 390 × 844 ; 0 cible < 44 px, 0 voisine < 8 px, bord tiré ≥ 24 px, 100 % des actions de fin dans les 45 % du bas.
- Q5 Contexte et effet visibles (tous) : rect de la cible et de la surface ouverte, MutationObserver des valeurs changées ; cible jamais couverte, surface ≤ 40 % à 390, 100 % des valeurs changées vues ou signalées.
- Q6 Rien ne saute (tous) : layout-shift et FLIP pendant T1-T16 et K11 ; CLS ≤ 0,01, chose touchée à ±8 px, glissement 120-250 ms, 0 ms en reduced-motion.
- Q7 Fluidité au doigt (tous) : CPU ×4, fixture ×4, trace des glissers ; ≥ 55 images/s, 0 tâche > 50 ms, INP ≤ 100 ms, barre ≤ 4 px du doigt, caisse dans la même image.
- Q8 Geste sûr (calendrier) : 50 défilements partis d'une barre et 20 essais par geste en touchers CDP ; 0 déplacement par défilement, 20/20 justes, prise ≥ 44 px même pour ½ jour.
- Q9 Le geste s'annonce (tous) : poignée si et seulement si déplaçable, `data-ro` sans poignée avec picto d'origine, aucun pointillé de saisie ; 100 % conformes, juge neuf ≥ 95 % et 5 gestes sur 5.
- Q10 Icônes reconnues seules (tous) : chaque icône à 12 px nommée par un juge neuf ; 8 sur 8, une ratée se montre en variantes.
- Q11 Grammaire des signes (tous) : signes relevés contre `signes.json` ; ≤ 5 par écran, 0 à double sens, ≥ 90 % nommés à l'aveugle.
- Q12 Rouge réservé au problème (tous) : tout chaud porte `data-etat` d'alerte et une forme ; 0 chaud hors alerte, ≤ 3 masses rouges, au flou 6 px alerte et grand chiffre en tête.
- Q13 Palette daltonien (tous) : `validate_palette.js` deux thèmes ; CVD ≥ 6, normal ≥ 15, aucun genre gris, ΔE ≥ 15 avec `--bad` ; correction en variantes.
- Q14 Présent ancré (calendrier) : trait aujourd'hui, passé à ΔL ≥ 0,08, réel plein et prévu pointillé, aujourd'hui au premier quart gauche ; 100 % des états, 0 mot.
- Q15 Base honnête (tous) : ligne zéro, ≤ 2 graduations, avant/après pendant le geste seulement, barres de Comparer depuis un zéro commun ; erreur ≤ 2 %.
- Q16 Pincer (calendrier) : pincement CDP sur la frise ; 1 pincement par niveau, centre ±8 px, p95 ≤ 16 ms ; en ajout aux segments de sa maquette.
- Q17 Test des 5 secondes (tous) : 3 juges Haiku neufs, capture 50 % floutée 2 px, 3 questions par écran ; 3 sur 3 chez chacun, deux thèmes.
- Q18 Zéro confirmation (tous) : boutons OK, Poser, Valider, Confirmer comptés hors toast, Annuler rejoué en égalité profonde ; 0 confirmation, Annuler ≥ 5 s, état identique hors ligne compris.
- Q19 Provenance visible (tous) : `data-origine` sur chaque valeur ; 0 valeur étrangère sans picto ≥ 14 px, 0 raison écrite sans sa validation, 0 inconnu à zéro.
- Q20 Aller-retour sans perte (liens) : 12 genres et carnet ↔ calendrier, aller-retour et sens inverse ; 1 geste, scroll ±8 px, filtres, tri, période identiques, 0 écart de valeur.
- Q21 Même signe partout (liens) : jetons picto, teinte, nom court par genre dans tous les modules ; 0 écart.
- Q22 Propositions justes (tous) : leave-one-out, réglé 2021-2023, jugé 2024-2025 ; 1re puce ≥ 60 %, 3 premières ≥ 90 %, semaine ±1 ≥ 80 %, montant ±10 % ≥ 70 %, carnet ≥ 80 % gardées.
- Q23 Son essai réel (tous) : page L7 chronométrée, journal des touchers ; médiane ≤ 6 s, 0 clavier, ≤ 1 hésitation, sa phrase classée « aime ». Juge final, non bloquant.
- Fonctions à verser (hors critères) : suites automatiques d'un brassin en lecture seule (W4), actions sur un lot (W7), rappel actionnable (W9), lier d'un geste avec lien stocké une fois (D-N9).

## L8 Calendrier contextuel (16.11, corrigé : « Un général avec son Tab Mais aussi un spécifique aux thématiques, finance, stock, brassage ECT... »)
- Lecture corrigée : le même calendrier vit aussi dans chaque section (Finances, Stock, Brassage…), réglé sur elle : ses choses d'abord, son chiffre clé, son action principale. Le général reste dans son onglet. L'ancienne lecture ci-dessous (bouton de thème, balayage) est refusée.
- Un geste flottant change le calendrier de thème : tout, finance, brassage, achats, atelier, ventes. Le + porte alors les actions du thème, et la frise montre les choses du thème au premier plan.
- Le changement de thème se fait en 1 toucher ou 1 balayage, sans clavier.
- Variantes en cours dans `work/missions/2026-11-16-vues-calendrier/themes/`.

## K13 Paysage mobile, bloquant (16.11, « Il faut vraiment une version horizontal pour mobile btw »)
- Une vraie vue paysage dessinée pour 844 × 390, et non le portrait étiré.
- Au moins 5 rangées de la frise et 12 semaines visibles sans défilement. L'en-tête et la caisse tiennent sur au plus 25 % de la hauteur, par exemple en colonne latérale.
- Les gestes K11 marchent. Pas de 9/10 sans K13.
- La mesure joue la rotation (390 × 844 vers 844 × 390) et garde la position, le thème et les filtres.

## Ses choix sur les liens (16.11)
- L1 (le + vers le carnet) est gardé, mais **sans intrusion** (LIEN-PLACE) : aucune rangée ni case de plus. Il passe par le + volant ou par un appui long sur une semaine, et l'idée reste un point discret.
- L18 est retiré : l'entretien du matériel ne va pas sur la frise.
- L9 est prioritaire : chaque geste décompte ce qu'il use, avec un bandeau et Annuler.
