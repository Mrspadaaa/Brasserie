l1 · Cave : q2b (c1) dans l'identité réelle de l'app. Pages : `etat-b.html` et `planche.html`, générées par `generateur-l1.mjs`, avec le socle commun `donnees-q2b.mjs`. Les écrans facultatifs (Ma bière, Comparer, fiche.html) ne sont pas faits.

- **Ce qui tient** :
  - Le langage suit DESIGN.md : charbon chaud (cave-950 pour la page, cave-900 pour une voie ajoutée, cave-850 pour la feuille), trois tons de lecture, paille pour la seule action principale (Comparer), cuivre pour les moments du brassin, Source Sans 3, et IBM Plex Mono pour les mesures.
  - Les familles s'allument sur le charbon : une pastille au ton base à 20 %, et le trait base. Pour petits fruits, épicé et résineux, le trait prend le ton fond, car leur base tient moins de 3:1 sur la pastille.
  - **Texte de famille recalculé pour le sombre** : la base, éclaircie vers cave-50 jusqu'à 4,6:1 sur cave-850. Cela donne petits fruits #b67497, herbacé #51946d, épicé #a18172 et résineux #679186 ; les autres familles gardent leur base. Ces tons servent hors des éléments de famille, par exemple pour les noms dans la fiche. Dans un élément `data-famille`, seuls base et fond sont employés (S2) : le titre « Moins résineux » est donc au ton fond.
  - L'appui long ouvre la fiche g1 dans une feuille cave-850 : 500 ms au doigt, sur le nom ou sur toute la ligne hors commandes, ou 750 ms de survol, qui ouvre une bulle à l'ordinateur. La feuille contient α et rôle, la bande étiquetée, la roue « N/M », Ajouter et Comparer, et quatre replis. Neuf fiches, de 67 à 88 mots.
  - Contrôles du brief sur `etat-b.html`, tous OK : MOTS 54, COULEURS (4 teintes), AU-STYLE, STANDARD, SURVOL, FICHE, FIL6, AUTRES, MOMENTS, MA-BIERE, USAGE-INTENSITE, BLOCS.
- **Ce qui casse** :
  - La structure reste celle de q2b : en vignette, l1 se reconnaît au noir, pas à une forme nouvelle.
  - Les rayons suivent l'échelle du lot (2, 4, 8 px, pilule ; S3), pas les 10, 16 et 24 px de DESIGN.md.
  - L'orangé #c2410c ne tient que 3,47:1 sur cave-900 : il ne porte aucun texte, seulement des segments et des traits.
  - Celeia n'a pas de fiche détaillée dans le dépôt : sa fiche vient du catalogue du moteur et de c1, sans mots par source, et elle le dit.
  - Les polices viennent de Google Fonts.
- **Ajouté, retiré, par rapport à q2b** :
  - Ajouté : une voie ajoutée à Comparer s'éclaire en cave-900 ; « Atteint » prend le ton de sa famille ; Barres et Radar ont leur icône.
  - Corrigé : « visée » et les en-têtes passent au-dessus des tirets (dans q2b, le tiret traversait « estimé ») ; la bulle de biotransformation n'est plus recouverte par le tableau suivant.
  - Changé : l'usage déduit de l'α est au trait seul (grammaire v3) au lieu d'être pâle.
  - Rien n'est retiré.
- **Pire contraste** : 5,02:1, cave-400 sur cave-850 dans la fiche (« lot 8,1 % », « Pépins? »). Sur la page, le pire est 5,40:1, cave-400 sur cave-900. Mesuré au rendu, sur le fond peint sans le texte (2ᵉ centile des pixels), pour la page, les replis ouverts et la fiche.
