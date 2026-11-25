RESULTAT critique-72 : 6 problèmes (B 1, m 5, D 0) — corrigés rejoués 8/8 (tenus 7, en partie 1) — carnet identique oui — BUGS OK

Paquet en ligne : index-E9xIEuvt.js (curl ?nocache, 25.11 ; vérifié dans avant.json et apres.json). Le DOSSIER prime sur VOIE.md (index-SSQ_J86L.js).
Tests : sans objet (test d'écran). Registre : `bugs.log` → BUGS OK : 2380 bugs, 563 ouverts, 202 sources.
Coût IA : 9 appels aiTask (6 rangements, 3 pour les deux liens) ≈ 0,085 CHF estimés (0,0094 par appel) ; ≤ 0,10 CHF. La photo seule n'appelle pas l'IA (rangement brut, CarnetsVue.tsx). 9 lignes au journal ia-journal.jsonl.

## Ses données : identiques
Avant (avant.json) et après (apres.json), champ par champ, tout est IDENTIQUE :
- Synthèse 0,00 / 265,40 ; caisse 1 145,00 ; départ 1 145,00 ; Opérations 265,40 / 0,00 / 265,40 ; Mon mois, HABITUELS ;
- −463 CHF à dépenser ; cadre 23 nov. 2026 – 3 janv. 2027 ; 6 sem. ; les 16 barres de la frise ;
- Carnets 32, À venir 11, Réalisés 5 ; l'arbre déplié ; Chambre froide (texte et 3 documents) ; Houblons citra.
Firestore : 3 482 documents hors ZZ avant ; après, 0 changé, 0 manquant ; 17 entrées neuves (1 journal d'audit, tombes de carnets et messages supprimés). Le guet n'a vu aucune écriture pendant les relevés.
Aucune phrase n'a visé un de ses carnets. Deux fois l'app a proposé « Rattacher » : à un ZZ d'une autre ronde (vapeur) et à son « Houblons citra » (phrase Citra) ; j'ai touché « Garder à part » les deux fois. La photo seule a été rattachée (Oui) à MON carnet ZZ Citra.
Ménage : mes 4 carnets supprimés (« Carnet supprimé » vu chaque fois) : vapeur, étiqueteuse, graissage, Citra (avec son plan ; À venir revenu à 11). Onglet fermé (page.close), browser.disconnect.

## Combien et quels problèmes ? 6
1. **B — C72-1** : coût en tête du problème faux. Deux pistes dites dans une phrase (450 et 180 CHF) : « 180 à 630 CHF » ; le ventilateur écarté : « 450 à 630 CHF ». 630 = somme des deux alternatives (B1-pistes, C4-ecartee). Retenu : « 450 CHF » juste (C5-retenu).
2. **m — C72-2** : la veille du ventilateur reste « veille demandée · pas encore relevée » après son écart (E1-tache, P2-1280-probleme, S2-sombre-probleme).
3. **m — C72-3** : À faire › « Un jour » pas dans l'ordre des dates : 1 mai 2027, puis 31 déc., puis sem. du 7 déc., puis avril 2027 (G1-afaire).
4. **m — C72-4 (C71-8 en partie)** : la carte de l'article choisi dit « 1 kg » et « ≈40 CHF », mais aussi « 50 g » sur sa ligne Alpha · Origine (L2-retire).
5. **m — C72-5** : « Comparer sur l'acides alpha (%) » (K1-liens, L0-carnet-choisi).
6. **m — C72-6** : « votre phrase : « … » » redit mot pour mot la première bulle, juste dessous ; absent de la maquette v01-vapeur. Doute au tour 71, compté ici : sur un carnet neuf (étiqueteuse, mémo), la phrase est deux fois à l'écran (H4-etiqueteuse, H5-memo, B1-pistes).

Doutes (non comptés) :
- Carte de saisie : le champ « Ajouter à Houblons citra… » vise déjà le carnet proposé (le sien) avant tout choix (H3-carte) ; idem vapeur (A1b-carte). La maquette v01-saisie montre aussi « Ajouter à Fusible… », mais pour un carnet neuf.
- Le compteur Carnets monte (33 → 34 → 35) pendant que la carte attend OK : carnet créé avant OK (H1, H2).
- La pastille « Lu · CITRA® (US) · 7✓ 17 s » reste sur la liste longtemps après la lecture, sous la saisie ; le bandeau « Dans À venir. » la recouvre (Q1-photo, K5-choisi).
- L1-feuille : contenu décalé de ~7 px à gauche à l'ouverture des actions d'article (titre et icônes coupés) ; scrollX 0 juste après : transitoire.
- « Pourquoi ce choix : En stock, MotlerHops. » alors que l'écart est le prix (≈40 contre 80 CHF/kg) (K5-choisi).
- Brau « vendu par 1 g à 20 kg » (K3-comparer) : 1 g peu plausible, lu sur la page.
- Chiffres en chasse fixe (450 CHF, 180 à 630 CHF, ≈40) ; « Quand · pas encore daté · 40 CHF » sans « ≈ ».
- Le problème vapeur porte un picto de hotte (Relire, bande des résolus) ; la maquette a la casserole fumante.
- L'IA a ôté « c72 » de deux titres (« ZZ TEST — Étiqueteuse… », « ZZ TEST — Graissage… ») : artefact du test.

## Corrigés rejoués (en regardant) — vérifié, en ligne index-E9xIEuvt.js
- **C71-1** : rien de 2027 ni du 12 déc. sous « Fin du mois » ; tout sous « Un jour » avec sa date (« sem. du 7 déc. », « jusqu'au 1 mai 2027 ») (G1-afaire). Ordre : C72-3.
- **C71-2** : la tâche « poser le condenseur avant le 12 décembre », condenseur retenu : seulement « tâche proposée · À faire · Plus tard », aucun « à retenir ? » (E1-tache).
- **C71-3** : plus de question « pourquoi » sous la raison d'écart (C4, C5) ; Relire : « essayé : ventilateur extracteur mural (non) », « pourquoi : tes notes : « trop bruyant… » » (F2-relire), comme v01-relecture.
- **C71-4** : Local (Air et chaleur, Bâtiment, Eau, Électricité, Sécurité), Meuble (Rangement), Papiers (Assurances, Autorisations) par parties ; « Sans catégorie » nomme ses carnets ; plus aucun « Autres » (avant-carnets, H6-arbre, P1-1280-liste).
- **C71-5** : phrase longue de 25 mots → « Étiqueteuse colle de travers » (H1-carte).
- **C71-6** : aucun bandeau « Carnet créé » tant que la carte est posée ; il paraît après OK (A1b, H1, H2, H3).
- **C71-7** : la piste condenseur porte un picto d'échangeur, plus de frigo (B1-pistes, C5, P2-1280, S2).
- **C71-8** en partie : « ≈40 CHF · 1 kg » sur la carte ; reste « 50 g » → C72-4.
- C70-4, C70-5, C70-6 tenus par C71-4 et C71-1.

Également vus : Noté › Je cherche › Décidé › Résolu › Rouvrir (Réalisés 5 → 6 → 5) ; veille ; écart avec raison sur la tuile ; retenu (450 CHF en tête) ; Résolu « le jour même » avec retenu, écarté et raison, « Rangé : Brasserie › Brassage › Vapeur » ; bande des résolus, le dernier en vert ; « Toujours le bon choix ? » ; liens Citra lus (7 étapes, 17 s), Comparer « pour 1 kg », « Choisir · MotlerHops, 1 kg », « Choisi le 25 nov. », À venir « CITRA® (US) · MotlerHops · 1 kg · 40 CHF » (12 puis 11) ; Retirer « Citra 13.6% » puis Annuler du bandeau : « Articles 1 » → « Articles 2 » (L2, L3) ; photo seule : « Photo rangée dans À ranger », la ligne « Photo du 25 nov. · sans texte » dans À ranger et la carte « Rattacher à … ? Oui · Nouveau problème · Laisser » (Q3), Oui → « Rattaché à … » (Q4) ; usage neuf (étiqueteuse : problème Je cherche, Brasserie › Conditionnement › Étiqueteuse ; mémo graissage : Brasserie › Fermentation › Cuve de garde, chip « mémo ») ; thème cave (S1, S2) lisible.

## Rangement sur l'IA réelle : 3/3 juste (phrases neuves)
| phrase | genre | chemin | titre | geste |
|---|---|---|---|---|
| étiqueteuse colle de travers (usage neuf) | nouveau problème · Je cherche | Brasserie › Conditionnement › Étiqueteuse | « Étiqueteuse colle de travers » | OK |
| mémo : joints du robinet graissés (usage neuf) | nouveau carnet · mémo | Brasserie › Fermentation › Cuve de garde | « Graissage robinet cuve de garde » | OK |
| commander du Citra, comparer | nouveau carnet · achat (+ Rattacher à « Houblons citra » ?) | Brasserie › Brassage › Houblon | « … commander du Citra pour l'IPA » | Garder à part |

## Captures
| capture | thème | largeur | état | problèmes | bloquants |
|---|---|---|---|---|---|
| avant-carnets, avant-carnets-deplie, H6-arbre | clair | 390 | Arbre | 0 | 0 |
| A1b-carte, H1, H2, H3-carte | clair | 390 | carte « rangé pour toi » | 0 (doutes) | 0 |
| B1-pistes, C4-ecartee, C5-retenu | clair | 390 | pistes, écart, retenu | 2 (n° 1, 6) | 1 |
| E1-tache | clair | 390 | tâche proposée | 1 (n° 2) | 0 |
| F0-resolu, F2-relire, F8-rouvrir | clair | 390 | Résolu, Relire, Rouvrir | 0 | 0 |
| G1-afaire | clair | 390 | À faire | 1 (n° 3) | 0 |
| H4-etiqueteuse, H5-memo | clair | 390 | carnets neufs | 1 (n° 6) | 0 |
| K1-liens, K3-comparer, K5-choisi, L0, L1, L2-retire, L3-annule | clair | 390 | liens, Comparer, Choisir, Retirer, Annuler | 2 (n° 4, 5) | 0 |
| Q1-photo, Q3-a-ranger, Q4-oui | clair | 390 | photo seule, À ranger | 0 | 0 |
| P1-1280-liste, P2-1280-probleme | clair | 1280 | liste, problème | 1 (n° 2) | 0 |
| S1-sombre-liste, S2-sombre-probleme | cave | 390 | liste, problème | 1 (n° 2) | 0 |

## Non couvert
- À faire à 1280 (P3) : liste non atteinte à 1280 après ouverture d'un carnet ; 2 captures 1280 sur 3.
- Thème cave posé par `data-theme` dans mon onglet (le réglage est local, theme.ts), pas par Réglages : aucune écriture sur ses réglages.
- L'avant/après photo du Résolu (greffe v05) : la photo est allée au carnet Citra, pas au problème.
- C70-8 (commande client) ; aucun lien collé hors Citra.
- BUGS.md : lignes C71-1..8 mises à jour (état) et C72-1..6 ajoutées. La VOIE (périmètre daté C61…) ne nomme pas C71 ; DOSSIER le demande (« chaque corrigé vérifié ou rouvert »), comme critique-71 pour C70.

LEÇON PROPOSÉE : aucune
