OK — 6 problèmes, 0 bloquants

RESULTAT critique-48 : 6 problèmes (B 0, m 3, D 3) — carnet identique oui — BUGS OK

Version : index-DJIfW4-y.js (vérifiée par curl). Mon onglet avait BxvQ1J-z ; `maj.mjs` l'a passé à DJIfW4-y avant le relevé « avant », que j'ai refait ensuite.
Tests : sans objet (test d'écran). Registre : `bugs.log` (BUGS OK : 2220 bugs, 522 ouverts, 202 sources).
Couvert : thème clair, 390 × 844, au toucher, Chrome de débug 9222, mon onglet seulement (page.close puis disconnect, navigateur gardé). Non couvert : sombre et 1280 (le DOSSIER ne les demande pas).
Coût IA : 0. Aucun lien relu, aucun geste qui enregistre.

## Avant et après (`avant.json`, `apres.json` : 10 champs, 0 différence)
| | avant = après |
|---|---|
| à dépenser | −463 (S53, dans le cadre) |
| période du Calendrier | 6 sem., du 23.11.2026 au 03.01.2027 (localStorage identique à l'octet) |
| Carnets | Tous 20, Local 10, Brasserie 4, Meuble 4, Papiers 2 ; texte de la liste identique |
| Chambre froide (texte de l'écran) | titre, Brasserie, « 2 articles à comparer », 2 articles, Quand « pas encore daté » |
| Chambre froide (document Firestore du cache) | identique à l'octet, updateTime 2026-11-23T13:02:49Z inchangé. Contenu : critères 0, notes 0, photos 0, façons 0, aucun prix, aucun choix, aucun plan ; 2 articles ggmgastro.com « lue », 12 caractéristiques chacun |

## Joué (lecture seulement)
- Liste : puces Brasserie, Local et Tous. Loupe : « frigorifique », « froide », « ggmgastro », « 4,06 », « RAL ».
- Carnet : feuille Articles ouverte puis fermée ; Comparer en entier (4 vues) ; les deux fiches (4 vues chacune) ; Quand ouvert ; menu de domaine ouvert puis fermé sans choix ; menu ••• du carnet (Renommer, Supprimer le carnet) ouvert puis fermé ; actions des articles (Déplacer, Retirer) affichées, sans toucher.
- Non touché, avec ce que l'écran annonce : Choisir (« Part dans À venir : 1800 x 1500 mm… avec le pourquoi ») ; Poser le prix ; Veille du prix tous les 3 jours (interrupteur coupé) ; Au calendrier ; Renommer ; un autre domaine ; Déplacer et Retirer.
- Pages sources ouvertes dans mon onglet et comparées (S1-haut, S1-spec, S2-haut, ld+json).
  - Titre « Chambre froide - 1800 x 1500 mm - 4,06 m³ - groupe frigorifique inclus », 2 763,65 CHF hors TVA (2 987,51 TTC), « En stock ! 2 - 4 jours ».
  - Second article : 2 495,60 CHF.
  - Les 12 caractéristiques de l'app sont sur la page, valeurs justes : « 1.845 mm » est bien rendu « 1845 mm ». La photo est la première image de la page. Rien d'inventé.
- C46-1 : rejoué sur son carnet Frigo + congel, Quand › Prix, en lecture seule.

## Corrigés rejoués (BUGS.md mis à jour)
- C46-1 vérifié — en ligne index-DJIfW4-y.js. Pastille pressée « 400 CHF · budget » : « · budget » en blanc sur vert (rgb 255 sur 76,107,42), lisible comme le montant (K3-frigo-prix).
- C46-2 vérifié — en ligne index-DJIfW4-y.js. « frigorifique » : la ligne citée tient entière sur deux lignes, « article : 1800 x 1500 mm - 4,06 m³ - groupe **frigorifique** inclus » (R-frigorifique).
- C46-3, C46-4 et C46-6 non rejoués, avec la note au registre. Son vrai carnet n'a aucun article choisi, et ni Choisir, ni Au calendrier, ni une lecture de lien ne sont permis. Les fiches lues le 21.11 n'affichent pas d'étapes (« lues sur la fiche du vendeur, 21 nov. »). À revoir sur un ZZ TEST.

## Combien et quels problèmes ? 6
1. m — C48-1 — Les deux chambres froides sont sans prix : « prix ? », « Poser le prix », Comparer « Classé par Prix ? » avec « ? » aux deux colonnes, compromis « prix non lu ». La page affiche en gros 2 763,65 et 2 495,60 CHF. Ce n'est pas un montant faux, mais la donnée qui décide manque (lecture du 21.11) et l'app ne propose pas de relire (F1-0, C-comparer-0, S1-haut). Le brasseur : « Le site met le prix en gros et l'app me dit prix ? ».
2. m — C48-2 — Comparer : les libellés de ligne sont coupés au milieu du mot, sans trait : « Dimension / s intérieures », « Performan / ce », « équipemen / t », « fonctionne / ment » (C-comparer-0, C-comparer-1).
3. m — C48-3 — Deux classements contradictoires. La feuille Articles dit « Classés par ce qui compte : Dimensions intérieures », le Comparer dit « Classé par Prix ? » alors qu'aucun prix n'est connu. On ne sait pas pourquoi la 1re est 1re (A-articles-0, C-comparer-0).
4. D — C48-4 — L'encadré « Compromis » récite le tableau (« les dimensions intérieures 1640 x 1340 x 1850 mm contre 1340 x 1040 x 1850 mm… ») et ne dit aucun compromis (C-comparer-2).
5. D — C48-5 — Choix des caractéristiques, rejoint E47-5 :
   - gardées : Couleur RAL 9002, densité d'isolation, épaisseur de tôle ;
   - absentes : « Température de 0 °C à 8 °C », « Air pulsé », « 230V », « R290 » ;
   - le volume (4,06 contre 2,6 m³) n'est pas une ligne, et 10 lignes sur 12 sont identiques (F1-1, C-comparer-1).
   - Le brasseur : « Une chambre froide, je veux la température et le volume, pas la couleur. »
6. D — C48-6 — Tableau du carnet : l'en-tête « Dimensio. » est coupé, et les valeurs en chasse fixe passent sur deux lignes (« 1640 x 1340 / x 1850 mm ») (avant-CF-0).

Bloquants : 0. Aucun geste sans effet, aucune valeur fausse, aucun élément de ses choix absent : domaine Brasserie juste, puces avec leur nombre, recherche au mot entier, Quand replié. Ses données sont intactes.

### Doutes (non comptés)
- Le nom de l'article perd « Chambre froide - », redondant dans ce carnet. Mais « Part dans À venir : 1800 x 1500 mm - 4,06 m³… » ne dit plus ce que c'est, si la ligne d'À venir n'est pas sous le titre du carnet.
- Prix hors ou avec TVA : la page met en avant 2 763,65 CHF hors TVA et donne 2 987,51 CHF TTC. Une lecture future devra dire lequel.
- Quand de la Chambre froide : pas de rangée « Prix estimé ? », contrairement à Frigo + congel. « Au calendrier » poserait-il un achat sans montant ? Non joué (geste qui enregistre).
- La recherche ne trouve ni « ggmgastro » (domaine de l'article) ni « RAL » (caractéristique). Cela reste conforme à Q-2 C : titres, faits, articles et notes.
- « densité d'isolation » en minuscule : c'est le libellé de la page.

## Table (captures 390 ouvertes)
| capture | thème | largeur | état | problèmes | bloquants |
|---|---|---|---|---|---|
| avant-carnets, P-Brasserie | clair | 390 | liste, puce Brasserie | 0 | 0 |
| avant-CF-0 | clair | 390 | carnet ouvert | 1 (C48-6) | 0 |
| A-articles-0 | clair | 390 | feuille Articles | 1 (C48-3) | 0 |
| C-comparer-0, -1, -2 | clair | 390 | Comparer | 4 (C48-1 à 5) | 0 |
| F1-0, F1-1, F2-0 | clair | 390 | fiches article | 2 (C48-1, C48-5) | 0 |
| Q-quand-0 | clair | 390 | Quand ouvert | 0 | 0 |
| D-domaine-0, AA-actions-0 | clair | 390 | menu de domaine, actions des articles | 0 | 0 |
| R-frigorifique | clair | 390 | recherche | 0 (C46-2 vérifié) | 0 |
| K3-frigo-prix | clair | 390 | Frigo + congel, Quand › Prix | 0 (C46-1 vérifié) | 0 |
| S1-haut | clair | 390 | page source ggmgastro | — | — |

LEÇON PROPOSÉE : aucune
