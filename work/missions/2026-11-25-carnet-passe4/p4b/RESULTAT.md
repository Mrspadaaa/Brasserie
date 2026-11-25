OK — 3 versions greffées p4b-1..3, 8 écrans et 2 gestes, Organisé ≤ 26 mots, info utile ≤ 48 px

## Fichiers écrits (Possède : p4b/)
- `p4b-1.html` « Ligne de métro » : recette du juge critique.
- `p4b-2.html` « Sous le pouce » : recette du juge personas action.
- `p4b-3.html` « Qui gagne quoi » : recette du juge personas produit.
- Chaque fichier écrit sa recette en tête (commentaire RECETTE, au format écran → mécanisme → source), et la montre avec `?e=recette`. Les écrans s'ouvrent par `?e=liste|organise|organise-ligne|organise-aide|achat|decider|afaire|relecture|erreur|memo`.
- `cap.mjs` : captures en 390 × 844, dsf 2, sur le Chrome 9222, dans un onglet propre (page.close puis disconnect). Il mesure aussi les mots et la hauteur de l'info utile.
- `planche.mjs` : une planche de 10 écrans par version.
- `cap/` : 30 captures, 3 planches et `mesures.json`.

## Mesures (script, premier écran 390 × 844, hors titre du carnet, placeholder compté)
| Version | Organisé problème : mots | 1re info utile sous la barre | Organisé achat : mots | utile | Liste : lignes entières visibles (part des lignes) |
|---|---|---|---|---|---|
| p4b-1 | **26** | **48 px** | 29 | 35 px | 13 (77 %) |
| p4b-2 | **24** | **38 px** | 29 | 0 px | 11 (71 %) |
| p4b-3 | **25** | **48 px** | 29 | 0 px | 13 (79 %) |

Règles dures :
- ORGANISE-TROP-TEXTUEL : ≤ 30 mots partout, et chaque bloc porte un repère visuel (ligne de métro, jeton coloré, case hachurée, couronne).
- ENTETE-PEU-UTILE : ≤ 120 px partout.
- CARNET-LISTE-COMPACTE : 11 à 13 lignes, soit ≥ 7, et ≥ 70 % de la hauteur.
- FRISE-GENERIQUE : aucune frise d'états. Seul l'achat de p4b-1 montre un avancement propre à son genre (comparé › choisi › commandé).
- Les chiffres sont proportionnels, en tabular-nums, sans chasse fixe (CARNET-COHERENT).

## Données : rien d'inventé
- Les données viennent des fixtures c79 et c75, lignes telles quelles. Ce sont les mêmes lignes que les EXEMPLES du jouable : 14 carnets distincts, les jumeaux c75 étant écartés. Le préfixe « ZZ TEST — » est masqué.
- Calculs de l'app, chacun nommé dans la page :
  - −720 CHF (1 200 − 480) ;
  - +8 CHF (2 sacs × 4 CHF) ;
  - 36 j jusqu'au 31 déc. ;
  - ≈ 1 déc. (« dans une semaine », écrit le 24.11) ;
  - ≈ 8 déc. (« dans 2 semaines »).
- Un inconnu est hachuré, jamais mis à 0 : prix du joint, délai, prix Brau « à relire » (0,10 CHF lu, incohérent), dispo Brau.
- 150 CHF vient de sa ligne « Estimation 150 CHF (exemple) » ; il est dit « estimé » et n'est jamais présenté comme un devis reçu.
- Sa note « dur à obtenir » est montrée face au « en stock » lu sur la page.
- Le carnet vapeur (« Humidificateur ») n'est pas ouvert ; seuls « condenser » et la veille du 2e en servent.
- IA en erreur ou hors ligne : seul ce que lit `etiquettesLocales` (analyseLocale.ts) sur ses 5 lignes est montré, soit `pas-trouve` (ligne 2) et 150 CHF en montant (ligne 5). « Contacter » ne déclenche pas `contacte`, « Devis attendu » sans prix ne déclenche rien, et p4b-3 dit « rien lu » pour contacté et piste. Aucune option ni tâche n'est montrée sans IA.
- Le seul texte de l'IA est la phrase de conseil de `visuel/reponse-reelle-ecoulement.json`, marquée ✦.

## Ce qui est commun aux trois
- La prochaine action est un gros bouton noir sous le pouce : Contacter l'entreprise X, Relire Brau, Réessayer, Retenir.
- La bascule Mes notes / Organisé est en bas, à portée de pouce.
- Le champ « Ajouter… » et « 💡 Aide » sont sur une ligne. Aide propose ✓ Vérifier, ☐ Tâche et 💡 Suggestion.
- Toucher un élément d'Organisé ouvre Mes notes, sur sa ligne surlignée de la couleur de la piste, avec un retour.
- La barre d'onglets de l'app est sur Liste et À faire. Le carnet ouvert est une page plein écran, comme dans le jouable.

## Captures (toutes ouvertes avec Read)
- Planches : `cap/planche-p4b-1.png`, `cap/planche-p4b-2.png`, `cap/planche-p4b-3.png`.
- Écrans : `cap/p4b-{1,2,3}-{liste,organise,organise-ligne,organise-aide,achat,decider,afaire,relecture,erreur,memo}.png`.

## Limites
- Pages statiques : le repli d'un en-tête sous filtre (CARNET-LISTE-COMPACTE) n'est pas joué.
- Les domaines et sous-domaines des carnets sans domaine dans la fixture sont proposés par l'IA, comme le fait le jouable.
- p4b-3 Relecture et p4b-2 Organisé gardent ≈ 150 à 200 px vides au-dessus du pouce.

Prédiction : il dira que l'Organisé de p4b-1 (métro) ou de p4b-3 (face à face) se lit enfin sans lire, et il voudra le face à face de p4b-2 sur le Décider.

DÉCISION À PRENDRE : la barre d'onglets de l'app, à rétablir selon l'INVENTAIRE, est masquée dans le carnet ouvert pour tenir 30 mots. Les captures la montrent sur Liste et À faire seulement. Si le carnet doit la garder, il faut 6 mots de plus.
CONNAISSANCE : etiquettesLocales ne lit ni « Contacter » (impératif ≠ « contacté ») ni « Estimation » (hors du motif ESTIME) : sur l'écoulement, le repli sans IA ne voit que « pas trouvé » et « 150 CHF ».
LEÇON PROPOSÉE : aucune
