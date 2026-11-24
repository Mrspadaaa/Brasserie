OK — 9 problèmes, 3 bloquants

RESULTAT critique-64 : 9 problèmes (B 3, m 6, D 0) — corrigés rejoués 11/13 — carnet identique oui (Chambre froide, Houblons citra), mais son carnet « Achat brasserie » a reçu une note d'une autre session (n° 3) — BUGS OK

Version : index-SSQ_J86L.js (curl ?nocache ; `maj.log` : onglet passé de D3jS7C01 à SSQ_J86L).
Tests : sans objet (test d'écran). Registre : `bugs.log` (BUGS OK : 2293 bugs, 520 ouverts, 202 sources).
Couvert : thème clair, 390 × 844, deviceScaleFactor 2, au toucher (CDP). Chrome de débug 9222, mon onglet seul ; fin par page.close() puis disconnect. Non couvert : 1280 et sombre (DOSSIER).

## À savoir d'abord (pilote)
- **Son carnet « Achat brasserie : moulin à malt + bac etc. » a changé pendant le test, pas de mon fait** (n° 3, C64-8).
  - CARNET-PLANNING-T-12 : updateTime 20.11 17:57:58Z → 24.11 20:24:52Z ; note neuve « Achat prévu fin du mois. » (genre à acheter).
  - Message MSG-4d6560ee, créé 20:24:52Z, rangement « locale », `depuis` le carnet « ZZ TEST — trop de vapeur au brassage » : une autre session de test, dans le même Chrome. Son écriture est passée par mon onglet (onglet primaire de Firestore), ce qui l'a rendue visible ici (doc.json, doc2.json, doc3.json).
  - Je ne l'ai pas retirée (sa donnée). À retirer par le pilote, et à signaler à la voie qui teste ces carnets ZZ.
- Le reste de mon relevé est identique (avant.json / apres.json) : soldes, à dépenser −463 (S53), Synthèse, Opérations, départ, Mon mois, HABITUELS, période (23 nov. 2026 – 3 janv. 2027, localStorage identique), 16 choses de la frise, Chambre froide (texte et 2 documents, 837 et 9 086 o), Houblons citra (texte).
  - Sur 3 276 documents hors ZZ, 2 seulement ont changé : CARNET-PLANNING-T-12 (ci-dessus) et `financialSync/state` (mes écritures ZZ puis leur retrait).
  - Les puces passent de Tous 21 / Local 10 / Brasserie 5 / Papiers 2 à 37 / 14 / 12 / 3 : ce sont les carnets ZZ de l'autre session (« CO2 qui baisse vite dans un fût », « assurance à renouveler », « truc à voir »…). Les miens sont tous supprimés.
- **Coût IA : 0,056 CHF**, 8 lignes au journal, tout sur ZZ TEST. Détail : 2 rangements, 5 lectures de lien, 1 Relire.
  - Le joint (IA bloquée) et le collier (plafond simulé dans mon onglet) n'ont fait partir aucun appel payant.
  - Aucun appel IA sur ses carnets.
- **Garde** : « ZZ TEST — Citra prix » a été refusé par la garde (« Déjà un carnet proche : Houblons citra »), sans rien toucher. J'ai repris le test sous « ZZ TEST — pellets T90 aromatiques ».
- **Nettoyage** :
  - 4 carnets ZZ supprimés (pellets, marmite, joint, collier), chaque fois après la garde « Ajouter à ZZ TEST… » ;
  - mes 2 écritures ZZ retirées (`supp-ecr` limité à « ZZ TEST — achat( rond) », pour ne rien retirer à l'autre session) ;
  - la barre ZZ de la frise supprimée (`KS après []`) ;
  - la période remise.

## Corrigés rejoués : 11 sur 13 vérifiés, 2 en cours
- **Vérifiés** — en ligne index-SSQ_J86L.js :
  - **C61-1** : la liste dit « Houblons citra · 2 articles », sans « dès 0,10 ».
  - **C61-2** : 5 liens lus jusqu'au bout, sans « interrompue ». J'ai quitté le carnet 1,5 s après avoir collé le lien Brau : la lecture a fini seule et je n'ai eu aucun Reprendre au retour (Q2-Q0, Q2-Q1, Q2-Q2, Q3-R, M2-R). Variante neuve : n° 9.
  - **C61-3** : Alpha, puis Arômes, puis Origine « États-Unis » des deux côtés.
  - **C61-4** : la quantité est dite (« 3,72 € · 50 g · 68,32 CHF/kg »). Reste le n° 4.
  - **C61-6** : « ales et IPA américaines ».
  - **C59-6** : plus de 0,10 ; Brau lu à « 0,1044 CHF/g » ; classement au kilo, MotlerHops 1er.
  - **C59-8** : « Alpha » en tête sur ses 2 fiches et sur les 3 fiches ZZ.
  - **LE-1** : guet vide pendant l'ouverture de Chambre froide et de Houblons citra (carnet, Articles, Comparer, fiches). Les écritures vues pendant la vue ZZ sont décodées dans `ecrvue.log` : ce sont les carnets ZZ de l'autre session, pas la vue.
  - **BD-1** : l'avis n'est jamais resté ni posé sur les onglets, sur 15 écritures réelles, réseau ralenti à 1,5 s compris. La pastille elle-même n'a pas été vue (doute 1).
  - **PX-2** : en-têtes « prix CHF/kg » et « prix CHF ».
  - **PX-3** : « Escalader » à côté de « Relire » sur la fiche et dans la cellule « ? » de Comparer.
- **En cours** :
  - **C61-5** : voir le n° 8.
  - **PX-1** : voir les n° 1 et 2.
- **Rejeu, en regardant** (mêmes vues qu'au tour 61) :
  - **Tiennent** :
    - C46-1 : « 400 CHF · budget » en blanc sur vert.
    - C46-2 : la recherche « frigorifique ».
    - C46-5, C54 : « −79,95 / −80 / −159,95 » partout ; « achat rond + 1 autre −159,95 » sur la marche S50 ; Prévisions, causes et Achats.
    - C50-5 : son compromis Chambre froide, « …mais la 2e a le volume 4,06 m³ au lieu de 2,6 m³ ».
    - C53 : fiche hopfenmarkt dans l'ordre Alpha 12,8 %, Bêta, Cohumulone, Récolte, Huiles totales, puis les huiles en ordre décroissant.
    - C56 : « Variantes 50 g · 100 g (affichée) · 250 g · 500 g · 1 kg », sans unité orpheline.
    - C59-1 : Relire du joint, 1 appel, la note rangée dans le joint.
    - C59-2 : « IA en pause : plafond… », 1 seul appel à la création et 1 seul au Relire.
    - C59-4 : la marmite 50 L passe 1re.
    - C58 : le bandeau « n'a pas répondu » ne s'affiche que dans le joint et sur la liste.
  - **K57, POI-1, Q4-1** :
    - poignée à 2 et 4 px : rien ; à 6 px : 1 jour ;
    - barre tenue : S48 → S12 à 30 px, S48 → S19 à 4 px ;
    - cadre lâché sans saut ;
    - toucher bref : rien ne bouge.
  - Je n'ai pas isolé C48, C52 et C55 : rien de contraire dans les mêmes vues.

## Combien et quels problèmes ? 9
1. **B — C64-1** — hopfenmarkt Citra : « 6,70 CHF · 50 g · 134,00 CHF/kg ».
   - Dans le code de la page, 6,70 est le prix de 100 g (SKU HOP-CITRA-0100). Le 50 g coûte 3,60, et le kilo 62,20.
   - Le Citra est classé 3e, le plus cher, alors qu'à 67 CHF/kg il est le moins cher.
   - Comparer se contredit : « Conditionnement 100 g » sous « 50 g » (P-comparer-0, P-F3-0, Q3-R-rouvert).
   - Le brasseur : « 134 le kilo chez hopfenmarkt ? Sur le site c'est 6,70 les 100 g. »
2. **B — C64-2** — Brau Citra 13.6% : « 104,40 CHF · 1 kg », « Conditionnement 1 kg ».
   - La boutique vend au gramme, 0,1044 CHF/g, et dès 1 000 g c'est 0,08 CHF/g : 1 kg y coûte donc 80 CHF.
   - Comparer, lui, dit juste : « 0,1044 CHF/g » (P-F2-0, Q3-R-rouvert).
   - Le brasseur : « 1 kg à 104 ? Au kilo c'est 0,08 le gramme. »
3. **B — C64-8** — Une note d'un carnet ZZ (« Achat prévu fin du mois. ») est rangée seule dans SON carnet « Achat brasserie : moulin à malt + bac etc. ». Voir « À savoir d'abord ».
   - Le message a été tapé sous « Ajouter à ZZ TEST — trop de vapeur… » et il est allé dans un autre carnet, le sien.
   - Le brasseur : « J'ai jamais écrit ça dans mon carnet. »
4. **m — C64-3** — CITRA® MotlerHops : un même prix, dit de trois façons.
   - La carte lue dit « ≈3 CHF », le tableau et la fiche « ≈4 CHF rendu ».
   - On lit « 68,32 CHF/kg » au tableau et dans Comparer, « 68,40 » dans la feuille Articles et la fiche.
   - Ce CHF/kg n'est pas sur la base du « ≈4 rendu », qui ferait environ 80 CHF/kg (Q1-fin, H-carnet, H-articles-0, H-F1-0).
   - Le brasseur : « 3 ou 4 balles ? Et 68 ou 80 le kilo ? »
5. **m — C64-4** — Les synonymes ne sont pas rapprochés.
   - MotlerHops publie « Arômes et saveurs : agrumes, pamplemousse… », et la fiche dit pourtant « Non publié par le vendeur : Arômes ». Comparer affiche « Arômes ? ».
   - De même pour hopfenmarkt : « Pays de récolte USA », mais « Origine ? » (P-F1-0, P-F3-0, P-comparer-0).
   - Le brasseur : « Les arômes sont écrits juste au-dessus. »
6. **m — C64-5** — La lecture MotlerHops dit « Caractéristiques · absent [Compléter] », alors que la carte, juste en dessous, montre l'alpha, les arômes et 50 g (Q1-fin).
   - Le brasseur : « Absent ? Elles sont là. »
7. **m — C64-6** — La liste des carnets dit « ZZ pellets · 3,72 EUR les 50 g », alors que dans le carnet on lit « ≈4 CHF rendu », et que les autres carnets sont en CHF (Q2-Q1-liste).
   - Le brasseur : « Pourquoi des euros ici ? »
8. **m — C61-5 rouvert** — Dans la feuille Articles de la marmite ZZ, la jauge du frigo 242 L (2e) est pleine et vert foncé ; celle de la marmite 50 L (1re) est grise, avec un point à gauche. Le repère de 50 L n'est qu'un trait fin. Comparer, lui, est juste (M-articles-0, M-comparer-0).
   - Le brasseur : « Le frigo a la barre pleine mais il est 2e ? »
9. **m — C64-7** — Après la suppression de mes carnets ZZ (tous lus jusqu'au bout), la liste affiche « Lecture de lien interrompue : 2 à reprendre [Reprendre] » (S-apres).
   - Reprendre relancerait des lectures payantes, pour un carnet supprimé.
   - Il y a un doute : une autre session avait des carnets ZZ ouverts dans le même navigateur.
   - Le brasseur : « Reprendre quoi ? Je l'ai supprimé. »

Bloquants : 3.
- n° 1 : valeur fausse et classement faux.
- n° 2 : valeur fausse (le prix du kilo).
- n° 3 : écriture dans ses données sans son geste.

Aucun élément de maquette ne manque.

### Doutes (non comptés)
1. BD-1 : la pastille « Enregistrement… » n'a jamais été vue. Les écritures sont acquittées en moins de 0,5 s, même réseau ralenti à 1,5 s. Son rendu (en bas, sans rien couvrir) reste à voir sur une écriture vraiment lente.
2. La colonne CHF du tableau ZZ mêle « ≈4 » (50 g), « 104,40 » (1 kg) et « 6,70 », alors que le rang se fait au kilo : la colonne a l'air non triée.
3. « Classé par Prix ? » (pastille en pointillés) : le « ? » n'est pas expliqué.
4. La pastille de lecture (« Lu · Kibernetik KS240L 6✓ 1– 31 s ») flotte sur la dernière ligne (Quand, liste) ; « 1– » est sibyllin (M2-R-rouvert, Q2-Q1-liste).
5. Sa liste montre « Houblons citra · 2 articles » sans prix, alors que le carnet a « ≈4 » : c'est conforme à « ou rien ».
6. Déjà vus : « PAS REMIS » transitoire après Annuler une barre tirée, « Horizon : jusqu'au 23 nov. 2031 » dans les causes, la bulle « achats ≥ 2,40, 13.12 » dans Prévisions, la flèche « < » à droite sur la dernière fiche.

## Table (captures 390 ouvertes : P-H1, P-H2, P-L2, P-Q, P-P, P-CAL, P-M, avant-carnets, S-apres)
| capture | thème | largeur | état | problèmes | bloquants |
|---|---|---|---|---|---|
| avant-carnets | clair | 390 | liste des carnets (lecture) | 0 | 0 |
| H-carnet, H-articles-0, H-comparer-0, H-F1-0, H-F2-0 | clair | 390 | son Houblons citra (lecture) | 1 (n° 4) | 0 |
| A-carnet, A-articles-0, A-comparer-5 | clair | 390 | son Chambre froide, compromis | 0 | 0 |
| Q1-fin, Q2-Q0-pendant, Q2-Q1-liste, Q3-R-rouvert | clair | 390 | 3 liens Citra ZZ, quitter pendant, rouvrir | 4 (n° 1, 4, 6, 7) | 1 |
| P-comparer-0/1, P-F1-0, P-F2-0, P-F3-0 | clair | 390 | ZZ pellets : Comparer, fiches | 3 (n° 1, 2, 5) | 2 |
| M1-fin, M2-R-rouvert, M-articles-0, M-comparer-0, M-F1-0, M-F2-0 | clair | 390 | marmite ZZ, cible 50 L | 1 (n° 8) | 0 |
| C7-fin, C1-proche, RJ, RP | clair | 390 | création, garde, Relire, pause simulée | 0 | 0 |
| F0-haut, D1-causes, S50, V2-previsions | clair | 390 | Calendrier, écritures ZZ | 0 | 0 |
| S-apres | clair | 390 | liste après suppression | 2 (n° 3, 9) | 1 |

LEÇON PROPOSÉE : deux voies de test dans le même Chrome partagent le même Firestore. L'onglet primaire envoie les écritures de tous les onglets, et les compteurs et le stockage local sont communs. Le relevé avant/après décode donc l'auteur (`depuis`, createTime) de chaque document changé avant d'accuser un geste, et un nettoyage ne cible que ses propres titres, jamais tout « ZZ TEST ». Mieux : une seule voie de test en ligne à la fois.
