OK — 3 problèmes, 0 bloquants

# Test d'écran — Finances, mineurs FN-22 à FN-26 et « Prix d’1 ingrédient » (voie w1)

Version : 989237c6 (arbre propre au départ). Banc local `?dev-local&finance-demo`, port 3000 (répond 200). Script de capture
(scratchpad de la session, d'après `voies/w1/sonde.mjs` et `voies/v1/capturer.mjs`) : points fn22, fn23 (+ 22 avant/après), fn24,
fn25-26, de4, chacun dans les quatre configurations (390 tactile et 1280, clair et sombre `cave`), profil Chrome neuf par
configuration, aucune erreur de page. Donnée « ZZ TEST — Prévision » 7,00, écrite dans le seul navigateur de test. 34 captures
ici ; 10 ouvertes en plein format (le tableau), les autres couvertes par le journal (légende, titre de fiche, cartes et limites
identiques mot pour mot dans les quatre configurations).

| capture | thème | largeur | état | problèmes | bloquants |
|---|---|---|---|---|---|
| fn22-filtres-390-clair.png | clair | 390 | Opérations › Filtres ouvert : « Courantes / Tout », « Sans filtre 7 », « toutes les dates » + À payer… | 1 | 0 |
| fn22-filtres-1280-clair.png | clair | 1280 | même panneau à 1280 | 1 | 0 |
| fn23-legende-390-clair.png | clair | 390 | Prévoir une dépense « ZZ TEST — Prévision » 7,00 : légende « avec ZZ TEST — Prévision — sans » | 0 | 0 |
| fn23-legende-390-cave.png | sombre | 390 | même feuille en sombre | 0 | 0 |
| 22-apres-390-clair.png | clair | 390 | Prévisions après Enregistrer : 7 sorties, Avec 2 100,34 (2 107,34 avant), Prévu ~ 807,00 | 1 | 0 |
| fn24-cartes-390-clair.png | clair | 390 | Prévisions : cartes « Avec / Sans Fermenteur supplémentaire » entières (4 lignes) | 1 | 0 |
| fn24-cartes-1280-cave.png | sombre | 1280 | mêmes cartes sur une ligne chacune | 1 | 0 |
| fn26-fiche-390-clair.png | clair | 390 | fiche du projet : « Fermenteur supplémentaire, / 750,00 CHF », Limites (3) | 1 | 0 |
| fn26-fiche-1280-cave.png | sombre | 1280 | même fiche en bulle : « 750,00 CHF » ensemble sur la 2e ligne, « CHF » jamais seul | 1 | 0 |
| de4-budget-390-cave.png | sombre | 390 | Budget d'un brassin › Pale Ale de septembre : 7,51 CHF/L, aucun prix manquant | 0 | 0 |

Bloquants : 0

## Vu juste (journal, les quatre configurations identiques)

- FN-22 : « Toutes » a disparu ; « Sans filtre 7 » se distingue de « Tout » et de « toutes les dates ».
- FN-23 : légende « avec ZZ TEST — Prévision », casse conservée.
- FN-24 : cartes « Avec Fermenteur supplémentaire » / « Sans Fermenteur supplémentaire » entières, `title` porté.
- FN-26 : « 750,00 CHF » insécable ; à 1280 le retour se fait après la virgule, « CHF » jamais seul.
- FN-25 : la limite dit son horizon : « d’ici fin nov. 2027 (soldes de fin de mois, 13 mois) ; au-delà de la vue affichée (jusqu’au 13 févr.) ».
- Prévision enregistrée : 6 → 7 sorties, Avec 2 107,34 → 2 100,34, Prévu ~ 800,00 → 807,00 (−7,00 juste).

## Problèmes

1. **Nom du projet encore coupé dans le graphique** (fn24-cartes-390-clair, fn24-cartes-1280-cave, 22-apres-390-clair, et sous la
   fiche) : « sans Fermenteur supplé… 2 857,34 » et la bulle « Fermenteur su… −750, 01.01 », même à 1280 où la place ne manque pas.
   Les cartes sont réparées, le dessin non. En brasseur : « au-dessus c'est entier, dans le graphique c'est encore coupé ».
2. **Filtres : « Sans filtre » seul sur sa ligne, séparé de ses voisins par « toutes les dates »** (fn22-filtres-390-clair,
   fn22-filtres-1280-clair) : « Sans filtre 7 » est la puce « aucun état » du même groupe que À payer, En retard, À encaisser…, mais
   elle est isolée au-dessus, et « toutes les dates » en texte nu s'intercale devant « À payer ». On lit trois groupes là où il y en a
   deux. En brasseur : « Sans filtre de quoi ? et toutes les dates, c'est un bouton ? ».
3. **Fiche du projet : deux réponses à « je passe sous zéro ? »** (fn26-fiche-390-clair, fn26-fiche-1280-cave) : en gros
   « Tu restes au-dessus de zéro » et « Plus bas 2 107,34 le 25.01 », puis en Limites « aucun mois ne tient le seuil de 0,00 CHF
   d’ici fin nov. 2027 ». L'horizon est désormais écrit (FN-25 corrigé à la lettre), mais la grosse phrase n'a pas d'horizon et
   « aucun mois ne tient le seuil » se lit « tous les mois sont sous zéro », ce que les chiffres du dessus démentent. En brasseur :
   « alors je tiens jusqu'en février et je plonge après ? dis-le simplement ». Attendu : « Tu restes au-dessus de zéro jusqu'au
   13 févr. », et la limite en clair (« sous zéro avant fin nov. 2027 »). Non bloquant : aucune valeur n'est fausse.

## Doutes (non comptés)

- « Rien de prévu » : le banc `finance-demo` a déjà des prévisions, la ligne n'existe ni avant ni après (journal : absent dans les
  quatre configurations). Le constat 22 n'est donc couvert que par le test `w1Mineurs` (vrai chemin `savePlan`), pas par l'écran.
