# Carnet : toutes ses demandes, mot pour mot (inventaire du 17.11, pour le port)

Sources lues en entier pour le carnet : SPEC-BRASSEUR.md (15 au 17.11), choix/maquettes.json (chantier carnet),
DEFAUTS-RECURRENTS.md (CARNET-*, THEME-APP, LIEN-PLACE), 2026-11-16-carnet-decision/CADRE.md,
2026-11-17-carnet-retouches/ (MISSION, TOP3, SYNTHESE, greffe4 et greffe5 INVENTAIRE), LIENS-APP.md (« Pour le carnet »).
decisions.md ne contient aucune décision sur le carnet (grep « carnet », « idée » : rien de ce chantier).
`systeme.mjs chercher carnet` ne renvoie que [[maquettes-16-11]] (leçons, pas de demande).

**Ce qui prime** : D-142, « En gros, un chat, et ça met en forme, c'est tout et ça permet de comparer les idée, en gros ».
Un geste qui ne sert ni le fil, ni la mise en forme, ni la comparaison passe derrière : il est rangé, pas supprimé.

**Statut** : *retenu* = sa demande est à porter ; *refusé* = ses mots refusent l'élément décrit dans « sens » ;
*remplacé par D-m* = une demande plus récente la remplace ; *idée à dessiner* = acceptée, mais aucune maquette ne la dessine.

**Où** : `p2:` = `work/missions/2026-11-17-carnet-retouches/maquettes/page2/img/<id>.webp` (classements 1 à 3) ;
`g4:` = `…/greffe4/page/img/<id>.webp` ; `g5:` = `…/greffe5/page/img/<id>.webp` (les numéros de g4 et de g5 désignent
des versions différentes) ; `ref/` = `…/greffe5/ref/` ; `ra` = `work/missions/2026-11-16-carnet-decision/ra-p5f/proto.html`.

