# Jury — l'outil de la rénovation (01.11, nuit)

Niveau **normal** : Brasseur (fable), Contradicteur (opus), Premiers principes (opus). Lisez ce dossier ; n'ouvrez une source que
pour vérifier un point précis. Faits du code et des données : `../DEPART.md` (lu par le pilote le 01.11).

## Hypothèse du pilote (confiance 55 %)
Un seul écran, la vue d'ensemble de la rénovation, qui **étend** les Projets de matériel au lieu de les doubler. Chaque chantier dit
où il en est, ce qu'il coûte en francs **et en heures**, et ce qui le bloque. Un récap en haut répond à deux questions : « quand
pourrai-je le payer ? » et « quand aurai-je fini, à mon rythme ? ».
Confiance sous 70 %, pour trois raisons :
- on ne sait pas lequel de l'ordre, de l'argent ou du temps est son premier geste ;
- on ne sait pas si un chantier sans matériel (site vitrine, seconde passe sur les sols) entre dans le même modèle ;
- on ne sait pas où vit l'écran (Bord, Finances, onglet propre).

## Ses mots (mot pour mot, `work/refonte-frontend/v4/SPEC-BRASSEUR.md`)
- 01.11, nuit, sur la vue TVA (u3, une bouteille dont le haut marron ne représentait rien) : « Même si c'est un peu enfantin j'aime
  assez bien, après pas convaincu vraiment du design. Mais avoir une vrai vu comme ça c'est top, aussi il y a pas vraiment le roi, et
  la partie maron ? Ni vraiment combien je gagne ? Mais des outils de genre prix, prédictions et tout c'est top. »
- La suite du même message : « Après c'est plus pour après pour le moment je fais pas encore de la grosse vente, c'est des outils
  important et essentiel. Mais j'ai plus besoin d'outil de prédictions, vu d'ensemble, panification et autres car la brasserie est en
  grande rénovation, et il me manque encore beaucoup de choses et j'ai pas beaucoup de temps à consacrer à ça et pas non plus un gros
  budget. Genre installation de hotte. Installation du 2eme évier. Armoire extérieur, seconde passe sur les sols ectt création du site
  web vitrine.... »
  - Lecture du pilote : « le roi » = le ROI ; « panification » = planification.
- 01.11, soir, sur la vue Finances r1 (récap en haut) : « J'aime beaucoup les pastilles sur les items, ça rend la chose très clair.
  Aussi un récap en haut comme sur le screen est top, avec la possibilité de clicker et avoir des revois »
- 18.10 (PRODUCT.md) : « Il faut que ce soit dense sur téléphone car je veux voir un Max d'info au même endroit mais ça doit pas être
  surchargé, et surtout on doit voir que en premier plan les informations réellement utilise. Ensuite on peut trouver plus d'infos
  avec des raccords, renvoie, replis ou autre. »
- Règle n° 1 (23.10) : « C'est critique que mes choix soient respectés. SI non, rien n'a de valeur. »

## Règles qui valent (SPEC § 0, PRODUCT.md, DESIGN.md)
- Au premier plan, seulement l'utile et l'actionnable ; le reste à un toucher ; 80 mots au plus ; pas d'écran de cockpit (D1 à D5).
- Thème : page blanche, gris neutres, texte presque noir ; « cave » en sombre.
- Moderne et visuel : des boosters d'interface (curseur, bascule, pastille, jauge, frise, édition sur place), des couleurs pour se
  repérer.
- **L'app refuse d'inventer un chiffre plausible.** Un inconnu s'annonce, il n'est jamais 0 : un prix ou une durée inconnus restent
  « à estimer ».
- Un outil, une question, un seul facteur libre ; les autres sur une ligne de contexte (L10).
- Défaut D259 (01.11) : chaque zone d'une figure dit ce qu'elle représente.
- Utilisateur : Gaëtan, seul opérateur, producteur, comptable et commercial. Deux scènes : cuverie (téléphone, une main, attention
  hachée) et bureau (attention continue).