- « Prix d’1 ingrédient » : le seul brassin du banc (Pale Ale de septembre) n'a aucun prix manquant ; le libellé n'apparaît pas
  (de4-budget-*). Couvert par `u2Pures` seulement.
- Budget de la Pale Ale de démonstration : « aucun houblon ni levure : le litre ne les compte pas » (de4-budget-390-cave) : une Pale Ale
  sans houblon ni levure n'existe pas chez un brasseur ; l'écran le dit honnêtement, c'est la fixture qui est pauvre.
- Prévisions dit « Limites (1) », la fiche du projet « Limites (3) » : portées différentes probablement, mais sans le dire.
- Cartes Avec/Sans à 390 : le nom entier pousse « au-dessus de / zéro » sur deux lignes ; carte de 4 lignes (voulu par FN-24).
- À 1280 sombre, la pastille « Compagnon hors connexion · mode local » touche la ligne « Entrées : aucune · 6 sorties · Limites (1) »
  (fn24-cartes-1280-cave) : mode local du banc.

## DEMANDE EXECUTANT

Deux états non atteignables sur le banc actuel (captures manquantes, à faire sur fixture simulée, sans données réelles) :
1. `22-vide` : `?dev-local&finance-demo` avec un jeu sans aucune prévision (onglet Prévisions : ligne « Rien de prévu ») ; ajouter
   « ZZ TEST — Prévision » 7,00 puis Enregistrer ; captures `22-vide-avant-390-clair.png` et `22-vide-apres-390-clair.png` (la ligne
   doit avoir disparu). Ouvrir les deux.
2. `de4-un` : un brassin avec une recette dont un seul ingrédient n'a pas de prix (ex. acide lactique) ; Prévisions › « n sorties » ›
   Budget d’un brassin › ce brassin ; attendu « Prix d’1 ingrédient : acide lactique » ; captures `de4-un-390-clair.png` et
   `de4-un-390-cave.png`. Ouvrir les deux.

Pilote : vu (16.11 : 22-apres-390-cave ouverte, plus de « Rien de prévu », 7 sorties ; 3 mineurs versés à BUGS.md FN-27 à FN-29)