| D | Date | Ses mots exacts | Sens | Statut | Où |
|---|---|---|---|---|---|
| D-1 | 15.11 | (capture Atelier : … À venir · Réalisés · Archives) « J'ai l'impression que tout les écrans sous les boutons de ces Tabs ne sont pas traitées ??? » | Les écrans À venir, Réalisés et Archives sont à traiter. | retenu | p2:h05-9 |
| D-2 | 15.11 | « Mais à la place de noter d'achat car ce bouton sert à rien vu que en théorie, le workflow est: je crée un besoin envie. Je cherche prix ou demande devis. Je scane devis ou achat, et l'ai fait le lien et l'enlève de la "Todo"" » | Le besoin naît, on cherche un prix ou un devis ; au scan, l'IA relie et le sort de la liste. | retenu (lien L11) | p2:h05-9 ; LIENS-APP L11 |
| D-3 | 15.11 | « Donc plutôt un bouton d'édition » | Crayon d'édition à la place de « Noter l'achat » dans À venir. | retenu (À venir, hors carnet) | À venir kh1r |
| D-4 | 15.11 | « Kg1-3 pareil.. pas super pratique en terme de workflow uxui » | Le parcours d'À venir kg1-3 est peu pratique. | refusé | — |
| D-5 | 15.11 | « passe 2 de ky2 : la boîte « À relier », repliée sous le héros ky2b Ça j'aime bien et passe 2 de ky3 : l'étape en anneau, une seule liste d'étapes (tiède à chaude) ky3b J'aime bien les anneaux Mais graph de prix était mieux sur l'une des autres variante précédente... » | Boîte « À relier », anneaux d'étape, graphe de prix d'une variante précédente. | remplacé par D-8 et D-11 | — |
| D-6 | 15.11 | « Scan relié par l'IA Je comprends pas, ça le fait pas quand on a une nouvelle depense ??? » | Le lien entre facture et besoin se fait au scan, dans Nouvelle dépense. | retenu (L11, hors écran carnet) | Nouvelle dépense |
| D-7 | 15.11 | « Pour ce qui est de l'ajout et de l'édition j'aime pas du tout, ça correspond pas à mon besoin. C'est des idées avec lien et prospection ect... » | Un besoin naît comme une idée avec liens et prospection, jamais comme un formulaire. | retenu (naissance du carnet) | g5:v03-2, g5:v04-1 |
| D-8 | 15.11 | « Scan relié par l'IA Je comprends toujours pas en théorie il y en a pas besoin ?? » | Aucune étape « scan relié » visible : le lien se fait seul. | retenu | rien à l'écran (CADRE, « Refusés ») |
| D-9 | 15.11 | « J'aime toujours pas, le workflow est trop contraignant, pas intuitif, c'est complexifié pour rien... Et ça rend la chose très compliqué.. » | Parcours à étapes (ky, kz), formulaire, champ obligatoire. | refusé (K4) | — |
| D-10 | 15.11 | « Réfléchis comme un brasseur, idée: je veux un système d'embouteillage. Il y a beaucoup de solutions, plein. De manière, budget ECT..... » | Une envie ouverte rassemble plusieurs solutions (manière, budget…). | retenu | p2:h05-3, p2:i06-4 |
| D-11 | 15.11 | « kyg1 sans étape de liaison, graphe de kh1r 1:1 kyh1 top » | À venir = kyh1 avec le graphe kh1r ; le carnet y envoie le choix, en sortie (C4). | retenu | p2:h05-9 |
| D-12 | 15.11 | « Ça semble quand même peu résoudre mes problèmes ???? » | Dossier de solutions qui compare des prix. | refusé (K5) | — |
| D-13 | 15.11 | « Mais je parle de problème avec l'emboiteilleuse par de l'Excel ??? » | Une solution se juge sur le problème qu'elle règle chez lui, pas sur un prix. | retenu | p2:g01-8 |
| D-14 | 16.11 | (capture s2a2) « Ça correspond pas du tout à mes besoins ?? » | Fiche avec prix et caisse au premier plan. | refusé (K5) | — |
| D-15 | 16.11 | « En gros j'ai un besoin ou une idée: embouteillages » | Partir d'une idée ouverte : une ligne suffit. | retenu | g5:v03-2, g5:v04-1 |
| D-16 | 16.11 | « il y a plusieurs façons de faire donc je vais rechercher les différentes façons » | Plusieurs façons de faire, retenues ou écartées. | retenu | p2:h05-3, p2:i06-4 (Façons) |
| D-17 | 16.11 | « Je trouve que il faut minimise l'oxygène donc je voudrais partir sur un système iso même si j'ai vu un système par gravité pas mal » | Un critère qui oriente entre les façons. | retenu | p2:g01-8, p2:h04-7 |
| D-18 | 16.11 | « Donc je regarde les systèmes iso et j'en trouve 5 6 différents, différentes endroit et tout.. » | 5 ou 6 articles, de fournisseurs et de lieux différents. | retenu | p2:h03-5, p2:h06-5 |
| D-19 | 16.11 | « J'ai besoin d'un endroit pour noter toutes ces recherches » | Noter au fil de l'eau, sans structure imposée. | retenu (devient le fil de D-142) | g5:v01-15, g5:v01-16 |
| D-20 | 16.11 | « et aussi pas revenir en arrière, du genre pourquoi j'ai pris un système iso super chère... ECT.. pourquoi j'ai pris ce fournisseur... » | Garder le pourquoi de la façon, du produit et du fournisseur. | retenu | p2:g05-11, p2:v03-7, p2:v09-3, p2:g05-9 |
| D-21 | 16.11 | « Et aussi ça permettrait de comparer » | Comparer. | retenu | p2:g01-8, p2:v03-4, p2:g05-8, p2:h04-7, p2:h06-7 |
| D-22 | 16.11 | « et aussi je pourrai utiliser l'ai pour voir si ce produit est disponible ECT... » | L'IA vérifie la disponibilité et le prix (simulée hors accord). | retenu | p2:h01-6 |
| D-23 | 16.11 | « Comparé les caractéristiques des systèmes » | Comparer les caractéristiques techniques, pas seulement le prix. | retenu | p2:g01-8, p2:g05-8 |
| D-24 | 16.11 | « Mais ça doit pas être uniquement pour ce système, ça doit être générique, un frigo, une ventil, un évier, ECT... Ça doit être dynamique et générique » | L'IA propose les caractéristiques selon la catégorie ; aucun gabarit propre à un objet (C2). | retenu | p2:g05-1, p2:i06-1 |
| D-25 | 16.11 | « Et va doit être facile d'utilisation, une vue sans détails juste pour savoir de quoi on parle et ensuite on peut détaillé et comparé. » | D'abord une vue sans détails ; détail et comparaison à un toucher (C1). | retenu | p2:g05-1, p2:i06-1 |
| D-26 | 16.11 | « Utiliser l'ai au besoin » | L'IA aide quand il le faut, sans être obligatoire. | remplacé par D-122 | — |
| D-27 | 16.11 | « Et aussi important, par exemple je mets un liens, ça montre l'objet » | Un lien collé affiche l'objet en aperçu (C3). | retenu | g5:v06-10, g5:v03-11, g5:v06-11 |
| D-28 | 16.11 | « et je peux faire un toggle switch qui va regarder tout les 3 jours si l'article est en stock aussi Chez d'autres fournisseurs et si il a baissé de prix » | Bascule de veille par article, tous les 3 jours : stock, autres fournisseurs, baisse de prix (L17). | retenu (appel externe : son accord avant la mise en ligne) | p2:h01-6, g4:base-E07a |
| D-29 | 16.11 | « Ça doit toujours être ultra facile d'utilisation.. workflow le plus simple » | Aucune étape imposée, un geste par action. | retenu | tous les écrans |
| D-30 | 16.11 | « Est-ce que il y aurait d'autres levier pour encore améliorer, facilité tout ça ? » | Il demande d'autres leviers. | remplacé par D-31 à D-36 | — |
| D-31 | 16.11 | « Tous » (levier : partager un lien depuis le navigateur) | « Partager → L'Affinée » crée l'idée avec le lien, sans copier-coller (L32). | idée à dessiner | aucun écran |
| D-32 | 16.11 | « Tous » (levier : raccourci sur l'écran d'accueil) | « Nouvelle idée » par un appui long sur l'icône de l'app. | idée à dessiner | aucun écran |
| D-33 | 16.11 | « Tous » (levier : la voix) | Dicter une idée ou une note. | remplacé par D-83 | — |
| D-34 | 16.11 | « Tous » (levier : lien carnet ↔ calendrier) | Une idée avec échéance ou budget paraît au calendrier global. | idée à dessiner | port du calendrier (LIENS L1, L2) |
| D-35 | 16.11 | « Tous » (levier : propositions acceptées en un toucher) | Caractéristiques de la catégorie et fournisseurs proposés, acceptés d'un toucher. | retenu | p2:i06-4, g5:v08-3 |
| D-36 | 16.11 | « Tous » (levier : essais sur son téléphone) | Le prototype retenu se joue seul, avec des tâches chronométrées. | retenu (preuve) | — |
| D-37 | 16.11 | « Da et dc sont pas trop Mal, certains aspec de l'un sont meilleurs que d'autres à toi de décider :) » | Fusion de dc et da, le pilote choisit. | remplacé par D-57 | — |
| D-38 | 16.11 | « Ça reste du l'ux UI assez mauvaise, et difficile à lire, voir... Ça fait partie des critères.. mais on c'est largement améliorer, on est passé de 5/10 à 7.5 » | Lisibilité d'abord (CARNET-LIS). | retenu | tous les écrans |
| D-39 | 16.11 | « Pas oublier le lien avec la compta, calendrier et autres... Dans l'application tout a un lien avec tout... » | Le carnet se lie à la compta, au calendrier, aux fournisseurs, au matériel. | retenu | LIENS-APP « Pour le carnet » |
| D-40 | 16.11 | « Je pourrais par exemple sur le calendrier très facilement dans la section correspond, ajouter avec un + une nouvelle idée, et ça viendrait directement là bas... Ce genre de lien, il y en aurait d'autres... À toi de les faire, trouver, créé, critiqué ECT... » | Une idée créée par le + du calendrier arrive au carnet (L1) ; trouver les autres liens. | retenu | geste : port du calendrier ; arrivée au carnet : ce port, R48 ; LIENS L1 |
| D-41 | 16.11 | « Je veux pas perdre en fonctionnalités ni en données » | Rien ne se perd quand une vue change. | retenu | tout le port |
| D-42 | 16.11 | « Ce que je voulais illustré c'est que le bouton+ dépend de son action principal en fonction de là où il est... » | Sur le carnet, le + porte d'abord l'action du carnet. | retenu | + volant |
| D-43 | 16.11 | « Il faut vraiment une version horizontal pour mobile btw » | Vue paysage, étendue au carnet par erreur. | remplacé par D-70 | — |
| D-44 | 16.11 | « 2Le + du calendrier envoie l'idée au carnet L1 ça prend énormément de place pour peu d'ajoute, je veux cette fonctionnalité mais pas aussi intrusif » | L1 gardé, sans rangée ni case dédiée (LIEN-PLACE). | retenu | port du calendrier |
| D-45 | 16.11 | « L11 garder » | La facture scannée solde le besoin du carnet, reliée seule. | retenu | LIENS L11 |
| D-46 | 16.11 | « L29 garder » | Pastilles « lié à » sur la fiche ouverte. | retenu | LIENS L29 |
| D-47 | 16.11 | « L33 garder » | Supprimer une idée : refus avec raison ou archivage, jamais de cascade, audit écrit. | retenu | LIENS L33 ; g4:v02-18 |
| D-47b | 16.11 | « Choix ouverts · Onglet v1 · Fournisseur v1 · Suppression v2 · Lot v1 · 5??? » (SPEC 1873) | Suppression v2 : « n liens le retiennent ». Chaque lien se règle, et à 0 Supprimer s'allume. Une facture ou un stock fait archiver (CHOIX.md, 16.11). Précise D-47. | retenu | `2026-11-16-choix-ouverts/CHOIX.md` ; g4:v02-18 |
| D-48 | 16.11 | « L16 garder » | Fournisseurs : une fiche ; le choix fait au carnet s'y enregistre (L15). | retenu | LIENS L16 |
| D-49 | 16.11 | « 8Chaque geste décompte ce qu'il use super important!! À bien mettre et généralisé partout » | L9 : un achat choisi, une fois reçu, entre dans les consommables. | retenu | LIENS L9 |
| D-50 | 16.11 | « 8.2 ça me va » | Fusion p5 acceptée sur sa note annoncée. | remplacé par D-51 | — |
| D-51 | 16.11 | « DC et dc semble meilleure sur beaucoup d'aspects, je comprends pas trop P5 ?? » | La fusion p5. | refusé | — |
| D-52 | 16.11 | « Carnet p5 · écartés visibles » | Dans Comparer, les écartés restent visibles (C7). | retenu | p2:g01-8, p2:h04-7 |
| D-53 | 16.11 | « da · un seul champ ; l'IA propose le critère le meilleur les deux autres sont horribles » | Un seul champ ; l'IA propose le critère (C7). | retenu | g4:base-E20g, p2:i06-4 |
| D-54 | 16.11 | « parcontre le champs text en bas ? SI non sur mobile le clavier cache tout » | Le champ en bas reste visible au-dessus du clavier (C8, CARNET-CLAV). | retenu | tout écran avec le champ |
| D-55 | 16.11 | « p5 · En cours, Choisis ; « ✓ choix » et ↓ 600 CHF pas fan ??? » | Onglets « En cours, Choisis », « ✓ choix », « ↓ 600 CHF ». | refusé (K1, K2, K3) | — |
| D-56 | 16.11 | « Ca semble pas fini ??? » | Un écran maigri pour tenir un plafond de mots ne perd rien (CARNET-MAIGRE). | retenu | tous les écrans |
| D-57 | 16.11 | « DC et da* Da semble globalement meilleure » | da devient la base. | remplacé par D-77 | — |
| D-58 | 16.11 | « Mais en soit p5 a des bonnes idées mais comment il a pu passer les critiques ??? » | Greffer les bonnes idées de p5 : police, noms entiers, dates lisibles, raisons cochées, offres ailleurs. | retenu (dans ra) | ra |
| D-59 | 16.11 | « En soit peut être faire une p5 mais aller jusqu'au bout et répondent au critère... » | p5f, une p5 finie. | retenu (dans ra) | ra |
| D-60 | 16.11 | « Sur beaucoup d'endroits il est un peu mieux mais certaines écran sont inutilisable en l'état » | Chaque écran est utilisable seul. | retenu | tous les écrans |
| D-61 | 16.11 | « Fait peut être passer un critique, revue, besoin brasseur ECT... Dessus ? » | Audit en trois regards. | retenu (méthode) | — |
| D-62 | 16.11 | « Comment autant d'erreur cruciale ont pu passer ??? » | Audit écran par écran obligatoire avant une page. | retenu (méthode) | — |
| D-63 | 16.11 | « Le cœur du problème : « En gros j'ai un besoin ou une idée: embouteillages: … » « Comparé les caractéristiques des systèmes » « Mais ça doit pas être uniquement pour ce système, ça doit être générique, un frigo, une ventil, un évier, ECT... Ça doit être dynamique et générique » N'a pas été respecté... » | Son scénario joué de zéro, sans fixture, puis frigo, ventilation, évier (CARNET-COEUR). | retenu | acceptation du port |
| D-64 | 16.11 | « Okay adapté p5 fini alors » | p5f fini, en parallèle de ra. | remplacé par D-77 | — |
| D-65 | 16.11 | (capture r3/c2) « Pourquoi il y a un thème autre que celui de l'app, et pas de couleur ? » | Le thème de l'app, avec ses couleurs (THEME-APP). | retenu | tous les écrans |
| D-66 | 16.11 | (même capture, X rouge sur « Façons possibles · Pistolet à contre-pression ») sans mot propre | Bloc « Façons possibles » proposé par l'IA, lu à retirer ou à revoir, jamais confirmé (a_preciser). | idée à dessiner | — |
| D-67 | 16.11 | « Et le bouton+ est pas au bon endroit btw En bas à gauche un peu au dessus des Tab, c'est genre la 200eme fois que je le dis » | + volant en bas à gauche. | remplacé par D-68 | — |
| D-68 | 16.11 | « Non c'est à droit pardon pas à gauche » | + volant en bas à droite, juste au-dessus de la barre d'onglets. | retenu | tous les écrans |
| D-69 | 16.11 | « Pas besoin de focus sur cave, mais utiliser le thème de l'app oui... » | Le thème de l'app tel qu'il s'affiche ; la version cave n'est pas exigée. | retenu | tous les écrans |
| D-70 | 16.11 | « Non c'est que par le calendrier la version horizontal ???? Pas besoin pour le carnet... » | Pas de vue paysage pour le carnet. | refusé (paysage du carnet) | — |
| D-71 | 16.11 | « Carnet · Il y a des choses bien des deux côtés. Je peux pas les départager... Entre ta et p5f » | ra et p5f : aucun ne gagne en bloc. | remplacé par D-75 | — |
| D-72 | 16.11 | « L1 a+b » | Idée par le + de la rangée (a) et par appui long sur la semaine (b), au calendrier. | retenu | geste : port du calendrier ; arrivée au carnet : ce port, R48 |
| D-73 | 16.11 | « L29 b » | Liens en mots dans la ligne, avec aperçu sur place. | remplacé par D-76 | — |
| D-74 | 16.11 | « Le bouton+ est vraiment nickel sur les exemple, bon travail, merci bonne nuit » | Le + volant des maquettes du soir est un acquis. | retenu | tous les écrans |
| D-75 | 16.11 | carnet « Assembler étape par étape » | ra ou p5f choisi à chaque étape. | retenu (donne ra+p5f) | ra |
| D-76 | 16.11 | « Sur L29, tu as pris b alors que le critique classait a en premier ah oui a est meilleur effectivement, la critique a bien fait son travail » | Pastilles « lié à » (a), avec l'aperçu sur place de b. | retenu | LIENS L29 |
| D-77 | 17.11 | « Carnet ra+p5f · ça va  J'aime bien mais pas mal de retouche » | La base ra+p5f est gardée, à 7/10. | retenu | ra |
| D-78 | 17.11 | « La carte de l'article est peu parlant, quand on clic dessus aussi. » | La carte et la fiche d'article disent ce qu'est l'objet (CARNET-CARTE-MUETTE). | retenu | p2:h03-5, p2:h06-5, p2:h01-6 |
| D-79 | 17.11 | « L'ajout d'une nouvelle idée est encore assez fouillis et difficile à comprendre et l'ajout à l'idée aussi. » | Ajouter une idée et ajouter à une idée : clair (CARNET-AJOUT-FOUILLIS). | retenu (traité par greffe 5 et D-142) | g5 (D-130 à D-140) |
| D-80 | 17.11 | « Et c'est encore assez moyen dans le thème de l'app. » | Habit de l'app : en-tête, segments, cartes, zone Stocks (CARNET-THEME). | retenu | tous les écrans |
| D-81 | 17.11 | « Fait passer un critique, brasseur, UX UI expert, feedback qui critique tout les écrans et on crée des mini maquettes (pas thème cave encore) pour résoudre tout ça. On est sur du 7/10 on vise le 9 ! » | Trois regards, mini maquettes, cible 9/10. | retenu (méthode) | SYNTHESE.md |
| D-82 | 17.11 | « Dans la v1, v2, c4,v10, v11 il y a beaucoup de bon, peut être prendre les meilleures écran et meilleures idées, et en faire plusieurs maquette, je pense que répartir de 0 pour chaque vue est pas une bonne idée... » | Greffer les meilleurs écrans, ne pas repartir de zéro. | retenu (méthode) | maquettes/v01, v02, v04, v10, v11 |
| D-83 | 17.11 | « Aussi beaucoup moins de cmd vocal. Je l'utilise très peu... » | Voix mise en avant (onde, étapes, écran voix) ; un petit micro dans le champ suffit. | refusé (CR-VOIX) | — |
| D-84 | 17.11 | « Regarde pour un meilleur workflow, meilleure itération » | Améliorer le parcours et la méthode d'itération. | retenu (méthode) | — |
| D-85 | 17.11 | « Et respecte le thème de l'app.... » | Habit de l'app réelle, captures côte à côte. | retenu | tous les écrans |
| D-86 | 17.11 | « v09 sur le vue du carnet est la meilleure... » | v09 source de la vue du carnet. | remplacé par D-96 | — |
| D-87 | 17.11 | « Mais la disposition des artefacts est difficile à comparer et prendre des notes des meilleurs vue.... Refait moi ça » | Pages de choix rangées par écran. | retenu (méthode, hors app) | — |
| D-88 | 17.11 | « Fait en sorte que sur l'artefact je puisse facilement faire un classement top3 par vue » | Rangs par écran sur la page de choix. | retenu (méthode, hors app) | — |
| D-89 | 17.11 | premier top 3 par écran (TOP3.md, début) | Premier classement. | remplacé par D-96 à D-105 | — |
| D-90 | 17.11 | « mais trop peu ??? Elles sont où les autres version ? » | Chaque version dessine tout le parcours. | retenu (méthode) | — |
| D-91 | 17.11 | « Beaucoup mieux : » puis le deuxième classement (TOP3.md § Deuxième) | Deuxième classement. | remplacé par D-96 à D-105 | — |
| D-92 | 17.11 | « Parcontre À venir et Réalisés · 15 2 h03-9 · 3 v02-6  Je comprends pas , c'est pas au bon endroit, il y a déjà une vue pour ça, et ça remplace pas le calendrie???? » | À venir déplacé dans le Calendrier. | refusé (CR-AVENIR-CAL) | — |
| D-93 | 17.11 | « Mais je pense que une vue pas calendrier avec juste des date à venir serait bien utile effectivement » | Au Calendrier, une liste des dates à venir, sans grille. | retenu (Calendrier, hors carnet) | port du calendrier |
| D-94 | 17.11 | « Donne la possibilité que pour dans les artefacts, je puisse choisir plusieurs top1,2,3, 4... » | Rangs 1 à 5, plusieurs par rang. | retenu (méthode, hors app) | — |
| D-95 | 17.11 | « Et fait passer la critique dessus fait lui aussi les même top1,2,3 ecttt.. » | Le critique classe aussi, à l'aveugle. | retenu (méthode, hors app) | — |
| D-96 | 17.11 | « Liste des carnets : 1 g05-1, i06-1 · 2 h06-1 · 3 h04-1 · notes : v11-1 : Top 4 ; g04-1 : Too1 aussi  ; h01-1 : Top1 » | Liste des carnets figée. | retenu (figé) | p2:g05-1, p2:i06-1 ; p2:h06-1, p2:h04-1, p2:g04-1, p2:h01-1 |
| D-97 | 17.11 | « Premier usage, liste vide : 2 i02-2, i06-2 · 3 i03-2 · notes : base-E00-vide : ?? » | Liste vide qui dit quoi faire ; l'écran vide de base ne le dit pas. | retenu (figé) | p2:i02-2, p2:i06-2, p2:i03-2 |
| D-98 | 17.11 | « Ajouter une idée : 1 h05-2 · 2 h01-2 · 3 g02-2 · notes : h02-2 : Top4 ; h03-2 : Top3 ; h05-2 : Top2 » | Classement de l'ajout d'une idée. | remplacé par D-107 à D-110 | p2:h05-2, p2:h01-2, p2:g02-2 |
| D-99 | 17.11 | « Un carnet ouvert : 2 h05-3, i06-4 · 3 h04-3b · notes : v04-1 : Top4 ; v08-3 : Top4 ; v12-2 : Top4 ; h01-3 : Top2 ; h04-3a : Top3 » | Carnet ouvert figé. | retenu (figé) | p2:h05-3, p2:i06-4 |
| D-100 | 17.11 | « Ajouter à une idée (lien, photo, texte) : 2 h03-4b · 4 base-E01b-carnet-cree · notes : base-E01b-carnet-cree : Top4 ; v06-4 : Top4 ; v07-1 : Top4 ; v07-2 : Top4 ; v08-5 : Top4 ; h02-4a : Top2 ; h04-4a : Top4 ; h05-4b : Top2 ; h06-4a : Top2 » | Classement de l'ajout à une idée. | remplacé par D-112 à D-117 | p2:h03-4b, p2:h02-4a, p2:h05-4b, p2:h06-4a |
| D-101 | 17.11 | « Cartes d’article : 2 h03-5, h06-5 · 3 h05-5 · notes : g02-7 : Top4 ; h01-5 : Top4 ; h03-5 : Top4 » | Cartes d'article figées. | retenu (figé) | p2:h03-5, p2:h06-5 |
| D-102 | 17.11 | « Un article ouvert : 1 h01-6 · 2 g05-7 · 3 g04-7 · notes : v01-2 : Top5 ; g01-7 : Top4 » | Article ouvert figé. | retenu (figé) | p2:h01-6 |
| D-103 | 17.11 | « Comparer sur le critère : 3 g01-8 · notes : v03-4 : Top2 ; g05-8 : Top2 ; h02-7 : Top3 ; h03-7 : Top4 ; h04-7 : Top2 ; h06-7 : Top2 » | Comparer sur le critère figé. | retenu (figé) | p2:g01-8, p2:v03-4, p2:g05-8, p2:h04-7, p2:h06-7 |
| D-104 | 17.11 | « Choisir, choisi, pourquoi : 2 g05-11 · 3 h06-8 · notes : v03-7 : Top2 ; v09-3 : Top2 ; v10-4 : Top3 ; g05-10 : Top3 ; g05-9 : Top2 ; g06-10 : Top4 ; h03-8 : Top3 ; h05-8 : Top3 » | Choisir, choisi, pourquoi figé. | retenu (figé) | p2:g05-11, p2:v03-7, p2:v09-3, p2:g05-9 |
| D-105 | 17.11 | « À venir et Réalisés : 2 h05-9 · 3 h03-9 · notes : h06-9 : Top4 » | À venir et Réalisés figés, dans Stocks › Matériel. | retenu (figé) | p2:h05-9 |
| D-106 | 17.11 | « Je pense que seul l'ajout de note/idée, modifications de note, création, suppression de note/idée doivent être revue, le reste c'est top » | Seuls créer, ajouter, modifier et supprimer sont à revoir ; le reste est figé. | retenu | ecrans_choisis.figes |
| D-107 | 17.11 | « Créer une idée · avant : 2 v01-2 » | Créer, avant. | remplacé par D-130 | g4:v01-2 |
| D-108 | 17.11 | « notes : v01-2 : Mais pas besoin de la flèche avec écrivez ou collez icic » | La flèche « Écrivez ou collez ici ». | refusé | g4:v01-2 |
| D-109 | 17.11 | « Créer une idée · pendant : 2 v02-2 » | Créer, pendant. | remplacé par D-131 | g4:v02-2 |
| D-110 | 17.11 | « Créer une idée · après : 2 v05-3 · 3 base-E01b, v01-4, v02-3, v03-3 » | Créer, après. | remplacé par D-132 | g4:v05-3 |
| D-111 | 17.11 | « notes : v05-3 : SI tout de trie et tout automatiquement c'est top c'est une bonne structure » | La structure de v05-3, à condition que tout se trie seul. | retenu | g4:v05-3 |
| D-112 | 17.11 | « Ajouter à une idée · avant : quoi ? : 3 base-E20g · 5 v02-4 » | Ajouter, avant. | remplacé par D-133 | g4:base-E20g |
| D-113 | 17.11 | « notes : base-E20g : La moins pire, je dois pouvoir faire n'importe quoi dans le champs text et ensuite ça me le trie, construire, catégorises » | Un champ libre ; l'IA trie, construit et catégorise. | retenu (CARNET-IA-AIDE) | g4:base-E20g |
| D-114 | 17.11 | « notes : v02-4 : Ça devrait être automatique » | Tuiles « quoi ? » à choisir avant d'ajouter. | refusé | g4:v02-4 |
| D-115 | 17.11 | « Ajouter un texte : 3 base-E06, v01-6, v05-5, v06-5 » | Ajouter un texte. | remplacé par D-134, D-135 | g4:base-E06 |
| D-116 | 17.11 | « Ajouter un lien : 3 base-E07a » | Ajouter un lien. | remplacé par D-136 à D-138 | g4:base-E07a |
| D-117 | 17.11 | « notes : base-E07a : Mais ça doit être fait automatiquement je comprends pas ces vues » | Écrans de lien à remplir à la main. | refusé | g4:base-E07a |
| D-118 | 17.11 | « Modifier une note : 3 v01-11, v01-12, v03-11 » | Modifier une note. | retenu | g4:v01-11, g4:v01-12, g4:v03-11 |
| D-119 | 17.11 | « Modifier le titre de l’idée : 2 v01-13, v02-14 » | Renommer une idée. | retenu | g4:v01-13, g4:v02-14 |
| D-120 | 17.11 | « Supprimer une note : 2 v02-12 · 3 v01-11 » | Supprimer une note, avec Annuler dans la page. | retenu | g4:v02-12, g4:v01-11 |
| D-121 | 17.11 | « Supprimer une idée : 2 v01-16, v01-17, v02-17, v02-18, v04-18, v04-19 » | Supprimer une idée : confirmation dans la page, jamais une boîte du navigateur. | retenu | g4:v02-17, g4:v02-18, g4:v01-16, g4:v01-17, g4:v04-18, g4:v04-19 |
| D-122 | 17.11 | « Il y a trop besoin d'action et pas assez d'aide de l'ai.... » | Moins de gestes, plus de travail fait par l'IA (CARNET-IA-AIDE). | retenu | g5 (D-130 à D-140) |
| D-123 | 17.11 | (capture « Sol local ») « En gros ça doit mettre en forme, mes note pour la brasserie, mais pas que des achats, surtout les achats mais par exemple : » | L'IA met en forme ses notes brutes : surtout des achats, mais aussi travaux, conseils, questions. | retenu | ref/note-sol-local.jpg |
| D-124 | 17.11 | (capture « Ajoute », 3 sept., sans mot) « Prévision prix pour prochains brassin + ajout aussi de combien l'estimation d'upgrade dans le dashboard principal » | Une note brute à mettre en forme, comme « Sol local ». | retenu | ref/note-ajoute-prevision.jpg |
| D-125 | 17.11 | même capture « Ajoute » : « Prévision prix pour prochains brassin + ajout aussi de combien l'estimation d'upgrade dans le dashboard principal » | Idée pour l'app : prix des prochains brassins et coût des améliorations au tableau de bord. | idée à dessiner (hors carnet) | aucun écran |
| D-126 | 17.11 | (capture « À faire au prochain brassage », 14 sept., sans mot) « Prédictions de coûts / Coûts et visu, tout est déjà payer / Houblon / Levures / Volume » | Une note brute en liste, à mettre en forme. | retenu | ref/note-prochain-brassage.jpg |
| D-127 | 17.11 | « Sol local » comme référence mais c'est juste un cas particulier, en gros ça sera beaucoup utilisé comme brouillon mais aussi pour de l'achat matériel et tout » | Brouillon d'abord, achats ensuite ; « Sol local » n'est qu'un cas. | remplacé par D-128 | — |
| D-128 | 17.11 | « Non focus sur l'achat de matériel mais ça peut aussi être utilisé comme brouillon » | Centré sur l'achat de matériel ; le brouillon est permis, sans être mis en avant. | retenu | g5:v06-10 (lien), g5:v01-15 (brouillon) |
| D-129 | 17.11 | « Oui je note mes trucs en gros juste un champs text et ensuite l'ai met en forme, trie, structure ECT... C'est clair ? » | Un seul champ texte ; l'IA met en forme, trie et structure. | retenu | g4:base-E20g, g5:v03-2 |
| D-130 | 17.11 | « Créer · avant : 1 v03-2, v04-1 · 2 v07-2, v08-2 » | Créer, avant. | retenu | g5:v03-2, g5:v04-1 ; g5:v07-2, g5:v08-2 |
| D-131 | 17.11 | « Créer · pendant : 2 v08-3 · 3 v04-2, v06-3, v07-3 · 4 v07-5 » | Créer, pendant. | retenu | g5:v08-3 ; g5:v04-2, g5:v06-3, g5:v07-3 |
| D-132 | 17.11 | « Créer · après : 2 v04-4 · 3 v01-4, v02-4 · 4 v05-4 » | Créer, après. | retenu | g5:v04-4 ; g5:v01-4, g5:v02-4 |
| D-133 | 17.11 | « Ajouter · avant : 2 v03-6 · 3 v04-5, v07-7 · 4 v02-8, v02-9 » | Ajouter, avant. | retenu | g5:v03-6 ; g5:v04-5, g5:v07-7 |
| D-134 | 17.11 | « Texte · pendant : 2 v02-10 · 3 v03-7 · 4 v08-8 » | Ajouter un texte, pendant. | retenu | g5:v02-10 ; g5:v03-7 |
| D-135 | 17.11 | « Texte · après : 3 v01-7, v03-8, v05-7, v08-7 » | Ajouter un texte, après. | retenu | g5:v01-7, g5:v03-8, g5:v05-7, g5:v08-7 |
| D-136 | 17.11 | « Lien · avant : 2 v07-10 · 3 v03-9, v08-10 » | Ajouter un lien, avant. | retenu | g5:v07-10 ; g5:v03-9, g5:v08-10 |
| D-137 | 17.11 | « Lien · pendant : 2 v01-9, v02-12, v03-10 · 3 v04-9, v05-10, v06-9 · 4 v08-11 » | Ajouter un lien, pendant (lecture de la page). | retenu | g5:v01-9, g5:v02-12, g5:v03-10 |
| D-138 | 17.11 | « Lien · après : 1 v06-10 · 2 v03-11, v06-11 · 3 v06-14 · 4 v04-10 » | Ajouter un lien, après (article lu et rangé). | retenu | g5:v06-10 ; g5:v03-11, g5:v06-11 |
| D-139 | 17.11 | « Note en vrac · pendant : 3 v01-15, v02-19, v06-17 » | Note en vrac (brouillon), pendant. | retenu | g5:v01-15, g5:v02-19, g5:v06-17 |
| D-140 | 17.11 | « Note en vrac · après : 3 v01-16 · 4 base-E06 » | Note en vrac, après (mise en forme). | retenu | g5:v01-16 ; g5:base-E06 |
| D-141 | 17.11 | « J'ai l'impression que ça classe pas super super. Mais tu peux implémenter comme tell avec les meilleures fonction de version.... » | Port accordé : le mieux classé de chaque geste, avec les meilleures fonctions des autres versions. | retenu | g5 (D-130 à D-140) |
| D-142 | 17.11 | « En gros, un chat, et ça met en forme, c'est tout et ça permet de comparer les idée, en gros » | Un fil de chat : il écrit, l'IA met en forme et range dans les idées ; puis comparer. Prime sur tout. | retenu (le fil est à dessiner) | aucun écran ne dessine le fil ; plus proches : g5:v01-15, g5:v01-16, g4:base-E20g ; comparer : p2:g01-8 |
| D-143 | 17.11 (soir) | « Parfait une fois en ligne puis testé sur la version en ligne, si tu arrives pas toi, utiliser les autres sessions ou trop ve une solution. Mode nuit activé. » (SPEC, « Port en ligne puis testé en ligne ») | Le port part en ligne dès 0 bloquant, puis se teste sur la version en ligne : lecture seule, actionneurs joués sur « ZZ TEST — … » retirés ensuite. En cas de blocage : une autre session ou une solution, sans l'attendre. Son accord de mise en ligne est donné. | retenu | version en ligne (lot G) |
| D-144 | 17.11 (soir) | « Ensuite je le mets en ligne (le front seulement) » · « Pourquoi que le front ? Non tout ?? » (SPEC, « Tout mettre en ligne ») | Tout part en ligne : front, fonctions touchées par le port (`rangerCarnet` et `lireLien` dans `aiTask`, donc l'IA du carnet) et règles Firestore si le port en a besoin. Restent exclues `dispatchBrewerHopAdviceV1` et `notifyBrewerHopAdviceAnswerV1` (interdit antérieur, non levé). | retenu | version en ligne (lot G) |

## Décompte

142 lignes : 101 retenues, 12 refusées, 24 remplacées, 5 idées à dessiner (compté par script sur la colonne Statut).
Ajout du 17.11 après COUVERTURE.md (manque 3) : D-47b, « Suppression v2 », oubliée de l'inventaire. Total : 143 lignes, 102 retenues.
Ajout du 17.11 (2e passe de COUVERTURE.md, manquants 1 et 2) : D-143 et D-144, la mise en ligne accordée et le test en ligne
(SPEC, 17.11 soir). Total : 145 lignes, 104 retenues.

## Doutes et tensions à trancher au port (pas des demandes)

1. **Tuiles « quoi ? » dans un écran figé.** Le carnet ouvert figé (p2:h05-3, p2:i06-4) porte la rangée « Ajouter à … : quoi ? Article · Façon · Critère · Note » (greffe4/INVENTAIRE.md). D-114 et D-122 la refusent. Lecture prudente : on porte l'écran figé sans cette rangée, rangée derrière le champ unique.
2. **« comparer les idée » (D-142).** Les écrans figés comparent les articles d'une idée sur un critère (p2:g01-8). Comparer des idées entre elles n'est dessiné nulle part. Lecture étroite : le Comparer figé. Comparer deux idées serait une idée à dessiner.
3. **Le fil de chat (D-142) n'est dessiné nulle part.** Les maquettes classées montrent un carnet structuré (rubriques) avec un champ en bas, pas un fil où ses messages restent visibles. Le port doit greffer le fil sur l'habit figé : plus proche, la note en vrac (g5:v01-15, v01-16) et « Dernier dépôt » (g5:base-E06).
4. **Veille et calendrier.** Le levier D-34 (CADRE) affiche une baisse de prix au calendrier. LIENS-APP L17 dit « jamais au calendrier ». Lecture prudente : L17, plus récent et plus précis.
5. **Supprimer une idée.** g4:v02-18 annonce « Il part avec 1 article, 1 photo, 2 façons et 1 note ». L33 (D-47) interdit la cascade vers les autres modules. Lecture : son propre contenu part avec l'idée ; un lien externe (facture, plan) bloque ou archive, avec sa raison.
6. **Modifier et supprimer.** Seul greffe 4 les a classés (D-118 à D-121). Greffe 5 en dessine (g5:v0x-20 à 27), mais ils ne sont pas classés. Les numéros g4 restent la référence.
7. **D-66 (X rouge sur « Façons possibles »).** Ce point n'a jamais été confirmé. Les écrans figés gardent une rubrique Façons, remplie par ses notes. Un bloc de façons proposé d'office par l'IA reste à ne pas mettre en avant.