## Ce qui existe (détails et chemins dans `../DEPART.md`)
- **Projets de matériel** (Finances › Prévisions › second onglet), à lire comme des achats prévus :
  - quand : Bientôt / Ensuite / Plus tard, et une date au mois ou au jour ;
  - où il en est : Idée / À étudier / Devis en cours / Prêt à acheter ;
  - combien : achat + livraison + installation, en estimation ou sur devis, sinon « À estimer » ;
  - « Inclure dans les prévisions » ; « Noter l'achat » ouvre la Nouvelle dépense ; les factures liées se comparent au budget prévu.
- **Évolution de la brasserie** (Synthèse de Finances) : budgets retenus, projets retenus et idées.
- **Prévisions** : échéances sur 30, 90 ou 365 jours, solde projeté, avec ou sans les projets.
- **Bord** :
  - un « Agenda » (événements du Labo créatif, cases à cocher, 3 visibles) ;
  - « Échéances et démarches » (rappels administratifs).
- **Labo créatif** : idées de matériel, recettes, événements, prix, prospects. Une idée de matériel devient un projet.
- **Ce qui n'existe nulle part** :
  - heures et temps disponible ;
  - ordre et dépendances entre travaux ;
  - étapes d'un chantier ;
  - chantier sans matériel ;
  - toute prédiction de la date de fin.
- **Ses données (lecture seule)** :
  - un seul projet de matériel, un système de brassage « Plus tard, prêt à acheter » ;
  - aucun de ses chantiers n'est saisi.
  - L'outil actuel est donc soit inconnu, soit inadapté. Aucun mot de lui ne départage les deux.

## Questions (dans l'ordre de l'arbre), avec la réponse recommandée par le pilote
Confirmez ou corrigez chacune en 40 mots au plus, avec sa classe (SOURCE, PILOTE, GOÛT, ACCORD, MESURE, CONSEIL). Retirée comme sans
objet : aucune.

**Tour 1 — le but**
- **J1. Scène.**
  - Recommandé : téléphone, au bureau, par moments volés, l'attention hachée (« pas beaucoup de temps »).
  - Plus rarement : sur le chantier, d'une main, pour cocher une étape ou noter un achat.
- **J2. Le geste et le facteur libre.**
  - Recommandé : « Qu'est-ce que je fais ensuite, et puis-je me le payer ? »
  - Facteur libre : **l'ordre des chantiers**. Il place un chantier avant un autre, et la date où il pourra le payer et celle où il
    aura fini réagissent.
  - Ligne de contexte : la caisse prévue (Prévisions) et ses heures par semaine.
  - Variante possible : le facteur libre est **ses heures par semaine**.
- **J3. Pourquoi maintenant.** Recommandé :
  - la grande rénovation est en cours, et « il me manque encore beaucoup de choses » ;
  - aucun de ses chantiers n'est dans l'app ;
  - l'outil existant est enfoui (troisième niveau de Finances), ne connaît que des achats, et ne connaît ni le temps ni l'ordre.
- **J4. La réussite.** Recommandé, sur le téléphone, au repos :
  - en 10 secondes, il voit ce qui est en cours, le prochain chantier, le reste à payer, le reste en heures et une date de fin à son
    rythme ;
  - 80 mots au plus ;
  - ajouter un chantier = un titre et 2 touchers ; prix et durée peuvent venir plus tard.

