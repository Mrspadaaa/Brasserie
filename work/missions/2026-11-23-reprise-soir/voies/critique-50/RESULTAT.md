OK — 9 problèmes, 1 bloquants

RESULTAT critique-50 : 9 problèmes (B 1, m 6, D 2) — corrigés rejoués 8/8 — carnet identique oui — BUGS OK

Version : index-u01CJTAh.js. Vérifiée par curl ; mon onglet neuf avait Bk3VRdwH, `maj.mjs` l'a passé à u01CJTAh avant tout relevé.
Tests : sans objet (test d'écran). Registre : `bugs.log` (BUGS OK : 2230 bugs, 519 ouverts, 202 sources).
Couvert : thème clair, 390 × 844, au toucher, Chrome de débug 9222, mon onglet seulement (page.close puis disconnect, navigateur gardé). Non couvert : 1280 et thème sombre (consigne du DOSSIER).
Coût IA : 3 rangements et 4 lectures de lien, soit environ 0,046 CHF (plafond 0,10). Journal `2026-11-23-carnet-en-ligne/ia-journal.jsonl` : 11 lignes critique-50, dont 2 corrections (rangements non partis, coût 0).

## Son carnet « Chambre froide » : avant = après (`avant.json`, `apres.json`)
| | avant = après |
|---|---|
| à dépenser | −463 (S53, dans le cadre) |
| période du Calendrier | 6 sem., 23.11.2026 – 03.01.2027 (localStorage identique à l'octet) |
| Carnets | Tous 20, Local 10, Brasserie 4, Meuble 4, Papiers 2 ; texte de la liste identique |
| Chambre froide | texte de l'écran identique ; ses 4 documents Firestore du cache identiques à l'octet (carnet : updateTime 2026-11-23T13:02:49Z inchangé) |
Seul document neuf dans le cache : le journal d'audit de la suppression de mon carnet ZZ raté (catégorie « Stocks », voir doutes).

## Joué
- Son carnet, lecture seule : liste, carnet, feuille Articles, Comparer (4 vues), les deux fiches (5 vues chacune), Quand, menu de domaine, menu « Plus », actions des articles. Rien d'enregistré, aucun « Relire » touché : la fiche et le Comparer proposent « Relire » sans rien annoncer de plus avant le toucher.
- Accident de script, sans effet sur ses données :
  - 1er essai de création : mon carnet ZZ n'est pas parti, car le champ de la liste était caché derrière son carnet ouvert.
  - 2e essai : le titre « ZZ TEST — chambre froide » a ouvert son carnet existant. L'app reconnaît le carnet qui en parle déjà. Rien n'a été écrit, et l'état après le confirme.
  - Un carnet aux titres concaténés a été créé, puis supprimé.
- ZZ TEST — cellule à 4 °C : le critère « Température à 4 °C » est tiré de la phrase. J'y ai collé les deux liens ggmgastro de son carnet. Les deux sont lus en 6 étapes sur 6, en 5 et 7 s.
- ZZ TEST — marmite de brassage 50 L (Brasserie, critère « Capacité : 50 L ») : liens brewstore 50 L et Galaxus KS240L, lus en 6 sur 6.
- Pour les deux carnets ZZ : carnet, feuille Articles, Comparer (6 vues) et fiches (4 vues). Je les ai ensuite supprimés au toucher (Plus › Supprimer le carnet).
- Rejeu sur son carnet Frigo + congel : Quand › Prix, en lecture seule. Recherche « frigorifique ».

## Corrigés rejoués (BUGS.md mis à jour) : 8 sur 8 vérifiés
- C48-1 vérifié — en ligne index-u01CJTAh.js. Sur son carnet, « Relire » apparaît à côté de « Poser le prix » sur les deux fiches, et sous les « ? » du Comparer. Sur le ZZ, les mêmes liens donnent 2 987,51 et 2 697,74 CHF, dits TTC. La page donne 2 763,65 HT et 2 987,51 TTC (F1-0, C-comparer-0, L1-fin, L2-fin).
- C48-2 vérifié — en ligne index-u01CJTAh.js. Les libellés de ligne sont entiers. Les titres sont coupés avec un trait (« fri-gorifique ») (C-comparer-0 à 2).
- C48-3 vérifié — en ligne index-u01CJTAh.js. La feuille Articles et le Comparer disent tous deux « Prix ? ». Sur le ZZ, ils disent tous deux « Température à 4 °C › Prix » (A-articles-0, C-comparer-0, Z-articles-0, Z-comparer-0).
- C48-4 vérifié — en ligne index-u01CJTAh.js. Sur son carnet, sans critère, il n'y a plus d'encadré Compromis (C-comparer-2). Avec critère, voir le problème n° 5.
- C48-5 vérifié — en ligne index-u01CJTAh.js. Le même lien, relu, donne 23 caractéristiques : Température de 0 °C et jusqu'à 8 °C, Air pulsé, 230 V, R290, Volume 4,06 m³ (Z-F1-0, Z-comparer-0). Restent les problèmes n° 3 et 4.
- C48-6 vérifié — en ligne index-u01CJTAh.js. L'en-tête « Dimensions intérieures » est entier, et les valeurs sont un terme par ligne (avant-CF-0).
- E47-5 vérifié — en ligne index-u01CJTAh.js.
  - brewstore : Matière, Volume et Induction viennent en tête.
  - KS240L : Volume, Réfrigérant, Classe E et 104 kWh viennent en tête.
  - « Couleur » n'apparaît qu'une fois, et l'adaptateur secteur a disparu (M-F1-0, M-F2-0).
- E49-1 vérifié — en ligne index-u01CJTAh.js. Les en-têtes disent « volume L », « Hauteur cm » et « Largeur de la porte mm » (M-comparer-0, C-comparer-1).
- Rejeu, regardé seulement, sans toucher aux lignes du registre (elles ne sont pas à moi) :
  - C46-1 tient : la pastille « 400 CHF · budget » est en blanc sur vert (K3-frigo-prix).
  - C46-2 tient : « frigorifique » est en gras, en mot entier, sur la ligne citée (R-frigorifique).
  - E47-1 tient : « sur commande · expédié sous 28 jours » (B-fin, M-comparer-0).
  - E47-2 tient : la colonne volume, puis Hauteur cm, reste stable (K-fin, M-comparer-0).
  - E47-3 tient : les libellés sont en français (M-F1-0).
  - E47-4 n'a pas pu être rejoué : les références ne figurent plus parmi les 16 caractéristiques du KS240L.

## Combien et quels problèmes ? 9
1. B — C50-1 — Fiche, Comparer et feuille Articles disent « non publié » alors que la valeur est lue.
   - Fiche de la cellule : « Non publié par le vendeur : température ».
   - Comparer : « Aucune valeur lue pour : température ». Pourtant, « Température de 0 °C » et « Température jusqu'à 8 °C » sont lues juste au-dessus.
   - Feuille Articles de la marmite : « volume : non publié » aux deux articles, alors que les fiches disent 242 l et 50 L. La jauge est vide (Z-F1-3, Z-comparer-5, M-articles-0).
   - Le brasseur : « Non publié ? C'est écrit 0 à 8 °C juste au-dessus ! »
2. m — C50-2 — Le tableau du carnet et la feuille Articles de la cellule montrent « Tension 230 V », la même valeur pour les deux articles, au lieu de la température (L2-fin, Z-articles-0). Probablement la même cause que le n° 1. Le brasseur : « La tension ? C'est une chambre froide. »
3. m — C50-3 — Il y a trois doublons parmi les 23 caractéristiques de ggmgastro : Refroidissement (Air pulsé), Fluide frigorigène / Type de réfrigérant (R290), Tension / Branchement électrique (230 V). La température est aussi coupée en deux lignes, au lieu de « 0 à 8 °C » (Z-F1-0, Z-comparer-0, Z-comparer-5). Le brasseur : « Trois fois la même chose. »
4. D — C50-4 — Deux chambres froides jumelles, chez le même vendeur, n'ont pas le même ordre de caractéristiques.
   - Pour la 4,06 m³, Tension vient 1re et Volume 5e.
   - Pour la 2,6 m³, Fluide vient 1er, Température 3e et Volume 7e.
   - Sur son carnet, Dimensions intérieures vient 3e sur une fiche et 6e sur l'autre (Z-F1-0, F1-0, F2-0).
5. m — C50-5 — Avec un critère, le Compromis récite le tableau.
   - Cellule : « la 1re, 2 697,74 CHF, la moins chère ». Il ne dit rien des 289,77 CHF de plus pour 4,06 m³ au lieu de 2,6.
   - Marmite : « la 1re, le volume 242 l L ; 302 CHF, la moins chère » (Z-comparer-5, M-comparer-0).
   - Le brasseur : « Ça je le vois déjà. »
6. m — C50-6 — La colonne « volume L » affiche « 242 l » et « 50 L », et le compromis dit « 242 l L », avec l'unité en double (K-fin, M-comparer-0).
7. m — C50-7 — Le résumé de la carte brewstore dit « Volume 50 L · pas : Induction · Matière… », alors que la fiche dit « Induction non » (B-fin, M-F1-0). Le brasseur : « pas : Induction, elle va sur induction ou pas ? »
8. m — C50-8 — Sur son carnet, dans la feuille Articles, l'interrupteur « Veiller » est coupé à moitié au bord droit, poussé par « Dimensions intérieures (L x P x H) ». Au tour 48, il était entier (A-articles-0).
9. D — C50-9 — Sur sa fiche sans prix, la ligne Offre est tassée depuis l'ajout de « Relire » : « en / stock » est coupé sur deux lignes, et « prix ? » reste isolé (F1-0, F2-0).

Bloquants : 1 (n° 1, valeur fausse : « non publié » est dit d'une valeur lue). Aucun geste sans effet, et aucun élément de ses choix n'a disparu. Ses données sont intactes.

### Doutes (non comptés)
- Son carnet, sans prix ni critère, dit « Classé par Prix ? » de chaque côté. C'est cohérent (R3), mais on ne sait toujours pas pourquoi la 1re est 1re.
- La pastille « Lu · Kibernetik KS240L » est restée plus de 20 min sur tous les écrans, y compris dans Frigo + congel et dans la liste (K3-frigo-prix, R-frigorifique).
- L'avis « Carnet supprimé · … Annuler » reste plus de 20 min dans la liste et dans la recherche (R-frigorifique).
- Le journal d'audit range la suppression d'un carnet dans la catégorie « Stocks ».
- La fiche brewstore indique « Vitesse de rotation 28 U/min », une unité allemande (tr/min attendu).
- Critère « Capacité : 50 L » : le frigo de 242 l est 1er parce qu'il est moins cher. C'est juste si le critère veut dire « au moins 50 L ».
- La cellule ZZ n'a pas été rangée dans un domaine (« Domaine ▾ »).
- Le prix retenu est le TTC, alors que la page professionnelle met en avant le HT. Le TTC est dit.
- 21 lignes sur 23 sont identiques dans le Comparer des chambres froides (C48-5, lignes repliées : décision (c), hors voie).

## Table (captures 390 ouvertes)
| capture | thème | largeur | état | problèmes | bloquants |
|---|---|---|---|---|---|
| avant-CF-0 | clair | 390 | son carnet ouvert | 0 | 0 |
| A-articles-0 | clair | 390 | sa feuille Articles | 1 (n° 8) | 0 |
| C-comparer-0, 1, 2 | clair | 390 | son Comparer | 0 | 0 |
| F1-0, F1-1, F1-2, F2-0 | clair | 390 | ses fiches | 2 (n° 4, 9) | 0 |
| Q-quand-0, AA-actions-0 | clair | 390 | Quand, actions | 0 | 0 |
| L1-fin, L2-fin | clair | 390 | cellule ZZ lue | 1 (n° 2) | 0 |
| Z-articles-0 | clair | 390 | Articles de la cellule | 2 (n° 1, 2) | 1 |
| Z-comparer-0, Z-comparer-5 | clair | 390 | Comparer de la cellule | 3 (n° 1, 3, 5) | 1 |
| Z-F1-3 | clair | 390 | fiche de la cellule, bas | 1 (n° 1) | 1 |
| B-fin, K-fin | clair | 390 | marmite ZZ lue | 2 (n° 6, 7) | 0 |
| M-articles-0 | clair | 390 | Articles de la marmite | 1 (n° 1) | 1 |
| M-comparer-0 | clair | 390 | Comparer de la marmite | 2 (n° 5, 6) | 0 |
| M-F1-0, M-F2-0 | clair | 390 | fiches brewstore, KS240L | 0 | 0 |
| K3-frigo-prix, R-frigorifique | clair | 390 | rejeu C46-1, C46-2 | 0 | 0 |

LEÇON PROPOSÉE : un script de test qui crée un carnet ZZ s'assure d'abord que le champ de la liste est visible, car un carnet ouvert le cache. Son titre ne doit pas recouper un carnet du brasseur : « ZZ TEST — chambre froide » a ouvert son carnet « Chambre froide ».
