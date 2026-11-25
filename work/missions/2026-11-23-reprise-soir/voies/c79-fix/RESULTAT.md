ECHEC — c79Regles 20/32 verts : EXA-6 (5), EXA-2 (1), EXA-4 (1), EXA-3 (3), EXA-8 (2) restent rouges, plafond de tours atteint ; R110, EXA-5, EXA-7, EXA-10 verts

# RESULTAT c79-fix (25.11)

## Plan (par règle, chaque endroit) et état
- R110 FAIT (10/10) : la date de la phrase est gardée par TOUT le chemin.
  - `src/domain/carnets/tacheDatee.ts` : mois abrégés (« déc. », « janv. », « sept. » ; « jui » ambigu, jamais deviné) ; `echeanceDite` lit aussi « le samedi 6 déc. » (jamais une date déjà passée : c'est un fait) et « dans 2 semaines/3 jours/un mois » (depuis le jour d'écriture) ; `echeanceDeLaPhrase` (la date de la phrase prime, sauf `echeancePosee`) ; `echeanceDeMoisJour` (le « MM-JJ » que l'IA recopie).
  - IA : `functions/src/carnetIA.ts` (schéma `tachePropose.date`, consigne, assainissement « MM-JJ » seulement) et `src/domain/carnets/ia.ts` (la date recopiée prime sur `quand`, ignorée si le jour n'est pas écrit dans le message).
  - Acceptation « À faire » : `fil.ts` (`accepterPropositionSuivi` : la date de la phrase, comptée depuis le jour d'écriture, écrase la semaine/le mois supposés par l'IA et pose `echeancePosee`) ; « Plus tard » (`actionsCarnet.ts`) pose aussi `echeancePosee` ; « Quand ? » (`poserEcheance`, `taches.ts`) aussi : un choix du brasseur n'est jamais retouché.
  - Donnée déjà fausse (30.11 « mois », 23.11 « semaine ») : `carnetsAuxDatesDites` (`afaireRegles.ts`) range et dit la tâche par la date de sa phrase (lecture seule, rien n'est réécrit) ; la liste dit la date sous « Un jour » ET sous « Fin du mois » quand la précision est la semaine.
  - Carte « tâche proposée » : dit la date (`FilCarnet.tsx`, ligne sous le texte : « sem. du 28 déc. »).
  - `modele.ts` : champ `echeancePosee` (lu, conservé, tolérant).
- R111 EXA-10 FAIT (5/5) : `suivi.ts` `pourquoiDe` lit la raison que l'option retenue porte (`raison` : « en stock »), à défaut une note du fil avant la décision qui partage un mot de fond avec l'option retenue (sans option écartée raisonnée) ; `raisonDEcart` accepte « finalement pas utile » (3 mots dont un de fond), refuse toujours « non, en fait ».
- R111 EXA-5 FAIT (3/3) : `nomCourtOption` (`titreCourt.ts`) : « Pistes : joint du couvercle, … » → « Joint du couvercle » ; appliqué aux écrans (options, tableau, Résolu, question, fermées), jamais à la donnée ni au fil.
- R111 EXA-7 FAIT (2/2) : la vignette de l'option fermée suit le nom court (sachet) ; la carte Résolu sans « Fermé : … » écrit dit « Dernier fait : « Monté à 19 °C… » » (`dernierFaitDuFil`, `filRegles.ts`), jamais une consigne pour la suite (« La prochaine fois : … »).
- NON FAIT (tours épuisés) :
  - EXA-6 (5 tests) + EXA-2 (1) : `FilCarnet.tsx` ne pose le ⋯ que si le message a EXACTEMENT UNE note (`liees.length === 1`). Reste : pour une bulle dont la note est devenue façon/critère/article, ou qui en a deux, ouvrir une feuille sur la LIGNE du message (note, critère, façon ; `modifierLigne`, `changerSorte`, `supprimerLigne` existent déjà dans `operations.ts` et marchent par `cible` + `id`). Piste : état `feuille` = `{cible, id}` au lieu d'un id de note dans `ecransCarnet.tsx` ; message sans aucune ligne ici (frigo, MSG-c79-27 dont la note vit dans « Chambre froide ») : ⋯ sur le message seul, `supprimerLigne` ne touche que ce carnet (le test EXA-2 le vérifiera ensuite).
  - EXA-4 : la carte « Reclasser ce carnet ? » n'apparaît pas sur la levure (critère né d'une phrase `origine: 'locale'`) : à lire dans `reclasser.ts` / `CarteReclasser.tsx`.
  - EXA-3 : la carte Reclasser du malt d'ancien format dit l'article → piste, mais ni « Problème », ni « Résolu », ni la tâche « Brassin du 3 déc. à décaler » : `reclasser.ts`.
  - EXA-8 : « Ajouter » sous « Déjà un carnet proche » : le brouillon `laffinee.carnet.brouillon:` n'est pas vidé, et le carnet du soufre montre « va atterrir ici · tiré de votre phrase » : `CarnetsVue.tsx` / `rangementCarnets.ts`.

## Fichiers écrits
functions/src/carnetIA.ts ; src/domain/carnets/{fil,ia,modele,suivi,tacheDatee,taches,titreCourt}.ts ; src/ui/carnets/{AFaire,ArticlesCarnet,CarnetOuvert,FilCarnet,OptionsProbleme,ResoluProbleme,TableauCarnet,actionsCarnet,afaireRegles,filRegles}.ts(x) ; ce dossier (tests.log, tsc.log, regress.log, liste.txt).

## Sortie des critères
- `npx vitest run tests/unit/c79Regles.test.tsx` : 20 passed, 12 failed (32) (tests.log).
- Rejeu : c48..c78Regles, noteRegles, c70RangementIA, c68Realises, carnets*, lot3CarnetOuvert, horizons*, pxPrix*, virgule-transversale, proprietes, stocksMaterielUneRangee : 100 fichiers, 2447 tests verts, 8 skipped (regress.log, avant les deux derniers changements : à rejouer par le pilote).
- `npx tsc --noEmit -p .` : 2 erreurs connues seulement (seedData GanttTask, virtual:pwa-register). `functions` : tsc exit 0.
- BUGS.md : lignes C79/EXA non touchées (rien n'est « corrigé en local » tant que le test n'est pas vert pour la ligne ; R110 = EXA-9 et EXA-11, EXA-5, EXA-7, EXA-10 sont corrigés en local au commit de cette voie : à reporter par le pilote avec `controle-bugs.mjs`, non lancé).

## Doutes et limites
- Aucun test de c79Regles modifié ; aucun test faux repéré. La pièce IA (schéma `date`) n'a pas de test propre (tests/ hors de mon périmètre) : couverte seulement par la compilation `functions` et le garde-fou « le jour doit être écrit dans le message » ; le test c79 rejoue la proposition SIMULÉE sans `date`, donc par le chemin `echeanceDite`.
- `dernierFaitDuFil` et la règle B de `pourquoiDe` (mot de fond commun) sont des heuristiques : le constat « Test à l'eau savonneuse » devient le pourquoi de « raccord gaz » ; une note du fil qui parle du même objet avant la décision est citée comme pourquoi. À juger en ligne par le critique (faux positifs possibles).
- Sous « Fin du mois », la ligne dit maintenant sa semaine quand la précision est « semaine » (« sem. du 30 nov. ») : le groupe reste « Fin du mois » pour le 6 déc. 2026 (lundi 30.11) ; R84 le refuserait peut-être : à décider.
- Le jour d'écriture du message (`carnetMessage.le`) sert de « aujourd'hui » pour « dans 2 semaines ».

## Essais
R110 : 1 essai. EXA-10 : 1. EXA-5/7 : 2 (import `etatDe` oublié, nom de façon encore long dans TableauCarnet/ArticlesCarnet).

DÉCISION À PRENDRE : relancer c79-fix-2 pour EXA-6/2 (feuille ⋯ sur la ligne du message), EXA-4, EXA-3, EXA-8 (22 tours suffisent pour EXA-6 ; reclasser.ts à lire pour EXA-3/4). Recommandation : oui, avant la mise en ligne de R110.
CONNAISSANCE : la date d'une tâche vient de DEUX endroits (la proposition de l'IA et la phrase) : la phrase prime partout, et seule une date posée à la main (`echeancePosee`) la bat.
LEÇON PROPOSÉE : aucune.
