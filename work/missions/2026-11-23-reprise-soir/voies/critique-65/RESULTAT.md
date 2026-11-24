OK — 8 problèmes, 3 bloquants

RESULTAT critique-65 : 8 problèmes (B 3, m 5, D 0) — corrigés rejoués 11/13 (C61-3, C61-6 rouverts en partie ; C64 du tour 65 : 6/9, C64-4 en partie, C64-3 et C64-8 rouverts) — carnet identique oui — BUGS OK

Version : index-BTs27oam.js (curl ?nocache 22:09 ; onglet mis à jour par `maj.mjs`, `maj.log`).
Tests : sans objet (test d'écran). Registre : `bugs.log` (BUGS OK : 2301 bugs, 520 ouverts, 202 sources).
Couvert : thème clair, 390 × 844, deviceScaleFactor 2, au toucher (CDP), Chrome de débug 9222, mon onglet seul. Fin : page.close(), puis disconnect. Non couvert : 1280 et sombre (DOSSIER).

## À savoir d'abord (pilote)
- **Son carnet « Chambre froide » avait déjà changé avant mon test. Ce n'est pas de mon fait.**
  - Relevé avant (21:12Z) : il porte une note neuve, « Fûts déplacés dans la chambre froide en attendant. » (NOTE-a7e26b53).
  - Elle a été écrite le 24.11 à 20:29:07Z par le message MSG-f1c7e07a, rangement « locale », depuis CARNET-46473686. Ce carnet n'est pas à lui : c'est l'autre session ZZ du tour 64.
  - Le paquet était alors celui du tour 64 (SSQ_J86L), avant c64-fix (21:57 heure suisse).
  - Au relevé après de critique-64, ce carnet faisait 9 086 o (maj 10:38Z) ; il en fait maintenant 9 373.
  - Je ne l'ai pas retirée, car c'est sa donnée. À retirer avec son accord, comme la note de « Achat brasserie » (b87f6e638).
- **Le relevé avant et après est identique** (avant.json / apres.json). Comparé : soldes, à dépenser −463 (S53), Synthèse, Opérations, départ, Mon mois, HABITUELS, période (23 nov. 2026 – 3 janv. 2027, localStorage identique), puces (Tous 37), les 16 choses de la frise, Chambre froide (texte et 3 documents), Houblons citra.
  - Sur environ 3 340 documents hors ZZ, 19 seulement ont changé, tous de mon fait : 1 financialSync/state ; 4 carnets ZZ c65 et leurs 12 messages, absents avant et supprimés depuis ; 2 VOID-MAIN de mes écritures ZZ retirées.
- **C64-8 ne tient pas en ligne** (n° 1 et 2). Un message tapé dans un carnet ouvert part encore dans un autre carnet, par l'IA comme sur l'appareil.
  - Mon filet n'a rien eu à réécrire : l'IA a désigné mon carnet ZZ joint. Aucun de ses carnets n'a été touché.
  - Tant que ce défaut reste ouvert, toute session de test qui tape une phrase dans un carnet ZZ peut écrire dans ses carnets.
- **Coût IA : 0,058 CHF**, 9 lignes au journal (`ia-journal.jsonl`), tout sur ZZ. Détail : 3 rangements, 5 lectures de lien, 1 Relire.
  - Le joint (IA bloquée), le collier (plafond simulé) et le message Y (IA refusée) n'ont fait partir aucun appel payant.
- **Ma garde** : la proximité « Déjà un carnet proche : ZZ TEST — c65 pellets… » a d'abord refusé la marmite, le joint et le collier, sur le seul mot commun « c65 ».
  - Je l'ai assouplie aux seuls carnets ZZ c65. Le carnet proposé reste refusé dès qu'il n'est pas un carnet ZZ.
- **Nettoyage** :
  - 4 carnets ZZ c65 supprimés (`supp-carnet2.log`) ;
  - 2 écritures ZZ c65 retirées (`supp-ecr.log`) ;
  - la barre ZZ c65 de la frise supprimée (`lot5det.log`) ;
  - la période remise.
  - Les carnets ZZ des autres sessions sont restés intacts.

## Corrigés rejoués (en ligne index-BTs27oam.js)
- **C64 (tour 65)** :
  - **C64-1** vérifié. hopfenmarkt affiche « 6,70 · 100 g · 67,00 CHF/kg ». Il est classé 1er au kilo et Comparer dit « 100 g » (Q3-R-rouvert, P-comparer-0, P-F3-0).
  - **C64-2** vérifié. Brau affiche « 0,1044 CHF/g · 80,00 CHF/kg dès 1 kg ». La fiche dit « 80 CHF » et n'a plus de « Conditionnement 1 kg » (P-F2-0).
  - **C64-3** rouvert : voir le n° 4.
  - **C64-4** vérifié en partie. « Arômes et saveurs » est bien lu comme Arômes (MotlerHops), et « Pays de récolte » comme Origine. Reste « USA » écrit à côté de « États-Unis » (n° 7).
  - **C64-5** vérifié. L'étape dit « Caractéristiques : 7 caractéristiques : 1 de la page, 6 lues par l'IA · trouvé » (Q1-t8).
  - **C64-6** vérifié. La liste dit « ≈4 CHF les 50 g », puis « dès 67 CHF/kg » (Q2-Q1-liste, EZ2).
  - **C64-7** vérifié. Après la suppression des 4 carnets ZZ, la liste n'a aucun bandeau « interrompue » (S-apres, apres-carnets).
  - **C64-8** rouvert : voir les n° 1 et 2.
  - **C61-5** vérifié. La jauge de la marmite 50 L (1re) est pleine, celle du frigo 242 L presque vide (M-articles-0).
- **Lignes C61, C59, LE, BD et PX** (état mis à jour dans BUGS.md) :
  - **Vérifiés** :
    - C61-1 : « Houblons citra · 2 articles », sans prix.
    - C61-2 : aucun « Lecture de lien interrompue » sur 5 liens. J'ai quitté le carnet 1,5 s après avoir collé Brau : je n'ai eu aucun Reprendre au retour.
    - C61-4 : la quantité est dite partout.
    - C61-5.
    - C59-6 : classement au kilo, hopfenmarkt 67 puis MotlerHops 73,80 puis Brau 80.
    - C59-8 : « Alpha » en tête sur ses 2 fiches et les 3 fiches ZZ.
    - LE-1 : guet vide sur toutes les vues de lecture (vueA, vueH, vueP, vueM).
    - BD-1 : l'avis ne reste jamais et ne couvre rien. La pastille n'a pas été vue (doute 1).
    - PX-1, PX-2 : « prix CHF/kg ».
    - PX-3 : « Escalader » sur la fiche et dans la cellule « ? ».
  - **Rouverts en partie** :
    - C61-3 : son carnet est juste ; sur un carnet neuf, on lit « USA / États-Unis » (n° 7).
    - C61-6 : son carnet est juste ; une lecture neuve donne de l'allemand (n° 8).
- **Rejeu, en regardant** :
  - C46-1 : « 400 CHF · budget » en blanc sur vert.
  - C46-2 : la recherche « frigorifique ».
  - C46-5, C54 : « −79,95 / −80 / −159,95 » ; « Achats −159,95 à payer » ; S50 ; à dépenser −623 avec mes 2 écritures ZZ (F0-haut, S50).
  - C50-5 : compromis de la marmite « la 2e, 302 CHF, soit 218 CHF de moins… ; le volume 242 L au lieu de 50 L ».
  - C53 : ordre de la fiche hopfenmarkt, Alpha 12,8 % puis Bêta, Cohumulone, Récolte, Huiles.
  - C56 : « Variantes 50 g · 100 g (affichée) · 250 g · 500 g · 1 kg ».
  - C58 : le bandeau « n'a pas répondu » n'apparaît que dans le joint.
  - C59-1 : Relire du joint, 1 appel.
  - C59-2 : « IA en pause : plafond… » ; Relire du collier, 1 appel, rien de payant.
  - C59-4 : la marmite 50 L est 1re.
  - K57, POI-1, Q4-1 se comportent comme au tour 64 (`cal.log`) :
    - poignée à 2 et 4 px : rien ; à 6 px : 1 jour ;
    - barre tenue S48 → S10 à 30 px, S48 → S17 à 4 px, Annuler remet ;
    - toucher bref : rien ne bouge.
  - C48, C52 et C55 n'ont pas été isolés : rien de contraire dans les mêmes vues.

## Combien et quels problèmes ? 8
1. **B — C65-1 (C64-8 rouvert, chemin IA)** — Dans le carnet ZZ marmite ouvert, j'ai tapé « Joint torique 20 mm : en racheter deux, l'ancien est fendu ».
   - L'IA a rendu carnetId = le carnet ZZ joint, et la note « Racheter deux joints toriques 20 mm, l'ancien est fendu » a été écrite dans le joint.
   - La marmite ne reçoit rien et aucune proposition « Déplacer vers … ? » n'apparaît (X-t8, X-fin, X-vise, message.log).
   - Le brasseur : « Je l'ai tapé dans la marmite, où il est passé ? »
2. **B — C65-2 (chemin local, IA sans réponse)** — Dans la même marmite ouverte, avec l'IA refusée, j'ai tapé « Collier de serrage 25 mm : en prendre dix pour les tuyaux ».
   - Le message devient un critère « Ce qui compte » du carnet ZZ collier.
   - La marmite dit pourtant « L'IA n'a pas répondu : 1 message rangé tel quel », alors que rien n'y est (Y-fin, Y-vise).
   - C'est le chemin de la note parasite de SON Chambre froide (rangement « locale », voir « À savoir d'abord »).
   - Le brasseur : « Qui a mis ça dans mon carnet ? »
