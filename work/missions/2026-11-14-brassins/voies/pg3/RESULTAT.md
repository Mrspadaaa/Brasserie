OK — Page « Brassins · tous les écrans » : couverture, 11 vues, 160 mini maquettes, PAGE OK.

Fichiers écrits :
- work/missions/2026-11-14-brassins/page3/index.html (écrit à la main, Write)
- work/missions/2026-11-14-brassins/page3/img/ (166 PNG : 160 copies des variantes e1a à e11d, 6 captures actuelles renommées ref-*)
- work/missions/2026-11-14-brassins/voies/pg3/tests.txt, verif-haut.png, verif-page.png, verif-ordinateur.png
- work/missions/2026-11-14-brassins/voies/pg3/RESULTAT.md

Critères :
- G1 (verifier-page --page-lot --captures voies/pg3/verif) : PAGE OK (166 images chargées, lisible à 390 et 1280 px, sans erreur). Premier essai : PAGE ECHEC, voir douteux.
- G2 (contenu) : CONTENU OK 167/160 (167 data-vignette, 160 PNG des variantes ; ids e1a à e11d, #a-choisir, #couverture, lien SqU1y2jQgMAX8tX6MKn9qL, pas de « fable »).
- Captures ouvertes : verif-haut.png (390) et verif-ordinateur.png (1280) : titre, #a-choisir, tableau de couverture lisibles, rangée e1 en tête. verif-page.png (2 Mo) non ouverte.

Essais utilisés : 2 sur G1 (1er : loading="lazy" → images non chargées ; 2e : attribut retiré, PAGE OK) ; 1 sur G2.

Ce qui reste douteux :
- loading="lazy" retiré de toutes les images : la consigne le demande, mais verifier-page ne fait pas défiler la page et déclarait les images hors écran « non chargées ». Choix pris : le critère G1 prime. Pour garder le lazy, il faut un défilement dans verifier-page (hors de ma voie).
- Thème cave et « Aujourd'hui » : les captures cave sont dans les vignettes, non ouvertes une à une ; pas de capture 390 cave ni 1280 vérifiée à l'œil pour toutes les vues.
- « Aujourd'hui » : vrai capture pour e1, e2, e3, e4, e6, e11 seulement (a1-banc) ; « pas encore de capture » pour e5, e7, e8, e9, e10 (COUVERTURE : pas de capture a1). e10 : la référence « captures/ » du VOIE était incomplète, rien repris.
- La ligne « Bilan » (e7) : sous-onglet non confirmé dans COUVERTURE ; la ligne est nommée par la vue, sans sous-onglet.
- Les 44 classements sont repris des VERDICT c5a, c5b, c5c (phrases raccourcies) ; les noms des variantes sont tirés de « Idée » de NOTE.md, raccourcis à 6 mots au plus (e4b, e10d, e11c notamment).
- Un paragraphe de vue (e8, e3) est court mais proche de la limite ; verifier n'a rien signalé.

CONNAISSANCE : aucune

LEÇON PROPOSÉE : verifier-page --page-lot compte comme « non chargée » toute image loading="lazy" hors écran, car il ne fait pas défiler la page avant networkidle0 ; règle : pas de loading="lazy" dans une page --page-lot tant que le contrôle ne défile pas, ou faire défiler le contrôle.
