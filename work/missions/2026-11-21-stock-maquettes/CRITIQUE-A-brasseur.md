# Autres stocks A, regard Brasseur au rayon (22.11)

Verdict qu'il donnerait : il aime l'idée (il l'a choisie), mais ça fait « pas fini ». Je l'estime à 7 au plus, d'après la règle d'écart en §7 du PORTRAIT. Sources : `st3-a-390.jpg`, `st3-a-390-ligne.jpg`, `st3-a-1280.jpg` et le modèle `st1-d2a-repos-660.jpg`, `st1-d3b-1280.jpg`, dans `C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/missions/2026-11-21-stock-maquettes/`. Ses mots : SPEC l. 2652 et 2676.

1. **Le seuil manque sur les lignes épuisées (390).** Bicarbonate, Lactique, Gélatine, Zinc et Cacao affichent « épuisé » sans seuil. Seule « bas · seuil 100 g » le montre, alors que le modèle écrit « assez · seuil 10 kg » ou « sans seuil » sur chaque ligne. Correction : sous chaque nom, « épuisé · seuil 250 ml » ou « sans seuil ». Lui : « Il est où le seuil ?? Je l'ai demandé ».
2. **Aucun geste pour régler le seuil.** La ligne ouverte propose Commander, Favori et Fiche, rien d'autre. Correction : un « seuil 250 ml » réglable dans la ligne ouverte, sans `type="number"` ([[saisie-mobile]]). Lui : « Je veux juste mettre mon seuil, pas ouvrir une fiche ».
3. **Pas de dose par brassin, ni de couverture pour les 3 brassins.** Seul « manque pour NEIPA 28.11 · 40 ml » apparaît, une fois la ligne ouverte. Correction : « ≈ N brassins » ou « manque X pour les 3 prévus » au repos. L'emplacement exact est à lui montrer en variantes : ce choix lui revient. Lui : « J'ai 3 brassins, j'en ai assez ou pas ? ».
4. **La pastille de catégorie ne lui apprend rien.** « Sels », « Acides » ou « Clarif. » répètent ce que disent déjà l'étagère et le titre de groupe. Dans le modèle, cette place porte une information (EBC). Correction : y mettre la DDM ou la couverture. Lui : « Je sais que le bicarbonate c'est un sel ».
5. **Les libellés de l'étagère sont incohérents.** Le modèle met un total sous chaque groupe (39,2 kg). A mélange un nom (« Bicarb. »), un format (« 50 cl »), des nombres muets (« 2 », « 3 ») et une ligne de texte pour Nettoyage. Correction : une seule règle par rangée, par exemple le nombre manquant en rouge. Lui : « Le 2 c'est quoi ? ».
6. **L'habillage est plus chargé que le modèle.** Hachures, damiers, points orange sans explication. Lui : « La version malt houblons et levure est un peu plus clean ». Correction : barres pleines, forme seulement là où elle désigne l'objet (« couleur et forme », l. 2654).
7. **À 1280, la jauge n'a pas d'échelle et ses textes sont trop petits.** Les barres sont pleines à 120 g comme à 200 ml, sans échelle « 0—5 kg // 25 kg » comme dans le modèle. « seuil 250 g » fait environ 10 px gris, et beaucoup de lignes n'ont ni seuil ni « sans seuil ». Correction : échelle par groupe, seuil à 14 px au moins. Lui : « Pleine par rapport à quoi ? ».
8. **Le dernier prix et le fournisseur manquent pour commander.** On ne les voit qu'en ouvrant la ligne à 390, et le bouton fournisseur du modèle (« Brau- und Rauchshop ») a disparu à 1280. Correction : remettre le regroupement par fournisseur. Lui : « Je commande chez qui ? ».
9. **La DDM n'apparaît qu'à 1280.** « DDM 12.26 » est absent des lignes à 390. Correction : l'ajouter au sous-texte. La pastille « +1 » en pointillé ne dit rien : écrire « à compter 1 ».
10. **Le premier écran à 390 est pris par l'étagère.** Il ne reste que 5 lignes épuisées visibles. Le choix 390×660 n'a pas été capturé : à vérifier (L12).

Toutes les corrections restent dans la version A qu'il a choisie (règle n° 1). Les points 3 et 4 changent le contenu des lignes : ils se montrent en variantes, je ne les tranche pas.

Position : pour (A, polie sur le modèle, avec les points 1, 2, 5 et 7 en premier)

LEÇON PROPOSÉE : un port « sur le modèle » vérifie chaque champ de ligne du modèle, ligne par ligne (seuil, « sans seuil », échelle, fournisseur). A a perdu le seuil, alors que le modèle l'affiche sur chaque ligne.
