OK — 6 problèmes, 1 bloquant

RESULTAT critique-46 : 6 problèmes (B 1, m 2, D 3) — domaine juste 10/10 — carnets identiques oui — BUGS OK

Version : index-D_XfFyFl.js (servi par curl, et chargé dans l'onglet).
Tests : sans objet (test d'écran). Registre : `bugs.log` (BUGS OK : 2209 bugs, 516 ouverts, 202 sources).
Couvert : thème clair, 390 × 844, au toucher, Chrome de débug 9222, mon onglet seulement (page.close puis disconnect, navigateur gardé). Non couvert : 1280 et sombre (consigne du 22.11 : téléphone surtout, un thème).
Coût IA : 11 rangements (≈ 0,002 CHF chacun) et 2 lectures du lien Landi (≈ 0,01 CHF chacune), soit ≈ 0,04 CHF pour un plafond de 0,10 CHF. Les 13 appels sont au journal `2026-11-23-carnet-en-ligne/ia-journal.jsonl`, voie critique-46.

## Carnets avant et après
| | avant | après retrait, app rechargée |
|---|---|---|
| Puces | Tous 20, Local 10, Brasserie 4, Meuble 4, Papiers 2 | identiques |
| Carnets sous chaque filtre (texte, avant.json et apres.json) | — | identiques, les 5 filtres |
| À venir | — | aucun ZZ ; « Les suivants : 10 achats · 8 330 CHF » |
| Calendrier | −463 CHF à dépenser (S53) ; fenêtre du 23.11.2026 au 03.01.2027 | −463 (S53), aucun ZZ ; fenêtre inchangée |
Aucun vrai carnet modifié. Frigo + congel a seulement été ouvert, avec Quand et « Prix » dépliés puis repliés, sans toucher aucune pastille. Pendant le test, les filtres sont montés à Tous 30, Outils 2 (puce apparue avec le premier carnet Outils), Papiers 4.

## Mesure du domaine posé par l'IA : juste 10/10
Les domaines attendus ont été écrits ici avant la création. Chaque carnet a été créé depuis le champ de la liste et rangé par l'IA :
| carnet | attendu | filtre | origine (cache Firestore) |
|---|---|---|---|
| peinture des murs du couloir | Local | Local | ia |
| serrure de la porte d'entrée | Local | Local | ia |
| fermenteur conique 60 L | Brasserie | Brasserie | ia |
| pompe de transfert pour le moût | Brasserie | Brasserie | ia |
| bureau pour l'ordinateur | Meuble | Meuble | ia |
| table de travail en bois | Meuble | Meuble | ia |
| déclaration TVA du trimestre | Papiers | Papiers | ia |
| renouveler la patente de commerce | Papiers | Papiers | aucun domaine de l'IA (Papiers vient des mots) |
| perceuse-visseuse sans fil | Outils | Outils | ia |
| clé dynamométrique | Outils | Outils | ia |
Un 11e carnet, la « table de travail » recréée pour Q-6, est aussi rangé en Meuble.

## Joué, et comparé à sa variante choisie
- **D437 A** (a-puces.png, carnet-domaine.png). La rangée loupe, Tous, Local, Brasserie, Meuble, Papiers montre ses nombres, comme la maquette. Les puces d'état ont disparu et les sections Idée, À comparer et Faits gardent l'ordre. Filtre Local : 6 Idée et 4 Faits (avant-Local). Au carnet rouvert, la pastille « Brasserie ▾ » ouvre un menu de 5 domaines avec une coche. Choisir Outils fait passer la liste à Brasserie 5 et Outils 3 ; remis à Brasserie ensuite (P1 à P5). Écart non compté : la pastille est sur sa propre ligne quand le carnet n'a pas de texte d'état.
- **Q-2 C** (q2-c-froide.png). La loupe ouvre « Chercher un carnet », en entier. « évier » et « EVIER » donnent 2ème évier dans Idée et les 2 Faits à part (R3, R6). « frigorifique » trouve Chambre froide et cite la ligne de l'article, mais le mot trouvé est coupé (n° 2). « fermenteur » et « patente » trouvent leur titre.
- **Q-5 A** (q5-a.png). Au repos, Quand tient sur une ligne : « Quand · pas encore daté › », ou « · S52 · 79,95 CHF estimé ». Un toucher l'ouvre, un toucher sur « Quand » le replie (Q5-repos, Q5-ouvert).
- **Q-1b B** (q1b-b.png). Sur la table ZZ, après le lien, « 79,95 CHF · lu » vient en tête des pastilles de prix (Q1-date), conforme. Sur Frigo + congel, « 400 CHF · budget » est bien en tête mais pressée, et « · budget » n'y est pas lisible (n° 1).
- **Q-1 A** (q1-a.png). Estimé 500 et « Au calendrier » donnent −500 au 21 déc. Après « Choisir chez landi.ch » à 79,95, le prix choisi remplace l'estimé partout : carnet 79,95, carte du Calendrier −79,95, À venir 80 CHF avec l'étiquette de prix connu, Achats « −80 probable » (V2, V3). Restent n° 3, 4 et 5.
- **Q-6 A**. Sur le carnet choisi (vue Stocks › Matériel › Carnets), « Placer » ouvre le Calendrier sur la carte −79,95 (Q6-placer). Rien n'est cassé.
- **D448**. Le lien Landi passe par les étapes Page, Données, Prix, Photos, Caractéristiques, Contrôle et Rangement, puis « Lu · 6 s ». La fiche montre nom, prix 79,95 CHF, photo et 5 caractéristiques (L-t1_5, L-fin). Seul défaut : le compte d'étapes (n° 6).
- **Retrait**. « Supprimer le carnet » propose « Supprimer avec son plan » quand un plan est lié. Les 11 ZZ sont retirés, plans compris.

## Combien et quels problèmes ? 6
1. B — C46-1 — Q-1b. Sur Frigo + congel, avec 400 estimé et un budget de 400, ouvrir Quand puis toucher « Prix » : la pastille « 400 CHF · budget » est en tête mais pressée, sur fond vert foncé. « · budget » y reste en gris et ne se lit pas, alors que ce mot dit d'où vient le prix (B3-frigo-prix). Le brasseur : « c'est écrit quoi après 400 ? ». Correction : le suffixe doit être lisible aussi sur la pastille pressée.
2. m — C46-2 — Q-2 C. Recherche « frigorifique » : la ligne citée « article : 1800 x 1500 mm - 4,06 m³ - groupe fri… » coupe le mot trouvé. La maquette le met en gras au milieu de la ligne (R4).
3. m — C46-3 — Q-1. Après le choix à 79,95, l'avis du Calendrier dit toujours « achat prévu posé · −500 CHF » avec son Annuler, alors que la carte dit −79,95 et la frise −80 (V3). L'avis a survécu à plusieurs changements d'écran.
4. D — C46-4 — Q-1. Le carnet choisi dit « Quand · S52 · 79,95 CHF estimé » : un prix choisi n'est plus un estimé (Z1-avant-placer).
5. D — C46-5 — Q-1. Un même prix s'écrit 79,95 au carnet et sur la carte du Calendrier, mais 80 dans À venir, sur la frise et dans Achats (V2, V3). Sa variante dit « un seul chiffre ».
6. D — C46-6 — D448. La lecture affiche « Lecture · 6 sur 7 », puis « 6 étapes sur 6 · lu en 6 s » à la fin (L-t1_5, L-fin).

Bloquants : 1 (n° 1, texte illisible sur l'élément propre à son choix Q-1b B). Aucune donnée fausse et aucun geste sans effet.

### Doutes (non comptés)
- La patente de commerce n'a reçu aucun domaine de l'IA : Papiers est juste, mais vient des mots.
- Le 11e rangement a pris environ 40 s (« L'IA range… »), contre environ 5 s pour les dix premiers.
- Changer le domaine n'affiche aucun « Annuler » (P3), alors que carnet-q l'annonçait. Rien ne dit que son choix l'exige.
- « Anciennes notes de l'Atelier · 3 » reste sous chaque résultat de recherche, même sans rapport avec le mot cherché (R2, R4, R5).
- Carnet choisi : « Placer » apparaît dans Stocks › Matériel › Carnets, mais pas dans Brassins › Atelier › Carnet (Z1-avant-placer).
- Placer d'un carnet non daté le pose au 1er févr. 2027 (Q6-placer).
- L'IA a proposé « Landi.ch. » comme pourquoi du choix (K3-confirmer).
- Cinq carnets neufs (clé, table, bureau, serrure, perceuse) ont la vignette générique « étiquette », alors que leur domaine a un picto (R1).

## Table (captures 390 ouvertes)
| capture | thème | largeur | état | problèmes | bloquants |
|---|---|---|---|---|---|
| avant-liste, avant-Local | clair | 390 | liste, puces de domaines, filtre Local | 0 | 0 |
| C1-fin, C3-t0_5 | clair | 390 | carnet créé, L'IA range | 0 | 0 |
| R1, R2, R3, R5, R6 | clair | 390 | loupe ouverte, recherches | 0 | 0 |
| R4 | clair | 390 | recherche d'un article | 1 (n° 2) | 0 |
| P2, P3 | clair | 390 | menu des domaines, Outils choisi | 0 | 0 |
| Q5-repos, Q5-ouvert | clair | 390 | Quand replié, ouvert | 0 | 0 |
| B2, B3 | clair | 390 | Frigo + congel, Quand, Prix | 1 (n° 1) | 1 |
| L-fin | clair | 390 | lien lu, article rangé | 1 (n° 6) | 0 |
| Q1-date | clair | 390 | Prix estimé, « · lu » | 0 | 0 |
| Q1-au-calendrier, V3 | clair | 390 | plan −500, puis choisi | 2 (n° 3, 5) | 0 |
| K3, K4 | clair | 390 | Choisir, choisi, Placer | 0 | 0 |
| V1, V2 | clair | 390 | À venir | 1 (n° 5) | 0 |
| Z1-avant-placer | clair | 390 | carnet choisi, Quand | 1 (n° 4) | 0 |
| Q6-placer | clair | 390 | Placer → Calendrier | 0 | 0 |
| F0, F1 | clair | 390 | après retrait | 0 | 0 |

## Registre
- Lignes neuves : C46-1 à C46-6 (ouvert).
- Passent à « vérifié — en ligne index-D_XfFyFl.js (tour 46) » : PNC-14, CA12-M4-14, CA12-M4-16, CA12-M2-2 et CA12-M1-3. Pour ces deux dernières, il reste C46-4 et C46-5.
- Incident d'écriture réparé : mon premier script a remplacé les 3 lignes d'en-tête de BUGS.md. Je les ai remises à l'octet depuis HEAD ; le diff final ne contient que les 5 statuts et les 6 lignes neuves.

LEÇON PROPOSÉE : aucune.