**Tour 2 — ce qui tient**
- **J5. Ce qui doit survivre.** Recommandé :
  - les Projets de matériel et leurs données (le système de brassage), « Noter l'achat », les factures liées, et l'inclusion dans les
    Prévisions ;
  - on **étend** les projets, on ne crée pas une couche parallèle (CLAUDE.md : « finir ou brancher plutôt qu'ajouter une couche ») ;
  - le récap en haut, cliquable, avec des renvois (ses mots du 01.11).
- **J6. Déjà refusé.** Recommandé :
  - le cockpit et le texte au premier plan ;
  - une figure décorative sans sens (« la partie maron ? ») ;
  - le côté « enfantin » de u3 : il aime la vraie vue, pas le dessin naïf.
- **J7. Ce qui lie.** Contraintes :
  - hors ligne ;
  - téléphone d'abord ;
  - aucun chiffre inventé (une heure ou un prix inconnu restent « à estimer ») ;
  - les budgets sont des intentions : seules les factures entrent dans les dépenses.
  Arbitrage recommandé : quand **simplicité de saisie** et **précision de la prédiction** se heurtent, la saisie gagne, puisqu'il a
  peu de temps. Une prédiction honnête et grossière (« pas avant mars, si 4 h par semaine ») vaut mieux qu'un formulaire long.
- **J8. Les mots.**
  - Recommandé : le titre de l'écran avec son mot, « Rénovation » ; chaque chantier sous son propre titre (« Hotte », « 2ᵉ évier »).
  - « Chantier », « projet » ou « travaux » sont des mots du pilote : à éviter au premier plan, ou à montrer en axe de variantes.
- **J9. Le code contre les sources.** Recommandé :
  - le modèle actuel (`EquipmentUpgrade`) a une catégorie « matériel », des étapes d'achat et un budget, mais ni heures, ni ordre, ni
    étapes de travail ;
  - le site vitrine n'y entre pas sans extension.

**Tour 3 — la forme**
- **J10. Le premier plan.** Recommandé :
  - un récap en haut : reste à payer, reste en heures, fin estimée ; chaque chiffre se touche et renvoie ;
  - puis les chantiers en une liste ordonnée, chacun avec une pastille d'état, ses francs et ses heures ;
  - à un toucher : les étapes, les achats liés, le devis, la note.
- **J11. Les cas limites.** Recommandé, chacun montré dans les maquettes :
  - aucun chantier (état vide) ;
  - un chantier sans prix, sans durée, ou payé en partie ;
  - un chantier bloqué par un autre ;
  - un budget dépassé ;
  - une caisse insuffisante (« pas avant mars ») ;
  - un chantier sans achat (site : des heures, peut-être un abonnement) ;
  - hors ligne.
- **J12. Hors périmètre.** Recommandé : la vente, les prix, le ROI et la marge (« pour après ») ; la TVA ; l'amortissement ; les devis
  automatiques ; l'IA.
- **J13. Les approches.** Aucune source ne tranche, ce sont des goûts : des axes de variantes. Recommandé, quatre approches :
  - (a) liste par état avec le récap, extension directe des projets ;
  - (b) une **file** ordonnée qu'on réordonne au doigt, avec la date de fin et la caisse qui réagissent ;
  - (c) une **frise** des mois à venir, chantiers et caisse sur le même axe ;
  - (d) des colonnes par état (Idée › À faire › En cours › Fait).
- **J14. Choix par défaut.** Recommandé :
  1. ses heures par semaine sont un réglage, sans valeur par défaut (« à régler ») ;
  2. la caisse vient du solde projeté des Prévisions, pas d'une nouvelle saisie ;
  3. un chantier peut ne rien coûter en francs ;
  4. un chantier peut en bloquer un autre ;
  5. les étapes sont des cases à cocher ;
  6. les maquettes utilisent ses chantiers cités et des montants fictifs.
- **J15. Ce qu'il veut vraiment.** « Il me manque encore beaucoup de choses » : peut-être d'abord **la liste de ce qui manque** (un
  inventaire rapide), avant tout plan. Recommandé : que la saisie d'un manque soit le geste le plus court de l'écran.

**Tour 4 — la clôture**
- **J16. L'irréversible.** Recommandé :
  - un chantier avec heures, ordre, étapes et nature hors matériel touche le schéma Firestore (`financialPlans` ou nouvelle
    collection) : ACCORD de l'utilisateur, à demander **après son choix de maquette** ;
  - les maquettes ne touchent rien.
- **J17. Le contrôle du bâtisseur.** Où un mauvais pari changerait-il le plan ? À classer par importance.
- **J18. Autre chose.** Ce qu'aucune question n'a couvert.

## Captures
- `work/missions/2026-10-31-ecran-depense/brasseur/01-11-u3-bouteille-marron-entouree.jpg` : sa capture de u3, le haut marron
  entouré. Elle sert pour J6 seulement.

## Rendre
Un avis par question : `Jn — <réponse, 40 mots au plus> — <CLASSE> — <source ou raison>`. Puis la phrase que le brasseur dirait
devant l'écran actuel (Projets de matériel), pour le regard Brasseur. Puis `LEÇON PROPOSÉE : …`. Votre réponse finale est l'avis
lui-même (vous êtes en lecture seule) ; le pilote le recopie dans la fiche.
