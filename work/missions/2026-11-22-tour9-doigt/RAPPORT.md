# Tour 9 au doigt, en ligne (22.11)

- **Tag** : `en-ligne/2026-11-22-tour9` ; paquet servi `index-B8Mp3grp.js` ; https://brasserie-l-affinee.web.app.
- **Banc** : Claude in Chrome (Chrome du PC, session du brasseur). L'app tourne dans une iframe `srcdoc` de 390×844, puis de 1280×900.
- **Gestes** :
  - souris réelle de l'extension ;
  - `PointerEvent` de type `touch` et `mouse`, par pas de 30 ms, avec l'état relevé à chaque pas.
- **Données** : uniquement « ZZ TEST Fête », « ZZ TEST Bord » et « ZZ TEST Carnet fermenteur », toutes retirées à la fin. La période est remise à « 6 sem. ».

## Combien et quels problèmes ? 5, plus 3 notes

1. **T9-1 (G) : une barre tirée hors du cadre n'agrandit pas l'échelle.**
   - Écran : Calendrier, fenêtre S46–S51 (6 sem.), à 390.
   - Geste : « ZZ TEST Bord » est tiré au-delà du bord droit de la frise, puis tenu (toucher 2,1 s à 386 px, souris 3 s à 388 px).
   - Résultat : la fenêtre reste S46–S51. La chose est posée au 20 déc. (S51), puis au 27 déc. (S52, hors de la fenêtre), et sort de la vue. Il faut passer à « 6 mois » pour la retrouver.
   - CAL-BARRE-BORD (6d22c6115) est bien dans le tag, mais son effet ne s'observe pas en ligne.
2. **T9-2 (D) : reculer dans le passé bute sur la semaine en cours.**
   - Écran : frise des prix, à 390.
   - Geste : poignée de début tenue au bord gauche (1 px) pendant 3,6 s.
   - Résultat : la fenêtre s'arrête à S47, la semaine en cours. Les 12 relevés pendant la tenue disent tous « S47 – S3 ». Il faut relâcher puis reprendre : le geste suivant passe à S44.
   - À 16 px du bord, 3,6 s ne gagnent qu'une semaine.
3. **T9-3 (D) : la fiche et Modifier ne disent pas la même durée.**
   - Écran : fiche de « ZZ TEST Fête ».
   - La fiche dit « 1 j ». Modifier, sur la même chose, dit « Durée 1 semaine · jusqu'à S52, 27 déc. ».
4. **T9-4 (m) : la « Légende » couvre le bas de la case Levures.**
   - Écran : Stock › Articles, étagère, à 390.
   - « Légende » (58×28, 466–494 px) recouvre le bas de « Levures : 10 articles » (437–481 px). Un toucher à 474 px ouvre la Légende, pas Levures.
5. **T9-5 (m) : deux cibles font moins de 44 px.**
   - Menu de période : Jour, Semaine et Mois mesurent 92×30.
   - Fiche d'un article : le bouton vendeur « Brau-Rauchshop » fait 32 px de haut.

### Notes

- **T9-NOTE-1 : un besoin daté du passé est encore compté (doute).**
  - Écran : fiche Flocons d'Avoine, « besoin 18,9 kg · 11 sources ».
  - Le total compte « Ssr, prévu le 21.09.2026 », une date passée, et deux recettes seulement « écrite ». À confirmer : un brassin prévu dans le passé doit-il encore compter dans le besoin ?
- **T9-NOTE-2 : deux données ZZ d'une autre session restent au Calendrier.**
  - Il s'agit de « Vente 1 × ZZ TEST — parcours r2 vente … 10 nov., S46, +45 » et de « Vente 1 × ZZ TEST — parcours 10.11 … ».
  - Elles n'ont pas été créées ici, donc pas retirées. À retirer par leur session.
- **T9-NOTE-3 : limites du banc.**
  - Aucune capture : `Page.captureScreenshot` expire sur l'iframe. Le jugement repose sur des mesures DOM : bords, cibles, `elementFromPoint`, textes.
  - Le 1280 est jugé de la même façon, par mesures.
  - Pas de vrai doigt, et le thème sombre n'est pas joué.
  - Une anomalie n'a pas été reproduite : un premier glissé synthétique de 100 px depuis le bord gauche, à 92 px par semaine, avait déplacé la fête de 4 semaines. Rejoué ensuite cinq fois, à la souris et au toucher, à 390 et à 1280, le déplacement est juste.

## Vérifiés justes

- **Fenêtre de la courbe** :
  - CFP-1 : le cadre suit le doigt. Le doigt est à 140 px, le bord gauche à 140,7 px.
  - CFP-4 : la poignée de début étire. S47–S53 devient S49–S53, soit 5 sem.
  - CFP-7 : le bord est ralenti, environ 1 semaine par seconde, sans saut au lâcher.
  - CFP-8 : l'en-tête reste à 53 px pendant « Enregistrement sur le serveur… ».
- **Toujours vrai** : CFP-5. Au lâcher, l'échelle se recale et le cadre revient à 68–316 px. Le cadre saute aussi de 12 px pour se caler sur la semaine.
- **Appui long sur la courbe** : la lecture « S1 · 4 janv. · rien cette semaine » apparaît, suit le doigt (S52) et reste après le lâcher.
- **Barre ZZ glissée** : vers le passé et le futur, à 390 et 1280, au toucher et à la souris, la date posée est juste : ±1 à 2 semaines selon la distance.
- **Fiche v02** :
  - le volet des dates s'ouvre ;
  - Supprimer puis Annuler rétablit la chose ;
  - Modifier enregistre le 23 déc. La fiche se ferme ensuite, comme T8-3.
- **Ajout et période** : l'ajout dans Fêtes et le menu de période (2 sem., 6 sem., 3 mois, 6 mois, An, Liste) marchent.
- **CAL-CUVE** : la fiche de Milk Stout (en cuve, J205) offre « Brassage 1 mai : régler » et « Prête : à préciser, régler ». Elle a été lue sans rien changer.
- **Carnet** :
  - Les filtres À comparer, Idée et Choisi basculent ; tous éteints, tout est montré.
  - Création depuis « Une idée, un besoin… » avec le lien réel https://brewstore.ch/materiel-fr/casseroles-et-cuves-fr/fermenteur-canon-inox-30l-fr/. La fiche montre « Fût fermenteur inox Polsinelli 30 L avec poignées · brewstore.ch · 120 CHF · rupture · lu sur la page : nom, prix, photo », soit le prix du JSON-LD de la page (120).
  - La suppression a une confirmation, puis « Carnet supprimé · Annuler ».
- **Stock** : l'étagère (Malts, Houblons, Levures, pastilles manque, bas, épuisés) et la fiche d'un article (Flocons d'Avoine, courbe des mouvements, correction) s'ouvrent.
- **À 1280** : aucun débordement, aucun texte sous 11 px, aucune barre qui se chevauche au Calendrier.

## IA

La création du carnet a fait 2 appels `aiTask` :
- `lireLien`, une lecture sans modèle ;
- `rangerCarnet`, Flash-Lite, sur une pièce ZZ TEST.

Ils sont notés au journal Gemini.
