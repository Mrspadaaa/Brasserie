FIX 1897/1901 verts (1 rouge périmé, 3 sautés) — tsc OK (racine et functions/) — ce2aa8b64

# RESULTAT c67b-fix (reprise)

Commit du code : `ce2aa8b64` (par chemins, 23 fichiers : src/ui/carnets, src/domain/carnets dont memo.ts neuf, ProblemesResolus.tsx neuf, functions/src/carnetIA.ts). Rien de src/ui/finance, src/fermenter, src/finance, src/stock.

## Corrigé à la reprise (types, sans changer le comportement)
- `EtatIA.tsx` : `ChoixV` reçoit `quantite?: { kg; libelle }` et `prixCentimes?: number` (déjà dans `Choix` du modèle, lus par Choisir.tsx l.168 et ListeCarnets.tsx l.134 pour R63). 10 erreurs en moins.
- `afaireRegles.ts` : `Maintenant` accepte aussi la fonction-horloge de la vue (`auj` de CarnetsVue) ; `aujourdhuiDe` la résout. `AFaire.tsx` l.45 la résout avant `aFaireDe` (qui prend une date). 1 erreur en moins.

## R par R (ce que le code fait, preuve : tests/unit/c67bRegles.test.tsx 35/35)
- R63 (C67B-1, C67B-8) : un choix fait à 1 kg dit cette quantité et son prix (≈40 CHF · 1 kg) à la confirmation (Choisir.tsx) et dans la liste (ListeCarnets.tsx `prixDe`) ; le prix du sachet est un seul rendu arrondi partout (Choisir.tsx l.30). Le modèle garde `quantite` et `prixCentimes` du choix (modele.ts, lu à la relecture).
- R64 (C67B-2) : l'achat venu d'un Choisir n'a aucune date inventée (actionsCarnet.ts, operations.ts) ; son libellé est celui de l'article choisi (« CITRA® (US) · MotlerHops · 1 kg »).
- R65 (C67B-3) : l'unité se dit aux deux bornes de la réglette (Choisir.tsx) ; une valeur de texte longue se replie au lieu de déborder (carnets-decider.css).
- R66 (C67B-4) : « ouvert » dit comme le coup d'œil (« 8 je cherche ») : carnet « cherche » ou « décidé », tout genre, ou problème non résolu ; archivé jamais (afaireRegles.ts `propositionARanger`). La photo rangée est montrée (ArbreCarnets.tsx).
- R67 (C67B-5) : un mémo (fait accompli) va dans une note du carnet de son sujet ; le bandeau « ailleurs » ne porte plus le faux « Aucun de vos carnets » (ia.ts, iaSimulee.ts, memo.ts, rangementCarnets.ts, functions/src/carnetIA.ts : consigne).
- R68 (C67B-6) : un carnet rangé « problème » à la création ouvre l'écran du problème (barre d'état) (CarnetOuvert.tsx).
- R69 (C67B-7, C67B-9) : Comparer ne répète pas le vendeur sur la ligne « vendu par » ; le meilleur est celui qui couvre la plus large étendue de quantités (tableauRegles.ts, Comparer.tsx) ; une fiche s'ouvre en haut, y compris l'article voisin atteint par › (FicheArticle.tsx).

BUGS.md : C67B-1 à C67B-9 passés « corrigé en local (voie c67b-fix, 25.11) ; reste à rejouer en ligne | ce2aa8b64 ». `controle-bugs.mjs` : BUGS OK (2343 bugs, 553 ouverts).

## Critères
- `npx tsc --noEmit` (racine) : 2 erreurs connues seulement (seedData GanttTask, virtual:pwa-register). `functions/` : aucune sortie, OK.
- Rejeu (carnets*, c48..c67bRegles, lot3CarnetOuvert, virgule-transversale, proprietes, stocksMaterielUneRangee ; 83 fichiers) : 82 fichiers verts, 1897 tests verts, 3 sautés, 1 rouge. Journal : voies/c67b-fix/tests.log.
- c48 à c56Regles verts. c67bRegles 35/35.

## Le seul rouge : attente périmée, pas un défaut du code
`tests/unit/carnetsAFaireRegles.test.ts` > « ce qui est proposé est toujours un problème ouvert : jamais le carnet de la photo, un résolu, un autre genre » (l.175-178). Il écrit que, parmi [photo, pompe, fête, assurance], rien n'est proposé (`aucune`). La fixture : photo = idée/note, pompe = problème résolu, fête = idée « cherche », assurance = mémo « décidé ». R66 (C67B-4, c67bRegles l.324-340) demande l'inverse : « Je cherche / Décidé, tous genres comme le coup d'œil » ; son test propose un rattachement vers la fête (idée) ou la chambre froide (achat). Les deux attentes se contredisent sur la fête ; on ne peut pas tenir les deux. R66 vient de la plainte du brasseur (« Aucun problème ouvert » devant « 8 je cherche »), elle prime. Le test garde son sens pour le carnet de la photo, le résolu et l'archivé (ces cas restent exclus). Je ne modifie pas ce test (hors de Possède). À mettre à jour par le pilote : attendre `rattacher` vers un carnet « cherche » ou « décidé » d'un autre genre, et `aucune` seulement si la liste est vide, ne contient que le carnet de la photo ou des résolus.

## Doutes et limites
- Aucune capture locale (consigne de la voie) : la preuve des R63 à R69 en ligne reste au pilote et au critique ; les C67B restent « à rejouer en ligne ».
- Le SENS réel de Gemini sur R67 (mémo) n'est jugé que sur l'IA simulée et le texte de la consigne.
- git a affiché des « failed to delete .git/worktrees/... Permission denied » au commit (ménage de worktrees d'autres sessions) : sans effet sur le commit.

DÉCISION À PRENDRE : mettre à jour l'attente périmée de carnetsAFaireRegles.test.ts (voir ci-dessus). Recommandation : oui, par le pilote ; R66 prime.
CONNAISSANCE : aucune
LEÇON PROPOSÉE : aucune
