ECHEC — rejeté : deux gestes sur huit trahissent le doigt (appui long sur un filtre = tableau vide ; glisser vers la poubelle annulé en tactile)

Critique au regard neuf, Opus, 16.11. J'ai lu PORTRAIT v2, SPEC (15 et 16.11, calendrier), RESULTAT et GESTES de fa, mesure.json, le code (proto.src.html l. 243, 346, 449, 462).
Captures ouvertes : fa repos (clair et cave), t2, t3, t4, t5, t7, t7b, plus, etsi, t6-844 ; mesure-t7, mesure-t8 ; f1-vue-390 (référence, 8/10).
Écran sans entrée dans `ecrans.json` (choix ouvert) : f1 sert de plancher, pas de maquette à reprendre 1:1.

- **fa** (g8 en gestes) — REJET : T8 et T7. Règles : D112 (« L'appui prolonger fait pas l'effet escompté ») et D343 (un geste sans effet ou à effet faux bloque). Corrections : points 1 et 2 ci-dessous.
  Phrase prédite : « L'idée est top, je tire la barre et mon libre bouge, je tape sur −540 et ça change. Mais j'appuie sur Brassins et tout disparaît ?? Et je retrouve plus ma courbe de caisse de f1. »

## Notes (sur 10)
brasseur 7 · uxui 6,5 · parcours 7 · navigation 7 · fluidité 5

Progrès par rapport à f1 : manipulation directe (tirer un bord, glisser, toucher la valeur), le libre suit la frappe, toast Annuler, « Et si… » très parlant, 1 fermenteur et jours libres négatifs en rouge (−2 j), ce qui est juste métier. Les chiffres sont cohérents : 709 − 180 = 529 ; sans Malt groupé, 709 + 540 = 1 249.
La fluidité est plombée par deux gestes cassés, une saisie de 19 à 21 touchers et des éléments qui se recouvrent.

## Problèmes, les plus graves d'abord

1. **Appui long sur un filtre : le tableau se vide** (T8, bloquant, effet surprenant). Ligne 462 : le drapeau `c.__long` est posé sur l'ancien bouton. `filtres()` reconstruit les boutons (`innerHTML`), donc le `click` du relâchement (l. 449) tombe sur un bouton neuf sans drapeau et coupe Brassins : les 5 filtres sont éteints. La cause est vérifiée dans le code.
   Correction : un drapeau au niveau du module (`var longFiltre = k`), lu puis remis à zéro dans le gestionnaire de click ; ou bien `filtres()` met seulement `aria-pressed` à jour sur les boutons existants, sans les reconstruire. Rejouer T8 en CDP tactile.
2. **Supprimer en glissant vers la bande rouge ne marche pas au doigt** (T7, bloquant). La barre a `touch-action: pan-y`. Les micro-mouvements pendant les 450 ms d'appui partent avant que `D` existe (l. 346 : `if(D)`). Chrome lance donc le défilement, puis envoie `pointercancel`. Un vrai doigt tremble toujours.
   Correction : abandonner le glisser vertical. L'appui long soulève la barre et ouvre sur place une mini-bulle « Supprimer · Fiche » : 2 touchers, Annuler dans le toast, et plus de bande rouge qui couvre la nav et le +.
3. **Le graphe caisse / de côté de f1 a disparu.** C'était le cœur de son « top, avec temps et argent » et de « La frise sous la caisse ». Les 8 verres sont presque identiques, alors que les valeurs vont de 3 872 à 5 696. On ne lit pas au coup d'œil où ça serre, et le « mis de côté » n'apparaît nulle part au repos. La bande annuelle de 52 px ne montre que le libre.
   Correction : remettre en tête la courbe de f1 (caisse, de côté hachuré, libre, point « au plus serré »), réduite à 150 px environ et calée sur les 8 semaines du tableau, l'année restant dans la bande. La rangée de verres peut alors céder sa place.
4. **Les chiffres de la rangée Libre sont collés** à 390 (« 4 032 4 152 3 872 5 172… » sans espace). Ils sont illisibles comme valeurs séparées, et les valeurs barrées au-dessus en T4 et T5 sont encore plus serrées.
   Correction : écrire en milliers (« 4,0k »), ou mettre un fond alterné par colonne avec 4 px de gouttière. Pendant un geste, montrer seulement l'écart (« −180 ») sous la valeur.
5. **Le + volant cache des données au repos** : « Inventaire 1 j » et la note −400 de S1, et aussi en t5 et etsi.
   Correction : ajouter au tableau un `padding-bottom` de 84 px pour que la dernière rangée passe au-dessus du +. Sur Calendrier, masquer le + pendant le défilement vers le bas et le rendre à l'arrêt.
6. **À 390, l'écran ne tient pas : Papiers est sous la nav.** La rangée Comptoir prend 245 px, parce que chaque étiquette est sous sa barre, sur sa propre ligne.
   Correction : nom et valeur dans la barre quand elle fait 2 semaines ou plus ; à droite, sur la même ligne, pour une barre d'une semaine. Viser toutes les rangées visibles au-dessus de la nav sans défiler.
7. **Ajouter coûte 19 à 21 touchers**, dont 17 et 18 frappes pour le nom (D209 : « à la volée… ajouter… sans ouvrir »).
   Correction : au-dessus du clavier, des puces de noms tirés d'À venir et des choses récentes (« Frigo », « Embouteilleuse », « Sols »), budget prérempli depuis le besoin. Un toucher sur une puce suivi de OK fait 3 touchers.
8. **Le champ de budget sur place recouvre le voisin** (T5) : la bulle « − dépense · Entrée pour garder » cache « Marché de Noël +1180 ».
   Correction : le champ s'ouvre dans la barre elle-même, et l'aide passe sous la rangée, ou disparaît (le − est implicite dans Achats).
9. **Les filtres ne portent pas le nom des rangées.** Il y a un filtre « Travaux » mais pas de rangée Travaux (« Achats et travaux »). « Activités » vise la rangée « Toi » et les fûts, « Fêtes » la rangée « Comptoir », « Brassins » la rangée « Cuve ».
   Correction : un seul nom par type, partout (filtre = titre de rangée), ou bien la puce du filtre posée devant le titre de sa rangée.
10. **« 1 j libre » à côté des jours, avec le mardi surligné.** Le jour surligné est le jour de brassage (Blonde mar.), mais on le lit comme le jour libre.
    Correction : jours libres en vert, jour de brassage marqué d'un point brun, ou la puce des jours retirée de la carte.
11. **En paysage (t6-844), la bulle du glisser cache « Noël privés »** et sa valeur.
    Correction : placer la bulle au-dessus de l'en-tête des semaines (zone fixe), jamais sur une rangée.

Doutes, non comptés :
- les actions communes du + mènent à un toast (c'est un prototype) ;
- jours actifs en nombre plutôt qu'en jours de la semaine ;
- « Malt groupé » et le coût des brassins (−148) pourraient compter deux fois le malt : la fixture « malt net » du 16.11 semble l'avoir réglé, à vérifier dans l'app ;
- gestes non joués sur un vrai téléphone.

LEÇON PROPOSÉE : un appui long qui reconstruit le DOM perd son drapeau avant le click. Tout état de geste vit dans le module, pas sur le nœud. Un glisser après appui long sur un élément en `pan-y` se rejoue avec du tremblement (2 à 6 px pendant l'attente) avant d'être déclaré tenu.
