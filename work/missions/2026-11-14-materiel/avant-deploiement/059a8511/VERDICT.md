Version : 059a8511

| capture | thème | largeur | état | problèmes | bloquants |
|---|---|---|---|---|---|
| ajout-1280-clair.png | clair | 1280 | ajout | 2 | 0 |
| ajout-1280-sombre.png | sombre | 1280 | ajout | 2 | 1 |
| ajout-390-clair.png | clair | 390 | ajout | 1 | 0 |
| ajout-390-sombre.png | sombre | 390 | ajout | 1 | 0 |
| annule-1280-clair.png | clair | 1280 | annule | 2 | 0 |
| annule-1280-sombre.png | sombre | 1280 | annule | 2 | 0 |
| annule-390-clair.png | clair | 390 | annule | 0 | 0 |
| annule-390-sombre.png | sombre | 390 | annule | 0 | 0 |
| apres-etalonne-1280-clair.png | clair | 1280 | apres-etalonne | 4 | 0 |
| apres-etalonne-1280-sombre.png | sombre | 1280 | apres-etalonne | 4 | 0 |
| apres-etalonne-390-clair.png | clair | 390 | apres-etalonne | 0 | 0 |
| apres-etalonne-390-sombre.png | sombre | 390 | apres-etalonne | 0 | 0 |
| fiche-1280-clair.png | clair | 1280 | fiche | 2 | 0 |
| fiche-1280-sombre.png | sombre | 1280 | fiche | 2 | 0 |
| fiche-390-clair.png | clair | 390 | fiche | 3 | 0 |
| fiche-390-sombre.png | sombre | 390 | fiche | 3 | 0 |
| fiche-pompe-1280-clair.png | clair | 1280 | fiche-pompe | 1 | 0 |
| fiche-pompe-1280-sombre.png | sombre | 1280 | fiche-pompe | 1 | 0 |
| fiche-pompe-390-clair.png | clair | 390 | fiche-pompe | 2 | 0 |
| fiche-pompe-390-sombre.png | sombre | 390 | fiche-pompe | 2 | 0 |
| gestion-1280-clair.png | clair | 1280 | gestion | 3 | 1 |
| gestion-1280-sombre.png | sombre | 1280 | gestion | 3 | 1 |
| gestion-390-clair.png | clair | 390 | gestion | 4 | 0 |
| gestion-390-sombre.png | sombre | 390 | gestion | 4 | 0 |
| repos-1280-clair.png | clair | 1280 | repos | 1 | 0 |
| repos-1280-sombre.png | sombre | 1280 | repos | 1 | 0 |
| repos-390-clair.png | clair | 390 | repos | 0 | 0 |
| repos-390-sombre.png | sombre | 390 | repos | 0 | 0 |
| traiter-1280-clair.png | clair | 1280 | traiter | 1 | 0 |
| traiter-1280-sombre.png | sombre | 1280 | traiter | 1 | 0 |
| traiter-390-clair.png | clair | 390 | traiter | 0 | 0 |
| traiter-390-sombre.png | sombre | 390 | traiter | 0 | 0 |
| vide-1280-clair.png | clair | 1280 | vide | 0 | 0 |
| vide-1280-sombre.png | sombre | 1280 | vide | 0 | 0 |
| vide-390-clair.png | clair | 390 | vide | 0 | 0 |
| vide-390-sombre.png | sombre | 390 | vide | 0 | 0 |

## Problèmes

Combien et quels problèmes ? 12 problèmes, dont 2 bloquants. J'ai ouvert les 36 captures et je les ai comparées à za3
(repos-390, repos-1280, traiter-390, geste-390, ajout-390, vide-390). Corrigés depuis ECRAN-PORT-2 :
- N1 : après Étalonné, à 390, la ligne verte « 4,02 · 7,01 ✓ » est à sa date, et la note « pH-mètre à jour jusqu'au 14.12 » est à l'ancienne place ;
- N4 : plus d'anneau sur ← ni sur × ;
- N5 : « **Étalonné** » est en gras, avec « ↶ Annuler » ;
- P7 : la fiche est en page pleine à 390, sans poignée.

1. **ajout-1280-sombre** — l'état « ajout » n'est pas à l'écran : pas de feuille « Nouveau matériel ». On voit la liste au
   repos avec la pompe ouverte, alors qu'en clair la feuille s'ouvre. Brasseur : « j'appuie sur ajouter, rien ne vient ».
   Gravité : **bloquant** (geste sans effet) tant qu'une nouvelle capture ne montre pas la feuille. Correction : rejouer le
   geste en sombre à 1280. Si la feuille ne s'ouvre pas, corriger le déclencheur ; si le banc est en cause, corriger son attente
   avant la capture.
2. **gestion-1280-clair, gestion-1280-sombre** — le menu ⋯ (Modifier, Vendu, Réformé, Supprimer) n'apparaît pas : la fiche du
   pH-mètre reste au repos, dans les deux thèmes. À 390, le menu s'ouvre. Gravité : **bloquant** (geste sans effet à 1280) tant
   qu'une capture ne le montre pas ouvert. Correction : rejouer le ⋯ du panneau de droite à 1280 et capturer le menu ouvert ;
   s'il ne s'ouvre pas, corriger son ancrage.
3. **apres-etalonne-1280-clair, -sombre** — le panneau dit « À jour · prochain le 14.12 », mais il garde le formulaire
   « Étalonner » vide et le gros bouton « ✓ Étalonné ». Brasseur : « je viens de l'étalonner, pourquoi il me le redemande ? ».
   Le brasseur risque un second étalonnage, vide. Gravité : gênant (pas pratique). Correction : un appareil à jour n'affiche ni
   le formulaire de mesure ni l'action principale « Étalonné », ou les replie sous « étalonner quand même ».
