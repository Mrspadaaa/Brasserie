# Voie q10 — Tests anciens cassés par le port (q1 à q7)

- Mission : 2026-11-14-brassins · Agent : auteur · Modèle : sonnet · Niveau : code · Plafond : 60 tours · Dépend de : q1 à q7 · Décideur : pilote

## Objectif
Le port 1:1 de ses choix (« Fermentation : gfc · Filtres : e6a + e6c · … · Carnet : e3gb · … · Atelier : e9na », 15.11) a changé la fiche en
fermentation, la liste et ses filtres, le carnet et le dossier, l'Atelier R&D.
Les 3 fichiers de `work/missions/2026-11-14-brassins/voies/q10/echecs.txt` passent sur HEAD et échouent maintenant (les autres échecs de la suite existent déjà sur HEAD,
hors voie). Pour chacun : soit le test vérifie une interface que sa maquette a retirée ou renommée (règle n° 1 : la maquette gagne) → réécrire
l'attente sur la nouvelle interface en gardant l'intention métier (même règle vérifiée) ; soit c'est une vraie régression (donnée perdue,
geste perdu, calcul faux, hors ligne) → corriger le code du port. Jamais supprimer un test ni affaiblir une règle métier.

## État de l'art
Aucun algorithme : adaptation de tests (Testing Library : rôles et libellés) et correctifs ponctuels.

## Entrées
- Liste : `work/missions/2026-11-14-brassins/voies/q10/echecs.txt`. Ce que chaque port a changé : `work/missions/2026-11-14-brassins/voies/q1/RESULTAT.md` à `q7/RESULTAT.md` et leurs `INVENTAIRE.md`.
- `git diff HEAD -- src` par fichier utile (sorties filtrées).

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- Les 3 fichiers de `echecs.txt` ; les fichiers `src/` déjà modifiés par q1 à q7 (`git status --short src`) ; `work/missions/2026-11-14-brassins/voies/q10/`.
- Jamais : `firestore.rules`, `firebase.json`, `firestore.indexes.json`, `.firebaserc`, `functions/.env`, `.codex/hooks.json`. Ni commit, ni stash, ni déploiement.

## Consignes
- `RESULTAT.md` : une ligne par fichier : « test adapté (ce que la maquette a changé) » ou « régression corrigée (quoi) ».
- `tests/unit/bDiversContraste.test.ts` vérifie un contraste : si une couleur neuve du port échoue, corriger la couleur (jetons de l'app), pas le test.
- Note de q7 : pour `contactConversionUnique`, ouvrir la fiche du contact avant « Convertir en client ».

## Exigences transversales et acquis (recopiés, leçons L05 et L06)
- Gemini jamais réel dans un test ; hors ligne préservé ; saisie au curseur, jamais `type="number"`.

## Critères
`work/missions/2026-11-14-brassins/voies/q10/GATES.md`, depuis la racine du dépôt. Ne pas le modifier.

## Rendre
- `RESULTAT.md` tenu au fil.
- La ligne « Tests » écrite dans un fichier : `npx vitest run tests/integration/batchAbvOgConfirmee.test.tsx tests/integration/batchDefautsB.test.tsx tests/integration/batchNombresFr.test.tsx tests/unit/port- --reporter=dot > work/missions/2026-11-14-brassins/voies/q10/tests.txt`.
Réponse finale au pilote : une ligne.

## Précision du pilote (15.11)
Ces 3 fichiers visent l'ancienne rubrique Mesures de la fiche en fermentation, remplacée par gfc. Les règles qu'ils gardent sont du métier et
doivent survivre : OG confirmée → alcool calculé (au-delà de 18 % : « non calculé » et sa raison), « Jour réellement brassé » qui refuse le futur,
nombres à la française (cibles à trois décimales, aide « 1048 pour 1,048 »). Pour chaque règle : si la fiche gfc la tient (feuille Mesurer,
Dossier, en-tête), adapter le test à cet endroit ; si elle a disparu, la rétablir dans la forme de gfc (feuille Mesurer ou Dossier), sans
cockpit, puis tester. Jamais affaiblir une règle.