3. **B — C65-3** — Tableau des articles du carnet ZZ pellets, ligne Brau : « 13,6 % » est écrit par-dessus « dès 1 kg », dans « 0,1044 CHF/g · 80,00 CHF/kg dès 1 kg ». C'est du texte illisible (Z-pellets-brau, zoom ×3 ; Q3-R-rouvert).
   - Le brasseur : « On lit rien sur la ligne du Brau. »
4. **m — C65-4 (C64-3 rouvert)** — Pour MotlerHops (3,72 € les 50 g), la carte lue dit « ≈3 CHF ». Le tableau, Comparer et la fiche disent « ≈4 CHF rendu » et 73,80 CHF/kg (Q1-fin, P-F1-0).
   - Le brasseur : « 3 ou 4 balles ? »
5. **m — C65-5** — Le tableau est classé au kilo (hopfenmarkt 1er), mais la case verte de la colonne CHF est le « ≈4 » de MotlerHops, 2e : c'est le plus petit prix brut, celui d'un sachet de 50 g (Q3-R-rouvert).
   - Le brasseur : « Le vert sur le 2e ? C'est lequel le moins cher ? »
6. **m — C65-6** — La fiche hopfenmarkt a quatre caractéristiques en double (P-F3-1) :
   - Année de récolte et Récolte 2025 ;
   - Forme et Forme de houblon Pellets ;
   - Pays de la récolte et Pays de récolte USA ;
   - Conditionnement et Taille de l'emballage 100 g.
   - Le brasseur : « Pourquoi tout deux fois ? »
