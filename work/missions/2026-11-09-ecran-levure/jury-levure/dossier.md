# Dossier du jury — étape « Levure 4/7 » de la création de recette (09.11, niveau rapide)

Lire ce dossier ; n'ouvrir une source que pour vérifier un point. Les réponses communes aux 7 étapes (scène, en-tête, fil, bandeau, pied,
+ flottant, interdits, honnêteté) sont acquises : `work/missions/2026-10-31-ecran-fermentescibles/jury-fermentescibles/fiche.md` (J1, J6,
J7, J12). Ne pas les rejuger : ne répondre que sur ce qui est propre à la levure.

## Hypothèse (65 %)
Au premier coup d'œil, l'étape montre **la levure choisie** (nom, labo, forme) et **ce qu'elle change à la bière** : atténuation → FG et
alcool, température, floculation, arômes. Elle montre aussi **la dose calculée** (sachets ou grammes, pour le volume et l'OG de la recette).
On change de levure en un toucher : le stock d'abord, puis le catalogue. L'achat (offres, prix) et la conduite (température × jours) sont
repliés.
Sous 70 %, pour deux raisons :
- la conduite vit ici et dans l'étape suivante « Paliers » : est-ce un doublon ?
- il n'a jamais dit ce qu'il veut voir en premier ici.

## État actuel (inventaire `work/missions/2026-11-09-ecran-levure/inventaire/inventaire-levure.md`, captures `…/inventaire/captures/`)
- `levure-choisie-390.png` : sous le bandeau, une carte « Levure » avec « Brouillon non enregistré », la ligne « Paliers 0 palier → 2 paliers… »
  et « Voir la conduite ». Puis la station « 1 Levure » :
  - la carte SafAle US-05 « Catalogue · forme à préciser » ;
  - le champ « Changer : nom, code, fabricant, arôme… » et « Parcourir le catalogue » ;
  - « Mon stock ou saisie libre » ;
  - « Produit exact et achat » (facultatif) : le sachet 11,5 g, « dose fabricant 50–80 g/hL », les sources, et **deux offres au premier
    plan** (3,40 CHF et 2,90 EUR, « Stock à revérifier », « Livraison CH à revérifier »).
  La dose de la recette n'est pas visible au premier écran.
- `levure-vide-390.png` : « Levure · choisir », le champ, « Filtres », « Parcourir les 1 734 références », « Chercher un lot ou une référence »
  et « Saisir une levure hors catalogue ». Puis la station « 2 Conduite · température × jours », « 2 paliers · fin J15 », « Brouillon »,
  « 1 point à vérifier ». Puis « Programme détaillé et guides enregistrés ».
- La fiche (`levure-detail-390.png`) : 18–26 °C, 78–82 %, 9–11 % vol, floculation non renseignée.
- Le bandeau ne montre ni FG ni alcool. La comparaison existe : une radio « Comparer <nom> » dans les résultats (`YeastCandidatePicker.tsx:164`).
- Le lien houblons et biotransformation n'est pas vérifié à l'étape. Côté outils houblons, le levier levure existe : groupe « Changer de
  levure » de q2b dans Suggérer ; `avecLevureSupposee` suppose US-05 quand `yeastId` est nul.

## Ses mots (mot pour mot, `work/refonte-frontend/v4/SPEC-BRASSEUR.md`)
- l. 668 : « Autre ticket pour les levures, choisir une levure remplis aussi sa dose (gram, sachet) » (#132).
- l. 675 : « Et tout ce qui est biotransformation avec levures, dry hopping et tout, comment ça d'intégre ? Ça a été oublié ? » ;
  C040 : « Est-ce que le lien entre houblon, levures, recette fonctionne vraiment ? ».
- l. 327-328 : « … pour de la comparaison entre ma bière de base -> 1 dry hop, 2 dry hop: levure » ; « a2b est interessant mais peut être
  pas en main. voir ce que la levure change reset vraiment interessant ».
- l. 525 (sur q2b, rangée du levier levure) : « Celle ci aussi est toujours meilleures. Mais aussi ajouter les spec en plus type comme
  matrice nettoyée flb5b · de flb5 ».
- 08.11 : « Les Screens levure seront à refaire, ne passe pas de temps dessus ».
- 09.11 : « Ensuite fait moi des mini maquettes pour la partie levures. Avec le bon workflow ».
- Malts/sucres (18.10, même principe pour chaque étape) : « j'ai besoin d'avoir des le premier coup d'œil, quel matière première j'ai, et et
  je peux ajouter en un click ultra facilement. Ensuite seulement je peux ouvrir mon panel de comparatif ».
- DEFAUTS D97 : « low », « medium » ou « Esters : low » ne s'affichent jamais ; tout se dit en français.
- DEFAUTS D81 : un picto sans nom visible est un défaut.

## Sa langue retenue aux étapes 1 et 2
- Identité : r4-a.
- Malts/sucres : p6-b2, avec la recherche s1. La capture de référence est `…/inventaire/captures/reference-malts-p6-b2-sucre-apres.png` :
  - une ligne par ingrédient ;
  - la masse se règle sur la ligne ;
  - la barre porte la masse ;
  - le champ d'ajout reste toujours prêt.

## Questions (réponse recommandée par le pilote ; confirmer ou corriger, avec une classe SOURCE, PILOTE, GOÛT, ACCORD, MESURE ou CONSEIL)
- **J2. Le geste** : voir la levure et sa dose, et changer de levure en un toucher. La comparaison est à un toucher, pas au repos.
- **J3. Pourquoi maintenant** : l'écran est un dossier d'achat. Les offres, les prix, « Brouillon », les sources et la conduite passent avant la
  dose et ce que la levure change. Sa dose n'est pas visible.
- **J4. La réussite** : à 390 px, au premier écran, on voit :
  - la levure ;
  - la dose (« 2 sachets · 23 g ») ;
  - l'atténuation, la température et la floculation en représentation, pas en phrase ;
  - le changement à un toucher ;
  - 80 mots au plus ;
  - aucun prix au repos.
- **J5. Les acquis à garder** :
  - la dose remplie au choix (#132) ;
  - le catalogue de 1 734 références ;
  - la saisie hors catalogue ;
  - la fiche corrigeable ;
  - le « Comparer » ;
  - la levure supposée US-05 dans les outils houblons, à afficher honnêtement.
  Et les données de la conduite ?
- **J7 bis. L'honnêteté** :
  - une floculation inconnue s'écrit « à renseigner » ;
  - « forme à préciser » reste vrai ;
  - la dose dit sa base (volume et OG) ;
  - une valeur du fabricant reste une donnée du fabricant.
- **J9. Le code contre le récit** :
  - la conduite (température × jours) est ici **et** à l'étape Paliers : laquelle la possède ?
  - la dose : sachet, g ou mL pour une liquide ?
- **J10. Le premier plan** : ligne ou carte de la levure, dose, trois repères. Replié : l'achat et les offres, les sources, la fiche complète,
  la conduite (un lien vers Paliers ?), le programme détaillé.
- **J11. Les cas limites** :
  - pas de levure ;
  - une levure hors catalogue ;
  - une levure liquide (paquet, mL, starter) ;
  - deux levures (co-ensemencement ou relais, par exemple kveik et Brett) ;
  - l'OG manquante, donc la dose inconnue ;
  - une levure en stock sous la dose ;
  - une floculation inconnue ;
  - hors ligne.
- **J13. Les approches** : (a) une ligne comme les malts, langue p6-b2 ; (b) une carte portrait de la levure, avec ses repères en jauge ;
  (c) l'effet sur la bière d'abord (FG, alcool, profil), la levure en dessous. Laquelle tranche une source ? Le reste est un goût.
- **J14. Les suppositions** : la dose se calcule depuis le volume et l'OG avec un taux standard (repère) ; les arômes viennent de la fiche ;
  aucun appel IA au repos.
- **J15. Le vouloir réel** : « voir ce que la levure change » ; est-ce le cœur de l'étape ?
- **J16. L'irréversible** : rien dans un lot de maquettes. Au port : aucune écriture de stock, aucune IA de fiche.
- **J17. Le contrôle du bâtisseur** : où un concepteur devrait-il deviner ?

## Axes candidats (à confirmer ou corriger)
| Axe | Options |
|---|---|
| A1. La forme | une ligne (langue p6-b2) · une carte portrait avec jauges · l'effet sur la bière d'abord |
| A2. La dose | des sachets entiers · des grammes au curseur · le taux d'ensemencement (repère) avec la dose calculée |
| A3. Le choix | un champ toujours prêt avec des puces (stock, habituelles, au style) · un catalogue filtré par style · un duel de deux levures |
| A4. Ce que la levure change | FG et alcool sur le bandeau · un profil d'arômes (esters, phénols) en mots français · un lien vers la biotransformation des houblons |
