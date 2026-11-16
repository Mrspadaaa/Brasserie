OK — 23 problèmes, 7 bloquants

Banc : worktree détaché `C:/Users/mrspa/AppData/Local/Temp/vj-wt` (tag `en-ligne/2026-11-10-fiches`, jonction node_modules deploy-bc70), Vite local :3031,
`?preview=brew&view=brassage`, clés Firebase factices, aucune donnée réelle. Fixture du banc modifiée dans le worktree temporaire seulement : levure remplacée par
« SafAle US-05 (Fermentis), sèche, sans quantité » (comme LOT-018 du brasseur). Scripts : `jour.mjs` (tout le jour), `fin.mjs` (quantité de levure puis clôture) ;
journaux : `journal-clair.txt`, `journal.txt`, `fin-journal.txt`. 390 tactile, clair et cave. Banc arrêté et worktree retiré à la fin.

## Problèmes
1. **Préparer › Mesurer : aucun curseur, sur les 4 onglets** ; le champ seul, collé au bord gauche (x = 10 px, bordure coupée), feuille ouverte sur
   Volume à « Eau et sels ». Bloquant (VB-3). Capture `captures/clair-01-1eau-et-sels-mes-*.png`.
2. **Ébullition › Mesurer : aucun curseur sur les 4 onglets** (Temp. comprise) : VB-3 tel que vu par le brasseur. Bloquant.
3. **Contrôle avant ébullition : Densité sans curseur**, alors que c'est la mesure de l'étape (densité avant ébullition) ; Volume a le sien (21,7–29,2). Bloquant.
4. **Premier moût, Rinçage, Refroidissement : pH / Densité / Volume sans curseur** selon l'étape (seule la grandeur à cible de recette en a un). Bloquant (VB-3).
5. **Ensemencement, levure sèche sans quantité : « J'ai ajouté la levure » ne clôt pas** au premier toucher ; la notice « Choisis la quantité de levure
   réellement ajoutée. » et l'éditeur de la ligne Levure s'ouvrent. Bloquant (geste sans effet). La clôture n'arrive qu'après les gestes du n° 15
   (vérifié : `fin.mjs`, `fin-journal.txt`).
6. **Préparer › Mesurer › pH : faux chiffre « 5,4 » en gris dans le champ** (placeholder lu comme une valeur), champ coupé à gauche, pas de « Pourquoi
   maintenant ». Non bloquant. `clair-01-1eau-et-sels-mes-ph.png`.
7. **Aides et repères : deux « À vérifier » rouges pour une seule cause** (quantité de levure non renseignée). Le tag de `BrewAide.tsx:61` s'allume dès qu'un
   descendant porte `data-notice` ; le repli extérieur hérite donc de celui de « Levure », d'où le doublon vu par le brasseur. Non bloquant (VB-4).
