# RESULTAT critique-70 : 10 problèmes (B 2, m 8, D 0) — corrigés rejoués 13/13 (tenus 6, en partie 6, rouvert 1 ; + C67B-1 rouvert) — carnet identique oui — BUGS OK

Paquet en ligne : index-CdpI-ft5.js (curl ?nocache, 25.11 ; vérifié dans avant.json et apres.json). Le DOSSIER prime sur VOIE.md (index-SSQ_J86L.js).
Tests : sans objet (test d'écran). Registre : `bugs.log` → BUGS OK : 2366 bugs, 563 ouverts.
Coût IA : 14 appels « ranger » (aiTask), ≈ 0,028 CHF, journalisés dans ia-journal.jsonl.

## Ses données : identiques
Avant (avant.json) et après (apres.json) : Synthèse 0,00 / 265,40 ; caisse 1 145,00 ; départ 1 145,00 ; Opérations 265,40 / 0,00 / 265,40 ; Mon mois et HABITUELS identiques ; −463 CHF à dépenser ; cadre 23 nov. 2026 – 3 janv. 2027 ; période 6 sem. ; 16 barres de la frise identiques ; À venir 11, Carnets 32, Réalisés 5, 8 je cherche, 5 résolus ; liste identique. Sur 3 438 documents hors ZZ : 0 changé, 0 manquant. Les 22 entrées neuves sont 2 journaux d'audit et 20 tombes de mes carnets, messages et plan. Le guet n'a vu aucune écriture à l'ouverture des listes. Aucune phrase n'a visé un de ses carnets : le seul rattachement accepté visait mon carnet ZZ vapeur.
Ménage : mes 5 carnets (vapeur, thermomètre, mariage, achats IPA « avec son plan », Photo du 25 nov.) ont été supprimés (« Carnet supprimé » vu). Mon brouillon local (les liens non envoyés) a été retiré du localStorage.

## Combien et quels problèmes ? 10
1. **B — C70-1 (C67B-1 rouvert, C69-12 en partie)** : Comparer « pour 1 kg » donne MotlerHops ≈40. Pourtant, « Choisir · MotlerHops, 1 kg » mène à une confirmation « 50 g · 73,80 CHF/kg · ≈4 CHF », à « Part dans À venir : ≈4 CHF », puis à À venir « CITRA® (US) · MotlerHops · à estimer », sans quantité. La valeur est fausse (K6-confirm, K7-choisi, K8-avenir).
2. **m — C70-2** : sur la fiche, la borne du curseur annonce « moins cher · 68 CHF/kg », alors que les deux articles sont à 73,80 et 80 CHF/kg (et Comparer dit ≈40) (K6, K3).
3. **B — C70-3 (C69-1 en partie)** : la phrase vapeur donne enfin un titre court. Mais la carte propose « Rattacher » à un autre carnet, et Garder à part crée une « Idée » sous « Brasserie » seul. Le thermomètre et les achats restent eux aussi sous « Brasserie » seul, et le Résolu comme le Relire affichent « Rangé : Brasserie ». La sous-catégorie de sa maquette est absente (B1, C1, F0 contre v01-saisie, v01-resolu).
4. **m — C70-4 (C69-10 en partie)** : dans l'Arbre, ses carnets sont repliés en « Autres 12 / 10 / 3 / 3 », sans sous-domaine ni nom. Sa maquette montre « Froid 2 Chambre froide · Frigo + congel » (avant-carnets, H3 contre v01-liste).
5. **m — C70-5 (C69-9 en partie)** : la tâche datée arrive bien en « tâche proposée › À faire ». Mais « avant le 12 décembre » est perdu : la tâche est rangée sans date dans Cette semaine, et « en mai » finit dans Un jour (E7, G6).
6. **m — C70-6 (C69-8 en partie)** : À faire affiche bien les coûts à droite. Les groupes sont Cette semaine · Plus loin · Un jour, alors que sa maquette donne Cette semaine · Fin du mois · Un jour (G1, G6 contre v01-afaire).
7. **m — C70-7** : sur la piste « ventilateur mural… plus en stock chez le fournisseur », l'app demande « ailleurs ? Rattacher à ZZ TEST — malt pilsner en rupture chez le fournisseur ? OK · Non ». Le rapprochement est absurde (C6-ailleurs).
8. **m — C70-8** : une commande client (« 20 bouteilles de blanche pour un mariage en mai ») est rangée sous Brasserie › Conditionnement › Commandes, en « idée ». Elle n'est pas à sa place (H2-client).
9. **m — C70-9 (C69-13 rouvert)** : sur la confirmation de Choisir, Prix et Arômes tiennent dans une colonne étroite à chasse fixe, avec des mots coupés (« pamplemous-se ») et un mot par ligne (K6).
10. **m — C70-10** : sur le Résolu, le dernier problème de « Résolus en 2026 · le dernier en vert » est coupé au bord droit de la bande (F0 contre v01-resolu).

Doutes (non comptés) :
- Un texte non envoyé du champ de la liste réapparaît en brouillon dans le champ d'un carnet (P1-1280, clé `laffinee.carnet.brouillon:`). La moitié vient de mon test.
- Retirer un article puis Annuler n'a pas été concluant : deux « Annuler » étaient affichés en même temps (le panneau du lien et le bandeau), mon toucher a pris le premier, et l'article est resté retiré sur un carnet ZZ.
- La tâche d'un problème résolu disparaît d'À faire et revient au Rouvrir.
- Le thermomètre a été créé « Noté » sans carte OK/Changer.
- La 3e piste n'a pas de jeton « piste ».
- « plus en stock » ne se voit pas sur la tuile du ventilateur.
- Le menu ··· d'une note déborde au-dessus de l'écran (« Modifier » à y = −1).

## Corrigés rejoués (en regardant)
- Vérifié — en ligne index-CdpI-ft5.js :
  - C69-2 : Supprimer une note de mon carnet ZZ la retire, aussi après rechargement (J1, J2).
  - C69-3 : 480 CHF en tête après Retenir, et « Retenu : Hotte… · 480 CHF » au Résolu (D4, F0).
  - C69-4 : un seul jeton par prix (C6).
  - C69-6 : la ligne du résolu porte « retenu : Hotte inox avec extracteur · 480 CHF » (F6).
  - C69-7 : Réalisés 6 avec 6 résolus, puis 5 et 5 au Rouvrir.
  - C69-11 : plus de ligne « vendeur » ; α sans ✓, ce qui est honnête entre 10–15 % et 13,6 % (K3).
- Également vus : les états Noté › Je cherche › Décidé › Résolu › Rouvrir, la raison sous l'option écartée, une seule bulle de veille, la question « pourquoi » (greffe v03) et le Relire (essayé, pris, pourquoi, durée). Le mémo propose de se rattacher à mon carnet ZZ au lieu de partir seul. La photo seule va dans À ranger.
- En partie :
  - C69-1 → C70-3 ;
  - C69-5 : pictos propres et prix sur les tuiles, mais pas de dispo ;
  - C69-8 → C70-6 ;
  - C69-9 → C70-5 ;
  - C69-10 → C70-4 ;
  - C69-12 → C70-1.
- Rouverts : C69-13 → C70-9 ; C67B-1 → C70-1.

## Captures
| capture | thème | largeur | état | problèmes | bloquants |
|---|---|---|---|---|---|
| avant-carnets, A0, H3 | clair | 390 | Arbre | 1 (n° 4) | 0 |
| B1, C1, C3 | clair | 390 | vapeur, carte, problème | 1 (n° 3) | 1 |
| C5, C6, D2, D4 | clair | 390 | options, veille, écart, retenue | 1 (n° 7) | 0 |
| E1, E5, E7 | clair | 390 | pourquoi, tâche datée | 1 (n° 5) | 0 |
| F0, F2, F6, F8 | clair | 390 | Résolu, Relire, résolus, Rouvrir | 2 (n° 3, 10) | 0 |
| G1, G6 | clair | 390 | À faire | 2 (n° 5, 6) | 0 |
| H1, H2, I1, I2 | clair | 390 | 3 phrases neuves, photo seule | 1 (n° 8) | 0 |
| K1, K3, K6, K7, K8 | clair | 390 | liens Citra, Comparer, Choisir, À venir | 3 (n° 1, 2, 9) | 1 |
| L2, L3 | clair | 390 | Retirer, Annuler | doute | 0 |
| J1, J2 | clair | 390 | supprimer une note ZZ, rechargement | 0 | 0 |
| P1-1280 | clair | 1280 | problème | 0 (doute brouillon) | 0 |

## Non couvert
- Le thème sombre : l'app impose `data-theme="clair"` par son réglage, et l'émulation `prefers-color-scheme` reste sans effet. Je n'ai pas changé le réglage.
- À 1280, la liste et À faire : la mise en page bureau n'a pas été atteinte par mes scripts ; une seule capture (P1, le problème).
- L'appui long dans À faire.
- Retirer puis Annuler, de façon concluante.
- L'avant/après photo du Résolu (greffe v05), faute d'une photo dans le problème.

## DEMANDE EXECUTANT
Sur un carnet neuf « ZZ TEST — c71 … », une phrase sans vapeur, sans houblon et sans aucun de ses sujets :
1. Réglages › thème « cave », puis 2 captures 390 (liste, problème), puis thème remis à « clair », et relever que `data-theme` vaut de nouveau « clair ».
2. À 1280, Stocks › Matériel › Carnets (barre latérale) : captures de la liste et d'À faire.
3. Coller 2 liens, Retirer un article, puis toucher l'« Annuler » du bandeau (aria ou texte « Article retiré »), et relever « Articles 2 ».

LEÇON PROPOSÉE : un script de geste ne choisit jamais « le premier » bouton par son texte quand l'écran peut en montrer deux (« Annuler », « Ajouter », « Choisir ») : il cible le bouton par son conteneur (bandeau, carte, champ) ; c70 a rouvert la plage de période et manqué l'Annuler du bandeau.