7. **m — C65-7** — Comparer, Origine : « USA / États-Unis / États-Unis » (P-comparer-1).
   - Le brasseur : « C'est le même pays. »
8. **m — C65-8** — Une lecture neuve du lien Brau donne « Convient particulièrement pour : amerikanische Ales und IPA's » : la valeur est en allemand (P-F2-0).
   - Le brasseur : « Pourquoi de l'allemand ? »

Bloquants : 3.
- n° 1 et 2 : écriture dans un autre carnet sans geste. C'est le même chemin qui a touché deux de ses carnets.
- n° 3 : texte illisible.

Aucun élément de maquette ne manque.

### Doutes (non comptés)
1. BD-1 : la pastille « Enregistrement… » n'a jamais été vue, même réseau ralenti à 1,5 s.
2. Comparer, en-tête « prix CHF/kg » : le chiffre en gros est le prix du sachet (6,70, ≈4, 80), et le CHF/kg est en petit dessous.
3. Pastille de lecture « Lu · Kibernetik KS240L 6 1– 6 s » et « 6✓ 1? » : « 1– » et « 1? » sont sibyllins. Elle flotte sur la dernière ligne (M2-R-rouvert, Q3-R-rouvert).
4. Le critère de la marmite ZZ, « C65 marmite de brassage 50 L », reprend le mot « C65 » de mon titre. C'est un artefact de mon titre de test.
5. Déjà vus : « PAS REMIS » transitoire après Annuler une barre tirée ; « Classé par Prix ? » en pointillés.