8. **Levure : phrase cassée « Préparer la levure / sèche. Renseigner la quantité… ; aucun sachet ni nombre de cellules n'est supposé. »** : le titre et la forme
   (`recipe.yeast.form`) sont collés en deux lignes (`yeastBrewDay.ts:42-43`), jargon de programme, aucun bouton pour renseigner la quantité. Bloquant (VB-4 :
   « une alerte dit le geste en peu de mots (et l'ouvre) »). `clair-01-1eau-et-sels-replis-b.png`, ses captures `brasseur-preparer-aides.jpg`.
9. **Chevrons orphelins** : « Fiche de la souche · repères pratiques » a son chevron sous le titre, à gauche ; « Programme, ajouts à cru et sources » le sien loin à
   droite, une ligne plus bas. Non bloquant. `clair-01-…-replis-b.png` (même défaut sur sa capture).
10. **Levure dépliée au jour de brassage = cockpit** : graphe de fermentation J0–J10, tableau du dry hop « À préciser · — h · — °C », sources en anglais brut
   (« 50 to 80 g/hl at ideally 18-26°C (64.4-78.8°F) »), stockage du sachet ; puis « Houblons · vigilances et potentiel » (Hazy IPA, Simuler ×8, BJCP, Tinseth).
   Rien n'aide le geste de Préparer. Non bloquant ([[pas-de-cockpit]]). `clair-01-…-replis-b/c.png`.
11. **Refroidissement : écart à m2.** La ligne « Au fermenteur · cible 19 L · au transfert » et la carte « Ensuite · Ensemencement 18 °C · levure » de
   `m2-refroidi-hors-390.png` manquent ; seul « Densité initiale » est là. Bloquant (élément de sa maquette absent). `clair-22-10refroidissement-repos-a.png`.
12. **Doublon dans Relevés du jour** (Refroidissement et Ensemencement) : sous les lignes, deux lignes en chasse fixe « Densité initiale — cible 1,061 /
   Volume en fermenteur — cible 19 L » répètent ce qui est juste au-dessus. Non bloquant. `clair-22-…-repos-a.png`, `clair-23-…-repos-a.png`.
13. **« Moût à l'ajout » : champ nu.** En clair, un tiret flottant sans cadre (rien ne dit qu'il se touche) ; en cave, un pavé gris clair. Absent de m2.
   Non bloquant. `clair-23-11ensemencement-repos-a.png`, `cave-fin-02-levure-fermee.png`.
14. **Ligne Levure sans quantité : « Quantité prévue absente ou nulle · saisis le réel dans le guide Levure »** (`BrewIngredients.tsx:256`) : jargon, et le
   « guide Levure » n'est nulle part sur l'écran ; bouton « À préciser » en chasse fixe. Non bloquant. `clair-23-…-repos-a.png`.
15. **Poser la quantité de levure : pas pratique.** Au toucher de « J'ai ajouté la levure », un bandeau **vert** (couleur de réussite) en haut de page, loin de
   la ligne ; puis 4 gestes : « Mesurée / Sans mesure » (sens obscur), champ vide « Mesure » à − / +, « Unité réelle : À choisir » parmi 7 unités, « Fermer
   l'ajustement ». Aucun « 1 sachet (11,5 g) » proposé pour une sèche. Ça marche (1 sachet posé, puis clôture). Non bloquant.
   `clair-24-levure-quantite-a.png`, `clair-fin-01-levure-saisie.png`.
16. **« À vérifier » reste rouge après la quantité posée** (1 sachet) : l'alerte d'Aides et repères ne s'éteint pas une fois la cause réglée. Non bloquant (VB-4).
   `clair-fin-02-levure-fermee.png`, `cave-fin-02-levure-fermee.png`.
17. **Dialogue de clôture** : « Aucune quantité prévue valide » (`BrewDayPage.tsx:620`), « OG inconnue · volume en fermenteur inconnu » sans moyen de les
   relever d'ici ; bouton « Confirmer la levure ajoutée » cassé sur deux lignes. Non bloquant. `clair-fin-03-dialogue.png`.
18. **Suivi thermique déplié : texte collé au bord gauche du cadre** (aucune marge intérieure), jargon « Exposition entre les relevés inconnue. La montée ne
   remplace pas le maintien. » (`BrewThermalControl.tsx:106`), « Conditions suivies · volume à préciser ». Non bloquant. `clair-05-3empatage-repos-a.png`,
   `clair-09-4mashout-repos-a.png`.
19. **Mesurer (Empâtage) : écart à m2.** Bouton « Volume + densité » en plus de « Conseil » ; onglet actif cerné d'un épais cadre noir souligné (blanc en cave)
   au lieu de la pastille de m2. Non bloquant. `clair-04-3empatage-mes-temp.png` contre `m2-palier-curseur-390.png`.
20. **Cave, Mesurer : « Enregistrer » grisé peint en ocre plein**, il se lit actif ; m2 cave le montre gris foncé. Non bloquant. `cave-04-3empatage-mes-temp.png`
   contre `m2-palier-curseur-cave-390.png`.
21. **Grains réaffichés à cocher (0/4) au Mashout** : la liste de l'empâtage revient en entier à l'étape suivante. Pas à sa place. Non bloquant.
   `clair-09-4mashout-repos-a.png`.
22. **Polices mêlées** : chasse fixe « machine à écrire » pour « 1 h 00 », « 1 h 15 », « à mesurer », « À préciser », « cible 1,061 », « 82 °C · 20 min » ;
   le minuteur passe de « 1 h 00 » (chasse fixe) à « 59:58 » (autre police) au démarrage. m2 : « 59 : 36 » dans la police du texte. Non bloquant.
   `clair-04-3empatage-repos-a.png`, `clair-06-3empatage-repos-a.png`, `clair-15-8ebullition-repos-a.png`.
23. **Ébullition › Aides › « Aide à cette étape · Simuler »** : « Ajout à +… min depuis le début : 75 », « +75 min écoulées = 0 min de contact avant la fin.
   La notation de la recette exprime les minutes restantes. » Calcul de programmeur au jour J. Non bloquant ([[pas-de-cockpit]]). `clair-15-8ebullition-replis-a.png`.

Bloquants : 1, 2, 3, 4, 5, 8, 11 (7).

## Doutes (non comptés)
- Après « Confirmer la levure ajoutée », le banc `?preview=brew` ouvre la fiche recette, sans bilan du brassage (« Brassage clôturé · OG — » seulement dans
  l'en-tête du banc) : à revoir dans l'app réelle, le banc ne reproduit peut-être pas la navigation. `clair-fin-05-fin.png`.
- Poids des grains dans un champ encadré ; m2 ne montre que l'état coché (poids en texte) : pas de quoi trancher.
- Amarillo 43 g au Premier moût puis 43 g à 0′ : deux ajouts de la recette du banc (`BrewPreview.tsx:50-51`), pas un double compte.

## Alertes vues, ce qu'elles signifient, d'où elles viennent
- « À vérifier » (Aides et repères, Levure) : un descendant du repli porte `data-notice` (`BrewAide.tsx:28-61`) ; ici l'instruction « Préparer la levure » est
  `warning: !quantityKnown` (`yeastBrewDay.ts:43`) : la recette n'a pas de quantité de levure. Elle reste allumée après la quantité réelle posée (n° 16).
- « Finale sèche » (sur sa capture LOT-018) : l'objectif de bière choisi pour la levure dans la recette (`YEAST_RECIPE_GOAL_LABELS.dry`,
  `yeastRecipeProfiles.ts:8`, `goal` de `yeastBrewDay.ts:69`) ; sans objectif, « conduite prévue ». Ce n'est pas une alerte, c'est un libellé mis en résumé.
- « Ajuster l'eau », « Rattraper », « Chauffer », « Simuler », « Refroidir » : le mode de « Aide à cette étape » selon l'étape (pas des alertes).
- « Choisis la quantité de levure réellement ajoutée. » : `BrewDayPage.tsx:763`, au toucher de « J'ai ajouté la levure » sans quantité choisie ; ouvre
  l'éditeur de la ligne Levure.
- « Confirmer l'ajout de levure ? … Aucune quantité prévue valide » : dialogue de clôture (`BrewDayPage.tsx:620`) ; la recette n'a pas de quantité prévue ;
  « 1/15 ajouts cochés » compte les cases cochées du jour.

LEÇON PROPOSÉE : aucune
