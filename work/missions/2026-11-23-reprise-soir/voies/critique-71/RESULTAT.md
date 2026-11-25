# RESULTAT critique-71 : 8 problèmes (B 1, m 7, D 0) — corrigés rejoués 9/10 (tenus 6, en partie 3, non rejoué 1) — carnet identique oui — BUGS OK

Paquet en ligne : index-Cwy7X3NS.js (curl ?nocache, 25.11 ; vérifié dans avant.json et apres.json). Le DOSSIER prime sur VOIE.md (index-SSQ_J86L.js).
Tests : sans objet (test d'écran). Registre : `bugs.log` → BUGS OK : 2374 bugs, 564 ouverts, 202 sources.
Coût IA : 13 appels aiTask (10 rangements, 3 lectures de liens). Estimé à 13 × 0,0094 ≈ 0,12 CHF : **le plafond de 0,10 CHF est probablement dépassé** d'environ 0,02 CHF, à cause des 3 appels de lecture des liens Citra, que je n'avais pas prévus. Les 13 lignes sont au journal ia-journal.jsonl. Je n'ai fait aucun appel ensuite (photo seule et thème sombre sautés).

## Ses données : identiques
J'ai comparé avant (avant.json) et après (apres.json), champ par champ ; tout est IDENTIQUE :
- Synthèse 0,00 / 265,40 ; caisse 1 145,00 ; départ 1 145,00 ; Opérations 265,40 / 0,00 / 265,40 ; Mon mois et HABITUELS ;
- −463 CHF à dépenser ; cadre 23 nov. 2026 – 3 janv. 2027 ; 6 sem. ; les 16 barres de la frise ;
- À venir 11, Carnets 32, Réalisés 5 ; l'arbre déplié ; Chambre froide (texte et 3 documents) ; Houblons citra.

Firestore : sur 3 460 documents hors ZZ, 0 changé et 0 manquant. Les 22 entrées neuves sont 1 journal d'audit et des tombes sans document (9 carnets, 11 messages, 1 plan). Le guet n'a vu aucune écriture pendant les relevés.

Aucune phrase n'a visé un de ses carnets. L'app a proposé « Déplacer vers / Rattacher à Houblons citra ? » sur mon carnet ZZ : je n'y ai pas touché.

Ménage : mes 7 carnets ont été supprimés (« Carnet supprimé » vu à chaque fois) : vapeur, condensation, réfractomètre, détartrage, Bière de Noël avec son plan, pH-mètre, TVA. Après coup, À venir est revenu à 11 et la liste est identique.

## Combien et quels problèmes ? 8
1. **B — C71-1 (C70-6 et C70-5 en partie)** : À faire a bien les trois groupes de la maquette, mais « Plus loin » a été versé dans « Fin du mois ». Résultat : « Installation électrique 27A (2027) », « Embouteillage (2027) », « 2ème évier (2027) » et la tâche « avant le 12 décembre » (sem. du 7 déc.) se retrouvent sous « Fin du mois ». « Frigo + congel », daté mai 2027 dans À venir, est sous « Cette semaine ». Ce sont des valeurs fausses sur ses achats (G1-afaire, P3-1280-afaire, K8b-avenir-citra).
2. **m — C71-2** : le condenseur est déjà retenu, et l'app propose encore « à retenir ? Retenir Condenseur de buées à eau froide ? OK · Non » (E7b-tache).
3. **m — C71-3** : la question « Pourquoi Condenseur… plutôt que Ventilateur… ? Tes notes ne le disent pas » s'affiche juste sous la raison écrite à l'écart (« bruyant et il ne sort pas la buée du plafond »). Au Relire, on lit « pourquoi : tes notes ne le disent pas » et « essayé : ventilateur » sans « non ». La maquette v01-relecture fait autrement (D4-retenu, F0-resolu, F2-relire).
4. **m — C71-4 (C70-4 en partie)** : dans l'Arbre, Brasserie se nomme enfin par parties (Brassage, Conditionnement, Fermentation, avec les noms). Mais Local « Autres 10 », Meuble « Autres 3 », Papiers « Autres 3 » et Brasserie « Autres 1 » restent muets (avant-carnets, P1-1280-liste, contre v01-liste).
5. **m — C71-5** : le problème voisin de la vapeur reçoit le titre « … la condensation de l'ébullition fait goutter », c'est-à-dire la phrase coupée au verbe, pas un titre court (H2-carte).
6. **m — C71-6** : avant OK, le bandeau du haut dit « Carnet créé · « phrase entière » · titre tiré de votre phrase », alors que la carte propose le titre court. Il y a deux titres à l'écran (H1, H3, H6).
7. **m — C71-7** : la piste « condenseur de buées » porte un picto de frigo, sur la tuile, au fil et à 1280 (C3-piste, D4-retenu, P2-1280-probleme).
8. **m — C71-8** : après « Choisir · MotlerHops, 1 kg » (≈40 CHF), la carte de l'article sous « Choisi » dit encore « 50 g · ≈4 CHF » (L2-retire).

Doutes (non comptés) :
- Quand la carte de saisie propose « Rattacher », elle n'offre pas « Changer ». Son champ « Ajouter à trop de vapeur… » vise déjà le carnet proposé avant tout choix (B1-carte).
- Les chiffres sont en chasse fixe (compteurs, « 450 CHF », Alpha, Origine), là où la maquette les met en proportionnel.
- La ligne « votre phrase : « … » » sous les tuiles n'est pas dans la maquette v01-vapeur.
- La carte de l'achat du pH-mètre ne reprend pas le prix dit (« environ 90 CHF »). Le carnet est créé avant OK.
- Le bandeau dit « Condenseur… retenue » (accord).
- L'extrait sous un problème de l'Arbre cite le début de la phrase, ici mon préfixe « ZZ TEST — c71… ». C'est un artefact du test.
- À venir affiche « 40 CHF » sans « ≈ » pour un prix converti.

## Rangement sur l'IA réelle : 5/6 juste
Les 6 phrases sont neuves ; aucune ne parle de vapeur ni de houblon, et aucune ne vise un de ses carnets.

| phrase | genre | chemin | titre | Garder à part / OK |
|---|---|---|---|---|
| réfractomètre +2 °Brix (matériel) | nouveau problème · Noté | Brasserie › Brassage › Mesure | « Écart réfractomètre et densimètre » | OK → problème |
| condensation qui goutte (recoupe mon ZZ vapeur) | nouveau problème · Je cherche | Brasserie › Brassage › Vapeur | phrase coupée (C71-5) | « Rattacher à c71 vapeur ? » → Garder à part → problème au chemin complet |
| détartré l'échangeur (mémo fait) | nouveau carnet · mémo | Brasserie › Brassage › Nettoyage | « Détartrage échangeur à plaques » | OK |
| bière de Noël à l'orange (idée) | nouveau carnet · idée | Brasserie › Brassage › Recettes | « Bière de Noël à l'orange » | OK |
| pH-mètre ≈90 CHF (achat) | nouveau carnet · achat | Brasserie › Brassage › Mesure | « pH-mètre de poche » | carte vue, réponse lente (> 9 s) |
| facture bouteilles pour la TVA (papier) | nouveau carnet · mémo + tâche | Papiers › Comptabilité › TVA | « Décompte TVA trimestre » | OK |

## Corrigés rejoués (en regardant)
Vérifiés, en ligne sur index-Cwy7X3NS.js :
- **C70-1** : Comparer « pour 1 kg » mène à « Choisir · MotlerHops, 1 kg ». La confirmation affiche « 1 kg · ≈40 CHF » et « Part dans À venir : ≈40 CHF ». À venir affiche « CITRA® (US) · MotlerHops · 1 kg · 40 CHF » (K6, K7, K8b).
- **C70-2** : les bornes du curseur sont « moins cher · 40 CHF/kg » et « 80 CHF/kg », les prix montrés (K6).
- **C70-3** : la carte affiche « nouveau problème · Je cherche · Brasserie › Brassage › Vapeur » et propose de rattacher en dessous. Garder à part crée bien un problème, et le Résolu comme le Relire affichent « Rangé : Brasserie › Brassage › Vapeur » (B1, C1, F0, F2).
- **C70-7** : la piste ventilateur « plus en stock chez le fournisseur » ne déclenche plus de bulle « ailleurs ? » (C6).
- **C70-9** : les Arômes sont lisibles, sans chasse fixe ni mot coupé (K6).
- **C70-10** : le dernier résolu, en vert, est visible dans la bande (F0).

Également vus :
- les états Noté › Je cherche › Décidé › Résolu › Rouvrir, avec Réalisés qui passe de 5 à 6 puis revient à 5 ;
- la veille (bulle « veille demandée ») et l'option écartée avec sa raison ;
- la retenue, avec 450 CHF en tête ;
- le Relire, avec la question « Toujours le bon choix ? » ;
- Retirer un article puis Annuler, en touchant l'Annuler du bandeau ciblé par son conteneur : on repasse de « Articles 1 » à « Articles 2 » (L2, L3) ;
- à 1280 : la liste, le problème et À faire.

En partie :
- C70-4 → C71-4 ;
- C70-5 : la date est gardée (« sem. du 7 déc. » dans l'Arbre), mais la tâche est rangée sous « Fin du mois » → C71-1 ;
- C70-6 → C71-1.

Non rejoué : C70-8 (commande client). Le budget IA était déjà au plafond.

## Captures
| capture | thème | largeur | état | problèmes | bloquants |
|---|---|---|---|---|---|
| avant-carnets, C1-apres-garder | clair | 390 | Arbre | 1 (n° 4) | 0 |
| B1-carte | clair | 390 | saisie vapeur, carte | 0 (doute) | 0 |
| C3-piste, C6-ailleurs, D2, D3, D3b, D4-retenu | clair | 390 | pistes, veille, écart, retenue | 2 (n° 3, 7) | 0 |
| E7-tache, E7b-tache, E8 | clair | 390 | tâche datée, propositions | 1 (n° 2) | 0 |
| F0-resolu, F2-relire, F8-rouvrir | clair | 390 | Résolu, Relire, Rouvrir | 1 (n° 3) | 0 |
| G1-afaire | clair | 390 | À faire | 1 (n° 1) | 1 |
| H1 à H6 (carte, après) | clair | 390 | 6 phrases neuves | 2 (n° 5, 6) | 0 |
| K1, K3, K4, K6, K7, K8, K8b | clair | 390 | liens Citra, Comparer, Choisir, À venir | 0 | 0 |
| L1, L2-retire, L3-annule | clair | 390 | Retirer, Annuler | 1 (n° 8) | 0 |
| P1-1280-liste, P2-1280-probleme, P3-1280-afaire | clair | 1280 | liste, problème, À faire | 3 (n° 1, 4, 7) | 1 |

## Non couvert
- Le thème sombre (Réglages › « cave ») : je l'ai sauté faute de tours, pour garder le ménage et le relevé après.
- La photo seule (À ranger) : je l'ai sautée pour ne pas ajouter d'appel IA.
- C70-8 (commande client).
- L'avant/après photo du Résolu (greffe v05), faute de photo dans le problème.

LEÇON PROPOSÉE : avant une voie à plafond IA, compter dans le budget les appels induits par un geste, et pas seulement les phrases. Coller deux liens a coûté ici 3 appels aiTask (lecture), ce qui a fait passer le test au-dessus de 0,10 CHF.
