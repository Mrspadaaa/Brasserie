# Vision m390 — carnet porté (18.11)

Banc : `C:/Users/mrspa/.codex/worktrees/openai-clean-start/port-carnet`, HEAD `b3bb2d0`. `dist` plus vieux que le commit de 6 s : `npm run build` relancé, EXIT 0, drapeaux OK.
Serveur : `vite` dev sur `http://127.0.0.1:5187/?preview=carnets` (le banc n'existe que sous `import.meta.env.DEV` ; `vite preview` ne le sert pas). Chrome headless, 390×844, deviceScaleFactor 2, isMobile, hasTouch. Thèmes : clair (sans `data-theme`) et sombre (`&theme=sombre`, `data-theme=cave`). Fixture « ZZ TEST — … », IA simulée, aucune écriture réelle.
Gestes joués au tactile (`ElementHandle.tap`) ; champ saisi au clavier (`keyboard.type`), envoi par Entrée ou bouton. Captures : `vision-6/m390-<thème>-<nn>-<état>.png`, 51 par thème, 102 au total. Script et résultats : `C:/Users/mrspa/AppData/Local/Temp/claude/2574149e6fd34767/16fc09ec-4e69-48a9-9744-5912b6ef6552/scratchpad/resultats-fusion.json`.

Lecture : « texte » = jugé sur le texte visible de la page (innerText), « image » = capture ouverte. Dix captures distinctes ouvertes (clair-04, -09, -11, -23, -27, -29, -36, -41, -44 ; sombre-09, -13). Les captures clair-04, -09, -27, -36, -44 et sombre-09 ont été refaites après correction du défilement (défilement remis en haut) ; celles ouvertes avant correction sont signalées.

## États (n° → fichier clair → ce qui se voit → agit)

1. Liste au repos (R01) → m390-clair-01-liste-repos.png → « À comparer 1 », Idée, Choisi, En veille, pastille « Dans À venir » (texte) → agit : non (repos).
2. Liste vide (R02) → m390-clair-02-liste-vide.png → texte sans « ↓ » ; image non ouverte → agit : non (repos).
3. Créer · avant (R09) → m390-clair-03-creer-avant.png → champ « Une idée, un besoin… » focalisé (texte) → agit : oui au focus, rien d'autre.
4. Créer · pendant, carnet proche (R10) → m390-clair-04-creer-pendant-proche.png → NON CAPTURÉ PENDANT : le carnet est déjà rangé à 150 ms (« ✓ Carnet créé », image) ; pas de « ↓ va atterrir ici » visible → agit : oui.
5. Créer · pendant, aucun proche → m390-clair-05-creer-pendant-aucun-proche.png → déjà rangé (texte) → agit : oui.
6. Créer · pendant, « Ce qui compte » → m390-clair-06-…png → « Ce qui compte · rien encore : l'IA le proposera » (texte) → agit : oui.
7. Créer · après (R11) → m390-clair-07-creer-apres.png → « ✓ Carnet créé, en tête des Carnets · Annuler », phrase en titre ; le critère n'est plus la phrase entière (texte, image clair-04) ; « Ensuite : l'IA cherche les façons » reste affiché alors que rien ne cherche (image) → agit : oui.
8. Créer · après puis Annuler → m390-clair-08-creer-apres-annuler.png → texte revenu à l'état de la liste 1 → agit : oui (Annuler rétablit).
9. Carnet ouvert (R03) → m390-clair-09-carnet-ouvert.png (image après correction) → en-tête, « 2 façons à comparer · attendre l'avis du ferblantier », « Critère : tient 80 °C, puis le débit · proposé par l'IA · +1 sans valeur » sur une ligne, Articles, « Comparer côte à côte », champ « Ajouter à Ventilation… » en bas. Pas de rangée « Ajouter à… : quoi ? » (image) → agit : oui.
10. Ajouter · avant, bulle G8 → m390-clair-10-ajouter-avant-bulle-g8.png → bulle « peut trancher » présente au focus (texte) → agit : oui au focus.
11. Texte · pendant, « va atterrir ici » (Évier) → m390-clair-11-texte-pendant-atterrir-evier.png → cadre « ↓ va atterrir ici · tiré de votre phrase », « Ce qui compte : fond de bac 38 cm minimum », G9 « les articles seront rangés sur le fond de bac, 38 cm au moins », puces « Va dans » avec « Ce qui compte » choisi (image). Le champ porte la phrase, « Ajouter » vert → agit : oui.
12. Texte · pendant, doublon (G11) → m390-clair-12-texte-pendant-doublon.png → « Garder à part » absent du texte (écart) → agit : oui ; à vérifier à l'image.
13. Texte · après (Évier) → m390-clair-13-texte-apres-evier.png (sombre : m390-sombre-13-…) → « ✓ Rangé ici, à l'instant · Annuler », « Fond de bac 38 cm minimum · de votre phrase », « assez profond pour un fût · proposé par l'IA » ; aucun « 30 L » (texte ; image sombre). Doublon de critère visible (« Critère : 2 bacs… puis … puis Fond de bac… ») → agit : oui.
14. Texte depuis la liste, saisi sans envoi → m390-clair-14-…png → pas de ligne éclairée vérifiée → agit : oui (saisie).
15. Lien · avant (« Coller : ») → m390-clair-15-lien-avant-puce.png → « Coller : » présent (texte) ; image non ouverte → agit : oui.
16. Lien · pendant, lecture → m390-clair-16-lien-pendant-lecture.png → « lecture de la page » présent (texte) → agit : oui.
17. Lien · pendant, depuis la liste → m390-clair-17-…png → même texte (texte) → agit : oui.
18. Lien · après, carte complète (hotte) → m390-clair-18-lien-apres-carte-hotte.png → « tient 80 °C » présent (texte) ; carte et veille non vues à l'image → agit : oui.
19. Lien · après, 2e lien (tableau) → m390-clair-19-…png → rangé (texte : pas de contrôle) → agit : oui.
20. Lien · après, depuis la liste (Évier) → m390-clair-20-lien-apres-liste-evier.png → « Rangé dans » présent (texte) → agit : oui.
21. Lien illisible → m390-clair-21-lien-illisible.png → « page non lue » présent (texte) → agit : oui.
22. Note en vrac · pendant → m390-clair-22-note-vrac-pendant.png → « découpe » absent (texte) → agit : oui.
23. Note en vrac · après → m390-clair-23-note-vrac-apres.png → IMAGE : une seule idée « Pour le bac » avec toute la note en citation, « Ce qui compte · Tient 80 °C » (critère de la hotte, faux pour un bac), pas de « 3 lignes rangées dans 2 carnets », pas de « › Texte d'origine », pas de découpe. Critique 7 non corrigée → agit : oui.
24. Notes ref/ collées → NON JOUÉ.
25. Cartes d'article, défilé → m390-clair-25-cartes-article.png → non ouvert (texte) → agit : non (défilement).
26. Article ouvert → m390-clair-26-article-ouvert.png → « tient 80 °C » présent ; « 1450 CHF » absent, « 1 450 » rendu (texte) ; image non ouverte → agit : oui.
27. Comparer, 2 articles, écartés → m390-clair-27-comparer-ecartes.png (image après correction) → tableau « rang · article | m³/h | CHF » avec rang 1 et 2, « Le critère sépare les deux façons : seule la hotte tient 80 °C · Retenir la hotte ». Pas de ligne « rangé par : … » (texte, image) → écart R26 ; agit : non (état).
28. Choisir, pourquoi → NON ATTEINT : « Choisir » absent de la vue Comparer (tap sans effet) → agit : non.
29. Choix revu (ADR) → m390-clair-29-choix-revu.png → « Choisi le 10 oct. », « Choisi : Chambre froide en kit 2 m³ · Pourquoi », « Dans À venir depuis le 16 nov. » (image). « Choix d'avant » non visible en haut de carnet (texte) → partiel ; agit : non.
30. À venir → m390-clair-30-a-venir.png → « Fixer la date » présent, « + mois » absent (texte) → agit : oui (segment).
31. Réalisés → m390-clair-31-realises.png → « Tes projets » et « Marque un projet comme réalisé » absents (texte) → agit : oui.
32. Modifier une note (feuille ···) → m390-clair-32-modifier-note-menu.png → feuille ouverte au tap sur « Note : …, actions » (texte changé) ; contenu non vérifié à l'image → agit : oui.
33. Modifier une note avec l'aide de l'IA → NON JOUÉ.
34. Renommer → m390-clair-34-renommer.png → « Se renomme ici · titre du carnet », « ✻ proposé d'après « surtout la buée… » · avant : « Ventilation… » » ; le contenu du carnet reste visible (texte). Critique 26 (cadre seul) non reproduite → agit : oui.
35. Supprimer une note → NON JOUÉ.
36. Supprimer une idée sans lien (G35) → m390-clair-36-supprimer-idee-sans-lien.png (image après correction) → « Supprimer le carnet Ventilation… ? », « 1 article en veille : les déplacer dans Ventilation de la cave de garde · Déplacer », « ni dans À venir, ni en commande », « Supprimer » rouge contour, « Garder » noir. Le carnet proposé est de même catégorie (critique 27 corrigée) → agit : oui.
37. Supprimer · après → m390-clair-37-supprimer-apres.png → « Carnet supprimé » (texte) ; image non ouverte → agit : oui.
38. Supprimer liée à À venir → m390-clair-38-supprimer-lien-a-venir.png → « 1 lien le retient » (texte) ; image non ouverte → agit : oui.
39. Clavier ouvert 300 px → m390-clair-39-clavier-300px.png → non ouvert ; champ focalisé (texte) → agit : oui au focus.
40. IA en cours (✻, ✕) → m390-clair-40-ia-en-cours.png → ✻ et ✕ absents à 700 ms (texte : la lecture est déjà rangée) → non atteint.
41. IA en échec → m390-clair-41-ia-echec.png → « L'IA n'a pas répondu : rangé sur l'appareil, tel quel ; rien n'est perdu » (image), « Ensuite : l'IA cherche » absent (texte) → agit : oui. Critique 24 corrigée à 390.
42. IA éteinte → m390-clair-42-ia-eteint.png → « IA éteinte : rangé sur l'appareil, tel quel » (texte) ; picto de provenance non vu → agit : oui.
43. Hors ligne → m390-clair-43-hors-ligne.png → « Hors ligne » présent (texte) → agit : oui.
44. Photo 📷 → NON JOUÉ : le bouton « Photo » n'est pas trouvé par son texte ; image clair-44 sans effet (icône 📷 du champ non tapée). Ouvert : image de la liste.
45. Dicter 🎤 → NON JOUÉ (même cause que 44).
46. + volant → m390-clair-46-plus-volant.png → « Nouvelle idée » présent (texte) après « Actions rapides » ; image non ouverte → agit : oui.
47. Stocks › Matériel, segments → même capture que 1 (À venir · Carnets · Réalisés visibles).
48. Scénario de zéro (D-63), étape frigo → m390-clair-48-zero-frigo.png → « Frigo » (texte) → agit : oui. Partiel : une étape seulement.
49. Suppression v2, « Garder le plan sans ce carnet » → m390-clair-49-garder-plan-sans-carnet.png → présent (texte) → agit : oui.
50. Idée avec plan réalisé → m390-clair-50-idee-plan-realise.png → « Archiver » présent, « Garder le plan » absent (texte) → agit : oui.
51. Aides éteintes (&aides=0) → m390-clair-51-aides-eteintes.png → bulle « peut trancher » absente (texte) → agit : oui au focus.
52a. Comparer 1 article → m390-clair-52a-comparer-1-article.png → pas de tableau (texte) → agit : non (état).
52b. Comparer 2 articles → m390-clair-52b-comparer-2-articles.png → tableau présent, « rangé par » absent (texte, image 27) → écart R26.
53. Page de choix voie E → NON JOUÉ (hors banc).
54. Bandeau de tâches (&taches=1) → m390-clair-54-bandeau-taches.png → non ouvert → agit : non (état).
55. Pastille « lié à » (R47) → m390-clair-55-pastille-lie-a-venir.png → « Dans À venir depuis le 16 nov. » (texte) ; image frigo (clair-29) montre le « Dans À venir depuis le 16 nov. » sous la pastille « À venir · … » → agit : non (repos).
56. Idée du calendrier (R48) → NON JOUÉ (exige `?dev-local`, hors de ce passage).

Thème sombre : mêmes captures sous `m390-sombre-<nn>-<état>.png`, 51 fichiers. Ouverts : sombre-09 (avant correction du défilement), sombre-13 (après). Les verdicts textuels sont identiques à ceux du clair, sauf 04 et 06 (même écart) ; la mise en page sombre n'a été jugée qu'à ces deux captures.

## Critique 5 (390) : état des problèmes

Corrigés (vus à l'image ou lus dans le texte) :
- 1 « Critère » : une ligne, « Critère : … · proposé par l'IA » (clair-09).
- 2 « Créer · après » : le critère n'est plus la phrase entière ; « Ce qui compte · rien encore » (clair-04).
- 3 « Texte · pendant » : cadre « va atterrir ici » et puces « Va dans » sur le bon carnet (clair-11).
- 4 chiffre inventé « 30 L » : absent (clair-13, sombre-13, texte).
- 12 À venir : « + mois » absent, « Fixer la date » présent (texte).
- 24 IA en échec : avis présent (clair-41) ; « Ensuite : l'IA cherche » absent à l'échec.
- 26 Renommer : le carnet reste visible avec le cadre (texte).
- 27 G35 : proposition vers un carnet de même catégorie (clair-36).
- 34 champ tronqué : « Ajouter à Ventilation… » (clair-09).
- 35 Réalisés : « Tes projets » et « Marque… » absents (texte).
- 37 prix : « 1 450 » avec espace (texte, clair-09).

Non corrigés ou partiels :
- 7 Note en vrac : un seul carnet, pas de découpe, pas de « 3 lignes rangées dans 2 carnets », pas de « › Texte d'origine », critère « Tient 80 °C » faux pour un bac (clair-23, image).
- 15 (D-131) Créer · pendant : non capturé, rangement plus rapide que la capture.
- 9 Comparer, colonnes : deux colonnes lisibles, largeur à juger ; pas de « rangé par » (clair-27, douteux).
- 10 Choisir (cadre avant le choix) : non atteint.
- 29 Choix revu : « Choix d'avant » non vu.
- 40 IA en cours : non atteint.
- 52b « rangé par » : absent alors que R26 le demande.
- 20 Liste, comparaison en veille, couleur du bouton « Choisir » (33) : non vérifiés.

Non vérifiés à 390 : 5 (clavier 300 px, image non ouverte), 6 (lien après, carte complète), 8 (article sans photo), 11 (liste vide), 16-18 (lecture du lien), 21, 28, 31-32, 38 (violet), 39 (dates).

## Erreurs

- Console : 0 erreur (clair et sombre), 0 erreur de page.
- Étapes du script en échec : 0. Gestes non trouvés, notés NON JOUÉ : 44, 45 (Photo, Dicter), 28 (Choisir).

## Doutes

- Les états 4 et 40 demandent un pendant que l'IA simulée ne laisse pas voir (rangement < 0,5 s ; `&ia=lent` ralentit la lecture de page, pas le rangement).
- Captures de la liste et de la vue carnet prises en haut de page après correction du défilement ; les captures antérieures, défilées, n'ont pas été gardées.
- Le banc tourne en `vite` dev et non `vite preview`, comme le § Vérification le demande ; le banc n'est servi qu'en DEV.