## Table (captures 390 ouvertes : avant-carnets, A-carnet, A-articles-0, A-comparer-0, H-carnet, H-comparer-0, H-F1-0, Q1-fin, Q2-Q1-liste, Q3-R-rouvert, Z-pellets-brau, EZ2, X-t8, X-vise, Y-vise, M-articles-0, P-comparer-0, P-F3-1, F0-haut, S50)
| capture | thème | largeur | état | problèmes | bloquants |
|---|---|---|---|---|---|
| avant-carnets, apres-carnets | clair | 390 | liste des carnets (lecture) | 0 | 0 |
| A-carnet, A-articles-0, A-comparer-0 | clair | 390 | son Chambre froide (lecture) | 0 (note parasite d'avant : À savoir) | 0 |
| H-carnet, H-comparer-0, H-F1-0, H-F2-0 | clair | 390 | son Houblons citra (lecture) | 0 | 0 |
| Q1-fin, Q2-Q1-liste, Q2-Q2-retour, Q3-R-rouvert, Z-pellets-brau | clair | 390 | 3 liens Citra ZZ, quitter pendant, rouvrir | 3 (n° 3, 4, 5) | 1 |
| P-comparer-0/1, P-F1-0, P-F2-0, P-F3-0/1 | clair | 390 | ZZ pellets : Comparer, fiches | 3 (n° 6, 7, 8) | 0 |
| M1-fin, M2-R-rouvert, M-articles-0, M-comparer-0 | clair | 390 | marmite ZZ, cible 50 L | 0 | 0 |
| X-avant, X-t8, X-fin, X-vise | clair | 390 | message dans la marmite ouverte, IA réelle | 1 (n° 1) | 1 |
| Y-fin, Y-vise | clair | 390 | message dans la marmite ouverte, IA refusée | 1 (n° 2) | 1 |
| RJ, RP, C6, C7 | clair | 390 | joint (IA bloquée), collier (pause), Relire | 0 | 0 |
| F0-haut, S50, D1-causes, V2-previsions | clair | 390 | Calendrier, écritures ZZ | 0 | 0 |

## Au fil (journal)
- 21:10Z maj vers BTs27oam ; 21:12Z relevé avant ; lot1 : vues A et H, rejeu46 ; lot2/2c/2d/2e : création, liens, Relire, messages ; lot4 : vues P et M ; lot35 : zoom, Calendrier, écritures ; lot6/lot7 : nettoyage et relevé après (la 1re suppression a été refusée par ma garde : placeholder tronqué, « Ajouter à ZZ TEST… » ; reprise avec contrôle du titre).

LEÇON PROPOSÉE : une garde de script qui exige le titre complet dans un champ dont l'app tronque le placeholder (« Ajouter à ZZ TEST… ») refuse tout. Elle doit lire le titre affiché en tête du carnet, pas le placeholder.