4. **apres-etalonne-1280-clair, -sombre** — dans la liste, la ligne « pH-mètre 4,02 · 7,01 ✓ 14.12 » n'a pas la surbrillance
   verte de za3-traiter : le gris de sélection et un crochet arrondi la recouvrent. À 390, elle est verte. Gravité : mineur
   (écart à sa maquette). Correction : le vert du geste prime sur le gris de sélection, et le marqueur de sélection garde la
   barre droite du repos.
5. **fiche-390-×2, fiche-1280-×2, gestion-390-×2, gestion-1280-×2, annule-1280-×2, apres-etalonne-1280-×2** — l'historique du
   pH-mètre se réduit à « 11.10 Étalonné 4,03 · 7,02 ». Or za3-geste-390 en montre quatre (11.10, 12.09, 10.08, 08.07), le fil de
   za3-repos-1280 a un point au 12.09, et la passe 2 en montrait deux (« 4,03 · 7,02 » et « 4,04 · 7,03 »). Brasseur : « il
   dérive comment, mon pH-mètre ? je vois qu'une mesure ». Gravité : gênant (écart à sa maquette, régression probable).
   Correction : vérifier la fixture, puis la lecture de l'historique ; afficher toutes les lectures passées, dans la fiche et
   dans le fil du milieu.
6. **fiche-390-×2, fiche-1280-×2, gestion-390-×2, gestion-1280-×2, annule-1280-×2, apres-etalonne-1280-×2** — les tampons sont
   écrits « pH 7 » et « pH 4 ». za3 écrit « pH 7,00 » et « pH 4,00 », à 390 comme à 1280, et c'était conforme en passe 2.
   Gravité : mineur (écart à sa maquette, régression). Correction : remettre les valeurs nominales à deux décimales.
7. **fiche-390-×2, fiche-pompe-390-×2, gestion-390-×2** — devant « Stocks · Matériel », la barre montre un cône de houblon.
   za3-geste-390 montre l'icône Stocks (trois alvéoles, celle de la barre du bas). Gravité : mineur (écart à sa maquette).
   Correction : reprendre l'icône Stocks de la navigation.
8. **gestion-390-clair, -sombre** — à l'ouverture tactile du menu ⋯, « Modifier » porte un gros anneau de focus, noir en clair,
   blanc en sombre. C'est le défaut N4, qui s'est déplacé. Gravité : mineur. Correction : l'anneau seulement en
   `:focus-visible`, ou le focus initial sur le conteneur du menu.
9. **ajout-1280-clair** — la feuille « Nouveau matériel » prend toute la largeur : champ Nom sur 1 240 px, boutons de 630 px.
   « Dernier fait » est posé à l'extrême droite, à plus de 800 px d'« Entretien », qu'il complète. Brasseur : « c'est étiré,
   faut traverser l'écran ». Gravité : gênant (pas pratique). Correction : à 1280, un dialogue centré d'environ 560 px, avec
   « Dernier fait » à côté d'« Entretien », comme à 390.
10. **ajout-390-clair, -sombre, ajout-1280-clair** — avec Entretien « aucun », le champ « Dernier fait 14.11.2026 » reste
    affiché alors qu'il n'y a rien à faire. za3-ajout-390 ne le montre qu'avec un rythme (« 3 mois », réglette et « prochain
    le »). Brasseur : « dernier fait de quoi ? ». Gravité : mineur (pas à sa place). Correction : masquer « Dernier fait » quand
    Entretien vaut « aucun ».
11. **repos-1280-×2, traiter-1280-×2, fiche-pompe-1280-×2, ajout-1280-sombre** — la pompe est ouverte par défaut, et la colonne
    du fil, au milieu, n'est qu'une règle vide (de sept. à janv., aucun point). On n'y voit ni la fuite du 05.11 ni « Réparer » le
    14.11, que la fiche à 390 montre. Gravité : mineur (pas pratique : un tiers de l'écran reste vide). Correction : poser au fil
    le point « fuit au raccord 05.11 » et le point d'aujourd'hui « Réparer ».
12. **fiche-pompe-390-clair, -sombre** — « fuit au raccord » est écrit deux fois : dans le titre « Fuit au raccord depuis le
    05.11 », et à droite de « 14.11 Réparer ». Gravité : mineur (texte en double). Correction : à droite, rien, ou une
    information utile (pièce, coût estimé), comme « tolérance ±0,05 » pour le pH-mètre.

Doutes (non comptés) :
- apres-etalonne-390 et -1280 : après le geste, le rail semble passer sur les pictos du Frigo et du Réfractomètre, alors qu'au
  repos ils sont posés dessus. À vérifier en plein format, zoomé.
- Coque « Compagnon hors connexion · mode local » : à 390, elle couvre « Déjà possédé », « Projets » et le « 1 » de 1 739 CHF.
  Elle vient du banc ; vérifier qu'elle n'apparaît pas en ligne.
- Bouton ⋮ de l'en-tête de l'app : une pastille le recouvre, et il se lit comme un « ? » (za3 : ⋮ net). Ce bouton est hors de
  l'écran Matériel.
- Pictos « Réparée » et « Projets d'équipement » : une clé plate au lieu du tournevis de za3. L'écart est minime.
- Captures manquantes pour reprendre N2 et N3 de la passe 2 :
  - « Payer un entretien » ouvert : la Dépense nomme-t-elle le pH-mètre ?
  - geste « Fait » sur le Refroidisseur : sort-il de « sans échéance » ?
  - geste « Réparée ».

Bloquants : 2
